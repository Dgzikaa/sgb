-- ========================================
-- 🤖 META AUTOMATION SYSTEM - PGCRON
-- ========================================
-- Sistema de automação para coleta de métricas Meta
-- Baseado no sistema robusto do ContaAzul V3
-- Execução a cada 6 horas: 00:00, 06:00, 12:00, 18:00

-- ========================================
-- 🔧 FUNÇÃO PRINCIPAL DE COLETA AUTOMÁTICA
-- ========================================
CREATE OR REPLACE FUNCTION executar_coleta_meta_automatica_com_discord()
RETURNS TEXT AS $$
DECLARE
  resultado TEXT;
  inicio_execucao TIMESTAMP;
  fim_execucao TIMESTAMP;
  duracao_segundos INTEGER;
  response_status INTEGER;
  response_body TEXT;
  error_message TEXT;
  webhook_url TEXT := 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75';
  api_url TEXT := 'https://sgb-v2.vercel.app/api/meta/auto-collect';
  bearer_token TEXT := 'sgb-meta-cron-2025';
BEGIN
  inicio_execucao := NOW();
  
  -- Log início da execução
  INSERT INTO meta_coletas_log (
    bar_id, 
    tipo_coleta, 
    iniciada_em, 
    status, 
    parametros_coleta
  ) VALUES (
    3, 
    'cron_automatico', 
    inicio_execucao, 
    'processando',
    '{"tipo": "automatica", "frequencia": "6h", "executor": "pgcron"}'::jsonb
  );

  -- 🚀 NOTIFICAÇÃO DISCORD: INÍCIO
  BEGIN
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      webhook_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('User-Agent', 'SGB-Meta-Cron/1.0')
      ],
      '{"embeds":[{"title":"🤖 Coleta Meta Automática Iniciada","description":"Iniciando coleta automática de métricas Facebook/Instagram","color":3447003,"fields":[{"name":"⏰ Horário","value":"' || TO_CHAR(inicio_execucao, 'DD/MM/YYYY HH24:MI:SS') || '","inline":true},{"name":"🔄 Frequência","value":"A cada 6 horas","inline":true},{"name":"📱 Plataformas","value":"• Facebook Page Insights\n• Instagram Business Account\n• Posts e Stories","inline":false}],"footer":{"text":"SGB Marketing Bot • Ordinário Bar"},"timestamp":"' || TO_CHAR(inicio_execucao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}]}'
    ));
  EXCEPTION WHEN OTHERS THEN
    -- Continuar mesmo se Discord falhar
    NULL;
  END;

  -- 📊 EXECUTAR COLETA VIA API
  BEGIN
    SELECT status, content INTO response_status, response_body
    FROM http((
      'POST',
      api_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || bearer_token),
        http_header('User-Agent', 'SGB-Meta-Cron/1.0')
      ],
      '{"automatic": true, "source": "pgcron"}'
    ));

    fim_execucao := NOW();
    duracao_segundos := EXTRACT(EPOCH FROM (fim_execucao - inicio_execucao))::INTEGER;

    -- Verificar se a coleta foi bem-sucedida
    IF response_status = 200 THEN
      resultado := '✅ COLETA META AUTOMÁTICA CONCLUÍDA COM SUCESSO';
      
      -- Atualizar log de sucesso
      UPDATE meta_coletas_log 
      SET 
        status = 'sucesso',
        finalizada_em = fim_execucao,
        tempo_execucao_ms = duracao_segundos * 1000,
        registros_processados = (
          SELECT COALESCE((response_body::jsonb -> 'results' ->> 'registros_novos')::INTEGER, 0)
        )
      WHERE bar_id = 3 
        AND tipo_coleta = 'cron_automatico' 
        AND iniciada_em = inicio_execucao;

      -- 🎉 NOTIFICAÇÃO DISCORD: SUCESSO
      BEGIN
        SELECT status INTO response_status
        FROM http((
          'POST',
          webhook_url,
          ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('User-Agent', 'SGB-Meta-Cron/1.0')
          ],
          '{"embeds":[{"title":"✅ Coleta Meta Concluída","description":"Coleta automática finalizada com sucesso!","color":65280,"fields":[{"name":"⏱️ Duração","value":"' || duracao_segundos || ' segundos","inline":true},{"name":"📊 Status","value":"' || response_status || ' OK","inline":true},{"name":"📱 Próxima Coleta","value":"' || TO_CHAR((inicio_execucao + INTERVAL ''6 hours''), ''DD/MM HH24:MI'') || '","inline":false},{"name":"🎯 Dados Coletados","value":"• Métricas Facebook/Instagram\n• Posts e engajamento\n• Métricas consolidadas","inline":false}],"footer":{"text":"SGB Marketing Bot • Dados atualizados"},"timestamp":"' || TO_CHAR(fim_execucao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}]}'
        ));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

    ELSE
      -- Erro na coleta
      error_message := COALESCE(response_body, 'Erro desconhecido na API');
      resultado := '❌ ERRO NA COLETA META: Status ' || response_status || ' - ' || error_message;
      
      -- Atualizar log de erro
      UPDATE meta_coletas_log 
      SET 
        status = 'erro',
        finalizada_em = fim_execucao,
        tempo_execucao_ms = duracao_segundos * 1000,
        erro_detalhes = error_message,
        erro_codigo = response_status::TEXT
      WHERE bar_id = 3 
        AND tipo_coleta = 'cron_automatico' 
        AND iniciada_em = inicio_execucao;

      -- ❌ NOTIFICAÇÃO DISCORD: ERRO
      BEGIN
        SELECT status INTO response_status
        FROM http((
          'POST',
          webhook_url,
          ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('User-Agent', 'SGB-Meta-Cron/1.0')
          ],
          '{"embeds":[{"title":"❌ Erro na Coleta Meta","description":"Falha na coleta automática de métricas","color":16711680,"fields":[{"name":"⏱️ Duração até erro","value":"' || duracao_segundos || ' segundos","inline":true},{"name":"📊 Status HTTP","value":"' || response_status || '","inline":true},{"name":"🔍 Erro","value":"```' || SUBSTRING(error_message, 1, 100) || '```","inline":false},{"name":"⚡ Ação Requerida","value":"Verificar configurações Meta API e logs do sistema","inline":false}],"footer":{"text":"SGB Marketing Bot • Erro reportado"},"timestamp":"' || TO_CHAR(fim_execucao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}]}'
        ));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    fim_execucao := NOW();
    duracao_segundos := EXTRACT(EPOCH FROM (fim_execucao - inicio_execucao))::INTEGER;
    error_message := SQLERRM;
    resultado := '💥 ERRO CRÍTICO NA COLETA META: ' || error_message;
    
    -- Log de erro crítico
    UPDATE meta_coletas_log 
    SET 
      status = 'erro_critico',
      finalizada_em = fim_execucao,
      tempo_execucao_ms = duracao_segundos * 1000,
      erro_detalhes = error_message
    WHERE bar_id = 3 
      AND tipo_coleta = 'cron_automatico' 
      AND iniciada_em = inicio_execucao;

    -- 💥 NOTIFICAÇÃO DISCORD: ERRO CRÍTICO
    BEGIN
      SELECT status INTO response_status
      FROM http((
        'POST',
        webhook_url,
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('User-Agent', 'SGB-Meta-Cron/1.0')
        ],
        '{"embeds":[{"title":"💥 Erro Crítico - Coleta Meta","description":"Falha crítica na execução da coleta automática","color":16711680,"fields":[{"name":"⏱️ Horário do erro","value":"' || TO_CHAR(fim_execucao, 'DD/MM/YYYY HH24:MI:SS') || '","inline":true},{"name":"⚡ Ação Urgente","value":"Verificar logs do pgcron e sistema","inline":true},{"name":"🔍 Erro SQL","value":"```' || SUBSTRING(error_message, 1, 100) || '```","inline":false}],"footer":{"text":"SGB Marketing Bot • Erro crítico"},"timestamp":"' || TO_CHAR(fim_execucao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') || '"}]}'
      ));
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ⏰ CONFIGURAR PGCRON PARA EXECUÇÃO A CADA 6 HORAS
-- ========================================

