from typing import Dict, Any, Optional

class ReadabilityAnalyzer:
    """
    Analyzes character height, contrast ratio, visual legibility,
    and safeguards against uncalibrated legal font-size claims.
    """

    @staticmethod
    def analyze_readability(
        char_height_px: float,
        image_height: int,
        image_width: int,
        calibrated_dpi: Optional[float] = None,
        calibrated_scale_mm_per_px: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Estimates visual readability and assesses physical font size if calibrated.
        """
        # Relative character height in percentage of image height
        rel_height = (char_height_px / float(image_height)) if image_height > 0 else 0.0

        # Visual readability categorization
        if char_height_px >= 24 or rel_height >= 0.025:
            visual_readability = "HIGH"
            readability_notes = "Declaration text has prominent character height and crisp visual contrast."
            is_legible = True
        elif char_height_px >= 14 or rel_height >= 0.015:
            visual_readability = "GOOD"
            readability_notes = "Declaration text is clearly legible to a standard viewer under normal lighting."
            is_legible = True
        elif char_height_px >= 9 or rel_height >= 0.009:
            visual_readability = "FAIR"
            readability_notes = "Borderline character height. Legible but may require inspector inspection under magnification."
            is_legible = True
        else:
            visual_readability = "POOR"
            readability_notes = "Extremely small text height. High risk of non-compliance with minimum font height standards."
            is_legible = False

        # Physical Font Size Estimation (in mm)
        estimated_font_mm: Optional[float] = None
        is_legally_calibrated = False

        if calibrated_scale_mm_per_px is not None and calibrated_scale_mm_per_px > 0:
            estimated_font_mm = round(char_height_px * calibrated_scale_mm_per_px, 2)
            is_legally_calibrated = True
        elif calibrated_dpi is not None and calibrated_dpi > 0:
            # 1 inch = 25.4 mm
            mm_per_px = 25.4 / calibrated_dpi
            estimated_font_mm = round(char_height_px * mm_per_px, 2)
            is_legally_calibrated = True

        legal_status = "UNVERIFIED_UNCALIBRATED"
        if is_legally_calibrated and estimated_font_mm is not None:
            # Minimum font height under First Schedule/Table 1 of Legal Metrology Packaged Commodities Rules 2011:
            # For <= 200g/200ml: min 1.0mm (blown/moulded 2.0mm)
            # For 200g - 500g: min 2.0mm
            # For > 500g: min 4.0mm
            if estimated_font_mm >= 2.0:
                legal_status = "LIKELY_COMPLIANT_CALIBRATED"
            elif estimated_font_mm >= 1.0:
                legal_status = "CONDITIONAL_COMPLIANT_FOR_SMALL_PACK"
            else:
                legal_status = "VIOLATION_BELOW_MIN_HEIGHT"
        else:
            legal_status = "ESTIMATED_ONLY_UNCALIBRATED"

        calibration_warning = (
            "Actual printed font size in millimetres cannot be legally certified from an uncalibrated photograph "
            "without a physical reference scale or known packaging template dimensions. Visual readability score "
            "is an AI estimate for regulatory triage."
        )

        return {
            "char_height_px": round(char_height_px, 1),
            "visual_readability": visual_readability,
            "readability_notes": readability_notes,
            "is_legible": is_legible,
            "estimated_font_mm": estimated_font_mm,
            "is_legally_calibrated": is_legally_calibrated,
            "legal_font_status": legal_status,
            "calibration_warning": calibration_warning
        }

