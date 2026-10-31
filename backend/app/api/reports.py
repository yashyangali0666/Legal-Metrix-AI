import os
import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.inspection import (
    Inspection, ExtractedDeclaration, InspectionReport
)
from backend.app.models.rule import ComplianceResult
from backend.app.models.audit import AuditLog
from backend.app.reports.pdf_generator import InspectionReportGenerator
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Inspection Reports"])

@router.post("/generate/{inspection_id}")
def generate_report(
    inspection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    decls = db.query(ExtractedDeclaration).filter(ExtractedDeclaration.inspection_id == inspection_id).all()
    results = db.query(ComplianceResult).filter(ComplianceResult.inspection_id == inspection_id).all()

    decl_list = []
    for d in decls:
        decl_list.append({
            "declaration_key": d.declaration_key,
            "label": d.declaration_key.replace("_", " ").title(),
            "raw_value": d.raw_value,
            "normalized_value": d.normalized_value,
            "confidence": d.confidence,
            "readability_score": d.readability_score,
            "is_manually_corrected": d.is_manually_corrected,
            "corrected_value": d.corrected_value
        })

    result_list = []
    for r in results:
        result_list.append({
            "rule_id": r.rule_id,
            "rule_name": r.rule.name if r.rule else r.rule_id,
            "legal_reference": r.rule.legal_reference if r.rule else "Rule 6",
            "required_declaration": r.declaration_key,
            "extracted_value": r.extracted_value,
            "status": r.status,
            "evidence_reason": r.evidence_reason,
            "confidence": r.confidence,
            "severity": r.severity
        })

    report_payload = {
        "id": insp.id,
        "created_at": insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "inspector_name": current_user.full_name,
        "overall_compliance": insp.overall_compliance,
        "product": {
            "name": insp.product.name if insp.product else "N/A",
            "brand": insp.product.brand if insp.product else "N/A",
            "category": insp.product.category if insp.product else "N/A"
        },
        "declarations": decl_list,
        "compliance_results": result_list
    }

    rep_info = InspectionReportGenerator.generate_pdf(report_payload)

    existing_rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()
    if existing_rep:
        existing_rep.report_number = rep_info["report_number"]
        existing_rep.pdf_path = rep_info["filepath"].replace("\\", "/")
        existing_rep.hash_checksum = rep_info["checksum"]
        existing_rep.generated_at = datetime.utcnow()
    else:
        new_rep = InspectionReport(
            inspection_id=insp.id,
            report_number=rep_info["report_number"],
            pdf_path=rep_info["filepath"].replace("\\", "/") ,
            generated_by=current_user.full_name,
            hash_checksum=rep_info["checksum"]
        )
        db.add(new_rep)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.username,
        action="REPORT_GENERATED",
        entity_type="report",
        entity_id=rep_info["report_number"],
        details=f"Generated statutory PDF report {rep_info['report_number']} for inspection {insp.id}"
    )
    db.add(audit)
    db.commit()

    return {
        "report_number": rep_info["report_number"],
        "pdf_url": f"/api/reports/{insp.id}/download",
        "checksum": rep_info["checksum"],
        "message": "Statutory PDF compliance report generated successfully."
    }

@router.get("/{inspection_id}/download")
def download_pdf_report(inspection_id: str, db: Session = Depends(get_db)):
    rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == inspection_id).first()
    if not rep or not os.path.exists(rep.pdf_path):
        raise HTTPException(status_code=404, detail="Inspection PDF report not found or not yet generated")

    return FileResponse(
        path=rep.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(rep.pdf_path)
    )

@router.get("/export/csv")
def export_inspections_csv(db: Session = Depends(get_db)):
    inspections = db.query(Inspection).order_by(Inspection.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Inspection ID", "Product Name", "Brand", "Category", "Net Quantity",
        "Declared MRP", "Compliance Status", "Passed Rules", "Violations", "Needs Review",
        "Date of Inspection", "Location State"
    ])

    for insp in inspections:
        prod = insp.product
        writer.writerow([
            insp.id,
            prod.name if prod else "",
            prod.brand if prod else "",
            prod.category if prod else "",
            prod.declared_net_quantity if prod else "",
            prod.declared_mrp if prod else "",
            insp.overall_compliance,
            insp.passed_rules,
            insp.violation_rules,
            insp.review_rules,
            insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else "",
            insp.location_state or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=LegalMetrix_Inspections_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

