import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database.session import Base, engine, SessionLocal
from backend.app.database.seed import seed_users, seed_rules, seed_initial_inspections
from backend.app.utils.sample_image_generator import create_all_sample_images

from backend.app.api.auth import router as auth_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.inspections import router as inspections_router
from backend.app.api.ocr import router as ocr_router
from backend.app.api.compliance import router as compliance_router
from backend.app.api.verification import router as verification_router
from backend.app.api.reports import router as reports_router
from backend.app.api.products import router as products_router
from backend.app.api.rules import router as rules_router
from backend.app.api.users import router as users_router
from backend.app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    os.makedirs("backend/uploads", exist_ok=True)
    os.makedirs("backend/generated_reports", exist_ok=True)
    os.makedirs("backend/sample_images", exist_ok=True)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        create_all_sample_images()
        seed_users(db)
        seed_rules(db)
        await seed_initial_inspections(db)
    finally:
        db.close()
    yield
    # Shutdown tasks (if any)

app = FastAPI(
    title="LegalMetrix AI",
    description="AI-Powered Packaged Commodity Legal Metrology Compliance Inspection Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Directories for Images and Generated PDFs
app.mount("/backend/uploads", StaticFiles(directory="backend/uploads"), name="uploads")
app.mount("/backend/sample_images", StaticFiles(directory="backend/sample_images"), name="sample_images")
app.mount("/backend/generated_reports", StaticFiles(directory="backend/generated_reports"), name="reports")
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads_root")
app.mount("/sample_images", StaticFiles(directory="backend/sample_images"), name="sample_images_root")
app.mount("/reports", StaticFiles(directory="backend/generated_reports"), name="reports_root")

# Register API routers
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(inspections_router, prefix="/api")
app.include_router(ocr_router, prefix="/api")
app.include_router(compliance_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(rules_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(health_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "LegalMetrix AI Backend",
        "status": "online",
        "docs_url": "/docs",
        "version": "2.0.0"
    }