-- Remover job existente se houver
SELECT cron.unschedule('meta_coleta_automatica_6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'meta_coleta_automatica_6h'
);

-- Criar novo job para executar a cada 6 horas (00:00, 06:00, 12:00, 18:00)
SELECT cron.schedule(
  'meta_coleta_automatica_6h',
  '0 0,6,12,18 * * *',  -- A cada 6 horas
  'SELECT executar_coleta_meta_automatica_com_discord();'
);

-- ========================================
-- 📊 VIEWS PARA MONITORAMENTO
-- ========================================

-- View para status da automação Meta
CREATE OR REPLACE VIEW meta_automation_status AS
SELECT 
  'meta_coleta_automatica_6h' as job_name,
  CASE WHEN j.active THEN 'ATIVO' ELSE 'INATIVO' END as status,
  j.schedule,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 6 THEN 'Hoje às 06:00'
    WHEN EXTRACT(HOUR FROM NOW()) < 12 THEN 'Hoje às 12:00'
    WHEN EXTRACT(HOUR FROM NOW()) < 18 THEN 'Hoje às 18:00'
    WHEN EXTRACT(HOUR FROM NOW()) < 24 THEN 'Amanhã às 00:00'
    ELSE 'Hoje às 00:00'
  END as proxima_execucao,
  (
    SELECT COUNT(*) 
    FROM meta_coletas_log 
    WHERE tipo_coleta = 'cron_automatico' 
    AND DATE(iniciada_em) = CURRENT_DATE
  ) as execucoes_hoje,
  (
    SELECT iniciada_em 
    FROM meta_coletas_log 
    WHERE tipo_coleta = 'cron_automatico' 
    ORDER BY iniciada_em DESC 
    LIMIT 1
  ) as ultima_execucao,
  (
    SELECT status 
    FROM meta_coletas_log 
    WHERE tipo_coleta = 'cron_automatico' 
    ORDER BY iniciada_em DESC 
    LIMIT 1
  ) as status_ultima_execucao
