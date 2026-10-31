import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert "ocr_engines" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_products_scanned"] >= 5
    assert "compliant_products" in data
    assert "potential_violations_detected" in data

def test_dashboard_analytics():
    response = client.get("/api/dashboard/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "compliance_distribution" in data
    assert "category_distribution" in data
    assert "frequent_violations" in data

def test_compliance_rules_endpoint():
    response = client.get("/api/compliance/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 10
    rule_ids = [r["id"] for r in rules]
    assert "LMR-RULE-06-1A" in rule_ids
    assert "LMR-RULE-06-1E" in rule_ids

def test_inspection_history_and_detail():
    response = client.get("/api/inspections/history")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    first_item = data["items"][0]
    insp_id = first_item["id"]

    # Test detail
    detail_res = client.get(f"/api/inspections/{insp_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == insp_id
    assert "product" in detail
    assert "declarations" in detail
    assert "compliance_results" in detail

def test_verification_pending():
    response = client.get("/api/verification/pending")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)

