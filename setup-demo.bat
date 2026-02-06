@echo off
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🚀 Janus Assessment Platform - Demo Setup              ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 20.x LTS
    echo    Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node --version') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:~1%
if %NODE_MAJOR% lss 20 (
    echo ❌ Node.js version too old! Please install Node.js 20.x LTS
    pause
    exit /b 1
)
echo ✅ Node.js OK

echo.
echo [2/3] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found! Please install Docker Desktop
    echo    Download: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker OK

echo.
echo [3/3] Installing dependencies...
echo ⏳ This may take 2-3 minutes...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [DONE] Starting Docker containers...
docker-compose up -d

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   ✅ Setup Complete!                                      ║
echo ║                                                            ║
echo ║   Next step: Run start-demo.bat to launch the demo       ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

pause
