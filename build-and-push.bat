@echo off
echo Building and pushing Docker image...
echo.

REM Build
docker build -t vehicle-api:latest .

REM Login to Docker Hub
echo Enter your Docker Hub username:
set /p DOCKER_USERNAME=
docker login -u %DOCKER_USERNAME%

REM Tag and push
docker tag vehicle-api:latest %DOCKER_USERNAME%/vehicle-api:latest
docker tag vehicle-api:latest %DOCKER_USERNAME%/vehicle-api:1.0.0

docker push %DOCKER_USERNAME%/vehicle-api:latest
docker push %DOCKER_USERNAME%/vehicle-api:1.0.0

echo.
echo ✅ Done! Image pushed to Docker Hub.
echo Image: %DOCKER_USERNAME%/vehicle-api:1.0.0
pause