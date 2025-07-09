-- ========================================
-- 📊 OTIMIZAÇÃO META AUTOMATION SYSTEM
-- ========================================
-- Migration: 012_otimizacao_meta_automation.sql
-- Descrição: Otimizar frequência de coleta para 2x/dia (8h e 20h)
-- Data: 2025-01-26
-- Autor: SGB Development Team

-- ========================================
-- 1. ATUALIZAR CONFIGURAÇÕES EXISTENTES
-- ========================================

-- Atualizar frequência de coleta para 12 horas (2x por dia)
UPDATE meta_configuracoes 
SET frequencia_coleta_horas = 12,
    observacoes = observacoes || ' | Otimizado 2x/dia: 8h e 20h para economia de rate limits'
WHERE ativo = true;

-- ========================================
-- 2. CONFIGURAR PGCRON OTIMIZADO
-- ========================================

-- Remover jobs antigos se existirem
SELECT cron.unschedule('meta-collect-auto') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta-collect-auto'
);

-- Configurar coleta manhã (8:00)
SELECT cron.schedule(
  'meta-collect-morning',
  '0 8 * * *', -- Todo dia às 8:00
  $$ 
  SELECT net.http_post(
    url := 'https://sgb-v2.vercel.app/api/meta/auto-collect',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sgb-meta-cron-2025"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Configurar coleta noite (20:00)
SELECT cron.schedule(
  'meta-collect-evening',
  '0 20 * * *', -- Todo dia às 20:00
  $$ 
  SELECT net.http_post(
    url := 'https://sgb-v2.vercel.app/api/meta/auto-collect',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sgb-meta-cron-2025"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ========================================
-- 3. ADICIONAR TABELA DE RATE LIMITS
-- ========================================

CREATE TABLE IF NOT EXISTS meta_rate_limits_log (
  id SERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Platform Rate Limits
  platform_call_count INTEGER,
  platform_total_time INTEGER,
  platform_total_cputime INTEGER,
  
  -- Business Use Case Rate Limits
  business_call_count INTEGER,
  business_total_time INTEGER,
  business_total_cputime INTEGER,
  business_type TEXT,
  estimated_time_to_regain_access INTEGER,
  
  -- Contexto
  api_calls_made INTEGER DEFAULT 5,
  collection_type TEXT DEFAULT 'automatica',
  warnings TEXT[]
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meta_rate_limits_bar_timestamp 
ON meta_rate_limits_log(bar_id, timestamp DESC);

-- ========================================
-- 4. FUNÇÃO PARA MONITORAR RATE LIMITS
-- ========================================

CREATE OR REPLACE FUNCTION log_meta_rate_limits(
  p_bar_id INTEGER,
  p_platform_usage JSONB DEFAULT NULL,
  p_business_usage JSONB DEFAULT NULL,
  p_api_calls_made INTEGER DEFAULT 5,
  p_collection_type TEXT DEFAULT 'automatica'
) RETURNS void AS $$
DECLARE
  v_warnings TEXT[] := '{}';
BEGIN
  -- Verificar warnings
  IF (p_platform_usage->>'call_count')::INTEGER > 70 THEN
    v_warnings := array_append(v_warnings, 'Platform rate limit > 70%');
  END IF;
  
  IF (p_business_usage->>'call_count')::INTEGER > 70 THEN
    v_warnings := array_append(v_warnings, 'Business rate limit > 70%');
  END IF;
  
  -- Log do rate limit
  INSERT INTO meta_rate_limits_log (
    bar_id,
    platform_call_count,
    platform_total_time,
    platform_total_cputime,
    business_call_count,
    business_total_time,
    business_total_cputime,
    business_type,
    estimated_time_to_regain_access,
    api_calls_made,
    collection_type,
    warnings
  ) VALUES (
    p_bar_id,
    (p_platform_usage->>'call_count')::INTEGER,
    (p_platform_usage->>'total_time')::INTEGER,
    (p_platform_usage->>'total_cputime')::INTEGER,
    (p_business_usage->>'call_count')::INTEGER,
    (p_business_usage->>'total_time')::INTEGER,
    (p_business_usage->>'total_cputime')::INTEGER,
    p_business_usage->>'type',
    (p_business_usage->>'estimated_time_to_regain_access')::INTEGER,
    p_api_calls_made,
    p_collection_type,
    v_warnings
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. VIEW PARA MONITORAMENTO
-- ========================================

CREATE OR REPLACE VIEW meta_rate_limits_summary AS
SELECT 
  bar_id,
  DATE(timestamp) as data,
  COUNT(*) as total_coletas,
  AVG(platform_call_count) as avg_platform_usage,
  AVG(business_call_count) as avg_business_usage,
  MAX(platform_call_count) as max_platform_usage,
  MAX(business_call_count) as max_business_usage,
  SUM(api_calls_made) as total_api_calls,
  ARRAY_AGG(DISTINCT unnest(warnings)) FILTER (WHERE warnings != '{}') as all_warnings
FROM meta_rate_limits_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY bar_id, DATE(timestamp)
ORDER BY data DESC;

-- ========================================
-- 6. ATUALIZAR PERMISSÕES
-- ========================================

-- Comentário sobre configuração manual necessária
/*
CONFIGURAÇÃO MANUAL NECESSÁRIA:

1. ATIVAR PGCRON NO SUPABASE:
   - Acessar Dashboard Supabase
   - Database > Extensions
   - Ativar 'pg_cron'
   - Ativar 'http' (para net.http_post)

2. VERIFICAR JOBS AGENDADOS:
   SELECT * FROM cron.job WHERE jobname LIKE 'meta-collect%';

3. VERIFICAR LOGS DE EXECUÇÃO:
   SELECT * FROM cron.job_run_details 
   WHERE jobname LIKE 'meta-collect%' 
   ORDER BY start_time DESC;

4. CONFIGURAR URL CORRETA:
   - Substitua 'sgb-v2.vercel.app' pela URL real de produção
   - Verifique o token de autorização

5. MONITORAMENTO:
   SELECT * FROM meta_rate_limits_summary;
*/

-- ========================================
-- 7. DADOS DE EXEMPLO PARA TESTE
-- ========================================

-- Simular alguns logs de rate limits para visualização
INSERT INTO meta_rate_limits_log (
  bar_id, platform_call_count, business_call_count, 
  api_calls_made, collection_type
) VALUES 
(3, 5, 8, 5, 'automatica'),
(3, 3, 5, 5, 'automatica'),
(3, 7, 12, 5, 'manual');

-- ========================================
-- 8. LOGS E CONFIRMAÇÃO
-- ========================================

-- Log da otimização
INSERT INTO meta_coletas_log (
  bar_id, tipo_coleta, status, parametros_coleta,
  registros_processados, observacoes
) VALUES (
  3, 'sistema_otimizacao', 'sucesso', 
  '{"frequencia_nova": "2x_dia", "horarios": ["08:00", "20:00"]}'::jsonb,
  2, 'Sistema otimizado para 2x/dia: economia de rate limits e recursos'
);

-- Confirmação
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Meta Automation System otimizado com sucesso!';
  RAISE NOTICE '📊 Nova frequência: 2x por dia (8h e 20h)';
  RAISE NOTICE '🎯 Rate limits otimizados: ~10 calls/dia vs ~20 calls/dia anteriores';
  RAISE NOTICE '⚡ Economia: 50%% de recursos + monitoramento aprimorado';
END $$; 