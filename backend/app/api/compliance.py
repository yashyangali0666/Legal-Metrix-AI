import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.inspection import Inspection, ExtractedDeclaration, InspectionReport
from backend.app.models.rule import ComplianceRule, ComplianceResult
from backend.app.models.audit import AuditLog
from backend.app.compliance.engine import ComplianceEngine
from backend.app.reports.pdf_generator import InspectionReportGenerator
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])

@router.get("/rules")
def get_compliance_rules(db: Session = Depends(get_db)):
    rules = db.query(ComplianceRule).order_by(ComplianceRule.id).all()
    return [
        {
            "id": r.id,
            "rule_number": r.rule_number,
            "name": r.name,
            "description": r.description,
            "legal_reference": r.legal_reference,
            "category_filter": r.category_filter,
            "required_declaration": r.required_declaration,
            "validation_type": r.validation_type,
            "severity": r.severity,
            "is_active": r.is_active,
            "effective_date": r.effective_date,
            "version": r.version,
            "created_by": r.created_by,
            "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M") if r.updated_at else ""
        }
        for r in rules
    ]

@router.get("/{inspection_id}/results")
def get_compliance_results(inspection_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    results = db.query(ComplianceResult).filter(ComplianceResult.inspection_id == inspection_id).all()

    items = []
    for r in results:
        rule_obj = db.query(ComplianceRule).filter(ComplianceRule.id == r.rule_id).first()
        items.append({
            "id": r.id,
            "rule_id": r.rule_id,
            "rule_name": rule_obj.name if rule_obj else r.rule_id,
            "legal_reference": rule_obj.legal_reference if rule_obj else "Legal Metrology Rules 2011",
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
        "inspection_id": inspection_id,
        "overall_compliance": insp.overall_compliance,
        "total_rules": insp.total_rules,
        "passed_rules": insp.passed_rules,
        "violation_rules": insp.violation_rules,
        "review_rules": insp.review_rules,
        "ocr_confidence_avg": insp.ocr_confidence_avg,
        "results": items,
        "inspection_scope_disclaimer": ComplianceEngine.DISCLAIMER_TEXT
    }

@router.post("/check/{inspection_id}")
def rerun_compliance_check(
    inspection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    decls = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.inspection_id == inspection_id).all()
    if not decls:
        raise HTTPException(status_code=400, detail="No extracted declarations found to validate")

    decl_dicts = []
    for d in decls:
        decl_dicts.append({
            "declaration_key": d.declaration_key,
            "raw_value": d.raw_value,
            "normalized_value": d.normalized_value,
            "confidence": d.confidence,
            "bounding_box": json.loads(d.bounding_box_json) if d.bounding_box_json else None,
            "readability_score": d.readability_score,
            "is_manually_corrected": d.is_manually_corrected,
            "corrected_value": d.corrected_value
        })

    rules = [r.__dict__ for r in db.query(ComplianceRule).filter(ComplianceRule.is_active == True).all()]
    comp_eval = ComplianceEngine.evaluate(decl_dicts, rules, {"category": insp.product.category if insp.product else "General"})

    # Delete previous results and update
    db.query(ComplianceResult).filter(ComplianceResult.inspection_id == inspection_id).delete()
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

    insp.overall_compliance = comp_eval["overall_compliance"]
    insp.total_rules = comp_eval["total_rules"]
    insp.passed_rules = comp_eval["passed_rules"]
    insp.violation_rules = comp_eval["violation_rules"]
    insp.review_rules = comp_eval["review_rules"]
    insp.updated_at = datetime.utcnow()

    # Re-generate PDF Report with updated compliance evaluation
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
        "declarations": decl_dicts,
        "compliance_results": comp_eval["results"]
    }
    rep_info = InspectionReportGenerator.generate_pdf(report_data)

    existing_rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()
    if existing_rep:
        existing_rep.report_number = rep_info["report_number"]
        existing_rep.pdf_path = rep_info["filepath"].replace("\\", "/")
        existing_rep.hash_checksum = rep_info["checksum"]

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="COMPLIANCE_RECHECK",
        entity_type="inspection",
        entity_id=insp.id,
        details=f"Compliance re-evaluated. Status: {comp_eval['overall_compliance']}"
    )
    db.add(audit)
    db.commit()

    return {
        "inspection_id": insp.id,
        "overall_compliance": comp_eval["overall_compliance"],
        "total_rules": comp_eval["total_rules"],
        "passed_rules": comp_eval["passed_rules"],
        "violation_rules": comp_eval["violation_rules"],
        "review_rules": comp_eval["review_rules"],
        "message": "Compliance re-evaluation completed successfully."
    }

