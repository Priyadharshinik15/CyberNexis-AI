@echo off
echo =====================================================================
echo                    CYBERNEXIS AI BACKEND LAUNCHER
echo =====================================================================
echo.

if exist "cyber\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment 'cyber'...
    call cyber\Scripts\activate.bat
)

:: Check Python installation
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.8+ and make sure it is added to your PATH.
    pause
    exit /b 1
)

echo [1/2] Checking backend Python dependencies...
python -c "import fastapi, uvicorn, scapy" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing missing backend dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [WARNING] Some dependencies failed to install. Retrying in user space...
        pip install --user -r requirements.txt
    )
) else (
    echo [INFO] All core dependencies are installed.
)

echo.
echo [2/2] Starting CyberNexis AI API server...
echo Server running on http://127.0.0.1:8000
echo.
python app.py

pause
