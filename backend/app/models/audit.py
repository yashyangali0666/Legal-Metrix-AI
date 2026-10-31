import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(100), default="System")
    action = Column(String(100), nullable=False) # UPLOAD_IMAGE, OCR_EXTRACTION, COMPLIANCE_CHECK, MANUAL_CORRECTION, GENERATE_REPORT, RULE_UPDATE, USER_LOGIN
    entity_type = Column(String(50), nullable=False) # inspection, rule, user, declaration, report
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

