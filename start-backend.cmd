@echo off
cd /d "%~dp0backend"
echo Starting Agri Supply Chain backend...
call npm.cmd run dev
