@echo off
echo ====================================================
echo Starting Product Sentiment Analyzer - Backend Server
echo ====================================================
cd /d "%~dp0backend"
python app.py
pause
