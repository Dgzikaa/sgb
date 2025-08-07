-- =====================================================
-- CONFIGURAR PG_CRON PARA CONTAHUB - DIÁRIO 07:00
-- =====================================================
-- Configuração: Executar ContaHub automaticamente todos os dias às 07:00 Brasília
-- Horário UTC: 07:00 Brasília = 10:00 UTC

-- 1. VERIFICAR SE PG_CRON ESTÁ INSTALADO
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_cron';

-- 2. VERIFICAR JOBS EXISTENTES DO CONTAHUB
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run,
  command
FROM cron.job 
WHERE jobname LIKE '%contahub%' OR command LIKE '%contahub%'
ORDER BY jobname;

-- 3. REMOVER JOBS ANTIGOS DO CONTAHUB (SE EXISTIREM)
SELECT cron.unschedule('contahub-sync-daily-07h');
SELECT cron.unschedule('contahub-sync-automatico');
SELECT cron.unschedule('contahub-daily');

-- 4. CRIAR NOVO JOB PG_CRON PARA CONTAHUB
-- Executa diariamente às 10:00 UTC (07:00 Brasília)
SELECT cron.schedule(
  'contahub-sync-daily-07h',
  '0 10 * * *',  -- 10:00 UTC = 07:00 Brasília
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-sync-automatico',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTMyMzU1NywiZXhwIjoyMDUwODk5NTU3fQ.m5fG4UWfXq-rGgxUe8M4Xmcf5jT0gqr-n2iV8_YrLmI"}'::jsonb,
      body := json_build_object(
        'bar_id', 3,
        'data_date', CURRENT_DATE::text
      )::text
    ) as request_id;
  $$
);

-- 5. VERIFICAR SE O JOB FOI CRIADO COM SUCESSO
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run,
  command
FROM cron.job 
WHERE jobname = 'contahub-sync-daily-07h';

-- 6. LISTAR TODOS OS JOBS ATIVOS
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE active = true
ORDER BY jobname;

-- =====================================================
-- CARACTERÍSTICAS DO JOB CRIADO:
-- =====================================================
-- ✅ Nome: contahub-sync-daily-07h
-- ✅ Schedule: 0 10 * * * (diário às 10:00 UTC = 07:00 Brasília)
-- ✅ Ativo: true
-- ✅ Chama Edge Function: contahub-sync-automatico
-- ✅ Parâmetros: bar_id=3, data_date=CURRENT_DATE
-- ✅ Autorização: Service Role Key configurado
-- ✅ Error handling: Nativo do pg_cron
-- ✅ Logs: Automáticos via cron.job_run_details

-- =====================================================
-- COMANDOS DE VERIFICAÇÃO:
-- =====================================================

-- Verificar próxima execução:
SELECT 
  jobname,
  next_run,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 10 THEN 'Hoje às 10:00 UTC (07:00 Brasília)'
    ELSE 'Amanhã às 10:00 UTC (07:00 Brasília)'
  END as proxima_execucao_descricao
FROM cron.job 
WHERE jobname = 'contahub-sync-daily-07h';

-- Verificar última execução:
SELECT 
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE command LIKE '%contahub%'
ORDER BY start_time DESC 
LIMIT 5;

-- =====================================================
-- TESTE MANUAL (EXECUTAR APENAS SE NECESSÁRIO):
-- =====================================================

-- Para testar imediatamente (não aguardar horário agendado):
-- SELECT
--   net.http_post(
--     url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-sync-automatico',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTMyMzU1NywiZXhwIjoyMDUwODk5NTU3fQ.m5fG4UWfXq-rGgxUe8M4Xmcf5jT0gqr-n2iV8_YrLmI"}'::jsonb,
--     body := json_build_object(
--       'bar_id', 3,
--       'data_date', CURRENT_DATE::text
--     )::text
--   ) as request_id;

-- =====================================================
-- IMPORTANTE: 
-- =====================================================
-- Este script deve ser executado no SQL Editor do Supabase
-- com privilégios de administrador para funcionar corretamente.
-- =====================================================
