@echo off
chcp 65001 >nul
echo.
echo ============================================
echo  SINCRONIZACAO RETROATIVA - DEBOCHE BAR
echo  (PRODUCAO - zykor.com.br)
echo ============================================
echo.
echo Bar ID: 4 (Deboche)
echo Periodo: 2024-10-03 ate 2025-12-08
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul

echo.
echo [1/15] Sincronizando outubro 2024...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-10-03\",\"end_date\":\"2024-10-31\",\"bar_id\":4}"

echo.
echo [2/15] Sincronizando novembro 2024...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-11-01\",\"end_date\":\"2024-11-30\",\"bar_id\":4}"

echo.
echo [3/15] Sincronizando dezembro 2024...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2024-12-01\",\"end_date\":\"2024-12-31\",\"bar_id\":4}"

echo.
echo [4/15] Sincronizando janeiro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-01-01\",\"end_date\":\"2025-01-31\",\"bar_id\":4}"

echo.
echo [5/15] Sincronizando fevereiro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-02-01\",\"end_date\":\"2025-02-28\",\"bar_id\":4}"

echo.
echo [6/15] Sincronizando marco 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-03-01\",\"end_date\":\"2025-03-31\",\"bar_id\":4}"

echo.
echo [7/15] Sincronizando abril 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-04-01\",\"end_date\":\"2025-04-30\",\"bar_id\":4}"

echo.
echo [8/15] Sincronizando maio 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-05-01\",\"end_date\":\"2025-05-31\",\"bar_id\":4}"

echo.
echo [9/15] Sincronizando junho 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-06-01\",\"end_date\":\"2025-06-30\",\"bar_id\":4}"

echo.
echo [10/15] Sincronizando julho 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-07-01\",\"end_date\":\"2025-07-31\",\"bar_id\":4}"

echo.
echo [11/15] Sincronizando agosto 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-08-01\",\"end_date\":\"2025-08-31\",\"bar_id\":4}"

echo.
echo [12/15] Sincronizando setembro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-09-01\",\"end_date\":\"2025-09-30\",\"bar_id\":4}"

echo.
echo [13/15] Sincronizando outubro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-10-01\",\"end_date\":\"2025-10-31\",\"bar_id\":4}"

echo.
echo [14/15] Sincronizando novembro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-11-01\",\"end_date\":\"2025-11-30\",\"bar_id\":4}"

echo.
echo [15/15] Sincronizando dezembro 2025...
curl -X POST "https://zykor.com.br/api/contahub/sync-retroativo-real" -H "Content-Type: application/json" -d "{\"start_date\":\"2025-12-01\",\"end_date\":\"2025-12-08\",\"bar_id\":4}"

echo.
echo ============================================
echo  SINCRONIZACAO CONCLUIDA!
echo ============================================
echo.
pause
