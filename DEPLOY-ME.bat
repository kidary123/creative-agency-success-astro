@echo off
cd /d "%~dp0"
call npm run build
if errorlevel 1 ( echo Fallo el build. & pause & exit /b 1 )
call vercel --prod
if errorlevel 1 (
  echo.
  echo Si dice "Not authorized": la sesion de Vercel muere cada pocas horas.
  echo Ejecuta LOGIN-VERCEL.bat y vuelve a intentarlo.
)
pause
