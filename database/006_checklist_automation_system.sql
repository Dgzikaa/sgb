-- =====================================================
-- 📅 SISTEMA DE AGENDAMENTO AUTOMÁTICO DE CHECKLISTS
-- =====================================================

-- Extensão para cron jobs (se não existir)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 📋 TABELAS DO SISTEMA DE AGENDAMENTO
-- =====================================================

-- Tabela expandida de agendamentos de checklists
ALTER TABLE checklist_schedules 
ADD COLUMN IF NOT EXISTS tempo_limite_horas INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS tempo_alerta_horas INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica')),
ADD COLUMN IF NOT EXISTS responsaveis_whatsapp JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ultima_execucao_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proxima_execucao_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_execucoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execucoes_com_sucesso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execucoes_com_falha INTEGER DEFAULT 0;

-- Tabela expandida de execuções de checklists  
ALTER TABLE checklist_execucoes
ADD COLUMN IF NOT EXISTS tipo_execucao TEXT DEFAULT 'manual' CHECK (tipo_execucao IN ('manual', 'agendada', 'automatica')),
ADD COLUMN IF NOT EXISTS prazo_conclusao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notificacoes_enviadas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS score_qualidade INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS problemas_encontrados INTEGER DEFAULT 0;

-- Tabela de logs de notificações de checklists
CREATE TABLE IF NOT EXISTS checklist_notification_logs (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id),
  checklist_execucao_id UUID NOT NULL REFERENCES checklist_execucoes(id),
  tipo_notificacao TEXT NOT NULL CHECK (tipo_notificacao IN ('completado', 'atrasado', 'iniciado', 'problema')),
  destinatarios_enviados JSONB DEFAULT '[]'::jsonb,
  destinatarios_falha JSONB DEFAULT '[]'::jsonb,
  mensagem_enviada TEXT,
  canal_utilizado TEXT DEFAULT 'whatsapp',
  sucesso BOOLEAN DEFAULT true,
  erro_detalhes TEXT,
  enviado_por UUID REFERENCES usuarios_sistema(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notification_logs_bar_checklist_fk 
    FOREIGN KEY (bar_id, checklist_execucao_id) 
    REFERENCES checklist_execucoes(bar_id, id) MATCH SIMPLE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checklist_schedules_ativo_proxima_execucao 
  ON checklist_schedules (ativo, proxima_execucao_em) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_checklist_execucoes_prazo_status 
  ON checklist_execucoes (prazo_conclusao, status) WHERE status IN ('agendado', 'em_andamento');

CREATE INDEX IF NOT EXISTS idx_notification_logs_bar_data 
  ON checklist_notification_logs (bar_id, created_at DESC);

-- =====================================================
-- 🔧 FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular próxima execução
CREATE OR REPLACE FUNCTION calcular_proxima_execucao(
  agendamento_record checklist_schedules
) RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql AS $$
DECLARE
  proxima_data TIMESTAMP WITH TIME ZONE;
  hora_agendamento INTEGER;
  minuto_agendamento INTEGER;
  agora TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Se não estiver ativo, retorna null
  IF NOT agendamento_record.ativo THEN
    RETURN NULL;
  END IF;

  -- Extrair hora e minuto do horário agendado
  hora_agendamento := EXTRACT(HOUR FROM agendamento_record.horario::TIME);
  minuto_agendamento := EXTRACT(MINUTE FROM agendamento_record.horario::TIME);
  
  -- Definir data base (hoje com o horário especificado)
  proxima_data := DATE_TRUNC('day', agora) + 
                  INTERVAL '1 hour' * hora_agendamento + 
                  INTERVAL '1 minute' * minuto_agendamento;
  
  -- Se já passou da hora hoje, começar de amanhã
  IF proxima_data <= agora THEN
    proxima_data := proxima_data + INTERVAL '1 day';
  END IF;

  -- Aplicar lógica de frequência
  CASE agendamento_record.frequencia
    WHEN 'diaria' THEN
      -- Diária: próxima data já está correta
      RETURN proxima_data;
    
    WHEN 'semanal' THEN
      -- Semanal: encontrar próximo dia da semana especificado
      WHILE NOT (EXTRACT(DOW FROM proxima_data)::INTEGER = ANY(agendamento_record.dias_semana)) LOOP
        proxima_data := proxima_data + INTERVAL '1 day';
      END LOOP;
      RETURN proxima_data;
    
    WHEN 'quinzenal' THEN
      -- Quinzenal: a cada 2 semanas nos dias especificados
      WHILE NOT (EXTRACT(DOW FROM proxima_data)::INTEGER = ANY(agendamento_record.dias_semana)) 
            OR EXTRACT(DAY FROM proxima_data) > 15 LOOP
        proxima_data := proxima_data + INTERVAL '1 day';
      END LOOP;
      RETURN proxima_data;
    
    WHEN 'mensal' THEN
      -- Mensal: dia específico do mês
      proxima_data := DATE_TRUNC('month', proxima_data) + 
                      INTERVAL '1 day' * (agendamento_record.dia_mes - 1) +
                      INTERVAL '1 hour' * hora_agendamento + 
                      INTERVAL '1 minute' * minuto_agendamento;
      
      -- Se já passou este mês, próximo mês
      IF proxima_data <= agora THEN
        proxima_data := DATE_TRUNC('month', proxima_data) + INTERVAL '1 month' +
                        INTERVAL '1 day' * (agendamento_record.dia_mes - 1) +
                        INTERVAL '1 hour' * hora_agendamento + 
                        INTERVAL '1 minute' * minuto_agendamento;
      END IF;
      RETURN proxima_data;
    
    WHEN 'conforme_necessario' THEN
      -- Sob demanda: não tem próxima execução automática
      RETURN NULL;
    
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- Função para atualizar próximas execuções
CREATE OR REPLACE FUNCTION atualizar_proximas_execucoes()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  agendamento RECORD;
  total_atualizados INTEGER := 0;
BEGIN
  -- Atualizar todas as próximas execuções
  FOR agendamento IN 
    SELECT * FROM checklist_schedules WHERE ativo = true
  LOOP
    UPDATE checklist_schedules 
    SET proxima_execucao_em = calcular_proxima_execucao(agendamento)
    WHERE id = agendamento.id;
    
    total_atualizados := total_atualizados + 1;
  END LOOP;
  
  RETURN total_atualizados;
END;
$$;

-- =====================================================
-- 🚀 CONFIGURAÇÃO DO CRON JOB
-- =====================================================

-- Remover jobs antigos se existirem
SELECT cron.unschedule('checklist-auto-scheduler-15min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'checklist-auto-scheduler-15min'
);

SELECT cron.unschedule('checklist-auto-scheduler-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'checklist-auto-scheduler-hourly'
);

-- Job principal: verificação a cada 15 minutos
SELECT cron.schedule(
  'checklist-auto-scheduler-15min',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  DO $$
  DECLARE
    bar_record RECORD;
    response_data JSONB;
    error_message TEXT;
  BEGIN
    -- Processar cada bar ativo
    FOR bar_record IN 
      SELECT id FROM bars WHERE ativo = true
    LOOP
      BEGIN
        -- Chamar Edge Function para processar agendamentos
        SELECT content::jsonb INTO response_data
        FROM http((
          'POST',
          current_setting('app.supabase_url') || '/functions/v1/checklist-auto-scheduler',
          ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
            http_header('Content-Type', 'application/json')
          ],
          'application/json',
          ('{"bar_id": ' || bar_record.id || '}')::text
        )::http_request);
        
        -- Log de sucesso
        RAISE NOTICE 'Agendamentos processados para bar %: %', 
          bar_record.id, response_data->>'message';
          
      EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        
        -- Log de erro
        RAISE WARNING 'Erro ao processar agendamentos do bar %: %', 
          bar_record.id, error_message;
        
        -- Opcional: inserir log de erro em tabela
        INSERT INTO system_logs (tipo, modulo, mensagem, dados_extras, created_at)
        VALUES (
          'error',
          'checklist_automation',
          'Erro no processamento automático de agendamentos',
          jsonb_build_object(
            'bar_id', bar_record.id,
            'error', error_message,
            'job_name', 'checklist-auto-scheduler-15min'
          ),
          NOW()
        );
      END;
    END LOOP;
  END $$;
  $$
);

