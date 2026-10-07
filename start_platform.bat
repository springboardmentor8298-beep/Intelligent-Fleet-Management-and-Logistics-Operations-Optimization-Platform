@echo off
title FleetFlow Platform Launcher
echo ======================================================================
echo Launching FleetFlow Enterprise Logistics Platform (Milestone 4)
echo ======================================================================
echo.

echo [1/2] Starting Backend API (FastAPI)...
start "FleetFlow Backend" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend UI (React + Vite)...
start "FleetFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo Services launched successfully!
echo   * Frontend Web UI : http://localhost:5173
echo   * Backend REST API: http://localhost:8000/docs
echo   * Health Endpoint : http://localhost:8000/health
echo ======================================================================
pause
