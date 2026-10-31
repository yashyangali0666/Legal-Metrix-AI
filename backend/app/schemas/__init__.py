from backend.app.schemas.user import UserRegister, UserLogin, UserResponse, Token, TokenData
from backend.app.schemas.ocr import BoundingBox, OCRLine, OCRWord, DeclarationItem, OCRExtractResponse, OCRCorrectionRequest
from backend.app.schemas.compliance import (
    ComplianceRuleBase, ComplianceRuleCreate, ComplianceRuleUpdate,
    ComplianceRuleResponse, RuleHistoryResponse, ComplianceResultItem, ComplianceAnalysisResponse
)
from backend.app.schemas.inspection import (
    ProductInfo, UploadedImageResponse, InspectionDetailResponse,
    DashboardSummaryResponse, RecentInspectionItem, DashboardAnalyticsResponse
)
from backend.app.schemas.verification import VerificationActionRequest, VerificationItemResponse
from backend.app.schemas.report import ReportGenerateResponse

