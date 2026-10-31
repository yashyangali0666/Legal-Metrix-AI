import os
import uuid
import json
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.product import Product
from backend.app.models.inspection import (
    Inspection, UploadedImage, OCRExtraction, ExtractedDeclaration, VerificationRecord, InspectionReport
)
from backend.app.models.rule import ComplianceRule, ComplianceResult
from backend.app.models.audit import AuditLog
from backend.app.api.auth import get_current_user
from backend.app.vision.preprocessor import ImagePreprocessor
from backend.app.ocr.engine import OCREngineManager
from backend.app.ocr.classifier import DeclarationClassifier
from backend.app.compliance.engine import ComplianceEngine
from backend.app.reports.pdf_generator import InspectionReportGenerator

router = APIRouter(prefix="/inspections", tags=["Inspections"])
UPLOAD_DIR = "backend/uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 25 * 1024 * 1024 # 25 MB

@router.post("/upload")
async def upload_inspection_images(
    files: List[UploadFile] = File(...),
    product_name: str = Form(...),
    brand: str = Form(...),
    category: str = Form(...),
    declared_net_quantity: Optional[str] = Form(None),
    declared_mrp: Optional[str] = Form(None),
    country_of_origin: Optional[str] = Form("India"),
    label_type: Optional[str] = Form("front"),
    state_location: Optional[str] = Form("Delhi NCT"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided. Please select or upload at least one image.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    insp_id = f"INSP-{datetime.utcnow().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"

    # Parse and sanitize declared_mrp if provided
    parsed_mrp: Optional[float] = None
    if declared_mrp is not None and str(declared_mrp).strip() != "":
        clean_mrp_str = "".join([c for c in str(declared_mrp) if c.isdigit() or c == "."])
        if clean_mrp_str:
            try:
                parsed_mrp = float(clean_mrp_str)
            except ValueError:
                parsed_mrp = None

    # 1. Create Product
    product = Product(
        name=product_name,
        brand=brand,
        category=category,
        declared_net_quantity=declared_net_quantity,
        declared_mrp=parsed_mrp,
        country_of_origin=country_of_origin
    )
    db.add(product)
    db.flush()

    # 2. Create Inspection
    inspection = Inspection(
        id=insp_id,
        product_id=product.id,
        inspector_id=current_user.id,
        status="pending",
        overall_compliance="NEEDS_REVIEW",
        location_state=state_location
    )
    db.add(inspection)
    db.flush()

    uploaded_image_records = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
        if ext not in ALLOWED_EXTENSIONS:
            ext = ".jpg"

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' exceeds 25MB maximum upload limit.")
        if len(contents) < 50:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is empty or not a valid image.")

        # Save original file
        file_filename = f"{insp_id}_{uuid.uuid4().hex[:6]}{ext}"
        original_filepath = os.path.join(UPLOAD_DIR, file_filename)

        with open(original_filepath, "wb") as f:
            f.write(contents)

        # Preprocess with OpenCV
        prep_filename = f"prep_{file_filename}"
        prep_filepath = os.path.join(UPLOAD_DIR, prep_filename)
        prep_info = ImagePreprocessor.preprocess_image(original_filepath, prep_filepath)

        # Upload record
        up_img = UploadedImage(
            inspection_id=inspection.id,
            file_path=original_filepath.replace("\\", "/"),
            preprocessed_path=prep_filepath.replace("\\", "/"),
            label_type=label_type or "front",
            file_size_bytes=prep_info["file_size_bytes"],
            width=prep_info["original_width"],
            height=prep_info["original_height"]
        )
        db.add(up_img)
        uploaded_image_records.append(up_img)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="INSPECTION_UPLOAD",
        entity_type="inspection",
        entity_id=insp_id,
        details=f"Uploaded {len(files)} packaging image(s) for product '{product_name}'"
    )
    db.add(audit)
    db.commit()

    return {
        "inspection_id": insp_id,
        "product_id": product.id,
        "images_uploaded": len(uploaded_image_records),
        "status": "pending",
        "message": "Images uploaded and preprocessed successfully. Ready for OCR and compliance analysis."
    }

@router.post("/{inspection_id}/process")
async def process_inspection(
    inspection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    images = db.query(UploadedImage).filter(UploadedImage.inspection_id == inspection_id).all()
    if not images:
        raise HTTPException(status_code=400, detail="No images associated with this inspection")

    ocr_mgr = OCREngineManager()
    all_lines = []
    raw_text_parts = []
    bboxes = []
    confs = []

    # Run OCR on all images (e.g. front and back)
    for img in images:
        img_to_read = img.preprocessed_path or img.file_path
        ocr_out = await ocr_mgr.extract_text(img_to_read)
        all_lines.extend(ocr_out["lines"])
        if ocr_out["raw_text"]:
            raw_text_parts.append(ocr_out["raw_text"])
        bboxes.extend(ocr_out["bounding_boxes"])
        confs.append(ocr_out["confidence_avg"])

        # Store OCR record
        ocr_record = OCRExtraction(
            inspection_id=insp.id,
            image_id=img.id,
            raw_text=ocr_out["raw_text"],
            lines_json=json.dumps(ocr_out["lines"]),
            bounding_boxes_json=json.dumps(ocr_out["bounding_boxes"]),
            confidence_avg=ocr_out["confidence_avg"],
            engine_used=ocr_out["engine"]
        )
        db.add(ocr_record)

    combined_text = "\n".join(raw_text_parts)
    avg_conf = sum(confs) / len(confs) if confs else 0.85

    # Classify declarations
    declarations = DeclarationClassifier.classify(all_lines, combined_text)

    # Clean existing declarations for this inspection if re-processing
    db.query(ExtractedDeclaration).filter(ExtractedDeclaration.inspection_id == inspection_id).delete()
    db.query(ComplianceResult).filter(ComplianceResult.inspection_id == inspection_id).delete()

    for d in declarations:
        decl_rec = ExtractedDeclaration(
            inspection_id=insp.id,
            declaration_key=d["declaration_key"],
            raw_value=d["raw_value"],
            normalized_value=d["normalized_value"],
            confidence=d["confidence"],
            bounding_box_json=json.dumps(d["bounding_box"]) if d["bounding_box"] else None,
            readability_score=d["readability_score"]
        )
        db.add(decl_rec)

    # Run Compliance Checks
    rules = [r.__dict__ for r in db.query(ComplianceRule).filter(ComplianceRule.is_active == True).all()]
    comp_eval = ComplianceEngine.evaluate(declarations, rules, {"category": insp.product.category if insp.product else "General"})

    for cr in comp_eval["results"]:
        c_rec = ComplianceResult(
            inspection_id=insp.id,
            rule_id=cr["rule_id"],
            declaration_key=cr["required_declaration"],
            status=cr["status"],
            extracted_value=cr["extracted_value"],
            evidence_reason=cr["evidence_reason"],
            confidence=cr["confidence"],
            severity=cr["severity"],
            requires_human_review=cr["requires_human_review"],
            evidence_bounding_box=json.dumps(cr["evidence_bounding_box"]) if cr["evidence_bounding_box"] else None
        )
        db.add(c_rec)

    # Update Inspection Status
    insp.status = "completed"
    insp.overall_compliance = comp_eval["overall_compliance"]
    insp.ocr_confidence_avg = round(avg_conf, 2)
    insp.total_rules = comp_eval["total_rules"]
    insp.passed_rules = comp_eval["passed_rules"]
    insp.violation_rules = comp_eval["violation_rules"]
    insp.review_rules = comp_eval["review_rules"]
    insp.updated_at = datetime.utcnow()

    # Generate ReportLab PDF
    report_data = {
        "id": insp.id,
        "created_at": insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "inspector_name": current_user.full_name,
        "overall_compliance": comp_eval["overall_compliance"],
        "product": {
            "name": insp.product.name if insp.product else "N/A",
            "brand": insp.product.brand if insp.product else "N/A",
            "category": insp.product.category if insp.product else "N/A"
        },
        "declarations": declarations,
        "compliance_results": comp_eval["results"]
    }
    rep_info = InspectionReportGenerator.generate_pdf(report_data)

    existing_rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()
    if existing_rep:
        existing_rep.report_number = rep_info["report_number"]
        existing_rep.pdf_path = rep_info["filepath"].replace("\\", "/")
        existing_rep.hash_checksum = rep_info["checksum"]
    else:
        new_rep = InspectionReport(
            inspection_id=insp.id,
            report_number=rep_info["report_number"],
            pdf_path=rep_info["filepath"].replace("\\", "/"),
            generated_by=current_user.full_name,
            hash_checksum=rep_info["checksum"]
        )
        db.add(new_rep)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="INSPECTION_PROCESSED",
        entity_type="inspection",
        entity_id=insp.id,
        details=f"OCR & Compliance checked: {comp_eval['passed_rules']} passed, {comp_eval['violation_rules']} violations, status: {comp_eval['overall_compliance']}"
    )
    db.add(audit)
    db.commit()

    return {
        "inspection_id": insp.id,
        "overall_compliance": comp_eval["overall_compliance"],
        "passed_rules": comp_eval["passed_rules"],
        "violation_rules": comp_eval["violation_rules"],
        "review_rules": comp_eval["review_rules"],
        "total_rules": comp_eval["total_rules"],
        "report_number": rep_info["report_number"],
        "download_url": f"/api/reports/{insp.id}/download"
    }

@router.get("/{inspection_id}/status")
def get_inspection_status(inspection_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    return {
        "id": insp.id,
        "status": insp.status,
        "overall_compliance": insp.overall_compliance,
        "ocr_confidence_avg": insp.ocr_confidence_avg,
        "passed_rules": insp.passed_rules,
        "violation_rules": insp.violation_rules,
        "review_rules": insp.review_rules
    }

@router.get("/history")
def get_inspection_history(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection).join(Product, Inspection.product_id == Product.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.brand.ilike(search_filter),
                Inspection.id.ilike(search_filter)
            )
        )

    if status and status != "ALL":
        query = query.filter(Inspection.overall_compliance == status)

    if category and category != "ALL":
        query = query.filter(Product.category == category)

    total_count = query.count()
    inspections = query.order_by(Inspection.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for insp in inspections:
        prod = insp.product
        rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == insp.id).first()
        img = db.query(UploadedImage).filter(UploadedImage.inspection_id == insp.id).first()
        items.append({
            "id": insp.id,
            "product_name": prod.name if prod else "N/A",
            "brand": prod.brand if prod else "N/A",
            "category": prod.category if prod else "N/A",
            "declared_net_quantity": prod.declared_net_quantity if prod else None,
            "declared_mrp": prod.declared_mrp if prod else None,
            "overall_compliance": insp.overall_compliance,
            "status": insp.status,
            "passed_rules": insp.passed_rules,
            "violation_rules": insp.violation_rules,
            "review_rules": insp.review_rules,
            "created_at": insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else "",
            "image_url": f"/{img.file_path}" if img else None,
            "has_report": rep is not None,
            "report_number": rep.report_number if rep else None
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.get("/{inspection_id}")
def get_inspection_details(inspection_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    prod = insp.product
    images = db.query(UploadedImage).filter(UploadedImage.inspection_id == inspection_id).all()
    decls = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.inspection_id == inspection_id).all()
    results = db.query(ComplianceResult).filter(ComplianceResult.inspection_id == inspection_id).all()
    report = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()

    image_list = []
    for im in images:
        image_list.append({
            "id": im.id,
            "file_path": f"/{im.file_path}",
            "preprocessed_path": f"/{im.preprocessed_path}" if im.preprocessed_path else None,
            "label_type": im.label_type,
            "width": im.width,
            "height": im.height,
            "file_size_bytes": im.file_size_bytes
        })

    decl_list = []
    for d in decls:
        decl_list.append({
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

    result_list = []
    for r in results:
        rule_obj = db.query(ComplianceRule).filter(ComplianceRule.id == r.rule_id).first()
        result_list.append({
            "id": r.id,
            "rule_id": r.rule_id,
            "rule_name": rule_obj.name if rule_obj else r.rule_id,
            "legal_reference": rule_obj.legal_reference if rule_obj else "Rule 6",
            "required_declaration": r.declaration_key,
            "extracted_value": r.extracted_value,
            "status": r.status,
            "evidence_reason": r.evidence_reason,
            "confidence": r.confidence,
            "severity": r.severity,
            "requires_human_review": r.requires_human_review,
            "evidence_bounding_box": json.loads(r.evidence_bounding_box) if r.evidence_bounding_box else None
        })

    return {
        "id": insp.id,
        "product": {
            "name": prod.name if prod else "Unknown",
            "brand": prod.brand if prod else "Unknown",
            "category": prod.category if prod else "General",
            "declared_net_quantity": prod.declared_net_quantity if prod else None,
            "declared_mrp": prod.declared_mrp if prod else None,
            "country_of_origin": prod.country_of_origin if prod else "India"
        },
        "inspector_name": insp.inspector.full_name if insp.inspector else "Govt Inspector",
        "reviewer_name": insp.reviewer.full_name if insp.reviewer else None,
        "status": insp.status,
        "overall_compliance": insp.overall_compliance,
        "ocr_confidence_avg": insp.ocr_confidence_avg,
        "total_rules": insp.total_rules,
        "passed_rules": insp.passed_rules,
        "violation_rules": insp.violation_rules,
        "review_rules": insp.review_rules,
        "location_state": insp.location_state,
        "created_at": insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else "",
        "images": image_list,
        "declarations": decl_list,
        "compliance_results": result_list,
        "report": {
            "report_number": report.report_number if report else None,
            "download_url": f"/api/reports/{insp.id}/download" if report else None
        } if report else None
    }

@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Clean up files
    images = db.query(UploadedImage).filter(UploadedImage.inspection_id == inspection_id).all()
    for img in images:
        if img.file_path and os.path.exists(img.file_path):
            try:
                os.remove(img.file_path)
            except Exception:
                pass
        if img.preprocessed_path and os.path.exists(img.preprocessed_path):
            try:
                os.remove(img.preprocessed_path)
            except Exception:
                pass

    rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()
    if rep and rep.pdf_path and os.path.exists(rep.pdf_path):
        try:
            os.remove(rep.pdf_path)
        except Exception:
            pass

    db.delete(insp)
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="INSPECTION_DELETED",
        entity_type="inspection",
        entity_id=inspection_id,
        details=f"Deleted inspection {inspection_id}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Inspection {inspection_id} deleted successfully"}

