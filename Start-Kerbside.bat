@echo off
title Kerbside
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed yet. Opening the download page...
  start https://nodejs.org
  echo After installing Node.js, double-click this file again.
  pause
  exit /b
)
echo Stopping any previous Kerbside server...
taskkill /f /im node.exe >nul 2>nul
echo Starting Kerbside at http://localhost:3000 ...
start "" http://localhost:3000
node local-server.js
pause
