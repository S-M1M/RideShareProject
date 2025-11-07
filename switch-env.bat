@echo off
REM Batch script to switch between local and production environments

if "%1"=="" (
    echo Usage: switch-env.bat [local^|production]
    exit /b 1
)

if "%1"=="local" (
    copy /Y .env.local .env >nul
    if exist backend\.env.local copy /Y backend\.env.local backend\.env >nul
    echo [92m✓ Switched to LOCAL environment[0m
    echo [93mFrontend connects to: http://localhost:5000/api[0m
) else if "%1"=="production" (
    copy /Y .env.production .env >nul
    if exist backend\.env.production copy /Y backend\.env.production backend\.env >nul
    echo [92m✓ Switched to PRODUCTION environment[0m
    echo [93mFrontend connects to: https://rideshareproject-vyu1.onrender.com/api[0m
) else (
    echo [91m✗ Invalid environment. Use 'local' or 'production'[0m
    exit /b 1
)
