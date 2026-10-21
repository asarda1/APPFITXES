@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "TARGET_BAT=%PROJECT_DIR%arrancar-app-y-abrir.bat"
set "ICON_FILE=%PROJECT_DIR%OIP.ico"
set "SILENT=%~1"

if not exist "%TARGET_BAT%" (
  echo Error: No se encuentra arrancar-app-y-abrir.bat en la carpeta de APP FITXES.
  if /i not "%SILENT%"=="/silent" pause
  exit /b 1
)

set "RP_APP_DIR=%PROJECT_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$project = (Resolve-Path -LiteralPath $env:RP_APP_DIR).Path;" ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "if ([string]::IsNullOrWhiteSpace($desktop)) { throw 'No se ha podido detectar la ruta del escritorio.' }" ^
  "$target = Join-Path $project 'arrancar-app-y-abrir.bat';" ^
  "if (-not (Test-Path -LiteralPath $target)) { throw 'No se encuentra arrancar-app-y-abrir.bat.' }" ^
  "$shortcutPath = Join-Path $desktop 'APP FITXES.lnk';" ^
  "$shell = New-Object -ComObject WScript.Shell;" ^
  "$shortcut = $shell.CreateShortcut($shortcutPath);" ^
  "$shortcut.TargetPath = $target;" ^
  "$shortcut.WorkingDirectory = $project;" ^
  "$icon = Join-Path $project 'OIP.ico';" ^
  "if (Test-Path -LiteralPath $icon) { try { $fso = New-Object -ComObject Scripting.FileSystemObject; $shortcut.IconLocation = $fso.GetFile($icon).ShortPath + ',0' } catch { $shortcut.IconLocation = $icon } }" ^
  "$shortcut.Save();"

if errorlevel 1 (
  echo Error: No se ha podido crear el acceso directo.
  if /i not "%SILENT%"=="/silent" pause
  exit /b 1
)

if /i not "%SILENT%"=="/silent" (
  echo.
  echo Acceso directo creado correctamente en el escritorio.
  echo.
  echo Ya puedes abrir APP FITXES desde el escritorio.
  echo.
  pause
)

exit /b 0
