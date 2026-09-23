@echo off
rem Lerntheke lokal ansehen: startet einen kleinen Webserver im Projektordner
rem und oeffnet die Seite im Standardbrowser. Beenden mit Strg + C.
setlocal
cd /d "%~dp0"

set PORT=8000

where python >nul 2>nul
if %errorlevel%==0 (
  set PY=python
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    set PY=py -3
  ) else (
    echo.
    echo Python wurde nicht gefunden.
    echo Bitte Python installieren ^(https://www.python.org/downloads/^) oder die Lerntheke
    echo ueber GitHub Pages aufrufen.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Lerntheke laeuft gleich unter http://localhost:%PORT%
echo Dieses Fenster offen lassen. Beenden mit Strg + C.
echo.

start "" "http://localhost:%PORT%/"
%PY% -m http.server %PORT% --bind 127.0.0.1
