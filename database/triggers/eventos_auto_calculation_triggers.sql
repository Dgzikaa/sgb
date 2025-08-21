-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE EVENTOS_BASE
-- =====================================================
-- Triggers que mantêm os cálculos sempre atualizados
-- Baseados nas regras da view_eventos_complete.sql
-- =====================================================

-- =================================================
-- 1. TRIGGER PARA NOVOS EVENTOS OU ALTERAÇÕES
-- =================================================
CREATE OR REPLACE FUNCTION trigger_recalcular_evento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Marcar para recálculo
    NEW.precisa_recalculo := TRUE;
    NEW.atualizado_em := NOW();
    
    -- Se é INSERT ou mudança significativa, recalcular imediatamente
    IF TG_OP = 'INSERT' OR 
       OLD.data_evento IS DISTINCT FROM NEW.data_evento OR
       OLD.bar_id IS DISTINCT FROM NEW.bar_id OR
       OLD.cl_plan IS DISTINCT FROM NEW.cl_plan THEN
        
        -- Recalcular lot_max imediatamente (não depende de dados externos)
        IF COALESCE(NEW.cl_plan, 0) > 0 THEN
            NEW.lot_max := NEW.cl_plan / 1.3;
        ELSE
            NEW.lot_max := 0;
        END IF;
        
        RAISE NOTICE 'Evento % marcado para recálculo completo', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela eventos_base
DROP TRIGGER IF EXISTS trigger_eventos_base_recalculo ON eventos_base;
CREATE TRIGGER trigger_eventos_base_recalculo
    BEFORE INSERT OR UPDATE ON eventos_base
    FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_evento();

-- =================================================
-- 2. TRIGGER PARA RECÁLCULO APÓS COMMIT
-- =================================================
CREATE OR REPLACE FUNCTION trigger_recalcular_evento_after()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Agendar recálculo assíncrono para não travar a transação
    PERFORM pg_notify('recalcular_evento', NEW.id::text);
    
    RETURN NEW;
END;
$$;

-- Trigger AFTER para não travar a transação principal
DROP TRIGGER IF EXISTS trigger_eventos_base_recalculo_after ON eventos_base;
CREATE TRIGGER trigger_eventos_base_recalculo_after
    AFTER INSERT OR UPDATE ON eventos_base
    FOR EACH ROW 
    WHEN (NEW.precisa_recalculo = TRUE)
    EXECUTE FUNCTION trigger_recalcular_evento_after();

-- =================================================
-- 3. TRIGGERS PARA DADOS EXTERNOS (CONTAHUB)
-- =================================================
CREATE OR REPLACE FUNCTION trigger_contahub_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    affected_date DATE;
    evento_ids INTEGER[];
BEGIN
    -- Determinar data afetada baseada na tabela
    IF TG_TABLE_NAME = 'contahub_pagamentos' THEN
        affected_date := COALESCE(NEW.dt_gerencial, OLD.dt_gerencial);
    ELSIF TG_TABLE_NAME = 'contahub_periodo' THEN
        affected_date := COALESCE(NEW.dt_gerencial, OLD.dt_gerencial);
    ELSIF TG_TABLE_NAME = 'contahub_analitico' THEN
        affected_date := COALESCE(NEW.trn_dtgerencial, OLD.trn_dtgerencial);
    ELSIF TG_TABLE_NAME = 'contahub_fatporhora' THEN
        affected_date := COALESCE(NEW.vd_dtgerencial, OLD.vd_dtgerencial);
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Marcar eventos da data para recálculo
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE,
        atualizado_em = NOW()
    WHERE data_evento = affected_date;
    
    GET DIAGNOSTICS evento_ids = ROW_COUNT;
    
    RAISE NOTICE 'Dados % alterados para %. % eventos marcados para recálculo', 
        TG_TABLE_NAME, affected_date, array_length(evento_ids, 1);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers nas tabelas ContaHub
DROP TRIGGER IF EXISTS trigger_contahub_pagamentos_change ON contahub_pagamentos;
CREATE TRIGGER trigger_contahub_pagamentos_change
    AFTER INSERT OR UPDATE OR DELETE ON contahub_pagamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_contahub_change();

DROP TRIGGER IF EXISTS trigger_contahub_periodo_change ON contahub_periodo;
CREATE TRIGGER trigger_contahub_periodo_change
    AFTER INSERT OR UPDATE OR DELETE ON contahub_periodo
    FOR EACH ROW EXECUTE FUNCTION trigger_contahub_change();

DROP TRIGGER IF EXISTS trigger_contahub_analitico_change ON contahub_analitico;
CREATE TRIGGER trigger_contahub_analitico_change
    AFTER INSERT OR UPDATE OR DELETE ON contahub_analitico
    FOR EACH ROW EXECUTE FUNCTION trigger_contahub_change();

DROP TRIGGER IF EXISTS trigger_contahub_fatporhora_change ON contahub_fatporhora;
CREATE TRIGGER trigger_contahub_fatporhora_change
    AFTER INSERT OR UPDATE OR DELETE ON contahub_fatporhora
    FOR EACH ROW EXECUTE FUNCTION trigger_contahub_change();

-- =================================================
-- 4. TRIGGERS PARA DADOS EXTERNOS (YUZER)
-- =================================================
CREATE OR REPLACE FUNCTION trigger_yuzer_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    affected_date DATE;
BEGIN
    affected_date := COALESCE(NEW.data_evento, OLD.data_evento);
    
    -- Marcar eventos da data para recálculo
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE,
        atualizado_em = NOW()
    WHERE data_evento = affected_date;
    
    RAISE NOTICE 'Dados Yuzer alterados para %. Eventos marcados para recálculo', affected_date;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers nas tabelas Yuzer
