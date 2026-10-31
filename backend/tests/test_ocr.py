import os
import pytest
from backend.app.ocr.classifier import DeclarationClassifier
from backend.app.reports.pdf_generator import InspectionReportGenerator

def test_declaration_classifier():
    raw_lines = [
        {"text": "Haldiram's Aloo Bhujia", "confidence": 0.95, "bounding_box": {"x": 0.1, "y": 0.1, "width": 0.5, "height": 0.05}},
        {"text": "Net Weight 150 g", "confidence": 0.98, "bounding_box": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.04}},
        {"text": "MRP Rs. 50.00 INCL. OF ALL TAXES", "confidence": 0.96, "bounding_box": {"x": 0.1, "y": 0.3, "width": 0.4, "height": 0.04}},
        {"text": "Unit Sale Price: Rs. 0.33 per g", "confidence": 0.92, "bounding_box": {"x": 0.1, "y": 0.4, "width": 0.35, "height": 0.03}},
        {"text": "Mfg Date: 10/2026", "confidence": 0.90, "bounding_box": {"x": 0.1, "y": 0.5, "width": 0.25, "height": 0.03}},
        {"text": "Manufactured by: Haldiram Snacks Pvt Ltd, New Delhi 110044", "confidence": 0.94, "bounding_box": {"x": 0.1, "y": 0.6, "width": 0.7, "height": 0.04}},
        {"text": "Customer Care: 1800-102-4455 | care@haldirams.com", "confidence": 0.95, "bounding_box": {"x": 0.1, "y": 0.7, "width": 0.6, "height": 0.03}},
        {"text": "Country of Origin: India", "confidence": 0.99, "bounding_box": {"x": 0.1, "y": 0.8, "width": 0.3, "height": 0.03}},
    ]
    raw_text = "\n".join(l["text"] for l in raw_lines)

    classified = DeclarationClassifier.classify(raw_lines, raw_text)
    mapping = {c["declaration_key"]: c for c in classified}

    assert "mrp" in mapping
    assert "₹50.00" in mapping["mrp"]["normalized_value"]

    assert "net_quantity" in mapping
    assert "150 g" in mapping["net_quantity"]["normalized_value"]

    assert "unit_sale_price" in mapping
    assert "₹0.33 / g" in mapping["unit_sale_price"]["normalized_value"]

    assert "consumer_care" in mapping
    assert "1800-102-4455" in mapping["consumer_care"]["normalized_value"]

def test_reportlab_pdf_generation():
    sample_inspection = {
        "id": "INSP-TEST-9999",
        "inspector_name": "Senior Inspector Test",
        "overall_compliance": "COMPLIANT",
        "product": {
            "name": "Test Potato Crisps",
            "brand": "TestBrand",
            "category": "Food & Beverages"
        },
        "declarations": [
            {"declaration_key": "mrp", "label": "MRP", "normalized_value": "₹40.00 (incl. of all taxes)", "confidence": 0.95, "readability_score": "HIGH", "is_manually_corrected": False},
            {"declaration_key": "net_quantity", "label": "Net Qty", "normalized_value": "100 g", "confidence": 0.96, "readability_score": "HIGH", "is_manually_corrected": False}
        ],
        "compliance_results": [
            {"rule_id": "LMR-RULE-06-1E", "rule_name": "MRP Declaration", "legal_reference": "Rule 6(1)(e)", "status": "COMPLIANT", "evidence_reason": "Price verified with inclusive of taxes", "confidence": 95, "severity": "CRITICAL"},
            {"rule_id": "LMR-RULE-06-1C", "rule_name": "Net Quantity", "legal_reference": "Rule 6(1)(c)", "status": "COMPLIANT", "evidence_reason": "Standard metric unit verified", "confidence": 96, "severity": "CRITICAL"}
        ]
    }

    out_info = InspectionReportGenerator.generate_pdf(sample_inspection, output_dir="backend/generated_reports")
    assert os.path.exists(out_info["filepath"])
    assert out_info["checksum"] is not None
    assert len(out_info["checksum"]) == 64

