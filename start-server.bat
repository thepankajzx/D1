@echo off
echo Starting Definite Habit Tracker Local Server...
echo Please wait a moment...
cd /d "%~dp0"
call npm install
start http://localhost:5173/H1-V2/
npm run dev
pause
