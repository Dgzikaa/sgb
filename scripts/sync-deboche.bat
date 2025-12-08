@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  SINCRONIZACAO RETROATIVA - DEBOCHE BAR
echo ============================================
echo.
echo Bar ID: 4 (Deboche)
echo Periodo: 2024-10-03 ate 2025-12-08
echo.
echo IMPORTANTE: Primeiro faca deploy das alteracoes!
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul

echo.
echo Sincronizando outubro 2024...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-10-03\",\"end_date\":\"2024-10-31\",\"bar_id\":4}"

echo.
echo Sincronizando novembro 2024...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-11-01\",\"end_date\":\"2024-11-30\",\"bar_id\":4}"

echo.
echo Sincronizando dezembro 2024...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-12-01\",\"end_date\":\"2024-12-31\",\"bar_id\":4}"

echo.
echo Sincronizando janeiro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-01-01\",\"end_date\":\"2025-01-31\",\"bar_id\":4}"

echo.
echo Sincronizando fevereiro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-02-01\",\"end_date\":\"2025-02-28\",\"bar_id\":4}"

echo.
echo Sincronizando marco 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-03-01\",\"end_date\":\"2025-03-31\",\"bar_id\":4}"

echo.
echo Sincronizando abril 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-04-01\",\"end_date\":\"2025-04-30\",\"bar_id\":4}"

echo.
echo Sincronizando maio 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-05-01\",\"end_date\":\"2025-05-31\",\"bar_id\":4}"

echo.
echo Sincronizando junho 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-06-01\",\"end_date\":\"2025-06-30\",\"bar_id\":4}"

echo.
echo Sincronizando julho 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-07-01\",\"end_date\":\"2025-07-31\",\"bar_id\":4}"

echo.
echo Sincronizando agosto 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-08-01\",\"end_date\":\"2025-08-31\",\"bar_id\":4}"

echo.
echo Sincronizando setembro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-09-01\",\"end_date\":\"2025-09-30\",\"bar_id\":4}"

echo.
echo Sincronizando outubro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-10-01\",\"end_date\":\"2025-10-31\",\"bar_id\":4}"

echo.
echo Sincronizando novembro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-11-01\",\"end_date\":\"2025-11-30\",\"bar_id\":4}"

echo.
echo Sincronizando dezembro 2025...
curl -X POST "http://localhost:3000/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-12-01\",\"end_date\":\"2025-12-08\",\"bar_id\":4}"

echo.
echo ============================================
echo  SINCRONIZACAO CONCLUIDA!
echo ============================================
echo.
pause
