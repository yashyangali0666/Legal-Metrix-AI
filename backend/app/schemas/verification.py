import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class VerificationActionRequest(BaseModel):
    action: str # approved, rejected, modified
    corrected_value: Optional[str] = None
    comments: Optional[str] = None

class VerificationItemResponse(BaseModel):
    id: int
    inspection_id: str
    product_name: str
    brand: str
    category: str
    declaration_key: str
    declaration_label: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: float
    readability_score: str
    bounding_box: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    created_at: datetime.datetime

