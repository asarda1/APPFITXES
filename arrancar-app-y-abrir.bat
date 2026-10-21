@echo off
setlocal
cd /d "%~dp0"

for /f "usebackq delims=" %%D in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::GetFolderPath('Desktop')" 2^>nul`) do set "USER_DESKTOP=%%D"
if defined USER_DESKTOP (
  if not exist "%USER_DESKTOP%\APP FITXES.lnk" (
    if exist "%~dp0CREAR_ACCESO_DIRECTO.bat" (
      call "%~dp0CREAR_ACCESO_DIRECTO.bat" /silent >nul 2>nul
    )
  )
)

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
start "" cmd /c "cd /d "%~dp0" && npm run dev"

echo Esperando a que el servidor local arranque...
timeout /t 5 /nobreak >nul

echo Abriendo navegador en http://localhost:5173 ...
start "" "http://localhost:5173"

exit /b 0
