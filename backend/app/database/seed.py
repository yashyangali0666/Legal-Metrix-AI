import os
import shutil
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.user import User
from backend.app.models.product import Product
from backend.app.models.rule import ComplianceRule, RuleHistory, ComplianceResult
from backend.app.models.inspection import (
    Inspection, UploadedImage, OCRExtraction, ExtractedDeclaration, VerificationRecord, InspectionReport
)
from backend.app.models.audit import AuditLog
from backend.app.compliance.rules_catalog import OFFICIAL_LMR_RULES
from backend.app.services.auth_service import get_password_hash
from backend.app.vision.preprocessor import ImagePreprocessor
from backend.app.ocr.engine import OCREngineManager
from backend.app.ocr.classifier import DeclarationClassifier
from backend.app.compliance.engine import ComplianceEngine
from backend.app.reports.pdf_generator import InspectionReportGenerator

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_users(db: Session):
    default_accounts = [
        {
            "username": "admin",
            "email": "admin@legalmetrix.gov.in",
            "password": "Admin@123",
            "full_name": "Chief Legal Metrology Controller",
            "role": "admin",
            "department": "Headquarters Enforcement Cell",
            "badge_number": "LM-DL-HQ-01"
        },
        {
            "username": "inspector",
            "email": "inspector@legalmetrix.gov.in",
            "password": "Inspector@123",
            "full_name": "Field Inspector (Delhi)",
            "role": "inspector",
            "department": "Delhi North District Inspection Unit",
            "badge_number": "LM-DL-N-01"
        },
        {
            "username": "inspector_rajesh",
            "email": "rajesh.kumar@legalmetrix.gov.in",
            "password": "Inspector@123",
            "full_name": "Rajesh Kumar",
            "role": "inspector",
            "department": "Delhi North District Inspection Unit",
            "badge_number": "LM-DL-N-42"
        },
        {
            "username": "reviewer",
            "email": "reviewer@legalmetrix.gov.in",
            "password": "Reviewer@123",
            "full_name": "Senior Review Officer",
            "role": "reviewer",
            "department": "Statutory Standards Review Board",
            "badge_number": "LM-REV-01"
        },
        {
            "username": "reviewer_anita",
            "email": "anita.sharma@legalmetrix.gov.in",
            "password": "Reviewer@123",
            "full_name": "Anita Sharma",
            "role": "reviewer",
            "department": "Statutory Standards Review Board",
            "badge_number": "LM-REV-07"
        }
    ]

    for acc in default_accounts:
        existing = db.query(User).filter(User.username == acc["username"]).first()
        if not existing:
            new_u = User(
                username=acc["username"],
                email=acc["email"],
                hashed_password=get_password_hash(acc["password"]),
                full_name=acc["full_name"],
                role=acc["role"],
                department=acc["department"],
                badge_number=acc["badge_number"],
                is_active=True
            )
            db.add(new_u)
    db.commit()
    print("[SEED] Default Users verified and seeded.")

def seed_rules(db: Session):
    for r in OFFICIAL_LMR_RULES:
        existing = db.query(ComplianceRule).filter(ComplianceRule.id == r["id"]).first()
        if not existing:
            rule_obj = ComplianceRule(
                id=r["id"],
                rule_number=r["rule_number"],
                name=r["name"],
                description=r["description"],
                legal_reference=r["legal_reference"],
                category_filter=r["category_filter"],
                required_declaration=r["required_declaration"],
                validation_type=r["validation_type"],
                severity=r["severity"],
                is_active=r["is_active"],
                effective_date=r["effective_date"],
                version=r["version"],
                created_by="Directorate of Legal Metrology"
            )
            db.add(rule_obj)
    db.commit()
    print("[SEED] Statutory compliance rules seeded.")

