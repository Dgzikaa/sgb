-- ========================================
-- 🔄 RECRIAR PGCRON META - 12 em 12 HORAS
-- ========================================
-- Migration: 017_recriar_pgcron_meta_12h.sql
-- Descrição: Recriar sistema de coleta automática Meta que sumiu
-- Frequência otimizada: 8h (manhã) e 20h (noite)
-- Endpoint: /api/meta/auto-collect (recriado)

-- ========================================
-- 1. REMOVER JOBS ANTIGOS SE EXISTIREM
-- ========================================

SELECT cron.unschedule('meta-collect-morning') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta-collect-morning'
);

SELECT cron.unschedule('meta-collect-evening') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta-collect-evening'
);

SELECT cron.unschedule('meta_coleta_automatica_6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta_coleta_automatica_6h'
);

SELECT cron.unschedule('meta-collect-auto') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta-collect-auto'
);

-- ========================================
-- 2. CONFIGURAR PGCRON OTIMIZADO (12h)
-- ========================================

-- Coleta manhã (8:00) - Pega dados do final do dia anterior + início do dia
SELECT cron.schedule(
  'meta-collect-morning',
  '0 8 * * *', -- Todo dia às 8:00
  $$ 
  SELECT net.http_post(
    url := 'https://sgb-v2.vercel.app/api/meta/auto-collect',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sgb-meta-cron-2025"}'::jsonb,
    body := '{"automatic": true, "source": "pgcron", "period": "morning"}'::jsonb
  );
  $$
);

-- Coleta noite (20:00) - Pega dados do dia completo
SELECT cron.schedule(
  'meta-collect-evening',
  '0 20 * * *', -- Todo dia às 20:00
  $$ 
  SELECT net.http_post(
    url := 'https://sgb-v2.vercel.app/api/meta/auto-collect',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sgb-meta-cron-2025"}'::jsonb,
    body := '{"automatic": true, "source": "pgcron", "period": "evening"}'::jsonb
  );
  $$
);

-- ========================================
-- 3. ATUALIZAR CONFIGURAÇÃO META
-- ========================================

UPDATE meta_configuracoes 
SET 
  frequencia_coleta_horas = 12,
  proxima_coleta = CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 8 THEN DATE_TRUNC('day', NOW()) + INTERVAL '8 hours'
    WHEN EXTRACT(HOUR FROM NOW()) < 20 THEN DATE_TRUNC('day', NOW()) + INTERVAL '20 hours'
    ELSE DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '8 hours'
  END,
  observacoes = COALESCE(observacoes, '') || ' | pgcron recriado 12h (8h e 20h) - ' || NOW()::TEXT
WHERE bar_id = 3 AND ativo = true;

-- ========================================
-- 4. REGISTRAR RECRIAÇÃO NO LOG  
-- ========================================

INSERT INTO meta_coletas_log (
  bar_id, 
  tipo_coleta, 
  status, 
  parametros_coleta,
  observacoes,
  registros_processados
) VALUES (
  3, 
  'sistema_recriacao', 
  'sucesso',
  '{"pgcron_recreated": true, "frequency": "12h", "times": ["08:00", "20:00"], "endpoint": "/api/meta/auto-collect"}'::jsonb,
  'pgcron Meta recriado - coleta automática Instagram + Facebook de 12 em 12h',
  2
);

-- ========================================
-- 5. CRIAR VIEW PARA MONITORAMENTO
-- ========================================

CREATE OR REPLACE VIEW meta_pgcron_status AS
SELECT 
  j.jobname,
  j.schedule,
  j.active,
  CASE j.jobname
    WHEN 'meta-collect-morning' THEN 'Coleta manhã (8h) - Instagram + Facebook'
    WHEN 'meta-collect-evening' THEN 'Coleta noite (20h) - Instagram + Facebook'
    ELSE 'Outro job'
  END as descricao,
  CASE 
    WHEN j.jobname = 'meta-collect-morning' AND EXTRACT(HOUR FROM NOW()) < 8 THEN 'Hoje às 8h'
    WHEN j.jobname = 'meta-collect-morning' THEN 'Amanhã às 8h'
    WHEN j.jobname = 'meta-collect-evening' AND EXTRACT(HOUR FROM NOW()) < 20 THEN 'Hoje às 20h'
    WHEN j.jobname = 'meta-collect-evening' THEN 'Amanhã às 20h'
    ELSE 'N/A'
  END as proxima_execucao,
  (
    SELECT COUNT(*) 
    FROM meta_coletas_log 
    WHERE tipo_coleta = 'cron_automatico' 
    AND DATE(iniciada_em) = CURRENT_DATE
  ) as execucoes_hoje
