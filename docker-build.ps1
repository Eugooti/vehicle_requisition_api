# docker-build.ps1 - Simple build script
param(
    [string]$tag = "latest"
)

Write-Host "Building Docker image..." -ForegroundColor Yellow

# Build image
docker build -t vehicle-api:$tag .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully: vehicle-api:$tag" -ForegroundColor Green
} else {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
}