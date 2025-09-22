-- =====================================================
-- CONFIGURAÇÃO DE SINCRONIZAÇÃO AUTOMÁTICA DE EVENTOS
-- =====================================================
-- Executa todos os dias às 10:00 (horário de Brasília)
-- Sincroniza custos do Nibo para eventos do mês passado, atual e futuro

-- Habilitar extensão pg_cron se não estiver habilitada
SELECT cron.schedule(
  'sync-eventos-automatico-diario',
  '0 13 * * *', -- 13:00 UTC = 10:00 Brasília (UTC-3)
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-eventos-automatico',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key') || '"}'::jsonb,
      body := '{"source": "pg_cron", "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);

-- Verificar se o agendamento foi criado
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job 
WHERE jobname = 'sync-eventos-automatico-diario';

-- Comentários sobre o agendamento:
-- 
-- HORÁRIO: 13:00 UTC = 10:00 Brasília (considerando UTC-3)
-- FREQUÊNCIA: Todos os dias
-- FUNÇÃO: Chama a Edge Function sync-eventos-automatico
-- 
-- A função irá:
-- 1. Buscar todos os eventos dos últimos 3 meses (passado, atual, futuro)
-- 2. Para cada evento, buscar custos no nibo_agendamentos usando data_competencia
-- 3. Atualizar os campos c_art e c_prod nos eventos
-- 4. Calcular percent_art_fat
-- 5. Enviar notificação Discord com o resultado
--
-- IMPORTANTE: 
-- - O horário pode precisar de ajuste dependendo do horário de verão
-- - Durante o horário de verão brasileiro (outubro a fevereiro), usar 12:00 UTC
-- - Durante o horário padrão (março a setembro), usar 13:00 UTC
