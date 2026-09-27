@echo off
title CyberNexis AI - Master Launcher
echo =====================================================================
echo               CYBERNEXIS AI - FULL STACK LAUNCHER
echo =====================================================================
echo.
echo [1/2] Starting CyberNexis AI FastAPI Backend (Port 8000)...
start "CyberNexis AI - Backend" cmd /k "cd /d "%~dp0backend" && call start_backend.bat"

:: Brief wait for backend to initialize
timeout /t 3 /nobreak >nul

echo [2/2] Starting CyberNexis AI Frontend Dashboard (Port 8080)...
start "CyberNexis AI - Frontend" cmd /k "cd /d "%~dp0" && call start_frontend.bat"

echo.
echo =====================================================================
echo All services launched!
echo.
echo  * Frontend Dashboard : http://localhost:8080
echo  * Backend API Docs   : http://127.0.0.1:8000/docs
echo  * Backend Health     : http://127.0.0.1:8000/health
echo =====================================================================
echo.
echo Press any key to exit this launcher window (services keep running).
pause >nul
