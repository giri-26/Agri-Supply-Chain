@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo Agri Supply Chain - Windows Setup
echo ========================================

echo.
echo [1/3] Installing backend dependencies...
cd backend
call npm.cmd install
if errorlevel 1 goto :error

cd ..\frontend
echo.
echo [2/3] Installing frontend dependencies...
call npm.cmd install
if errorlevel 1 goto :error

cd ..\backend
echo.
echo [3/3] Initializing database schema and migrations...
call npm.cmd run db:migrate
if errorlevel 1 goto :error

cd ..
echo.
echo Setup completed.
echo.
echo Next:
echo   1. Make sure backend\.env contains your real PostgreSQL password.
echo   2. Run start-backend.cmd
 echo   3. Run start-frontend.cmd
exit /b 0

:error
echo.
echo Setup failed. Read the error above.
exit /b 1
