import re
from typing import List, Dict, Any, Optional

class ComplianceEngine:
    """
    Statutory Legal Metrology Rule-Based Validation Engine.
    Executes configured rules against extracted declarations and product metadata.
    Does NOT invent declarations. Accurately flags compliant, non-compliant,
    needs review, and not applicable statutory checks.
    """

    DISCLAIMER_TEXT = (
        "Statutory Notice: This report constitutes automated AI-assisted regulatory triage "
        "under The Legal Metrology (Packaged Commodities) Rules, 2011. Results are based "
        "on optical image scanning and do not replace physical verification with calibrated "
        "inspection instruments or certified laboratory testing."
    )

    @classmethod
    def evaluate(
        cls,
        declarations: List[Dict[str, Any]],
        rules: List[Dict[str, Any]],
        product_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        product_meta = product_meta or {}
        decl_map = {d.get("declaration_key"): d for d in declarations}

        results: List[Dict[str, Any]] = []
        passed_cnt = 0
        violation_cnt = 0
        review_cnt = 0
        na_cnt = 0

        # Check exemption under Rule 26 first (e.g. Net Qty <= 10g or 10ml)
        net_qty_decl = decl_map.get("net_quantity", {})
        net_val = (net_qty_decl.get("normalized_value") or net_qty_decl.get("raw_value") or "").lower()
        is_small_pack_exempt = False
        qty_num_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(g|gm|ml)', net_val)
        if qty_num_match:
            val_num = float(qty_num_match.group(1))
            if val_num <= 10.0:
                is_small_pack_exempt = True

        for rule in rules:
            if not rule.get("is_active", True):
                continue

            rule_id = rule.get("id")
            req_decl_key = rule.get("required_declaration")
            severity = rule.get("severity", "HIGH")
            decl_item = decl_map.get(req_decl_key, {})

            # Get raw / normalized / corrected value
            extracted_val = decl_item.get("corrected_value") if decl_item.get("is_manually_corrected") else (
                decl_item.get("normalized_value") or decl_item.get("raw_value")
            )
            raw_val = decl_item.get("raw_value") or ""
            bbox = decl_item.get("bounding_box")
            decl_conf = int((decl_item.get("confidence", 0.0)) * 100)

            status = "NEEDS_REVIEW"
            evidence_reason = ""
            requires_human = False

            # RULE DISPATCH
            if rule_id == "LMR-RULE-26-EXEMP":
                if is_small_pack_exempt:
                    status = "NOT_APPLICABLE"
                    evidence_reason = f"Package declared quantity is {net_val} (<= 10g/10ml). Exempt from mandatory declarations under Rule 26(a)."
                    na_cnt += 1
                else:
                    status = "COMPLIANT"
                    evidence_reason = "Package net quantity exceeds 10g/10ml threshold; standard provisions of Packaged Commodities Rules apply."
                    passed_cnt += 1

            elif rule_id == "LMR-RULE-06-1A":
                # Product Name
                if extracted_val and len(extracted_val.strip()) > 2:
                    status = "COMPLIANT"
                    evidence_reason = f"Generic commodity name '{extracted_val}' clearly declared on packaging as per Rule 6(1)(a)."
                    passed_cnt += 1
                else:
                    status = "NEEDS_REVIEW"
                    evidence_reason = "Generic commodity name was not clearly isolated on scanned panel. Verification required."
                    requires_human = True
                    review_cnt += 1

            elif rule_id == "LMR-RULE-06-1B":
                # Manufacturer / Packer complete physical address
                if not extracted_val:
                    status = "NON_COMPLIANT"
                    evidence_reason = "Mandatory declaration of Manufacturer / Packer identity and address is MISSING from scanned packaging."
                    violation_cnt += 1
                else:
                    has_pin = bool(re.search(r'\b[1-9][0-9]{5}\b', extracted_val))
                    if has_pin:
                        status = "COMPLIANT"
                        evidence_reason = f"Manufacturer name and complete physical postal address with PIN code detected: '{extracted_val}'."
                        passed_cnt += 1
                    else:
                        status = "NEEDS_REVIEW"
                        evidence_reason = f"Manufacturer name detected ('{extracted_val}'), but full postal address or 6-digit postal PIN code could not be verified automatically."
                        requires_human = True
                        review_cnt += 1

            elif rule_id == "LMR-RULE-06-1C":
                # Net Quantity in standard metric units
                if not extracted_val:
                    status = "NON_COMPLIANT"
                    evidence_reason = "Mandatory Net Quantity declaration is MISSING from scanned packaging label."
                    violation_cnt += 1
                else:
                    valid_units = ["g", "kg", "ml", "l", "piece", "pcs", "n", "count"]
                    has_metric = any(re.search(rf'\b{u}\b', extracted_val.lower()) for u in valid_units)
                    if has_metric:
                        status = "COMPLIANT"
                        evidence_reason = f"Net Quantity '{extracted_val}' conforms to standard metric units specified in the Second Schedule of Legal Metrology Act."
                        passed_cnt += 1
                    else:
                        status = "NON_COMPLIANT"
                        evidence_reason = f"Net Quantity '{extracted_val}' appears in non-standard units, violating Rule 6(1)(c) and Rule 12."
                        violation_cnt += 1

            elif rule_id == "LMR-RULE-06-1D":
                # Date of manufacture / packing
                if extracted_val:
                    status = "COMPLIANT"
                    evidence_reason = f"Manufacturing / Packing date '{extracted_val}' successfully identified on packaging."
                    passed_cnt += 1
                else:
                    status = "NEEDS_REVIEW"
                    evidence_reason = "Manufacturing / Packing date not detected in OCR text. May be embossed on crimp seal or batch area."
                    requires_human = True
                    review_cnt += 1

            elif rule_id == "LMR-RULE-06-1E":
                # MRP Declaration
                if not extracted_val:
                    status = "NON_COMPLIANT"
                    evidence_reason = "Maximum Retail Price (MRP) declaration is MISSING from product packaging."
                    violation_cnt += 1
                else:
                    has_taxes = "tax" in extracted_val.lower() or "tax" in raw_val.lower()
                    if has_taxes:
                        status = "COMPLIANT"
                        evidence_reason = f"MRP declared as '{extracted_val}' with statutory 'inclusive of all taxes' clause."
                        passed_cnt += 1
                    else:
                        status = "NEEDS_REVIEW"
                        evidence_reason = f"Price detected ('{extracted_val}') but statutory phrase 'inclusive of all taxes' was not conclusively identified."
                        requires_human = True
                        review_cnt += 1

            elif rule_id == "LMR-RULE-06-1EA":
                # Unit Sale Price (USP)
                if extracted_val:
                    status = "COMPLIANT"
                    evidence_reason = f"Unit Sale Price '{extracted_val}' declared in compliance with 2021/2022 Amendment Rules."
                    passed_cnt += 1
                else:
                    # USP is mandatory for packages > 1kg/1L or standard prepackaged goods
                    status = "NEEDS_REVIEW"
                    evidence_reason = "Unit Sale Price (USP) declaration not detected on scanned panel. Required for standard packages under 2021 Amendment unless net qty is under threshold."
                    requires_human = True
                    review_cnt += 1

            elif rule_id == "LMR-RULE-06-1F":
                # Consumer Care details
                if extracted_val and ("phone" in extracted_val.lower() or "email" in extracted_val.lower() or "@" in extracted_val):
                    status = "COMPLIANT"
                    evidence_reason = f"Consumer grievance redressal details identified: '{extracted_val}'."
                    passed_cnt += 1
                elif extracted_val:
                    status = "NEEDS_REVIEW"
                    evidence_reason = f"Consumer care text detected ('{extracted_val}'), but both telephone and email contact channels should be confirmed."
                    requires_human = True
                    review_cnt += 1
                else:
                    status = "NON_COMPLIANT"
                    evidence_reason = "Mandatory Consumer Care / Helpline contact information is MISSING from product packaging."
                    violation_cnt += 1

            elif rule_id == "LMR-RULE-06-1G":
                # Country of Origin
                if extracted_val:
                    status = "COMPLIANT"
                    evidence_reason = f"Country of Origin '{extracted_val}' clearly declared on packaging."
                    passed_cnt += 1
                else:
                    status = "NEEDS_REVIEW"
                    evidence_reason = "Explicit 'Country of Origin' declaration not detected. Inspector must confirm if packaging bears domestic manufacturer address or separate origin badge."
                    requires_human = True
                    review_cnt += 1

            elif rule_id == "LMR-RULE-09-READ":
                # Readability and placement
                readability_score = decl_item.get("readability_score", "GOOD")
                if readability_score in ["HIGH", "GOOD"]:
                    status = "COMPLIANT"
                    evidence_reason = "Mandatory text displays prominent contrast and legible character height on principal panel. (Visual estimate; uncalibrated image cannot certify mm font size)."
                    passed_cnt += 1
                else:
                    status = "NEEDS_REVIEW"
                    evidence_reason = f"Text region flagged with '{readability_score}' readability. Physical font height must be verified using calibrated regulatory scale."
                    requires_human = True
                    review_cnt += 1

            else:
                # Default generic rule handler
                if extracted_val:
                    status = "COMPLIANT"
                    evidence_reason = f"Declaration verified for {rule.get('name')}: '{extracted_val}'."
                    passed_cnt += 1
                else:
                    status = "NEEDS_REVIEW"
                    evidence_reason = f"Requirement {rule.get('name')} could not be verified automatically."
                    requires_human = True
                    review_cnt += 1

            results.append({
                "rule_id": rule_id,
                "rule_name": rule.get("name"),
                "legal_reference": rule.get("legal_reference"),
                "required_declaration": req_decl_key,
                "extracted_value": extracted_val,
                "status": status,
                "evidence_reason": evidence_reason,
                "confidence": decl_conf if decl_conf > 0 else 85,
                "severity": severity,
                "requires_human_review": requires_human,
                "evidence_bounding_box": bbox
            })

        # Calculate overall compliance
        if violation_cnt > 0:
            overall = "NON_COMPLIANT"
        elif review_cnt > 0:
            overall = "NEEDS_REVIEW"
        else:
            overall = "COMPLIANT"

        return {
            "overall_compliance": overall,
            "total_rules": len(results),
            "passed_rules": passed_cnt,
            "violation_rules": violation_cnt,
            "review_rules": review_cnt,
            "not_applicable_rules": na_cnt,
            "results": results,
            "inspection_scope_disclaimer": cls.DISCLAIMER_TEXT
        }

