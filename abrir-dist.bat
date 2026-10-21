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

if not exist dist (
  echo No existe la carpeta dist.
  echo Generala antes con: npm run build
  pause
  exit /b 1
)

echo Sirviendo la carpeta dist...
echo Abre la URL local que aparezca abajo.
call npx serve dist

pause
