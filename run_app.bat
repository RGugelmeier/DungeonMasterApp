@echo off
setlocal enabledelayedexpansion

:: Get the directory where the script is located
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ==========================================
echo    Dungeon Master App Startup Script
echo ==========================================
echo.

:: 1. Check for Virtual Environment
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at: %ROOT_DIR%venv
    echo Please ensure the 'venv' folder exists in the project root.
    pause
    exit /b 1
)

:: 2. Check for Frontend Directory
if not exist "dungeon-master-app" (
    echo [ERROR] Frontend directory 'dungeon-master-app' not found.
    pause
    exit /b 1
)

:: 3. Start the Backend Server
echo [1/2] Launching Backend Server (Python/Waitress)...
:: Using 'start' to run in a new window so you can see logs
start "Dungeon Master Backend" cmd /c "call venv\Scripts\activate && cd dungeon-master-app && echo Starting Python backend on port 5000... && python -m server.app || (echo Backend failed to start. && pause)"

:: 4. Start the Frontend Dev Server
echo [2/2] Launching Frontend Dev Server (Vite)...
start "Dungeon Master Frontend" cmd /c "cd dungeon-master-app && echo Starting Vite frontend on port 5173... && npm run dev || (echo Frontend failed to start. && pause)"

echo.
echo ------------------------------------------
echo SUCCESS: Both servers are starting up!
echo.
echo - Frontend Dev: http://localhost:5173
echo - Backend API:  http://localhost:5000
echo.
echo Note: Vite is configured to proxy API requests to the backend.
echo ------------------------------------------
echo.
pause