FROM cron.job j
WHERE j.jobname LIKE 'meta-collect-%'
ORDER BY j.jobname;

-- ========================================
-- 6. FUNÇÃO PARA VERIFICAR STATUS
-- ========================================

CREATE OR REPLACE FUNCTION verificar_meta_pgcron()
RETURNS TABLE(
  status TEXT,
  jobs_ativos INTEGER,
  proxima_execucao TEXT,
  ultima_coleta TIMESTAMP WITH TIME ZONE,
  execucoes_hoje INTEGER
) AS $$
DECLARE
  job_count INTEGER;
  proxima_exec TEXT;
  ultima_exec TIMESTAMP WITH TIME ZONE;
  exec_hoje INTEGER;
BEGIN
  -- Contar jobs ativos
  SELECT COUNT(*) INTO job_count 
  FROM cron.job 
  WHERE jobname IN ('meta-collect-morning', 'meta-collect-evening') 
  AND active = true;
  
  -- Próxima execução
  SELECT CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 8 THEN 'Hoje às 8h (manhã)'
    WHEN EXTRACT(HOUR FROM NOW()) < 20 THEN 'Hoje às 20h (noite)'
    ELSE 'Amanhã às 8h (manhã)'
  END INTO proxima_exec;
  
  -- Última coleta
  SELECT iniciada_em INTO ultima_exec
  FROM meta_coletas_log 
  WHERE tipo_coleta = 'cron_automatico'
  ORDER BY iniciada_em DESC 
  LIMIT 1;
  
  -- Execuções hoje
  SELECT COUNT(*) INTO exec_hoje
  FROM meta_coletas_log 
  WHERE tipo_coleta = 'cron_automatico' 
  AND DATE(iniciada_em) = CURRENT_DATE;
  
  RETURN QUERY SELECT 
    CASE 
      WHEN job_count = 2 THEN 'ATIVO - Coletas automáticas configuradas' 
      WHEN job_count = 1 THEN 'PARCIAL - Apenas 1 job ativo'
      ELSE 'INATIVO - Nenhum job ativo'
    END,
    job_count,
    proxima_exec,
    ultima_exec,
    exec_hoje;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. VERIFICAR CRIAÇÃO DOS JOBS
-- ========================================

DO $$ 
DECLARE
  job_count INTEGER;
  job_names TEXT;
BEGIN 
  SELECT COUNT(*), STRING_AGG(jobname, ', ') 
  INTO job_count, job_names
  FROM cron.job 
  WHERE jobname IN ('meta-collect-morning', 'meta-collect-evening');
  
  IF job_count = 2 THEN
    RAISE NOTICE '✅ pgcron Meta recriado com sucesso!';
    RAISE NOTICE '📅 Jobs criados: %', job_names;
    RAISE NOTICE '⏰ Frequência: 12 em 12h (8h manhã + 20h noite)';
    RAISE NOTICE '🔗 Endpoint: /api/meta/auto-collect';
    RAISE NOTICE '📊 Coleta: Instagram + Facebook automaticamente';
    RAISE NOTICE '🎯 Próxima execução: %', (
      SELECT CASE 
        WHEN EXTRACT(HOUR FROM NOW()) < 8 THEN 'Hoje às 8h'
        WHEN EXTRACT(HOUR FROM NOW()) < 20 THEN 'Hoje às 20h'
        ELSE 'Amanhã às 8h'
      END
    );
  ELSIF job_count = 1 THEN
    RAISE NOTICE '⚠️ Apenas 1 job criado: %', job_names;
  ELSE
    RAISE NOTICE '❌ Nenhum job criado - verificar permissões pgcron';
  END IF;
END $$;

-- ========================================
-- ✅ PGCRON META RECRIADO - RESUMO
-- ========================================
-- • Frequência: 12 em 12 horas (8h e 20h)
-- • Endpoint: /api/meta/auto-collect
-- • Coleta: Instagram + Facebook completos
-- • Rate limits otimizados: ~10 calls/dia
-- • Logs automáticos em meta_coletas_log
-- • Monitoramento: SELECT * FROM meta_pgcron_status;
-- • Status: SELECT * FROM verificar_meta_pgcron();
-- ========================================

-- Executar verificação final
SELECT 'pgcron Meta recriado!' as resultado;
SELECT * FROM verificar_meta_pgcron(); 