-- Job secundário: atualização de próximas execuções (1x por hora)
SELECT cron.schedule(
  'checklist-update-next-executions',
  '0 * * * *', -- A cada hora
  $$
  DO $$
  DECLARE
    total_atualizados INTEGER;
  BEGIN
    -- Atualizar próximas execuções de todos os agendamentos
    SELECT atualizar_proximas_execucoes() INTO total_atualizados;
    
    RAISE NOTICE 'Próximas execuções atualizadas: % agendamentos', total_atualizados;
  END $$;
  $$
);

-- =====================================================
-- 📊 TRIGGERS PARA MANTER DADOS ATUALIZADOS
-- =====================================================

-- Trigger para atualizar próxima execução quando agendamento for modificado
CREATE OR REPLACE FUNCTION trigger_atualizar_proxima_execucao()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Calcular e definir próxima execução
  NEW.proxima_execucao_em := calcular_proxima_execucao(NEW);
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS tr_checklist_schedules_proxima_execucao ON checklist_schedules;
CREATE TRIGGER tr_checklist_schedules_proxima_execucao
  BEFORE INSERT OR UPDATE ON checklist_schedules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_proxima_execucao();

-- Trigger para atualizar estatísticas quando execução for completada
CREATE OR REPLACE FUNCTION trigger_atualizar_stats_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Se execução foi completada
  IF OLD.status != 'completado' AND NEW.status = 'completado' AND NEW.agendamento_id IS NOT NULL THEN
    UPDATE checklist_schedules 
    SET 
      ultima_execucao_em = NEW.concluido_em,
      total_execucoes = total_execucoes + 1,
      execucoes_com_sucesso = execucoes_com_sucesso + 1
    WHERE id = NEW.agendamento_id;
  END IF;
  
  -- Se execução falhou
  IF OLD.status != 'cancelado' AND NEW.status = 'cancelado' AND NEW.agendamento_id IS NOT NULL THEN
    UPDATE checklist_schedules 
    SET 
      total_execucoes = total_execucoes + 1,
      execucoes_com_falha = execucoes_com_falha + 1
    WHERE id = NEW.agendamento_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS tr_checklist_execucoes_update_stats ON checklist_execucoes;
