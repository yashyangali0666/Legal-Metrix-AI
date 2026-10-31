import os
import hashlib
import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class InspectionReportGenerator:
    """
    Generates official Legal Metrology Compliance Inspection PDF Reports
    using ReportLab with precise statutory citations and audit checksums.
    """

    @classmethod
    def generate_pdf(
        cls,
        inspection_data: Dict[str, Any],
        output_dir: str = "backend/generated_reports"
    ) -> Dict[str, str]:
        os.makedirs(output_dir, exist_ok=True)
        insp_id = inspection_data.get("id", "INSP-UNKNOWN")
        report_num = f"REP-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{insp_id[-6:]}"
        filename = f"{report_num}.pdf"
        filepath = os.path.join(output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom styles
        header_title = ParagraphStyle(
            'GovHeaderTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#101828'),
            alignment=1 # Center
        )
        header_sub = ParagraphStyle(
            'GovHeaderSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475467'),
            alignment=1
        )
        section_heading = ParagraphStyle(
            'GovSectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1D4ED8'),
            spaceBefore=8,
            spaceAfter=4
        )
        body_text = ParagraphStyle(
            'GovBodyText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1E293B')
        )
        bold_text = ParagraphStyle(
            'GovBoldText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0F172A')
        )
        status_compliant = ParagraphStyle(
            'GovStatusCompliant',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#16A34A')
        )
        status_violation = ParagraphStyle(
            'GovStatusViolation',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#DC2626')
        )
        status_review = ParagraphStyle(
            'GovStatusReview',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#D97706')
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("LEGALMETRIX AI &bull; REGULATORY COMPLIANCE SYSTEM", header_title))
        elements.append(Paragraph("Directorate of Legal Metrology &bull; Ministry of Consumer Affairs, Food & Public Distribution", header_sub))
        elements.append(Paragraph("Statutory Product Label Inspection Report (Rule 6 & Rule 18, Packaged Commodities Rules 2011)", header_sub))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1D4ED8'), spaceBefore=2, spaceAfter=8))

        # 2. Inspection Metadata Grid
        prod = inspection_data.get("product", {})
        overall = inspection_data.get("overall_compliance", "NEEDS_REVIEW")
        overall_color = colors.HexColor('#16A34A') if overall == 'COMPLIANT' else (
            colors.HexColor('#DC2626') if overall == 'NON_COMPLIANT' else colors.HexColor('#D97706')
        )

        meta_data = [
            [
                Paragraph("<b>Inspection ID:</b>", body_text),
                Paragraph(insp_id, bold_text),
                Paragraph("<b>Report No:</b>", body_text),
                Paragraph(report_num, bold_text)
            ],
            [
                Paragraph("<b>Inspection Date:</b>", body_text),
                Paragraph(str(inspection_data.get("created_at", datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M'))), body_text),
                Paragraph("<b>Inspector:</b>", body_text),
                Paragraph(inspection_data.get("inspector_name", "Govt Enforcement Officer"), body_text)
            ],
            [
                Paragraph("<b>Product Name:</b>", body_text),
                Paragraph(prod.get("name", "N/A"), bold_text),
                Paragraph("<b>Brand / Mfr:</b>", body_text),
                Paragraph(prod.get("brand", "N/A"), body_text)
            ],
            [
                Paragraph("<b>Product Category:</b>", body_text),
                Paragraph(prod.get("category", "General Packaged Goods"), body_text),
                Paragraph("<b>Overall Status:</b>", body_text),
                Paragraph(f"<b><font color='{overall_color}'>{overall.replace('_', ' ')}</font></b>", bold_text)
            ],
        ]

        t_meta = Table(meta_data, colWidths=[1.3*inch, 2.3*inch, 1.3*inch, 2.3*inch])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 12))

        # 3. Mandatory Declarations Extracted
        elements.append(Paragraph("1. MANDATORY DECLARATIONS AUDIT (RULE 6)", section_heading))
        decl_rows = [
            [
                Paragraph("<b>Declaration Key</b>", bold_text),
                Paragraph("<b>Extracted / Stated Value</b>", bold_text),
                Paragraph("<b>OCR Conf.</b>", bold_text),
                Paragraph("<b>Readability</b>", bold_text),
                Paragraph("<b>Audit Status</b>", bold_text)
            ]
        ]

        for d in inspection_data.get("declarations", []):
            conf_val = f"{int(d.get('confidence', 0.0) * 100)}%"
            val_txt = d.get("corrected_value") if d.get("is_manually_corrected") else (d.get("normalized_value") or d.get("raw_value") or "NOT DETECTED")
            is_corrected = d.get("is_manually_corrected", False)
            audit_badge = "Human Verified" if is_corrected else "AI Extracted"

            decl_rows.append([
                Paragraph(d.get("label", d.get("declaration_key", "")), body_text),
                Paragraph(f"{val_txt}" + (" <i>[Corrected]</i>" if is_corrected else ""), body_text),
                Paragraph(conf_val, body_text),
                Paragraph(d.get("readability_score", "GOOD"), body_text),
                Paragraph(audit_badge, bold_text)
            ])

        t_decl = Table(decl_rows, colWidths=[1.8*inch, 2.8*inch, 0.7*inch, 0.9*inch, 1.0*inch])
        t_decl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        elements.append(t_decl)
        elements.append(Spacer(1, 12))

        # 4. Statutory Rule Compliance Checks
        elements.append(Paragraph("2. STATUTORY RULE COMPLIANCE EVALUATION", section_heading))
        rule_rows = [
            [
                Paragraph("<b>Rule ID & Provision</b>", bold_text),
                Paragraph("<b>Statutory Reference</b>", bold_text),
                Paragraph("<b>Result</b>", bold_text),
                Paragraph("<b>Reason & Regulatory Evidence</b>", bold_text)
            ]
        ]

        for r in inspection_data.get("compliance_results", []):
            st = r.get("status", "NEEDS_REVIEW")
            p_style = status_compliant if st == "COMPLIANT" else (
                status_violation if st == "NON_COMPLIANT" else (
                    status_review if st == "NEEDS_REVIEW" else body_text
                )
            )

            rule_rows.append([
                Paragraph(f"<b>{r.get('rule_id')}</b><br/>{r.get('rule_name', '')}", body_text),
                Paragraph(r.get("legal_reference", "Packaged Commodities Rules 2011"), body_text),
                Paragraph(st.replace("_", " "), p_style),
                Paragraph(r.get("evidence_reason", ""), body_text)
            ])

        t_rules = Table(rule_rows, colWidths=[1.7*inch, 1.9*inch, 1.1*inch, 2.5*inch])
        t_rules.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_rules)
        elements.append(Spacer(1, 14))

        # 5. Statutory Disclaimer & Sign-off
        disclaimer = (
            "<b>STATUTORY DISCLAIMER:</b> This report is generated by LegalMetrix AI regulatory triage system. "
            "Under the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011, uncalibrated digital images "
            "provide probabilistic indicators of declaration presence and readability. Actual legal compounding "
            "or seizure proceedings require certified physical inspection and calibrated measurement of packaging."
        )
        elements.append(Paragraph(disclaimer, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7, leading=9, textColor=colors.HexColor('#64748B'))))
        elements.append(Spacer(1, 14))

        # Signature Box
        sig_data = [
            [
                Paragraph("<b>Inspected By:</b><br/><br/>___________________________<br/>Authorized Inspector<br/>Legal Metrology Department", body_text),
                Paragraph("<b>Supervisory Review:</b><br/><br/>___________________________<br/>Controller of Legal Metrology<br/>Official Seal / Stamp", body_text)
            ]
        ]
        t_sig = Table(sig_data, colWidths=[3.6*inch, 3.6*inch])
        t_sig.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#94A3B8')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sig)

        # Build document
        doc.build(elements)

        # Calculate checksum
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            hasher.update(f.read())
        checksum = hasher.hexdigest()

        return {
            "report_number": report_num,
            "filepath": filepath,
            "filename": filename,
            "checksum": checksum
        }

