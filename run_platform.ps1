# ==============================================================================
# FleetFlow Platform PowerShell Launcher
# Launches both backend and frontend servers simultaneously
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Launching FleetFlow Enterprise Logistics Platform (Milestone 4)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "FleetFlow Services Launched Successfully!" -ForegroundColor Green
Write-Host "  * Frontend UI     : http://localhost:5173" -ForegroundColor White
Write-Host "  * Interactive Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  * Health Status   : http://localhost:8000/health" -ForegroundColor White
Write-Host "======================================================================`n" -ForegroundColor Green