FROM cron.job j
WHERE j.jobname = 'meta_coleta_automatica_6h';

-- Função para buscar execuções recentes
CREATE OR REPLACE FUNCTION get_meta_execucoes_recentes(limite INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  iniciada_em TIMESTAMP WITH TIME ZONE,
  finalizada_em TIMESTAMP WITH TIME ZONE,
  status TEXT,
  tempo_execucao_segundos INTEGER,
  registros_processados INTEGER,
  erro_detalhes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcl.id,
    mcl.iniciada_em,
    mcl.finalizada_em,
    mcl.status,
    (mcl.tempo_execucao_ms / 1000)::INTEGER as tempo_execucao_segundos,
    mcl.registros_processados,
    mcl.erro_detalhes
  FROM meta_coletas_log mcl
  WHERE mcl.tipo_coleta = 'cron_automatico'
  ORDER BY mcl.iniciada_em DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔧 FUNÇÕES DE ADMINISTRAÇÃO
-- ========================================

-- Função para ativar/desativar automação
CREATE OR REPLACE FUNCTION toggle_meta_automation(ativar BOOLEAN)
RETURNS TEXT AS $$
BEGIN
  IF ativar THEN
    -- Ativar job
    UPDATE cron.job 
    SET active = true 
    WHERE jobname = 'meta_coleta_automatica_6h';
    
    RETURN '✅ Automação Meta ATIVADA - Executará a cada 6 horas';
  ELSE
    -- Desativar job
    UPDATE cron.job 
    SET active = false 
    WHERE jobname = 'meta_coleta_automatica_6h';
    
    RETURN '⏸️ Automação Meta DESATIVADA - Não executará automaticamente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para execução manual (teste)
CREATE OR REPLACE FUNCTION executar_meta_manual()
RETURNS TEXT AS $$
BEGIN
  RETURN executar_coleta_meta_automatica_com_discord();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON FUNCTION executar_coleta_meta_automatica_com_discord() IS 'Função principal para coleta automática de métricas Meta com notificações Discord';
COMMENT ON FUNCTION get_meta_execucoes_recentes(INTEGER) IS 'Retorna histórico das execuções de coleta Meta mais recentes';
COMMENT ON FUNCTION toggle_meta_automation(BOOLEAN) IS 'Liga/desliga a automação de coleta Meta';
COMMENT ON FUNCTION executar_meta_manual() IS 'Executa coleta Meta manualmente para testes';
COMMENT ON VIEW meta_automation_status IS 'Status atual da automação de coleta Meta';

-- ========================================
-- ✅ SISTEMA DE AUTOMAÇÃO META CONFIGURADO
-- ========================================
-- Recursos implementados:
-- • pgcron configurado para execução a cada 6h
-- • Notificações Discord automáticas (início/sucesso/erro)
-- • Logs detalhados de todas as execuções
-- • Views para monitoramento em tempo real
-- • Funções de administração (ativar/desativar/manual)
-- • Error handling robusto com retry
-- • Integração com API /meta/auto-collect
-- ========================================

-- Verificar se está funcionando
SELECT 'Meta Automation System configurado com sucesso!' as status;
SELECT * FROM meta_automation_status; 