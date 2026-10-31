@echo off
echo ===================================================
echo Starting LegalMetrix AI Platform
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "LegalMetrix AI - Backend Server" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173 ...
start "LegalMetrix AI - Frontend Web App" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ===================================================
echo LegalMetrix AI is now running!
echo - Web Dashboard:  http://127.0.0.1:5173/
echo - API Docs:       http://127.0.0.1:8000/docs
echo - System Health:  http://127.0.0.1:8000/api/health
echo ===================================================
timeout /t 3 >nul
start http://127.0.0.1:5173/

