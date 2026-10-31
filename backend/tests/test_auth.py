import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_success():
    res = client.post("/api/auth/login", json={
        "username": "inspector_rajesh",
        "password": "Inspector@123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "inspector_rajesh"
    assert data["user"]["role"] == "inspector"

def test_login_invalid_credentials():
    res = client.post("/api/auth/login", json={
        "username": "inspector_rajesh",
        "password": "WrongPassword@999"
    })
    assert res.status_code == 400
    assert "Incorrect username or password" in res.json()["detail"]

def test_register_new_officer():
    import uuid
    uid = uuid.uuid4().hex[:6]
    uname = f"officer_{uid}"
    email = f"officer_{uid}@legalmetrix.gov.in"

    res = client.post("/api/auth/register", json={
        "username": uname,
        "email": email,
        "full_name": f"Officer Test {uid}",
        "password": "SecurePassword@123",
        "role": "inspector",
        "department": "Special Inspection Unit",
        "badge_number": f"LM-TEST-{uid.upper()}"
    })
    assert res.status_code == 200, f"Register failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == uname
    assert data["user"]["email"] == email

    # Test duplicate registration rejection
    dup_res = client.post("/api/auth/register", json={
        "username": uname,
        "email": email,
        "full_name": "Duplicate Test",
        "password": "SecurePassword@123",
        "role": "inspector"
    })
    assert dup_res.status_code == 400

def test_auth_me_endpoint():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]

    # Call /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "admin"
    assert me_data["role"] == "admin"
