@echo off
echo 🪐 Exoplanet Hunter - NASA Space Apps Challenge 2025
echo ==================================================

echo.
echo 🚀 Iniciando Backend...
start "Backend API" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload"

echo.
echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo.
echo 🎨 Iniciando Frontend...
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo ✅ Servicios iniciados!
echo.
echo 🌐 Accesos:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 💡 Para detener los servicios, cierra las ventanas de terminal
echo.
pause

