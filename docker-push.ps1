# docker-push.ps1 - Simple push to Docker Hub
param(
    [string]$username,
    [string]$tag = "latest"
)

if (-not $username) {
    $username = Read-Host "Enter your Docker Hub username"
}

Write-Host "Logging into Docker Hub..." -ForegroundColor Yellow
docker login -u $username

Write-Host "Tagging image..." -ForegroundColor Yellow
docker tag vehicle-api:$tag ${username}/vehicle-api:$tag
docker tag vehicle-api:$tag ${username}/vehicle-api:latest

Write-Host "Pushing to Docker Hub..." -ForegroundColor Yellow
docker push ${username}/vehicle-api:$tag
docker push ${username}/vehicle-api:latest

Write-Host "✅ Image pushed to Docker Hub!" -ForegroundColor Green
Write-Host "  - ${username}/vehicle-api:$tag" -ForegroundColor Cyan
Write-Host "  - ${username}/vehicle-api:latest" -ForegroundColor Cyan