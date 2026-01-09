@echo off
echo ========================================
echo     Vehicle API Docker Deployment
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Check for .env file
if not exist ".env" (
    echo ❌ ERROR: .env file not found!
    echo.
    echo Please copy .env.example to .env and fill in:
    echo   DOCKER_USERNAME=your_dockerhub_username
    echo   DB_NAME=vehicledb
    echo   DB_USER=vehicleuser
    echo   DB_PASSWORD=your_password
    echo   DB_ROOT_PASSWORD=root_password
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

REM Run PowerShell script
echo Running deployment script...
echo.
powershell -ExecutionPolicy Bypass -File "deploy.ps1"

echo.
pause