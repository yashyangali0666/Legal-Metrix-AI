from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    char_height_px: Optional[float] = None
    readability_score: Optional[str] = "GOOD"

class OCRWord(BaseModel):
    text: str
    bounding_box: Optional[BoundingBox] = None
    confidence: float

class OCRLine(BaseModel):
    text: str
    confidence: float
    bounding_box: Optional[BoundingBox] = None
    words: Optional[List[OCRWord]] = []

class DeclarationItem(BaseModel):
    declaration_key: str
    label: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: float
    bounding_box: Optional[Dict[str, Any]] = None
    readability_score: Optional[str] = "GOOD"
    is_manually_corrected: bool = False
    corrected_value: Optional[str] = None

class OCRExtractResponse(BaseModel):
    inspection_id: str
    engine_used: str
    confidence_avg: float
    raw_text: str
    lines: List[OCRLine]
    declarations: List[DeclarationItem]

class OCRCorrectionRequest(BaseModel):
    declaration_key: str
    corrected_value: str
    comments: Optional[str] = None

