@echo off
echo ===================================================================
echo   SENTILYTICS AI - PRODUCT SENTIMENT INTELLIGENCE PLATFORM
echo ===================================================================
echo.
echo 1. Launching Python Flask Backend on http://127.0.0.1:5000 ...
start "Sentilytics Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

echo 2. Launching React Vite Frontend on http://localhost:3000 ...
start "Sentilytics Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Services launched!
echo Open your browser at: http://localhost:3000 (or http://127.0.0.1:5000 for direct Flask serving)
echo Backend API active at: http://127.0.0.1:5000/api/health
echo.
pause
