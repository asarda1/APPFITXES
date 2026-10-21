@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo Error al instalar dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando la app en modo desarrollo...
echo Cuando aparezca la URL, abre el navegador en http://localhost:5173 si no se abre sola.
call npm run dev

pause
