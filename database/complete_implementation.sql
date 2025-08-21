-- IMPLEMENTAÇÃO COMPLETA - EVENTOS_BASE COM TODAS AS REGRAS
-- =====================================================
-- Estrutura final: 1 tabela + 1 função + triggers específicos
-- Replica TODAS as regras da view_eventos_complete.sql
-- =====================================================

-- =================================================
-- STEP 1: ADICIONAR COLUNAS NA EVENTOS_BASE
-- =================================================

-- Colunas calculadas principais
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS cl_real INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS te_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tb_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS t_medio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lot_max NUMERIC DEFAULT 0;

-- Colunas de custos e percentuais
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS c_prod NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_art_fat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_b NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_d NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_c NUMERIC DEFAULT 0;

-- Colunas de tempo e performance
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS t_coz NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS t_bar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat_19h_percent NUMERIC DEFAULT 0;

-- Colunas de integração
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS sympla_liquido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sympla_checkins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yuzer_liquido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS yuzer_ingressos NUMERIC DEFAULT 0;

-- Colunas de controle
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS precisa_recalculo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS versao_calculo INTEGER DEFAULT 1;

-- =================================================
-- STEP 2: FUNÇÃO PRINCIPAL COM TODAS AS REGRAS
-- =================================================

CREATE OR REPLACE FUNCTION calculate_evento_metrics(evento_id INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    evento_record RECORD;
    is_domingo_or_special BOOLEAN;
    
    -- Dados agregados das fontes externas
    yuzer_data RECORD;
    contahub_pag RECORD;
    contahub_per RECORD;
    contahub_fat RECORD;
    contahub_ana RECORD;
    nibo_custos RECORD;
    sympla_data RECORD;
    yuzer_fatporhora RECORD;
    
    -- Valores calculados finais
    calculated_cl_real INTEGER := 0;
    calculated_real_r NUMERIC := 0;
    calculated_te_real NUMERIC := 0;
    calculated_tb_real NUMERIC := 0;
    calculated_t_medio NUMERIC := 0;
    calculated_lot_max NUMERIC := 0;
    calculated_percent_b NUMERIC := 0;
    calculated_percent_d NUMERIC := 0;
    calculated_percent_c NUMERIC := 0;
    calculated_t_coz NUMERIC := 0;
    calculated_t_bar NUMERIC := 0;
    calculated_fat_19h_percent NUMERIC := 0;
    calculated_percent_art_fat NUMERIC := 0;
    calculated_c_art NUMERIC := 0;
    calculated_c_prod NUMERIC := 0;
BEGIN
    -- Buscar dados do evento
    SELECT * INTO evento_record 
    FROM eventos_base 
    WHERE id = evento_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Evento % não encontrado', evento_id;
        RETURN;
    END IF;
    
    -- Verificar se é domingo ou data especial (09/08/2025)
    is_domingo_or_special := (
        UPPER(evento_record.dia_semana) = 'DOMINGO' OR 
        evento_record.data_evento = '2025-08-09'::date
    );
    
    RAISE NOTICE 'Calculando evento % - Data: % - Domingo/Especial: %', 
        evento_id, evento_record.data_evento, is_domingo_or_special;
    
    -- =================================================
    -- BUSCAR DADOS DE TODAS AS FONTES
    -- =================================================
    
    -- 1. YUZER
    SELECT 
        COALESCE(faturamento_liquido, 0) as faturamento_liquido,
        COALESCE(receita_ingressos, 0) as receita_ingressos,
        COALESCE(quantidade_ingressos, 0) as quantidade_ingressos,
        COALESCE(percent_bebidas, 0) as percent_bebidas,
        COALESCE(percent_drinks, 0) as percent_drinks,
        COALESCE(percent_comidas, 0) as percent_comidas
    INTO yuzer_data
    FROM yuzer_resumo2 
    WHERE data_evento = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- Se não encontrou, usar valores padrão
    IF NOT FOUND THEN
        yuzer_data := ROW(0,0,0,0,0,0);
    END IF;
    
    -- 2. CONTAHUB PAGAMENTOS
    SELECT COALESCE(SUM(liquido), 0) as total_liquido
    INTO contahub_pag
    FROM contahub_pagamentos
    WHERE dt_gerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- 3. CONTAHUB PERÍODO
    SELECT 
        COALESCE(SUM(pessoas), 0) as total_pessoas,
        COALESCE(SUM(CASE WHEN vr_pagamentos > 0 THEN pessoas ELSE 0 END), 0) as total_pessoas_pagantes,
        COALESCE(SUM(vr_couvert), 0) as total_couvert,
        COALESCE(SUM(vr_pagamentos), 0) as total_pagamentos
    INTO contahub_per
    FROM contahub_periodo
    WHERE dt_gerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- 4. CONTAHUB FATURAMENTO POR HORA
    SELECT 
        COALESCE(SUM(CASE WHEN hora < 19 THEN valor ELSE 0 END), 0) as fat_ate_19h,
        COALESCE(SUM(valor), 0) as fat_total
    INTO contahub_fat
    FROM contahub_fatporhora
    WHERE vd_dtgerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- 5. CONTAHUB ANALÍTICO
    SELECT 
        COALESCE(SUM(valorfinal), 0) as total_valorfinal,
        -- %B - Bebidas
        CASE 
            WHEN SUM(valorfinal) > 0 
            THEN (SUM(CASE WHEN loc_desc IN ('Chopp','Baldes','Pegue e Pague','PP','Venda Volante','Bar') THEN valorfinal ELSE 0 END) / SUM(valorfinal)) * 100
            ELSE 0 
        END AS percent_bebidas,
        -- %C - Comidas  
        CASE 
            WHEN SUM(valorfinal) > 0 
            THEN (SUM(CASE WHEN loc_desc IN ('Cozinha','Cozinha 1','Cozinha 2') THEN valorfinal ELSE 0 END) / SUM(valorfinal)) * 100
            ELSE 0 
        END AS percent_comidas,
        -- %D - Drinks
        CASE 
            WHEN SUM(valorfinal) > 0 
            THEN (SUM(CASE WHEN loc_desc IN ('Preshh','Drinks','Drinks Autorais','Mexido','Shot e Dose','Batidos') THEN valorfinal ELSE 0 END) / SUM(valorfinal)) * 100
            ELSE 0 
        END AS percent_drinks,
        -- Valores por categoria para T.COZ e T.BAR
        COALESCE(SUM(CASE WHEN loc_desc IN ('Chopp','Baldes','Pegue e Pague','PP','Venda Volante','Bar') THEN valorfinal ELSE 0 END), 0) as valor_bebidas,
        COALESCE(SUM(CASE WHEN loc_desc IN ('Cozinha','Cozinha 1','Cozinha 2') THEN valorfinal ELSE 0 END), 0) as valor_comidas
    INTO contahub_ana
    FROM contahub_analitico
    WHERE trn_dtgerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- Se não encontrou, usar valores padrão
    IF NOT FOUND THEN
        contahub_ana := ROW(0,0,0,0,0,0);
    END IF;
    
    -- 6. NIBO CUSTOS
    SELECT 
        COALESCE(SUM(CASE WHEN categoria_nome = 'Atrações Programação' THEN valor ELSE 0 END), 0) as custo_artistico,
        COALESCE(SUM(CASE WHEN categoria_nome = 'Produção Eventos' THEN valor ELSE 0 END), 0) as custo_producao
    INTO nibo_custos
    FROM nibo_agendamentos
    WHERE data_competencia = evento_record.data_evento;
    
    -- Se não encontrou, usar valores padrão
    IF NOT FOUND THEN
        nibo_custos := ROW(0,0);
    END IF;
    
    -- 7. SYMPLA
    SELECT 
        COALESCE(SUM(sp_ped.valor_liquido), 0) AS sympla_liquido,
        COALESCE(SUM(CASE WHEN sp_part.fez_checkin = true THEN 1 ELSE 0 END), 0) AS sympla_checkins
    INTO sympla_data
    FROM sympla_pedidos sp_ped
    LEFT JOIN sympla_participantes sp_part ON sp_ped.evento_sympla_id = sp_part.evento_sympla_id
    WHERE CAST(SUBSTRING(sp_ped.evento_sympla_id FROM '[0-9]+') AS INTEGER) = 
          CAST(SUBSTRING(evento_record.nome FROM '[0-9]+') AS INTEGER);
    
    -- Se não encontrou, usar valores padrão
    IF NOT FOUND THEN
        sympla_data := ROW(0,0);
    END IF;
    
    -- 8. YUZER FATURAMENTO POR HORA (para domingos)
    SELECT 
        COALESCE(SUM(CASE 
            WHEN SUBSTRING(hora_formatada FROM '\\d{2}:\\d{2}') BETWEEN '14:00' AND '18:00' 
            THEN faturamento 
            ELSE 0 
        END), 0) as fat_14_18h,
        COALESCE(SUM(faturamento), 0) as fat_total
    INTO yuzer_fatporhora
    FROM yuzer_fatporhora
    WHERE data_evento = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- Se não encontrou, usar valores padrão
    IF NOT FOUND THEN
        yuzer_fatporhora := ROW(0,0);
    END IF;
    
    -- =================================================
    -- APLICAR TODAS AS REGRAS DE NEGÓCIO
    -- =================================================
    
    -- REGRA 1: CLIENTES REAIS
    IF is_domingo_or_special THEN
        calculated_cl_real := yuzer_data.quantidade_ingressos + sympla_data.sympla_checkins + contahub_per.total_pessoas;
    ELSE
        calculated_cl_real := contahub_per.total_pessoas_pagantes;
    END IF;
    
    -- REGRA 2: REAL RECEITA
    IF is_domingo_or_special THEN
        calculated_real_r := contahub_pag.total_liquido + yuzer_data.faturamento_liquido;
    ELSE
        calculated_real_r := contahub_pag.total_liquido;
    END IF;
    
    -- REGRA 3: TICKET MÉDIO REAL (TE_REAL)
    IF is_domingo_or_special THEN
        IF calculated_cl_real > 0 THEN
            calculated_te_real := (contahub_per.total_couvert + sympla_data.sympla_checkins + yuzer_data.receita_ingressos) / calculated_cl_real;
        END IF;
    ELSE
        IF contahub_per.total_pessoas_pagantes > 0 THEN
            calculated_te_real := contahub_per.total_couvert / contahub_per.total_pessoas_pagantes;
        END IF;
    END IF;
    
    -- REGRA 4: TICKET BAR REAL (TB_REAL)
    IF is_domingo_or_special THEN
        IF calculated_cl_real > 0 THEN
            calculated_tb_real := (contahub_per.total_pagamentos + (yuzer_data.faturamento_liquido - yuzer_data.receita_ingressos)) / calculated_cl_real;
        END IF;
    ELSE
        IF contahub_per.total_pessoas_pagantes > 0 THEN
            calculated_tb_real := (contahub_per.total_pagamentos - calculated_te_real) / contahub_per.total_pessoas_pagantes;
        END IF;
    END IF;
    
    -- REGRA 5: TICKET MÉDIO TOTAL
    calculated_t_medio := calculated_te_real + calculated_tb_real;
    
    -- REGRA 6: LOTAÇÃO MÁXIMA
    IF COALESCE(evento_record.cl_plan, 0) > 0 THEN
        calculated_lot_max := evento_record.cl_plan / 1.3;
    END IF;
    
    -- REGRA 7: PERCENTUAIS (%B, %D, %C)
    IF is_domingo_or_special THEN
        calculated_percent_b := yuzer_data.percent_bebidas;
        calculated_percent_d := yuzer_data.percent_drinks;
        calculated_percent_c := yuzer_data.percent_comidas;
    ELSE
        calculated_percent_b := contahub_ana.percent_bebidas;
        calculated_percent_d := contahub_ana.percent_drinks;
        calculated_percent_c := contahub_ana.percent_comidas;
    END IF;
    
    -- REGRA 8: T.COZ E T.BAR (zerados para domingo)
    IF is_domingo_or_special THEN
        calculated_t_coz := 0;
        calculated_t_bar := 0;
    ELSE
        IF contahub_per.total_pessoas_pagantes > 0 THEN
            calculated_t_coz := contahub_ana.valor_comidas / contahub_per.total_pessoas_pagantes;
            calculated_t_bar := contahub_ana.valor_bebidas / contahub_per.total_pessoas_pagantes;
        END IF;
    END IF;
    
    -- REGRA 9: FAT.19H PERCENTUAL
    IF is_domingo_or_special THEN
        IF yuzer_fatporhora.fat_total > 0 THEN
            calculated_fat_19h_percent := (yuzer_fatporhora.fat_14_18h / yuzer_fatporhora.fat_total) * 100;
        END IF;
    ELSE
        IF calculated_real_r > 0 THEN
            calculated_fat_19h_percent := (contahub_fat.fat_ate_19h / calculated_real_r) * 100;
        END IF;
    END IF;
    
    -- REGRA 10: CUSTOS E %ART/FAT
    calculated_c_art := nibo_custos.custo_artistico;
    calculated_c_prod := nibo_custos.custo_producao;
    
    IF calculated_real_r > 0 THEN
        calculated_percent_art_fat := ((calculated_c_art + calculated_c_prod) / calculated_real_r) * 100;
    END IF;
    
    -- =================================================
    -- ATUALIZAR TABELA EVENTOS_BASE
    -- =================================================
    UPDATE eventos_base SET
        -- Dados calculados principais
        cl_real = calculated_cl_real,
        real_r = calculated_real_r,
        te_real = calculated_te_real,
        tb_real = calculated_tb_real,
        t_medio = calculated_t_medio,
        lot_max = calculated_lot_max,
        
        -- Percentuais
        percent_b = calculated_percent_b,
        percent_d = calculated_percent_d,
        percent_c = calculated_percent_c,
        
        -- Tempos e performance
        t_coz = calculated_t_coz,
        t_bar = calculated_t_bar,
        fat_19h_percent = calculated_fat_19h_percent,
        
        -- Custos
        c_art = calculated_c_art,
        c_prod = calculated_c_prod,
        percent_art_fat = calculated_percent_art_fat,
        
        -- Dados de integração
        sympla_liquido = sympla_data.sympla_liquido,
        sympla_checkins = sympla_data.sympla_checkins,
        yuzer_liquido = yuzer_data.faturamento_liquido,
        yuzer_ingressos = yuzer_data.receita_ingressos,
        
        -- Controle
        calculado_em = NOW(),
        precisa_recalculo = FALSE,
        versao_calculo = 1,
        atualizado_em = NOW()
    WHERE id = evento_id;
    
    RAISE NOTICE 'Evento % calculado: Real=% | Clientes=% | TE=% | TB=% | T.Médio=%', 
        evento_id, calculated_real_r, calculated_cl_real, calculated_te_real, calculated_tb_real, calculated_t_medio;
        
END;
$$;

-- =================================================
-- STEP 3: TRIGGERS ESPECÍFICOS POR TABELA
-- =================================================

-- Trigger para mudanças no próprio evento
CREATE OR REPLACE FUNCTION trigger_evento_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Marcar para recálculo
    NEW.precisa_recalculo := TRUE;
    NEW.atualizado_em := NOW();
    
    -- Recalcular lot_max imediatamente (não depende de dados externos)
    IF COALESCE(NEW.cl_plan, 0) > 0 THEN
        NEW.lot_max := NEW.cl_plan / 1.3;
    ELSE
        NEW.lot_max := 0;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para dados externos (ContaHub, Yuzer, etc)
CREATE OR REPLACE FUNCTION trigger_external_data_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    affected_date DATE;
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Determinar data afetada baseada na tabela
    CASE table_name
        WHEN 'contahub_pagamentos' THEN affected_date := COALESCE(NEW.dt_gerencial, OLD.dt_gerencial);
        WHEN 'contahub_periodo' THEN affected_date := COALESCE(NEW.dt_gerencial, OLD.dt_gerencial);
        WHEN 'contahub_analitico' THEN affected_date := COALESCE(NEW.trn_dtgerencial, OLD.trn_dtgerencial);
        WHEN 'contahub_fatporhora' THEN affected_date := COALESCE(NEW.vd_dtgerencial, OLD.vd_dtgerencial);
        WHEN 'yuzer_resumo2' THEN affected_date := COALESCE(NEW.data_evento, OLD.data_evento);
        WHEN 'yuzer_fatporhora' THEN affected_date := COALESCE(NEW.data_evento, OLD.data_evento);
        WHEN 'nibo_agendamentos' THEN affected_date := COALESCE(NEW.data_competencia, OLD.data_competencia);
        ELSE RETURN COALESCE(NEW, OLD);
    END CASE;
    
    -- Marcar eventos da data para recálculo
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE, atualizado_em = NOW()
    WHERE data_evento = affected_date;
    
    RAISE NOTICE 'Tabela % alterada para data %. Eventos marcados para recálculo', table_name, affected_date;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =================================================
-- STEP 4: APLICAR TRIGGERS NAS TABELAS
-- =================================================

-- Trigger no próprio eventos_base
DROP TRIGGER IF EXISTS trigger_eventos_base_changed ON eventos_base;
CREATE TRIGGER trigger_eventos_base_changed
    BEFORE INSERT OR UPDATE ON eventos_base
    FOR EACH ROW EXECUTE FUNCTION trigger_evento_changed();

-- Triggers nas tabelas externas
DROP TRIGGER IF EXISTS trigger_contahub_pagamentos_ext ON contahub_pagamentos;
CREATE TRIGGER trigger_contahub_pagamentos_ext
    AFTER INSERT OR UPDATE OR DELETE ON contahub_pagamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_contahub_periodo_ext ON contahub_periodo;
CREATE TRIGGER trigger_contahub_periodo_ext
    AFTER INSERT OR UPDATE OR DELETE ON contahub_periodo
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_contahub_analitico_ext ON contahub_analitico;
CREATE TRIGGER trigger_contahub_analitico_ext
    AFTER INSERT OR UPDATE OR DELETE ON contahub_analitico
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_contahub_fatporhora_ext ON contahub_fatporhora;
CREATE TRIGGER trigger_contahub_fatporhora_ext
    AFTER INSERT OR UPDATE OR DELETE ON contahub_fatporhora
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_yuzer_resumo2_ext ON yuzer_resumo2;
CREATE TRIGGER trigger_yuzer_resumo2_ext
    AFTER INSERT OR UPDATE OR DELETE ON yuzer_resumo2
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_yuzer_fatporhora_ext ON yuzer_fatporhora;
CREATE TRIGGER trigger_yuzer_fatporhora_ext
    AFTER INSERT OR UPDATE OR DELETE ON yuzer_fatporhora
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

DROP TRIGGER IF EXISTS trigger_nibo_agendamentos_ext ON nibo_agendamentos;
CREATE TRIGGER trigger_nibo_agendamentos_ext
    AFTER INSERT OR UPDATE OR DELETE ON nibo_agendamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_external_data_changed();

-- =================================================
-- STEP 5: FUNÇÕES AUXILIARES
-- =================================================

-- Função para recalcular eventos pendentes
CREATE OR REPLACE FUNCTION recalcular_eventos_pendentes(limite INTEGER DEFAULT 50)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    evento_id INTEGER;
    total_recalculados INTEGER := 0;
BEGIN
    FOR evento_id IN 
        SELECT id FROM eventos_base 
        WHERE precisa_recalculo = TRUE 
        ORDER BY data_evento DESC
        LIMIT limite
    LOOP
        PERFORM calculate_evento_metrics(evento_id);
        total_recalculados := total_recalculados + 1;
    END LOOP;
    
    RAISE NOTICE 'Recalculados % eventos pendentes', total_recalculados;
    RETURN total_recalculados;
END;
$$;

-- Função para recalcular período específico
CREATE OR REPLACE FUNCTION recalcular_eventos_periodo(data_inicio DATE, data_fim DATE DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    evento_id INTEGER;
    total_recalculados INTEGER := 0;
BEGIN
    IF data_fim IS NULL THEN data_fim := data_inicio; END IF;
    
    -- Marcar eventos do período
    UPDATE eventos_base 
    SET precisa_recalculo = TRUE, atualizado_em = NOW()
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
    
    RAISE NOTICE 'Recalculados % eventos do período % a %', total_recalculados, data_inicio, data_fim;
    RETURN total_recalculados;
END;
$$;

-- =================================================
-- STEP 6: ÍNDICES PARA PERFORMANCE
-- =================================================

CREATE INDEX IF NOT EXISTS idx_eventos_base_data_evento ON eventos_base(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_base_bar_id ON eventos_base(bar_id);
CREATE INDEX IF NOT EXISTS idx_eventos_base_precisa_recalculo ON eventos_base(precisa_recalculo) WHERE precisa_recalculo = TRUE;
CREATE INDEX IF NOT EXISTS idx_eventos_base_calculado_em ON eventos_base(calculado_em);

-- =================================================
-- COMENTÁRIOS FINAIS
-- =================================================

COMMENT ON FUNCTION calculate_evento_metrics(INTEGER) IS 'Função principal que replica TODAS as regras da view_eventos_complete.sql';
COMMENT ON FUNCTION trigger_evento_changed() IS 'Trigger para mudanças diretas no evento (recálculo imediato do lot_max)';
COMMENT ON FUNCTION trigger_external_data_changed() IS 'Trigger universal para mudanças em dados externos (marca para recálculo)';
COMMENT ON FUNCTION recalcular_eventos_pendentes(INTEGER) IS 'Recalcula eventos marcados como pendentes (em lotes)';
COMMENT ON FUNCTION recalcular_eventos_periodo(DATE, DATE) IS 'Força recálculo de eventos em período específico';

-- =================================================
-- IMPLEMENTAÇÃO COMPLETA!
-- =================================================
-- ✅ 1 tabela eventos_base com todas as colunas
-- ✅ 1 função principal com todas as 10 regras
-- ✅ Triggers específicos por tabela (performance)
-- ✅ Funções auxiliares para manutenção
-- ✅ Índices para performance
-- ✅ Zero dependência de views complexas
-- =================================================
