@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto :missing
echo Instalando dependencias do projeto...
call npm ci
if errorlevel 1 goto :fail
call npm run android:sync
if errorlevel 1 goto :fail
call npm run android:open
if errorlevel 1 goto :fail
echo Projeto preparado. Continue no Android Studio.
pause
exit /b 0
:missing
echo Instale o Node.js 22 LTS ou superior e tente novamente.
pause
exit /b 1
:fail
echo Nao foi possivel preparar o projeto. Copie a mensagem acima.
pause
exit /b 1
