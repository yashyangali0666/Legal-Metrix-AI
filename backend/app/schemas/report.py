from typing import Optional
from pydantic import BaseModel

class ReportGenerateResponse(BaseModel):
    report_id: int
    inspection_id: str
    report_number: str
    pdf_url: str
    generated_at: str
    checksum: Optional[str] = None

