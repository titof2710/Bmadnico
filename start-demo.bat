@echo off
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🚀 Janus Assessment Platform - Demo Launcher           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found! Please install Docker Desktop.
    pause
    exit /b 1
)
echo ✅ Docker OK

echo.
echo [2/3] Starting MongoDB and Redis...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker containers
    pause
    exit /b 1
)

echo ⏳ Waiting 10 seconds for MongoDB to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Starting all services...
echo.
echo 📝 This will open 3 services:
echo    - Backend API:      http://localhost:3000
echo    - Test Portal:      http://localhost:5173
echo    - Manager Dashboard: http://localhost:5174
echo.
echo Press Ctrl+C to stop all services
echo.

npm run dev

pause
