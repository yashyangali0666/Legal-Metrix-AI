from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.session import get_db
from backend.app.ocr.engine import OCREngineManager

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Test DB
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    ocr_mgr = OCREngineManager()
    engines = ocr_mgr.get_available_engines()

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "database_connected": db_ok,
        "ocr_engines": engines,
        "opencv_enabled": True,
        "reportlab_enabled": True,
        "compliance_rules_version": "2026.1",
        "service": "LegalMetrix AI Compliance Engine"
    }

