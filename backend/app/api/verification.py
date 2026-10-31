import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.product import Product
from backend.app.models.inspection import (
    Inspection, ExtractedDeclaration, UploadedImage, VerificationRecord
)
from backend.app.models.rule import ComplianceResult
from backend.app.models.audit import AuditLog
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/verification", tags=["Human Verification"])

class VerificationAction(BaseModel):
    action: str # approve, reject, modify
    corrected_value: Optional[str] = None
    comments: Optional[str] = None

@router.get("/pending")
def get_pending_verifications(db: Session = Depends(get_db)):
    # Find all declarations with low confidence (< 0.75), or whose rule resulted in NEEDS_REVIEW
    decls = (
        db.query(ExtractedDeclaration)
        .join(Inspection, ExtractedDeclaration.inspection_id == Inspection.id)
        .filter(ExtractedDeclaration.is_manually_corrected == False)
        .all()
    )

    items = []
    for d in decls:
        # Check if confidence is low OR corresponding compliance result requires review
        needs_review = d.confidence < 0.75 or d.readability_score in ["POOR", "FAIR"] or (not d.raw_value)
        rule_review = db.query(ComplianceResult).filter(
            ComplianceResult.inspection_id == d.inspection_id,
            ComplianceResult.declaration_key == d.declaration_key,
            ComplianceResult.status == "NEEDS_REVIEW"
        ).first()

        if needs_review or rule_review:
            insp = db.query(Inspection).filter(Inspection.id == d.inspection_id).first()
            prod = insp.product if insp else None
            img = db.query(UploadedImage).filter(UploadedImage.inspection_id == d.inspection_id).first()

            items.append({
                "id": d.id,
                "inspection_id": d.inspection_id,
                "product_name": prod.name if prod else "Unknown",
                "brand": prod.brand if prod else "Unknown",
                "category": prod.category if prod else "General",
                "declaration_key": d.declaration_key,
                "declaration_label": d.declaration_key.replace("_", " ").title(),
                "raw_value": d.raw_value,
                "normalized_value": d.normalized_value,
                "confidence": d.confidence,
                "readability_score": d.readability_score,
                "bounding_box": json.loads(d.bounding_box_json) if d.bounding_box_json else None,
                "image_url": f"/{img.file_path}" if img else None,
                "review_reason": rule_review.evidence_reason if rule_review else "Low OCR extraction confidence or unverified characters",
                "created_at": d.inspection.created_at.strftime("%Y-%m-%d %H:%M") if d.inspection and d.inspection.created_at else ""
            })

    return items

@router.post("/{declaration_id}/approve")
def approve_declaration(
    declaration_id: int,
    action_in: VerificationAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decl = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.id == declaration_id).first()
    if not decl:
        raise HTTPException(status_code=404, detail="Declaration not found")

    decl.is_manually_corrected = True
    decl.corrected_value = action_in.corrected_value or decl.normalized_value or decl.raw_value or "VERIFIED_COMPLIANT"
    decl.corrected_by = current_user.full_name
    decl.corrected_at = datetime.utcnow()

    # Record verification record
    v_rec = VerificationRecord(
        inspection_id=decl.inspection_id,
        declaration_id=decl.id,
        previous_value=decl.raw_value or "NONE",
        new_value=decl.corrected_value or "VERIFIED_COMPLIANT",
        action="approved",
        comments=action_in.comments or f"Approved by Inspector {current_user.full_name}",
        verified_by=current_user.full_name,
        verified_at=datetime.utcnow()
    )
    db.add(v_rec)

    # Re-evaluate compliance rule for this key
    comp_res = db.query(ComplianceResult).filter(
        ComplianceResult.inspection_id == decl.inspection_id,
        ComplianceResult.declaration_key == decl.declaration_key
    ).first()
    if comp_res:
        comp_res.status = "COMPLIANT"
        comp_res.requires_human_review = False
        comp_res.evidence_reason = f"Human Verified by {current_user.full_name}: '{decl.corrected_value}'. Accepted as legally compliant."

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="DECLARATION_APPROVED",
        entity_type="declaration",
        entity_id=str(decl.id),
        details=f"Approved declaration '{decl.declaration_key}' with value '{decl.corrected_value}'"
    )
    db.add(audit)
    db.commit()

    return {"message": "Declaration approved successfully", "declaration_id": declaration_id}

@router.post("/{declaration_id}/reject")
def reject_declaration(
    declaration_id: int,
    action_in: VerificationAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decl = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.id == declaration_id).first()
    if not decl:
        raise HTTPException(status_code=404, detail="Declaration not found")

    decl.is_manually_corrected = True
    decl.corrected_value = "REJECTED_NON_COMPLIANT"
    decl.corrected_by = current_user.full_name
    decl.corrected_at = datetime.utcnow()

    v_rec = VerificationRecord(
        inspection_id=decl.inspection_id,
        declaration_id=decl.id,
        previous_value=decl.raw_value,
        new_value="REJECTED_NON_COMPLIANT",
        action="rejected",
        comments=action_in.comments or f"Rejected by Inspector {current_user.full_name}: Defective or Missing Declaration",
        verified_by=current_user.full_name,
        verified_at=datetime.utcnow()
    )
    db.add(v_rec)

    # Flag compliance as NON_COMPLIANT
    comp_res = db.query(ComplianceResult).filter(
        ComplianceResult.inspection_id == decl.inspection_id,
        ComplianceResult.declaration_key == decl.declaration_key
    ).first()
    if comp_res:
        comp_res.status = "NON_COMPLIANT"
        comp_res.requires_human_review = False
        comp_res.evidence_reason = f"Confirmed Violation by Inspector {current_user.full_name}: Declaration absent or defective on physical commodity."

    # Update overall inspection status to NON_COMPLIANT
    insp = db.query(Inspection).filter(Inspection.id == decl.inspection_id).first()
    if insp:
        insp.overall_compliance = "NON_COMPLIANT"

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="DECLARATION_REJECTED",
        entity_type="declaration",
        entity_id=str(decl.id),
        details=f"Confirmed violation for '{decl.declaration_key}'. Rejection reason: {action_in.comments}"
    )
    db.add(audit)
    db.commit()

    return {"message": "Declaration confirmed as violation/rejected", "declaration_id": declaration_id}

