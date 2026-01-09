# deploy.ps1 - PowerShell deployment script for Windows
Write-Host "=== Vehicle API Docker Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check for .env file
if (-not (Test-Path ".\.env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and fill in your values" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example .env file should contain:" -ForegroundColor Gray
    Write-Host "DOCKER_USERNAME=your_dockerhub_username" -ForegroundColor Gray
    Write-Host "DB_NAME=vehicledb" -ForegroundColor Gray
    Write-Host "DB_USER=vehicleuser" -ForegroundColor Gray
    Write-Host "DB_PASSWORD=your_secure_password" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Load environment variables
Write-Host "📄 Loading environment variables..." -ForegroundColor Yellow
$envVars = @{}
Get-Content .\.env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $envVars[$key] = $value
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

# Check required variables
$requiredVars = @("DOCKER_USERNAME")
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var)) {
        Write-Host "❌ ERROR: Missing required variable: $var" -ForegroundColor Red
        exit 1
    }
}

$dockerUsername = $envVars["DOCKER_USERNAME"]
$apiVersion = if ($envVars.ContainsKey("API_VERSION")) { $envVars["API_VERSION"] } else { "1.0.0" }

Write-Host "✅ Using Docker Hub username: $dockerUsername" -ForegroundColor Green
Write-Host "✅ Using API version: $apiVersion" -ForegroundColor Green
Write-Host ""

# Step 1: Build Docker image
Write-Host "[1/4] 🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t ${dockerUsername}/vehicle-api:${apiVersion} .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Login to Docker Hub
Write-Host "[2/4] 🔐 Logging into Docker Hub..." -ForegroundColor Yellow
Write-Host "Please enter your Docker Hub password:" -ForegroundColor Gray
$securePassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$dockerPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$tempFile = [System.IO.Path]::GetTempFileName()
"$dockerPassword" | docker login -u $dockerUsername --password-stdin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed!" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
Write-Host "✅ Logged in to Docker Hub!" -ForegroundColor Green
Write-Host ""

# Step 3: Tag and push images
Write-Host "[3/4] 📤 Pushing to Docker Hub..." -ForegroundColor Yellow

# Tag as latest
docker tag ${dockerUsername}/vehicle-api:${apiVersion} ${dockerUsername}/vehicle-api:latest

# Push both tags
Write-Host "Pushing version $apiVersion..." -ForegroundColor Gray
docker push ${dockerUsername}/vehicle-api:${apiVersion}

Write-Host "Pushing 'latest' tag..." -ForegroundColor Gray
docker push ${dockerUsername}/vehicle-api:latest

Write-Host "✅ Images pushed to Docker Hub!" -ForegroundColor Green
Write-Host ""

# Step 4: Show deployment info
Write-Host "[4/4] 📋 Deployment Summary" -ForegroundColor Yellow
Write-Host "=" * 50
Write-Host "✅ BUILD COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Image Tags:" -ForegroundColor Cyan
Write-Host "   - ${dockerUsername}/vehicle-api:${apiVersion}" -ForegroundColor White
Write-Host "   - ${dockerUsername}/vehicle-api:latest" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Docker Hub URL:" -ForegroundColor Cyan
Write-Host "   https://hub.docker.com/r/$dockerUsername/vehicle-api" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To deploy on your server:" -ForegroundColor Cyan
Write-Host "   1. SSH to your server" -ForegroundColor Gray
Write-Host "   2. Create a .env file with database credentials" -ForegroundColor Gray
Write-Host "   3. Run: docker pull ${dockerUsername}/vehicle-api:${apiVersion}" -ForegroundColor Gray
Write-Host "   4. Run: docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Test locally:" -ForegroundColor Cyan
Write-Host "   docker run -p 8080:8080 -e NODE_ENV=development ${dockerUsername}/vehicle-api:${apiVersion}" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to test locally
$test = Read-Host "Test the image locally? (y/n)"
if ($test -eq 'y' -or $test -eq 'Y') {
    Write-Host "Testing image locally..." -ForegroundColor Yellow

    # Stop existing container if running
    docker stop vehicle-api-test 2>$null
    docker rm vehicle-api-test 2>$null

    # Run new container
    Write-Host "Starting container on port 8080..." -ForegroundColor Gray
    docker run -d -p 8080:8080 --name vehicle-api-test ${dockerUsername}/vehicle-api:${apiVersion}

    Write-Host "Waiting for container to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 10

    # Test health endpoint
    try {
        Write-Host "Testing health endpoint..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri "http://localhost:8080/ebk/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Health check PASSED: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Health check FAILED: $_" -ForegroundColor Red
        Write-Host "Container logs:" -ForegroundColor Yellow
        docker logs vehicle-api-test --tail 20
    }

    Write-Host ""
    Write-Host "To stop test container:" -ForegroundColor Yellow
    Write-Host "   docker stop vehicle-api-test && docker rm vehicle-api-test" -ForegroundColor White
}

Write-Host ""
Write-Host "=" * 50
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 50