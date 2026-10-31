import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True) # e.g. INSP-2026-8941
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="completed") # pending, processing, completed, flagged, rejected
    overall_compliance = Column(String(30), default="NEEDS_REVIEW") # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW
    ocr_confidence_avg = Column(Float, default=0.0)
    total_rules = Column(Integer, default=0)
    passed_rules = Column(Integer, default=0)
    violation_rules = Column(Integer, default=0)
    review_rules = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    location_state = Column(String(50), default="Delhi NCT")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections", foreign_keys=[inspector_id])
    reviewer = relationship("User", back_populates="reviewed_inspections", foreign_keys=[reviewer_id])
    images = relationship("UploadedImage", back_populates="inspection", cascade="all, delete-orphan")
    ocr_extractions = relationship("OCRExtraction", back_populates="inspection", cascade="all, delete-orphan")
    declarations = relationship("ExtractedDeclaration", back_populates="inspection", cascade="all, delete-orphan")
    compliance_results = relationship("ComplianceResult", back_populates="inspection", cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("InspectionReport", back_populates="inspection", cascade="all, delete-orphan")

class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(255), nullable=False)
    preprocessed_path = Column(String(255), nullable=True)
    label_type = Column(String(50), default="front") # front, back, side, mrp_panel
    file_size_bytes = Column(Integer, default=0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    resolution_dpi = Column(Integer, default=72)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    inspection = relationship("Inspection", back_populates="images")

class OCRExtraction(Base):
    __tablename__ = "ocr_extractions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    image_id = Column(Integer, ForeignKey("uploaded_images.id", ondelete="CASCADE"), nullable=True)
    raw_text = Column(Text, nullable=False)
    lines_json = Column(Text, nullable=False) # JSON array of lines
    bounding_boxes_json = Column(Text, nullable=False) # JSON array of {text, bbox, confidence}
    confidence_avg = Column(Float, default=0.0)
    engine_used = Column(String(50), default="winocr") # winocr, paddleocr, tesseract, vision_cv
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    inspection = relationship("Inspection", back_populates="ocr_extractions")

class ExtractedDeclaration(Base):
    __tablename__ = "extracted_declarations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    declaration_key = Column(String(50), nullable=False) # mrp, net_quantity, manufacturer, etc.
    raw_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0) # 0.0 - 1.0
    bounding_box_json = Column(Text, nullable=True)
    estimated_char_height_px = Column(Float, nullable=True)
    readability_score = Column(String(30), default="GOOD") # HIGH, GOOD, FAIR, POOR, UNREADABLE
    is_manually_corrected = Column(Boolean, default=False)
    corrected_value = Column(Text, nullable=True)
    corrected_by = Column(String(100), nullable=True)
    corrected_at = Column(DateTime, nullable=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="declarations")
    verification_records = relationship("VerificationRecord", back_populates="declaration")

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    declaration_id = Column(Integer, ForeignKey("extracted_declarations.id", ondelete="CASCADE"), nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=False)
    action = Column(String(30), default="modified") # approved, rejected, modified
    comments = Column(Text, nullable=True)
    verified_by = Column(String(100), nullable=False)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    inspection = relationship("Inspection", back_populates="verification_records")
    declaration = relationship("ExtractedDeclaration", back_populates="verification_records")

class InspectionReport(Base):
    __tablename__ = "inspection_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    report_number = Column(String(50), unique=True, nullable=False) # e.g. REP-2026-0042
    pdf_path = Column(String(255), nullable=False)
    generated_by = Column(String(100), default="System")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    hash_checksum = Column(String(64), nullable=True)

    # Relationship
    inspection = relationship("Inspection", back_populates="reports")

