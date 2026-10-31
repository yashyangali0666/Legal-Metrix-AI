import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.ocr import DeclarationItem
from backend.app.schemas.compliance import ComplianceResultItem

class ProductInfo(BaseModel):
    name: str
    brand: str
    category: str
    subcategory: Optional[str] = None
    packaging_type: Optional[str] = "Pouch"
    is_imported: Optional[bool] = False
    country_of_origin: Optional[str] = "India"
    declared_net_quantity: Optional[str] = None
    declared_mrp: Optional[float] = None
    barcode: Optional[str] = None

class UploadedImageResponse(BaseModel):
    id: int
    file_path: str
    preprocessed_path: Optional[str] = None
    label_type: str
    width: int
    height: int
    file_size_bytes: int

    class Config:
        from_attributes = True

class InspectionDetailResponse(BaseModel):
    id: str
    product: ProductInfo
    inspector_name: Optional[str] = "Govt Inspector"
    reviewer_name: Optional[str] = None
    status: str
    overall_compliance: str
    ocr_confidence_avg: float
    total_rules: int
    passed_rules: int
    violation_rules: int
    review_rules: int
    notes: Optional[str] = None
    location_state: Optional[str] = "Delhi NCT"
    created_at: datetime.datetime
    images: List[UploadedImageResponse]
    declarations: List[DeclarationItem]
    compliance_results: List[ComplianceResultItem]
    report_url: Optional[str] = None

class DashboardSummaryResponse(BaseModel):
    total_products_scanned: int
    compliant_products: int
    products_requiring_review: int
    potential_violations_detected: int
    pending_inspections: int
    total_inspection_reports: int

class RecentInspectionItem(BaseModel):
    id: str
    product_name: str
    brand: str
    category: str
    inspection_date: str
    compliance_status: str
    passed_rules: int
    violation_rules: int
    has_report: bool

class DashboardAnalyticsResponse(BaseModel):
    summary: DashboardSummaryResponse
    compliance_distribution: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]
    frequent_violations: List[Dict[str, Any]]
    state_statistics: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
    recent_inspections: List[RecentInspectionItem]

