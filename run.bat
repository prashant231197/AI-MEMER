@echo off
echo Starting AI MEMER Web Application...
"%LOCALAPPDATA%\Programs\Python\Python313\python.exe" run.py
if %ERRORLEVEL% NEQ 0 (
    python run.py
)
pause
