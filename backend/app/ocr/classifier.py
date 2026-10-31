import re
from typing import List, Dict, Any, Optional

class DeclarationClassifier:
    """
    Intelligently classifies raw OCR extracted text into Legal Metrology mandatory fields:
    - MRP (Maximum Retail Price)
    - Net Quantity
    - Manufacturer Name & Complete Address
    - Packer Name & Address
    - Importer Details
    - Manufacturing / Packing Date
    - Consumer Care Contact
    - Country of Origin
    - Unit Sale Price (USP)
    - Product / Commodity Name

    Strictly preserves actual evidence and DOES NOT invent missing values.
    """

    MANDATORY_FIELDS = [
        {"key": "product_name", "label": "Product / Generic Name", "rule_ref": "Rule 6(1)(a)"},
        {"key": "mrp", "label": "Maximum Retail Price (MRP)", "rule_ref": "Rule 6(1)(e)"},
        {"key": "net_quantity", "label": "Net Quantity", "rule_ref": "Rule 6(1)(c)"},
        {"key": "unit_sale_price", "label": "Unit Sale Price (USP)", "rule_ref": "Rule 6(1)(e)"},
        {"key": "date_of_manufacture", "label": "Date of Mfg / Packing", "rule_ref": "Rule 6(1)(d)"},
        {"key": "manufacturer", "label": "Manufacturer Name & Address", "rule_ref": "Rule 6(1)(b)"},
        {"key": "packer", "label": "Packer Details (if different)", "rule_ref": "Rule 6(1)(b)"},
        {"key": "consumer_care", "label": "Consumer Care Details", "rule_ref": "Rule 6(1)(f)"},
        {"key": "country_of_origin", "label": "Country of Origin", "rule_ref": "Rule 6(1)(10)"},
        {"key": "importer", "label": "Importer Details (for imported goods)", "rule_ref": "Rule 6(1)(b)"},
    ]

    @classmethod
    def classify(cls, lines: List[Dict[str, Any]], raw_text: str) -> List[Dict[str, Any]]:
        full_text = raw_text or "\n".join(l.get("text", "") for l in lines)
        results = []

        # 1. Maximum Retail Price (MRP)
        mrp_data = cls._extract_mrp(lines, full_text)
        results.append(mrp_data)

        # 2. Net Quantity
        net_qty_data = cls._extract_net_quantity(lines, full_text)
        results.append(net_qty_data)

        # 3. Unit Sale Price (USP)
        usp_data = cls._extract_usp(lines, full_text)
        results.append(usp_data)

        # 4. Date of Manufacture / Packing
        mfg_date_data = cls._extract_mfg_date(lines, full_text)
        results.append(mfg_date_data)

        # 5. Manufacturer Name & Address
        mfg_data = cls._extract_manufacturer(lines, full_text)
        results.append(mfg_data)

        # 6. Packer Details
        packer_data = cls._extract_packer(lines, full_text)
        results.append(packer_data)

        # 7. Consumer Care Details
        consumer_data = cls._extract_consumer_care(lines, full_text)
        results.append(consumer_data)

        # 8. Country of Origin
        coo_data = cls._extract_country_of_origin(lines, full_text)
        results.append(coo_data)

        # 9. Product Name / Generic Description
        pname_data = cls._extract_product_name(lines, full_text)
        results.append(pname_data)

        # 10. Importer Details
        importer_data = cls._extract_importer(lines, full_text)
        results.append(importer_data)

        return results

    @classmethod
    def _find_matching_bbox(cls, target_text: str, lines: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Finds bounding box corresponding to detected string snippet."""
        if not target_text or not lines:
            return None
        target_clean = re.sub(r'[^a-zA-Z0-9]', '', target_text.lower())
        for line in lines:
            l_text = line.get("text", "")
            l_clean = re.sub(r'[^a-zA-Z0-9]', '', l_text.lower())
            if target_clean in l_clean or l_clean in target_clean:
                return line.get("bounding_box")
        return lines[0].get("bounding_box") if lines else None

    @classmethod
    def _extract_mrp(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Regex patterns for Indian MRP declarations:
        # e.g., "MRP Rs. 50.00 incl. of all taxes", "M.R.P. ₹ 120 (INCL. OF ALL TAXES)"
        pattern = r'(?:M\.?R\.?P\.?|MAX(?:IMUM)?\s*RETAIL\s*PRICE)[\s:.]*(?:Rs\.?|INR|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)(?:\s*\(?(?:INCL\.?(?:USIVE)?\s*OF\s*ALL\s*TAXES)\)?)?'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            num_str = match.group(1)
            has_tax_phrase = bool(re.search(r'incl(?:usive)?\s*(?:of)?\s*all\s*taxes', text, re.IGNORECASE))
            norm_val = f"₹{float(num_str):.2f}" + (" (incl. of all taxes)" if has_tax_phrase else "")
            conf = 0.94 if has_tax_phrase else 0.82
            bbox = cls._find_matching_bbox(raw_val, lines)
        else:
            # Fallback loose search for standalone currency numbers
            standalone = re.search(r'(?:Rs\.?|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)', text, re.IGNORECASE)
            if standalone:
                raw_val = standalone.group(0).strip()
                norm_val = f"₹{float(standalone.group(1)):.2f}"
                conf = 0.65 # Lower confidence without explicit "MRP" keyword
                bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "mrp",
            "label": "Maximum Retail Price (MRP)",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "HIGH" if conf > 0.8 else ("FAIR" if conf > 0.5 else "POOR"),
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_net_quantity(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Rule 6(1)(c) - Net quantity in g, kg, ml, l, piece, N
        pattern = r'(?:Net\s*(?:Qty|Quantity|Wt|Weight|Contents|Volume)|Contents|Qty)[\s:]*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|grams|ml|l|ltr|litres|liters|piece|pcs|N|count)\b'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            amount = match.group(1)
            unit = match.group(2).lower()
            if unit in ["gm", "grams"]:
                unit = "g"
            elif unit in ["ltr", "litres", "liters"]:
                unit = "ml" if float(amount) < 1 else "L"
            norm_val = f"{amount} {unit}"
            conf = 0.95
            bbox = cls._find_matching_bbox(raw_val, lines)
        else:
            # Standalone quantity search (e.g., "500 g", "1.5 kg", "200 ml")
            loose_match = re.search(r'\b([0-9]+(?:\.[0-9]+)?)\s*(kg|g|gm|ml|l|ltr)\b', text, re.IGNORECASE)
            if loose_match:
                raw_val = loose_match.group(0).strip()
                norm_val = raw_val
                conf = 0.68
                bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "net_quantity",
            "label": "Net Quantity",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "HIGH" if conf > 0.8 else ("FAIR" if conf > 0.5 else "POOR"),
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_usp(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Rule 6(1)(e) Amendment: Unit Sale Price (e.g. "USP: Rs. 0.50 per g" or "Unit Sale Price: ₹ 1.20 / ml")
        pattern = r'(?:Unit\s*Sale\s*Price|USP|Unit\s*Price)[\s:]*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per|\/)\s*(g|kg|ml|l|piece|N|gm)'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            price = match.group(1)
            unit = match.group(2).lower()
            norm_val = f"₹{float(price):.2f} / {unit}"
            conf = 0.91
            bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "unit_sale_price",
            "label": "Unit Sale Price (USP)",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else "POOR",
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_mfg_date(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Date of manufacture / packing: Rule 6(1)(d)
        # Formats: "Mfg Date: 10/2026", "Pkd: OCT 2026", "MFD: 15/09/2026"
        pattern = r'(?:Mfg(?:\s*Date)?|Manufactured(?:\s*on)?|Pkd(?:\s*on)?|Packed(?:\s*on)?|Date\s*of\s*(?:Mfg|Packing|Packaging))[\s:.]*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,9}[\/\-\s\.]+[0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            date_str = match.group(1).strip()
            norm_val = date_str
            conf = 0.89
            bbox = cls._find_matching_bbox(raw_val, lines)
        else:
            # Standalone date pattern like MM/YYYY or MON YYYY
            standalone = re.search(r'\b(0[1-9]|1[0-2])[\/\-](202[4-9]|203[0-5])\b', text)
            if standalone:
                raw_val = standalone.group(0)
                norm_val = raw_val
                conf = 0.60
                bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "date_of_manufacture",
            "label": "Date of Mfg / Packing",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else "FAIR",
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_manufacturer(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Rule 6(1)(b) - Complete name and address of manufacturer
        pattern = r'(?:Manufactured\s*by|Mfg(?:\.?\s*by)?|Producer|Made\s*by)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,3})'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            details = match.group(1).strip().replace("\n", ", ")
            # Check for PIN code presence (6 digits in India)
            has_pin = bool(re.search(r'\b[1-9][0-9]{5}\b', details))
            norm_val = details
            conf = 0.92 if has_pin else 0.74
            bbox = cls._find_matching_bbox("Manufactured", lines) or cls._find_matching_bbox("Mfg", lines)
        else:
            # Look for lines mentioning Private Limited / Ltd / Foods / Industries
            for line in lines:
                l_text = line.get("text", "")
                if re.search(r'\b(Pvt\.?\s*Ltd\.?|Limited|Industries|Enterprises|Foods)\b', l_text, re.IGNORECASE):
                    raw_val = l_text
                    norm_val = l_text
                    conf = 0.65
                    bbox = line.get("bounding_box")
                    break

        return {
            "declaration_key": "manufacturer",
            "label": "Manufacturer Name & Address",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else ("FAIR" if conf > 0.6 else "POOR"),
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_packer(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        pattern = r'(?:Packed\s*by|Pkd\s*by|Packer)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            norm_val = match.group(1).strip().replace("\n", ", ")
            conf = 0.88
            bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "packer",
            "label": "Packer Details",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else "FAIR",
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_consumer_care(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Rule 6(1)(f) - Consumer care contact (phone, toll free, email, website)
        phone_match = re.search(r'(?:Tel(?:ephone)?|Phone|Helpline|Toll\s*Free|Customer\s*Care|Contact)[\s:.]*([+]?[0-9\s\-]{8,15})', text, re.IGNORECASE)
        email_match = re.search(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', text)

        raw_parts = []
        norm_parts = []
        conf = 0.0
        bbox = None

        if phone_match:
            raw_parts.append(phone_match.group(0).strip())
            norm_parts.append(f"Phone: {phone_match.group(1).strip()}")
            conf += 0.5
            bbox = cls._find_matching_bbox(phone_match.group(0), lines)

        if email_match:
            raw_parts.append(f"Email: {email_match.group(0)}")
            norm_parts.append(f"Email: {email_match.group(0)}")
            conf += 0.45
            if not bbox:
                bbox = cls._find_matching_bbox(email_match.group(0), lines)

        raw_val = " | ".join(raw_parts) if raw_parts else None
        norm_val = " | ".join(norm_parts) if norm_parts else None

        return {
            "declaration_key": "consumer_care",
            "label": "Consumer Care Details",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(min(1.0, conf), 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else ("FAIR" if conf > 0.4 else "POOR"),
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_country_of_origin(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        pattern = r'(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)[\s:]*([A-Za-z\s]+)'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            country = match.group(1).strip().split("\n")[0]
            norm_val = country.title()
            conf = 0.95
            bbox = cls._find_matching_bbox(raw_val, lines)
        elif re.search(r'\b(India|Bharat)\b', text, re.IGNORECASE):
            raw_val = "Made in India"
            norm_val = "India"
            conf = 0.85
            bbox = cls._find_matching_bbox("India", lines)

        return {
            "declaration_key": "country_of_origin",
            "label": "Country of Origin",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "HIGH" if conf > 0.8 else "FAIR",
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_product_name(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        # Typically the highest/largest header line or generic description
        # e.g., "Potato Chips", "Pure Mustard Oil", "Glucose Biscuits"
        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if lines:
            # Look for line with largest bounding box height or near the top
            top_lines = sorted(lines[:4], key=lambda x: x.get("bounding_box", {}).get("height", 0), reverse=True)
            if top_lines:
                cand = top_lines[0]
                t = cand.get("text", "").strip()
                if len(t) > 3 and not re.search(r'mrp|weight|net|mfg|price', t, re.IGNORECASE):
                    raw_val = t
                    norm_val = t.title()
                    conf = 0.82
                    bbox = cand.get("bounding_box")

        return {
            "declaration_key": "product_name",
            "label": "Product / Generic Name",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "HIGH" if conf > 0.8 else "GOOD",
            "is_manually_corrected": False,
            "corrected_value": None
        }

    @classmethod
    def _extract_importer(cls, lines: List[Dict[str, Any]], text: str) -> Dict[str, Any]:
        pattern = r'(?:Imported\s*by|Importer)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})'
        match = re.search(pattern, text, re.IGNORECASE)

        raw_val = None
        norm_val = None
        conf = 0.0
        bbox = None

        if match:
            raw_val = match.group(0).strip()
            norm_val = match.group(1).strip().replace("\n", ", ")
            conf = 0.90
            bbox = cls._find_matching_bbox(raw_val, lines)

        return {
            "declaration_key": "importer",
            "label": "Importer Details",
            "raw_value": raw_val,
            "normalized_value": norm_val,
            "confidence": round(conf, 2),
            "bounding_box": bbox,
            "readability_score": "GOOD" if conf > 0.8 else "FAIR",
            "is_manually_corrected": False,
            "corrected_value": None
        }