DROP TRIGGER IF EXISTS trigger_yuzer_resumo2_change ON yuzer_resumo2;
CREATE TRIGGER trigger_yuzer_resumo2_change
    AFTER INSERT OR UPDATE OR DELETE ON yuzer_resumo2
    FOR EACH ROW EXECUTE FUNCTION trigger_yuzer_change();

DROP TRIGGER IF EXISTS trigger_yuzer_fatporhora_change ON yuzer_fatporhora;
CREATE TRIGGER trigger_yuzer_fatporhora_change
    AFTER INSERT OR UPDATE OR DELETE ON yuzer_fatporhora
    FOR EACH ROW EXECUTE FUNCTION trigger_yuzer_change();

-- =================================================
-- 5. TRIGGERS PARA DADOS EXTERNOS (NIBO E SYMPLA)
-- =================================================
CREATE OR REPLACE FUNCTION trigger_nibo_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    affected_date DATE;
BEGIN
    affected_date := COALESCE(NEW.data_competencia, OLD.data_competencia);
    
    -- Marcar eventos da data para recálculo
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE,
        atualizado_em = NOW()
    WHERE data_evento = affected_date;
    
    RAISE NOTICE 'Dados Nibo alterados para %. Eventos marcados para recálculo', affected_date;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_nibo_agendamentos_change ON nibo_agendamentos;
CREATE TRIGGER trigger_nibo_agendamentos_change
    AFTER INSERT OR UPDATE OR DELETE ON nibo_agendamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_nibo_change();

-- Trigger para Sympla (mais complexo por causa do matching por nome)
CREATE OR REPLACE FUNCTION trigger_sympla_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Marcar todos os eventos para recálculo (por segurança, já que o matching é por nome)
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE,
        atualizado_em = NOW()
    WHERE nome IS NOT NULL;
    
    RAISE NOTICE 'Dados Sympla alterados. Todos os eventos marcados para recálculo';
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sympla_pedidos_change ON sympla_pedidos;
CREATE TRIGGER trigger_sympla_pedidos_change
    AFTER INSERT OR UPDATE OR DELETE ON sympla_pedidos
    FOR EACH ROW EXECUTE FUNCTION trigger_sympla_change();

DROP TRIGGER IF EXISTS trigger_sympla_participantes_change ON sympla_participantes;
CREATE TRIGGER trigger_sympla_participantes_change
    AFTER INSERT OR UPDATE OR DELETE ON sympla_participantes
    FOR EACH ROW EXECUTE FUNCTION trigger_sympla_change();

-- =================================================
-- 6. FUNÇÃO PARA RECÁLCULO EM LOTE
-- =================================================
CREATE OR REPLACE FUNCTION recalcular_eventos_pendentes()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    evento_id INTEGER;
    total_recalculados INTEGER := 0;
BEGIN
    -- Recalcular todos os eventos marcados
    FOR evento_id IN 
        SELECT id FROM eventos_base 
        WHERE precisa_recalculo = TRUE 
        ORDER BY data_evento DESC
        LIMIT 100  -- Processar em lotes para não travar
    LOOP
        PERFORM calculate_evento_metrics(evento_id);
        total_recalculados := total_recalculados + 1;
    END LOOP;
    
    RAISE NOTICE 'Recalculados % eventos', total_recalculados;
    RETURN total_recalculados;
END;
$$;

-- =================================================
-- 7. FUNÇÃO PARA RECÁLCULO FORÇADO DE PERÍODO
-- =================================================
CREATE OR REPLACE FUNCTION recalcular_eventos_periodo(
    data_inicio DATE, 
    data_fim DATE DEFAULT NULL
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    evento_id INTEGER;
    total_recalculados INTEGER := 0;
BEGIN
    -- Se data_fim não informada, usar apenas data_inicio
    IF data_fim IS NULL THEN
        data_fim := data_inicio;
    END IF;
    
    -- Marcar eventos do período para recálculo
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE,
        atualizado_em = NOW()
    WHERE data_evento BETWEEN data_inicio AND data_fim;
    
    -- Recalcular eventos do período
    FOR evento_id IN 
        SELECT id FROM eventos_base 
        WHERE data_evento BETWEEN data_inicio AND data_fim
        ORDER BY data_evento
    LOOP
        PERFORM calculate_evento_metrics(evento_id);
        total_recalculados := total_recalculados + 1;
    END LOOP;
    
    RAISE NOTICE 'Recalculados % eventos do período % a %', 
        total_recalculados, data_inicio, data_fim;
    RETURN total_recalculados;
END;
$$;

-- =================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =================================================
COMMENT ON FUNCTION trigger_recalcular_evento() IS 'Trigger que marca eventos para recálculo quando dados básicos mudam';
COMMENT ON FUNCTION trigger_contahub_change() IS 'Trigger que detecta mudanças nos dados ContaHub e marca eventos afetados';
COMMENT ON FUNCTION trigger_yuzer_change() IS 'Trigger que detecta mudanças nos dados Yuzer e marca eventos afetados';
COMMENT ON FUNCTION trigger_nibo_change() IS 'Trigger que detecta mudanças nos dados Nibo e marca eventos afetados';
COMMENT ON FUNCTION recalcular_eventos_pendentes() IS 'Função para recalcular em lote todos os eventos marcados como pendentes';
COMMENT ON FUNCTION recalcular_eventos_periodo(DATE, DATE) IS 'Função para forçar recálculo de eventos em um período específico';
