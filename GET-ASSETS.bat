@echo off
cd /d "%~dp0"
rem Descarga Y optimiza en un solo paso, a proposito: cuando fueron dos scripts
rem separados el segundo se olvidaba y quedaban 84 MB de originales en produccion.
call node scripts\get-assets.mjs
if errorlevel 1 (
  echo.
  echo Fallo la descarga. Si son 403: las URLs firmadas de Figma caducan a los ~7 dias.
  echo Pidele a Claude que regenere assets.json desde el archivo de Figma.
  pause & exit /b 1
)
call python scripts\optimize-images.py
pause
