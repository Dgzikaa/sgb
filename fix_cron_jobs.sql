-- Script para corrigir jobs do pg_cron
-- ⚠️ EXECUTAR VIA SUPABASE SQL EDITOR

-- 1. 🚨 DESATIVAR JOB PROBLEMÁTICO que chama função inexistente
UPDATE cron.job 
SET active = false, 
    command = '-- DESATIVADO: Função contahub-prodporhora não existe mais'
WHERE jobid = 149 AND jobname = 'contahub-prodporhora-daily';

-- 2. 🕐 CORRIGIR HORÁRIOS PARA BRASÍLIA (UTC-3)
-- ContaHub Sync Diário: 07h Brasília = 10h UTC
UPDATE cron.job 
SET schedule = '0 10 * * *',
    command = REPLACE(command, 'source', 'pgcron-10h-brasilia')
WHERE jobid = 137 AND jobname = 'contahub-sync-diario-7h';

-- 3. 🍺 CORRIGIR Stockout: 20h Brasília = 23h UTC (já está correto)
-- Job 154 já está às 23h UTC (20h Brasília) ✅

-- 4. 💰 CORRIGIR NIBO: 10h Brasília = 13h UTC (já está correto)
-- Job 156 já está às 13h UTC (10h Brasília) ✅

-- 5. 📊 CORRIGIR Sync Eventos: 07h30 Brasília = 10h30 UTC
UPDATE cron.job 
SET schedule = '30 10 * * *'
WHERE jobid = 155 AND jobname = 'sync-eventos-automatico-diario';

-- 6. 🏪 CORRIGIR Recálculo Eventos: 07h30 Brasília = 10h30 UTC
UPDATE cron.job 
SET schedule = '30 10 * * *'
WHERE jobid = 147 AND jobname = 'recalculo-eventos-pos-contahub';

-- 7. 📋 GETIN já está correto (a cada 2h) ✅

-- 8. 🔑 ATUALIZAR SERVICE KEY (não expira)
-- Atualizar jobs que usam token antigo
UPDATE cron.job 
SET command = REPLACE(command, 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjYzNzQ4NiwiZXhwIjoyMDIyMjEzNDg2fQ.yMjbxJJ0fNXOgw_-F-sDC_M_T6fgCZRzZcLtY0Jz4cE',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0'
)
WHERE command LIKE '%eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjYzNzQ4NiwiZXhwIjoyMDIyMjEzNDg2fQ.yMjbxJJ0fNXOgw_-F-sDC_M_T6fgCZRzZcLtY0Jz4cE%';

-- 9. ✅ VERIFICAR RESULTADOS
SELECT 
    jobid,
    schedule,
    jobname,
    active,
    CASE 
        WHEN schedule = '0 10 * * *' THEN '07h Brasília ✅'
        WHEN schedule = '30 10 * * *' THEN '07h30 Brasília ✅'
        WHEN schedule = '0 11 * * *' THEN '08h Brasília ✅'
        WHEN schedule = '0 13 * * *' THEN '10h Brasília ✅'
        WHEN schedule = '0 23 * * *' THEN '20h Brasília ✅'
        ELSE 'Verificar horário'
    END as horario_brasilia
FROM cron.job 
WHERE jobname IN (
    'contahub-sync-diario-7h',
    'contahub-prodporhora-daily', 
    'stockout-sync-diario-corrigido',
    'nibo-sync-diario-10h',
    'sync-eventos-automatico-diario',
    'recalculo-eventos-pos-contahub'
)
ORDER BY schedule;