async def seed_initial_inspections(db: Session):
    # Only seed if no inspections exist
    if db.query(Inspection).count() > 0:
        return

    inspector = db.query(User).filter(User.username == "inspector_rajesh").first()
    reviewer = db.query(User).filter(User.username == "reviewer_anita").first()
    ocr_mgr = OCREngineManager()

    sample_specs = [
        {
            "id": "INSP-2026-1001",
            "img_file": "sample_chips_compliant.jpg",
            "name": "Aloo Bhujia Crispy Snacks 150g",
            "brand": "Haldiram's",
            "category": "Food & Beverages",
            "mrp": 50.0,
            "net_qty": "150 g",
            "state": "Delhi NCT"
        },
        {
            "id": "INSP-2026-1002",
            "img_file": "sample_biscuit_missing_mrp.jpg",
            "name": "Glucose Milk Biscuits 250g",
            "brand": "Parle-G",
            "category": "Food & Beverages",
            "mrp": None,
            "net_qty": "250 g",
            "state": "Maharashtra"
        },
        {
            "id": "INSP-2026-1003",
            "img_file": "sample_oil_incomplete_address.jpg",
            "name": "Cold Pressed Pure Mustard Oil 1L",
            "brand": "Tata Sampann",
            "category": "Edible Oils",
            "mrp": 195.0,
            "net_qty": "1 L",
            "state": "Uttar Pradesh"
        },
        {
            "id": "INSP-2026-1004",
            "img_file": "sample_imported_no_origin.jpg",
            "name": "Swiss Truffles Dark Confection 200g",
            "brand": "Cadbury",
            "category": "Confectionery",
            "mrp": 250.0,
            "net_qty": "200 g",
            "state": "Karnataka"
        },
        {
            "id": "INSP-2026-1005",
            "img_file": "sample_cosmetic_exempt.jpg",
            "name": "Purifying Neem Face Wash Mini 8ml",
            "brand": "Himalaya",
            "category": "Cosmetics",
            "mrp": 15.0,
            "net_qty": "8 ml",
            "state": "Tamil Nadu"
        }
    ]

    os.makedirs("backend/uploads", exist_ok=True)
    rules = [r.__dict__ for r in db.query(ComplianceRule).filter(ComplianceRule.is_active == True).all()]

    for spec in sample_specs:
        src_path = os.path.join("backend/sample_images", spec["img_file"])
        if not os.path.exists(src_path):
            continue

        dest_filename = f"{spec['id']}_{spec['img_file']}"
        dest_path = os.path.join("backend/uploads", dest_filename)
        shutil.copyfile(src_path, dest_path)

        # 1. Product
        product = Product(
            name=spec["name"],
            brand=spec["brand"],
            category=spec["category"],
            declared_mrp=spec["mrp"],
            declared_net_quantity=spec["net_qty"],
            country_of_origin="India"
        )
        db.add(product)
        db.flush()

        # 2. Preprocess
        prep_path = os.path.join("backend/uploads", f"prep_{dest_filename}")
        img_info = ImagePreprocessor.preprocess_image(dest_path, prep_path)

        # 3. OCR extraction
        ocr_res = await ocr_mgr.extract_text(prep_path)

        # 4. Declarations classification
        decls = DeclarationClassifier.classify(ocr_res["lines"], ocr_res["raw_text"])

        # 5. Compliance evaluation
        comp_res = ComplianceEngine.evaluate(decls, rules, {"category": spec["category"]})

        # 6. Inspection Record
        insp = Inspection(
            id=spec["id"],
            product_id=product.id,
            inspector_id=inspector.id if inspector else None,
            reviewer_id=reviewer.id if reviewer else None,
            status="completed",
            overall_compliance=comp_res["overall_compliance"],
            ocr_confidence_avg=ocr_res["confidence_avg"],
            total_rules=comp_res["total_rules"],
            passed_rules=comp_res["passed_rules"],
            violation_rules=comp_res["violation_rules"],
            review_rules=comp_res["review_rules"],
            location_state=spec["state"]
        )
        db.add(insp)
        db.flush()

        # 7. Uploaded Image
        up_img = UploadedImage(
            inspection_id=insp.id,
            file_path=dest_path.replace("\\", "/"),
            preprocessed_path=prep_path.replace("\\", "/"),
            label_type="front",
            file_size_bytes=img_info["file_size_bytes"],
            width=img_info["original_width"],
            height=img_info["original_height"]
        )
        db.add(up_img)
        db.flush()

        # 8. OCR DB record
        import json
        ocr_rec = OCRExtraction(
            inspection_id=insp.id,
            image_id=up_img.id,
            raw_text=ocr_res["raw_text"],
            lines_json=json.dumps(ocr_res["lines"]),
            bounding_boxes_json=json.dumps(ocr_res["bounding_boxes"]),
            confidence_avg=ocr_res["confidence_avg"],
            engine_used=ocr_res["engine"]
        )
        db.add(ocr_rec)

        # 9. Declarations records
        for d in decls:
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

        # 10. Compliance Results records
        for cr in comp_res["results"]:
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

        # 11. PDF Report
        report_data = {
            "id": insp.id,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "inspector_name": inspector.full_name if inspector else "Rajesh Kumar",
            "overall_compliance": comp_res["overall_compliance"],
            "product": {
                "name": product.name,
                "brand": product.brand,
                "category": product.category
            },
            "declarations": decls,
            "compliance_results": comp_res["results"]
        }
        rep_info = InspectionReportGenerator.generate_pdf(report_data)
        rep_rec = InspectionReport(
            inspection_id=insp.id,
            report_number=rep_info["report_number"],
            pdf_path=rep_info["filepath"].replace("\\", "/"),
            generated_by="Automatic Triage Engine",
            hash_checksum=rep_info["checksum"]
        )
        db.add(rep_rec)

    db.commit()
    print("[SEED] 5 Initial Inspections with real OCR & Compliance reports seeded successfully.")

def run_seed():
    init_db()
    db = SessionLocal()
    try:
        seed_users(db)
        seed_rules(db)
        asyncio.run(seed_initial_inspections(db))
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()

