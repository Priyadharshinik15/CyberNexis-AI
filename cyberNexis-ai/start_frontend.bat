@echo off
title CyberNexis AI - Frontend
echo =====================================================================
echo                    CYBERNEXIS AI FRONTEND LAUNCHER
echo =====================================================================
echo.

cd /d "%~dp0frontend"

:: Check for bun or npm
where bun >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Starting frontend dev server with Bun...
    bun run dev
    goto :done
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Starting frontend dev server with npm...
    npm run dev
    goto :done
)

echo [ERROR] Neither Bun nor Node/npm was found in PATH.
echo Please install Bun (https://bun.sh) or Node.js (https://nodejs.org).
pause

:done
