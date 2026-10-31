# LegalMetrix AI
## AI-Powered Packaged Commodity Legal Metrology Compliance Inspection Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB?logo=react)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_Headless-5C3EE8?logo=opencv)](https://opencv.org)
[![ReportLab](https://img.shields.io/badge/PDF_Engine-ReportLab-DC2626)](https://www.reportlab.com)
[![License](https://img.shields.io/badge/Jurisdiction-India_PCR_2011-1D4ED8)](#statutory-framework)

---

### 1. Project Overview & Problem Statement

**LegalMetrix AI** is a full-stack, regulatory-tech compliance platform designed for Legal Metrology officers, state controllers, and field inspectors across India. 

Under the **Legal Metrology (Packaged Commodities) Rules, 2011**, all pre-packaged commodities sold in India must display mandatory statutory declarations, including:
- Generic Commodity Description (Rule 6(1)(a))
- Complete Manufacturer / Packer / Importer Identity & Postal Physical Address with PIN code (Rule 6(1)(b))
- Net Quantity in Standard Metric Units (Rule 6(1)(c) & Second Schedule)
- Month & Year of Manufacture / Pre-packing (Rule 6(1)(d))
- Maximum Retail Price (MRP) in INR inclusive of all taxes (Rule 6(1)(e))
- Unit Sale Price (USP) per g/ml/piece (Rule 6(1)(e) - 2021/2022 Amendment)
- Consumer Grievance Redressal / Contact (Rule 6(1)(f))
- Country of Origin (Rule 6(10) / 2020 Amendment)
- Legibility, Minimum Font Size & Conspicuous Placement (Rule 9)
- Exemption Thresholds (Rule 26)

Manual label inspection of retail products is slow, prone to oversight, and difficult to audit. **LegalMetrix AI** automates product label inspection using computer vision and multi-engine OCR, accurately classifies statutory declarations, assesses legal compliance, enables human inspector adjudication, generates certified PDF inspection reports, and tracks enforcement trends.

---

### 2. Architecture & System Design

```text
┌────────────────────────────────────────────────────────────────────────┐
│               LEGALMETRIX AI REGULATORY SYSTEM                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴──────────────────────────────┐
    ▼                                                              ▼
┌───────────────────────────────────────┐      ┌─────────────────────────────────┐
│     REACT + TYPESCRIPT FRONTEND       │      │        FASTAPI BACKEND          │
│                                       │      │                                 │
│ • Dashboard (Recharts KPI & Trends)   │◄────►│ • RESTful Endpoints (Pydantic)  │
│ • AI Packaging Scanner (Drag-and-Drop)│      │ • SQLAlchemy ORM (SQLite / PG)  │
│ • OCR Viewer with Bounding Box Overlay│      │ • JWT Role-Based Auth           │
│ • Rule-by-Rule Compliance Breakdown   │      │ • Complete System Audit Logs    │
│ • Human Verification Adjudication     │      └────────────────┬────────────────┘
│ • ReportLab PDF Report Viewer         │                       │
│ • Rule Management & Versioning        │                       │
└───────────────────────────────────────┘                       │
                                                                ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │               COMPUTER VISION & OCR PIPELINE            │
                     │                                                         │
                     │ 1. OpenCV Preprocessor (CLAHE, Denoise, Skew Correction)│
                     │ 2. Multi-Engine OCR (winocr / PaddleOCR / Tesseract)    │
                     │ 3. Declaration Classifier (Regex, Pin Code, Units, Tax) │
                     │ 4. Statutory Rule Engine (PCR 2011 Rules 6, 9, 18, 26)  │
                     │ 5. ReportLab Certified PDF Inspection Report Generator  │
                     └─────────────────────────────────────────────────────────┘
```

---

### 3. Technology Stack

- **Frontend**:
  - React 19 with TypeScript
  - Vite 8.3
  - Tailwind CSS 3.4 (Regulatory palette: Navy `#101828`, Deep Blue `#1D4ED8`, Electric Blue `#3B82F6`, Cyan `#06B6D4`)
  - Lucide React icons
  - Recharts (Analytics and violation trends)
  - Axios (API communication with `/api` proxy)
  - React Router v7

- **Backend**:
  - Python 3.14 / 3.11+
  - FastAPI & Pydantic V2
  - SQLAlchemy ORM (SQLite for zero-config local run, PostgreSQL-ready connection pool)
  - OpenCV Headless (CLAHE contrast improvement, Bilateral denoising, deskew)
  - Windows Neural OCR (`winocr`) as native Windows engine, PaddleOCR & Tesseract integration
  - Custom Rule-Based Compliance Engine
  - ReportLab 5.0 (Certified PDF reports with SHA-256 checksum)
  - Pytest (Comprehensive test suite)

---

### 4. Key Modules Implemented

1. **AI Product Packaging Scanner**:
   - Supports JPG, JPEG, PNG, WEBP packaging images up to 25MB.
   - OpenCV image preprocessing preserves original photographic evidence while creating optimized copies for character recognition.
   - Specimen Selector: One-click test samples (Haldiram's Chips, Parle-G Biscuits, Tata Sampann Mustard Oil, Cadbury Truffles, Himalaya Face Wash).

2. **OCR Extraction & Visual Bounding Box Overlay**:
   - Interactive SVG/Canvas bounding box overlay on packaging photos.
   - Tooltips with character heights (px), legibility scores, and OCR confidence percentages.
   - Highlights low-confidence detections (< 75%) and enables inline inspector correction with audit trail.

3. **Intelligent Declaration Classification**:
   - Classifies raw OCR stream into 10 mandatory fields without inventing missing data.
   - Verifies 6-digit postal PIN codes, metric units (g, kg, ml, l), tax-inclusive pricing, and consumer care channels.

4. **Legal Metrology Compliance Engine**:
   - Implements statutory rules: `LMR-RULE-06-1A`, `LMR-RULE-06-1B`, `LMR-RULE-06-1C`, `LMR-RULE-06-1D`, `LMR-RULE-06-1E`, `LMR-RULE-06-1EA`, `LMR-RULE-06-1F`, `LMR-RULE-06-1G`, `LMR-RULE-09-READ`, `LMR-RULE-26-EXEMP`.
   - Adjudicates `COMPLIANT`, `NON_COMPLIANT`, `NEEDS_REVIEW`, and `NOT_APPLICABLE`.

5. **Human Verification & Adjudication Queue**:
   - Routes uncertain or low-confidence declarations to officers.
   - Officers can approve, reject (confirm violation), or modify declarations with regulatory comments.

6. **Inspection Reports**:
   - Certified ReportLab PDF reports with official government header, inspection metadata, mandatory declaration table, statutory rule evaluations, and cryptographic SHA-256 integrity checksums.
   - CSV export for state-wide enforcement data.

7. **Rule Management & Versioning**:
   - Promulgate new rules, amend provisions, adjust severity, and view version history.

8. **User Roles & Security**:
   - Role-based authorization: **Administrator**, **Field Inspector**, **Statutory Reviewer**.
   - Immutable audit logs for all uploads, OCR extractions, manual corrections, rule modifications, and report generations.

---

### 5. Installation & Execution Guide

#### Prerequisites
- Windows 10/11 (or Linux/macOS)
- Python 3.10+ (Tested on Python 3.14)
- Node.js v18+ and npm v9+

#### Step 1: Clone or Navigate to Directory
```powershell
cd "c:\Users\Yash\OneDrive\Desktop\LegalMetrix AI"
```

#### Step 2: Install Backend Dependencies
```powershell
python -m pip install -r backend/requirements.txt
```

#### Step 3: Seed Database and Sample Specimen Images
```powershell
python -m backend.app.database.seed
```
*Creates initial enforcement officers (`admin`, `inspector_rajesh`, `reviewer_anita`), seeds statutory rules, generates sample packaging images, and prepares initial inspection records.*

#### Step 4: Run Backend Server
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is live at: `http://127.0.0.1:8000/docs`*

#### Step 5: Run Frontend Client
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
*Frontend opens at: `http://127.0.0.1:5173/`*

---

### 6. Automated Tests & Quality Assurance

To execute backend unit and integration tests:
```powershell
# Run compliance and OCR unit tests
python -m pytest backend/tests

# Run full end-to-end integration test
python backend/tests/test_e2e_workflow.py
```

**Test Results:**
- `test_compliant_potato_chips_declarations`: PASSED
- `test_missing_mrp_violation`: PASSED
- `test_incomplete_address_needs_review`: PASSED
- `test_small_package_exemption`: PASSED
- `test_declaration_classifier`: PASSED
- `test_reportlab_pdf_generation`: PASSED
- `test_health_endpoint`: PASSED
- `test_dashboard_summary`: PASSED
- `test_dashboard_analytics`: PASSED
- `test_compliance_rules_endpoint`: PASSED
- `test_inspection_history_and_detail`: PASSED
- `test_verification_pending`: PASSED
- `test_full_e2e_inspection_workflow` (8-step live integration): PASSED

---

### 7. Accuracy & Legal Safeguards

1. **No Data Fabrication**: The OCR engine strictly extracts characters visible on the packaging and will never invent missing fields.
2. **Uncalibrated Image Safeguard**: The system explicitly warns officers that printed font size in millimetres cannot be legally certified from an uncalibrated photograph alone without a calibrated physical reference scale.
3. **Audit Trail**: Every manual correction preserves the original OCR raw string and records who modified it and when.
4. **Regulatory Limitations**: AI analysis serves as automated enforcement triage and does not replace statutory compounding proceedings by an authorized controller.

#   L e g a l - M e t r i x - A I  
 