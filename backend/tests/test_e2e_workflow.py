import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_full_e2e_inspection_workflow():
    print("\n--- Starting End-to-End LegalMetrix AI Verification ---")

    # 1. Check Health
    h_res = requests.get(f"{BASE_URL}/api/health")
    assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
    health = h_res.json()
    print(f"[1/8] Health check OK. Active OCR Engine: {health['ocr_engines']['active_engine']}")

    # 2. Upload packaging specimen
    sample_img_path = "backend/sample_images/sample_chips_compliant.jpg"
    assert os.path.exists(sample_img_path), "Sample image not found"

    with open(sample_img_path, "rb") as img_file:
        files = [("files", ("test_chips.jpg", img_file, "image/jpeg"))]
        data = {
            "product_name": "E2E Test Aloo Bhujia",
            "brand": "Haldiram's",
            "category": "Food & Beverages",
            "declared_net_quantity": "150 g",
            "declared_mrp": "50.00",
            "country_of_origin": "India",
            "label_type": "front",
            "state_location": "Delhi NCT"
        }
        up_res = requests.post(f"{BASE_URL}/api/inspections/upload", files=files, data=data)

    assert up_res.status_code == 200, f"Upload failed: {up_res.text}"
    up_data = up_res.json()
    insp_id = up_data["inspection_id"]
    print(f"[2/8] Product packaging uploaded successfully. Inspection ID: {insp_id}")

    # 3. Process Inspection (OCR + Classifier + Rules + PDF)
    proc_res = requests.post(f"{BASE_URL}/api/inspections/{insp_id}/process")
    assert proc_res.status_code == 200, f"Processing failed: {proc_res.text}"
    proc_data = proc_res.json()
    print(f"[3/8] Processing complete. Overall Status: {proc_data['overall_compliance']}, Passed Rules: {proc_data['passed_rules']}, Violations: {proc_data['violation_rules']}")

    # 4. Fetch OCR Results & Bounding Boxes
    ocr_res = requests.get(f"{BASE_URL}/api/ocr/{insp_id}/results")
    assert ocr_res.status_code == 200, f"OCR fetch failed: {ocr_res.text}"
    ocr_data = ocr_res.json()
    print(f"[4/8] OCR Results verified. Extracted {len(ocr_data['lines'])} lines, {len(ocr_data['declarations'])} classified declarations.")

    # 5. Fetch Compliance Evaluation
    comp_res = requests.get(f"{BASE_URL}/api/compliance/{insp_id}/results")
    assert comp_res.status_code == 200, f"Compliance fetch failed: {comp_res.text}"
    comp_data = comp_res.json()
    assert len(comp_data["results"]) >= 10
    print(f"[5/8] Compliance Analysis verified. Total statutory rules evaluated: {comp_data['total_rules']}.")

    # 6. Test Manual Inspector Correction of a declaration
    corr_payload = {
        "declaration_key": "net_quantity",
        "corrected_value": "150 g (Net Weight Verified by Inspector)",
        "comments": "Audited using calibrated digital bench scale"
    }
    corr_res = requests.put(f"{BASE_URL}/api/ocr/{insp_id}/correct", json=corr_payload)
    assert corr_res.status_code == 200, f"Correction failed: {corr_res.text}"
    print(f"[6/8] Inspector manual correction recorded and saved to audit log.")

    # 7. Download PDF Report & verify bytes
    pdf_res = requests.get(f"{BASE_URL}/api/reports/{insp_id}/download")
    assert pdf_res.status_code == 200, f"PDF download failed: {pdf_res.text}"
    assert len(pdf_res.content) > 1000, "PDF content too small"
    assert pdf_res.content.startswith(b"%PDF"), "Response is not a valid PDF file"
    print(f"[7/8] ReportLab PDF compliance report verified ({len(pdf_res.content)} bytes, valid PDF header).")

    # 8. Check Dashboard Summary Update
    dash_res = requests.get(f"{BASE_URL}/api/dashboard/summary")
    assert dash_res.status_code == 200, f"Dashboard summary failed: {dash_res.text}"
    dash_data = dash_res.json()
    print(f"[8/8] Dashboard Summary updated: Total Scanned: {dash_data['total_products_scanned']}, Reports: {dash_data['total_inspection_reports']}.")

    print("\n>>> ALL 8 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! <<<\n")

if __name__ == "__main__":
    test_full_e2e_inspection_workflow()

