@echo off
REM ============================================
REM SCRIPT PARA INICIAR O BACKEND
REM ============================================
REM
REM Executa este arquivo para:
REM 1. Iniciar banco de dados
REM 2. Rodar migrações
REM 3. Seed dados de teste
REM 4. Iniciar servidor Node
REM

echo ============================================
echo INICIANDO VALIDACAO DO SISTEMA
echo ============================================
echo.

echo [1/5] Navegando para pasta backend...
cd /d "c:\Users\Bill\Downloads\Nova pasta (3)\completov2\backend"

echo [2/5] Instalando dependencias...
call npm install --silent

echo [3/5] Preparando banco de dados...
call npm run db:reset

echo [4/5] Iniciando servidor...
echo.
echo ============================================
echo BACKEND INICIANDO NA PORTA 3000
echo ============================================
echo.
echo Para testar:
echo 1. Abra: backend\src\modules\auth\teste.http
echo 2. Clique: "Send Request"
echo 3. Anote resultado em: TESTING_RESULTS.md
echo.
echo ============================================
echo.

call npm run dev

pause
