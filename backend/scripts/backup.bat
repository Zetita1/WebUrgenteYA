@echo off
REM ─────────────────────────────────────────────────────────────
REM  Backup manual de UrgenteYa (Windows)
REM  Copia la DB y uploads a la carpeta backend\backups\
REM  Uso: doble clic sobre este archivo
REM ─────────────────────────────────────────────────────────────

setlocal

cd /d "%~dp0.."
set BACKEND_DIR=%CD%
set BACKUP_DIR=%BACKEND_DIR%\backups
set DB_PATH=%BACKEND_DIR%\database.sqlite
set UPLOADS_DIR=%BACKEND_DIR%\uploads

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Timestamp: YYYY-MM-DD_HH-MM-SS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set DT=%%I
set STAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%-%DT:~12,2%

echo.
echo [backup] Carpeta destino: %BACKUP_DIR%
echo [backup] Timestamp: %STAMP%
echo.

REM ── 1. DB ──────────────────────────────────────────────────
if not exist "%DB_PATH%" (
  echo [backup] ERROR: No se encontro la DB en %DB_PATH%
  pause
  exit /b 1
)

copy /Y "%DB_PATH%" "%BACKUP_DIR%\database_%STAMP%.sqlite" > nul
echo [backup] OK  DB      -^> database_%STAMP%.sqlite

REM ── 2. Uploads (si existen) ────────────────────────────────
if exist "%UPLOADS_DIR%" (
  powershell -NoProfile -Command "Compress-Archive -Path '%UPLOADS_DIR%\*' -DestinationPath '%BACKUP_DIR%\uploads_%STAMP%.zip' -Force" 2>nul
  if exist "%BACKUP_DIR%\uploads_%STAMP%.zip" (
    echo [backup] OK  uploads -^> uploads_%STAMP%.zip
  ) else (
    echo [backup] uploads\ vacio, se omite
  )
)

echo.
echo [backup] Listo. Backups disponibles:
dir /b "%BACKUP_DIR%"
echo.
pause
