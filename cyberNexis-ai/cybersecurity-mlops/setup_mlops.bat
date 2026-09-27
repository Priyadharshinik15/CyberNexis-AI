@echo off
echo =====================================================================
echo          CyberNexis AI — MLOps Setup
echo =====================================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.9+ first.
    pause
    exit /b 1
)

echo [1/3] Installing MLOps Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some packages failed — trying user install...
    pip install --user -r requirements.txt
)

echo.
echo [2/3] Generating synthetic training data...
python src/data_generator.py

echo.
echo [3/3] Running full MLOps pipeline (train → evaluate → drift → decide)...
python src/train.py
python src/drift_monitor.py
python src/retraining_decision.py
python src/evaluate.py

echo.
echo =====================================================================
echo  MLOps setup complete!
echo  Models saved to:   cybersecurity-mlops\models\
echo  Reports saved to:  cybersecurity-mlops\reports\
echo  Now start the backend:  cd ..\backend  &  start_backend.bat
echo =====================================================================
pause
