@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js para usar o servidor.
 pause
 exit /b 1
)
echo Acesse http://localhost:3000 no navegador.
node server.js
pause
