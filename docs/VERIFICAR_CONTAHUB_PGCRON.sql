-- =====================================================
-- VERIFICAR SE O PG_CRON DO CONTAHUB ESTÁ FUNCIONANDO
-- =====================================================
-- Execute no Supabase SQL Editor para verificar

-- 1. VERIFICAR SE O JOB FOI CRIADO
SELECT 
  jobname,
  schedule,
  active,
  next_run,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 10 THEN 'Hoje às 10:00 UTC (07:00 Brasília)'
    ELSE 'Amanhã às 10:00 UTC (07:00 Brasília)'
  END as proxima_execucao
FROM cron.job 
WHERE jobname = 'contahub-sync-daily-07h';

-- 2. LISTAR TODOS OS JOBS ATIVOS  
SELECT 
  jobname,
  schedule,
  active,
  next_run
FROM cron.job 
WHERE active = true
ORDER BY jobname;

-- 3. VERIFICAR ÚLTIMAS EXECUÇÕES (SE HOUVER)
-- Nota: Esta tabela pode não existir em algumas versões do pg_cron
-- SELECT 
--   runid,
--   job_pid,
--   database,
--   username,
--   command,
--   status,
--   return_message,
--   start_time,
--   end_time
-- FROM cron.job_run_details 
-- WHERE command LIKE '%contahub%'
-- ORDER BY start_time DESC 
-- LIMIT 5;

-- ALTERNATIVA: Verificar se existe tabela de logs
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'cron' 
  AND table_name = 'job_run_details'
) as logs_disponiveis;