CREATE TRIGGER tr_checklist_execucoes_update_stats
  AFTER UPDATE ON checklist_execucoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_stats_agendamento();

-- =====================================================
-- 🔧 VIEWS ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- View de agendamentos com próximas execuções
CREATE OR REPLACE VIEW v_agendamentos_proximas_execucoes AS
SELECT 
  cs.*,
  c.nome as checklist_nome,
  c.setor as checklist_setor,
  CASE 
    WHEN NOT cs.ativo THEN 'inativo'
    WHEN cs.proxima_execucao_em IS NULL THEN 'manual'
    WHEN cs.proxima_execucao_em <= NOW() THEN 'pendente'
    ELSE 'agendado'
  END as status_agendamento,
  EXTRACT(EPOCH FROM (cs.proxima_execucao_em - NOW()))/3600 as horas_ate_proxima_execucao
FROM checklist_schedules cs
JOIN checklists c ON c.id = cs.checklist_id
ORDER BY cs.proxima_execucao_em ASC NULLS LAST;

-- View de execuções atrasadas
CREATE OR REPLACE VIEW v_checklist_execucoes_atrasadas AS
SELECT 
  ce.*,
  c.nome as checklist_nome,
  c.setor as checklist_setor,
  cs.titulo as agendamento_titulo,
  EXTRACT(EPOCH FROM (NOW() - ce.prazo_conclusao))/3600 as horas_atraso
FROM checklist_execucoes ce
JOIN checklists c ON c.id = ce.checklist_id
LEFT JOIN checklist_schedules cs ON cs.id = ce.agendamento_id
WHERE ce.status IN ('agendado', 'em_andamento') 
  AND ce.prazo_conclusao < NOW()
ORDER BY ce.prazo_conclusao ASC;

-- =====================================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE checklist_notification_logs IS 'Log de todas as notificações enviadas relacionadas a checklists';
COMMENT ON FUNCTION calcular_proxima_execucao IS 'Calcula próxima execução baseada na frequência do agendamento';
COMMENT ON FUNCTION atualizar_proximas_execucoes IS 'Atualiza próximas execuções de todos os agendamentos ativos';
COMMENT ON VIEW v_agendamentos_proximas_execucoes IS 'Visão consolidada de agendamentos com status e próximas execuções';
COMMENT ON VIEW v_checklist_execucoes_atrasadas IS 'Lista de execuções de checklists que passaram do prazo';

-- =====================================================
-- ✅ INICIALIZAÇÃO
-- =====================================================

-- Atualizar próximas execuções existentes
SELECT atualizar_proximas_execucoes();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚀 ===================================================';
  RAISE NOTICE '✅ SISTEMA DE AGENDAMENTO AUTOMÁTICO CONFIGURADO!';
  RAISE NOTICE '🚀 ===================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Jobs configurados:';
  RAISE NOTICE '   • checklist-auto-scheduler-15min (a cada 15 min)';
  RAISE NOTICE '   • checklist-update-next-executions (a cada hora)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   • checklist_notification_logs';
  RAISE NOTICE '   • Colunas expandidas em checklist_schedules';
  RAISE NOTICE '   • Colunas expandidas em checklist_execucoes';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Views disponíveis:';
  RAISE NOTICE '   • v_agendamentos_proximas_execucoes';
  RAISE NOTICE '   • v_checklist_execucoes_atrasadas';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 O sistema está ativo e processando agendamentos!';
  RAISE NOTICE '';
END $$; 