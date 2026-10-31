import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.inspection import Inspection, OCRExtraction, ExtractedDeclaration, VerificationRecord
from backend.app.models.audit import AuditLog
from backend.app.schemas.ocr import OCRCorrectionRequest
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/ocr", tags=["OCR Extraction"])

@router.get("/{inspection_id}/results")
def get_ocr_results(inspection_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    ocr_rec = db.query(OCRExtraction).filter(OCRExtraction.inspection_id == inspection_id).order_by(OCRExtraction.id.desc()).first()
    decls = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.inspection_id == inspection_id).all()

    lines = json.loads(ocr_rec.lines_json) if ocr_rec and ocr_rec.lines_json else []
    bboxes = json.loads(ocr_rec.bounding_boxes_json) if ocr_rec and ocr_rec.bounding_boxes_json else []

    decl_items = []
    for d in decls:
        decl_items.append({
            "id": d.id,
            "declaration_key": d.declaration_key,
            "label": d.declaration_key.replace("_", " ").title(),
            "raw_value": d.raw_value,
            "normalized_value": d.normalized_value,
            "confidence": d.confidence,
            "bounding_box": json.loads(d.bounding_box_json) if d.bounding_box_json else None,
            "readability_score": d.readability_score,
            "is_manually_corrected": d.is_manually_corrected,
            "corrected_value": d.corrected_value,
            "corrected_by": d.corrected_by,
            "corrected_at": d.corrected_at.strftime("%Y-%m-%d %H:%M") if d.corrected_at else None
        })

    return {
        "inspection_id": inspection_id,
        "engine_used": ocr_rec.engine_used if ocr_rec else "auto",
        "confidence_avg": ocr_rec.confidence_avg if ocr_rec else insp.ocr_confidence_avg,
        "raw_text": ocr_rec.raw_text if ocr_rec else "",
        "lines": lines,
        "bounding_boxes": bboxes,
        "declarations": decl_items
    }

@router.put("/{inspection_id}/correct")
def correct_ocr_declaration(
    inspection_id: str,
    correction: OCRCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decl = (
        db.query(ExtractedDeclaration)
        .filter(
            ExtractedDeclaration.inspection_id == inspection_id,
            ExtractedDeclaration.declaration_key == correction.declaration_key
        )
        .first()
    )

    if not decl:
        raise HTTPException(status_code=404, detail=f"Declaration '{correction.declaration_key}' not found in inspection")

    prev_val = decl.corrected_value if decl.is_manually_corrected else (decl.normalized_value or decl.raw_value)
    decl.is_manually_corrected = True
    decl.corrected_value = correction.corrected_value
    decl.corrected_by = current_user.full_name
    decl.corrected_at = datetime.utcnow()

    # Record verification audit trail
    v_rec = VerificationRecord(
        inspection_id=inspection_id,
        declaration_id=decl.id,
        previous_value=prev_val,
        new_value=correction.corrected_value,
        action="modify",
        comments=correction.comments or f"Manually corrected by {current_user.full_name}",
        verified_by=current_user.full_name,
        verified_at=datetime.utcnow()
    )
    db.add(v_rec)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="OCR_MANUAL_CORRECTION",
        entity_type="declaration",
        entity_id=str(decl.id),
        details=f"Field '{correction.declaration_key}' updated from '{prev_val}' to '{correction.corrected_value}'"
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Declaration '{correction.declaration_key}' successfully corrected and verified.",
        "declaration_key": decl.declaration_key,
        "previous_value": prev_val,
        "corrected_value": decl.corrected_value,
        "corrected_by": decl.corrected_by,
        "corrected_at": decl.corrected_at.strftime("%Y-%m-%d %H:%M")
    }

