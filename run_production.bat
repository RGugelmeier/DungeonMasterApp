@echo off
setlocal enabledelayedexpansion

:: Get the directory where the script is located
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ==========================================
echo    Dungeon Master App - Production Mode
echo ==========================================
echo.
echo This script runs the Python backend, which serves 
echo the built frontend from the 'dist' folder.
echo.

:: 1. Check for Virtual Environment
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at: %ROOT_DIR%venv
    pause
    exit /b 1
)

:: 2. Check for Dist folder
if not exist "dungeon-master-app\dist" (
    echo [WARNING] 'dist' folder not found in dungeon-master-app.
    echo The frontend might not be visible unless you run 'npm run build' first.
    echo.
)

:: 3. Start the Backend Server
echo Starting Backend Server on port 5000...
call venv\Scripts\activate
cd dungeon-master-app
python -m server.app

pause
