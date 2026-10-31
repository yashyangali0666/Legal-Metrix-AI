import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(String(50), primary_key=True) # e.g. LMR-RULE-06-1A
    rule_number = Column(String(50), nullable=False) # e.g. Rule 6(1)(a)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    legal_reference = Column(String(255), nullable=False) # The Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(a)
    category_filter = Column(String(255), default="ALL") # ALL or comma-separated list of categories
    required_declaration = Column(String(100), nullable=False) # product_name, manufacturer, net_quantity, mrp, etc.
    validation_type = Column(String(50), default="regex_presence") # presence, pattern, range, readability
    severity = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    is_active = Column(Boolean, default=True)
    effective_date = Column(String(50), default="2011-11-01")
    version = Column(Integer, default=1)
    created_by = Column(String(100), default="Legal Metrology Administration")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    history = relationship("RuleHistory", back_populates="rule", cascade="all, delete-orphan")
    results = relationship("ComplianceResult", back_populates="rule")

class RuleHistory(Base):
    __tablename__ = "rule_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_id = Column(String(50), ForeignKey("compliance_rules.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    modified_by = Column(String(100), nullable=False)
    changes_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    rule = relationship("ComplianceRule", back_populates="history")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String(50), ForeignKey("compliance_rules.id"), nullable=False)
    declaration_key = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False) # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW, NOT_APPLICABLE
    extracted_value = Column(Text, nullable=True)
    evidence_reason = Column(Text, nullable=False)
    confidence = Column(Integer, default=90) # 0-100%
    severity = Column(String(20), default="HIGH")
    requires_human_review = Column(Boolean, default=False)
    evidence_bounding_box = Column(Text, nullable=True) # JSON coordinates [x1, y1, x2, y2]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rule = relationship("ComplianceRule", back_populates="results")
    inspection = relationship("Inspection", back_populates="compliance_results")

