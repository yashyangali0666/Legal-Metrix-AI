import pytest
from backend.app.compliance.engine import ComplianceEngine
from backend.app.compliance.rules_catalog import OFFICIAL_LMR_RULES

def test_compliant_potato_chips_declarations():
    declarations = [
        {"declaration_key": "product_name", "normalized_value": "Aloo Bhujia Crispy Snacks", "confidence": 0.95},
        {"declaration_key": "mrp", "normalized_value": "₹50.00 (incl. of all taxes)", "raw_value": "MRP Rs 50 incl of all taxes", "confidence": 0.95},
        {"declaration_key": "net_quantity", "normalized_value": "150 g", "confidence": 0.95},
        {"declaration_key": "unit_sale_price", "normalized_value": "₹0.33 / g", "confidence": 0.92},
        {"declaration_key": "date_of_manufacture", "normalized_value": "10/2026", "confidence": 0.90},
        {"declaration_key": "manufacturer", "normalized_value": "Haldiram Snacks Pvt Ltd, New Delhi 110044", "confidence": 0.95},
        {"declaration_key": "consumer_care", "normalized_value": "Phone: 1800-102-4455 | Email: care@haldirams.com", "confidence": 0.95},
        {"declaration_key": "country_of_origin", "normalized_value": "India", "confidence": 0.98},
        {"declaration_key": "readability", "readability_score": "HIGH", "confidence": 0.95}
    ]

    eval_res = ComplianceEngine.evaluate(declarations, OFFICIAL_LMR_RULES)

    assert eval_res["overall_compliance"] == "COMPLIANT"
    assert eval_res["violation_rules"] == 0
    assert eval_res["passed_rules"] >= 8

def test_missing_mrp_violation():
    declarations = [
        {"declaration_key": "product_name", "normalized_value": "Parle-G Biscuits", "confidence": 0.95},
        # mrp is completely missing
        {"declaration_key": "net_quantity", "normalized_value": "250 g", "confidence": 0.95},
        {"declaration_key": "manufacturer", "normalized_value": "Parle Products Pvt Ltd, Mumbai 400057", "confidence": 0.95},
        {"declaration_key": "date_of_manufacture", "normalized_value": "09/2026", "confidence": 0.90},
        {"declaration_key": "consumer_care", "normalized_value": "care@parle.biz", "confidence": 0.90},
        {"declaration_key": "country_of_origin", "normalized_value": "India", "confidence": 0.95}
    ]

    eval_res = ComplianceEngine.evaluate(declarations, OFFICIAL_LMR_RULES)

    assert eval_res["overall_compliance"] == "NON_COMPLIANT"
    assert eval_res["violation_rules"] >= 1
    mrp_result = next((r for r in eval_res["results"] if r["rule_id"] == "LMR-RULE-06-1E"), None)
    assert mrp_result is not None
    assert mrp_result["status"] == "NON_COMPLIANT"

def test_incomplete_address_needs_review():
    declarations = [
        {"declaration_key": "product_name", "normalized_value": "Pure Mustard Oil", "confidence": 0.95},
        {"declaration_key": "mrp", "normalized_value": "₹195.00 incl. of all taxes", "raw_value": "incl of taxes", "confidence": 0.95},
        {"declaration_key": "net_quantity", "normalized_value": "1 L", "confidence": 0.95},
        # Manufacturer address lacks 6-digit PIN code
        {"declaration_key": "manufacturer", "normalized_value": "Tata Consumer Products Ltd, Bareilly", "confidence": 0.70},
        {"declaration_key": "date_of_manufacture", "normalized_value": "08/2026", "confidence": 0.90},
        {"declaration_key": "consumer_care", "normalized_value": "Phone: 1800-345-0066", "confidence": 0.90},
        {"declaration_key": "country_of_origin", "normalized_value": "India", "confidence": 0.95}
    ]

    eval_res = ComplianceEngine.evaluate(declarations, OFFICIAL_LMR_RULES)

    mfg_result = next((r for r in eval_res["results"] if r["rule_id"] == "LMR-RULE-06-1B"), None)
    assert mfg_result is not None
    assert mfg_result["status"] == "NEEDS_REVIEW"
    assert mfg_result["requires_human_review"] is True

def test_small_package_exemption():
    declarations = [
        {"declaration_key": "product_name", "normalized_value": "Herbal Face Wash Mini", "confidence": 0.95},
        {"declaration_key": "net_quantity", "normalized_value": "8 ml", "confidence": 0.95},
        {"declaration_key": "mrp", "normalized_value": "₹15.00", "confidence": 0.95}
    ]

    eval_res = ComplianceEngine.evaluate(declarations, OFFICIAL_LMR_RULES)

    exemp_result = next((r for r in eval_res["results"] if r["rule_id"] == "LMR-RULE-26-EXEMP"), None)
    assert exemp_result is not None
    assert exemp_result["status"] == "NOT_APPLICABLE"

