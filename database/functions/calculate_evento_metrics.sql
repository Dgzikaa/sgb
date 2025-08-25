-- FUNÇÃO DE CÁLCULO COMPLETO DE MÉTRICAS DE EVENTOS
-- =====================================================
-- Replica TODAS as regras da view_eventos_complete.sql
-- Para ser usada em triggers de atualização automática
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_evento_metrics(evento_id INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    evento_record RECORD;
    is_domingo_or_special BOOLEAN;
    
    -- Dados agregados
    yuzer_data RECORD;
    contahub_pag RECORD;
    contahub_per RECORD;
    contahub_fat RECORD;
    contahub_ana RECORD;
    nibo_custos RECORD;
    sympla_data RECORD;
    yuzer_fatporhora RECORD;
    
    -- Valores calculados
    calculated_cl_real INTEGER;
    calculated_real_r NUMERIC;
    calculated_te_real NUMERIC;
    calculated_tb_real NUMERIC;
    calculated_t_medio NUMERIC;
    calculated_lot_max NUMERIC;
    calculated_percent_b NUMERIC;
    calculated_percent_d NUMERIC;
    calculated_percent_c NUMERIC;
    calculated_t_coz NUMERIC;
    calculated_t_bar NUMERIC;
    calculated_fat_19h_percent NUMERIC;
    calculated_percent_art_fat NUMERIC;
    calculated_c_art NUMERIC;
    calculated_c_prod NUMERIC;
BEGIN
    -- Buscar dados do evento
    SELECT * INTO evento_record 
    FROM eventos_base 
    WHERE id = evento_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Evento % não encontrado', evento_id;
        RETURN;
    END IF;
    
    -- REGRAS ESPECIAIS DO DOMINGO REMOVIDAS - TODOS OS EVENTOS USAM AS MESMAS REGRAS
    is_domingo_or_special := FALSE;
    
    RAISE NOTICE 'Calculando métricas para evento % - Data: %', 
        evento_id, evento_record.data_evento;
    
    -- =================================================
    -- 1. BUSCAR DADOS YUZER
    -- =================================================
    SELECT 
        faturamento_liquido,
        receita_ingressos,
        quantidade_ingressos,
        percent_bebidas,
        percent_drinks,
        percent_comidas,
        valor_bebidas,
        valor_comidas
    INTO yuzer_data
    FROM yuzer_resumo2 
    WHERE data_evento = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- 2. BUSCAR DADOS CONTAHUB PAGAMENTOS
    -- =================================================
    SELECT SUM(liquido) as total_liquido
    INTO contahub_pag
    FROM contahub_pagamentos
    WHERE dt_gerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- 3. BUSCAR DADOS CONTAHUB PERÍODO
    -- =================================================
    SELECT 
        SUM(pessoas) as total_pessoas,
        SUM(CASE WHEN vr_pagamentos > 0 THEN pessoas ELSE 0 END) as total_pessoas_pagantes,
        SUM(vr_couvert) as total_couvert,
        SUM(vr_pagamentos) as total_pagamentos
    INTO contahub_per
    FROM contahub_periodo
    WHERE dt_gerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- 4. BUSCAR DADOS CONTAHUB FATURAMENTO POR HORA
    -- =================================================
    SELECT 
        SUM(CASE WHEN hora < 19 THEN valor ELSE 0 END) as fat_ate_19h,
        SUM(valor) as fat_total
    INTO contahub_fat
    FROM contahub_fatporhora
    WHERE vd_dtgerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- 5. BUSCAR DADOS CONTAHUB ANALÍTICO
    -- =================================================
    SELECT 
        SUM(valorfinal) as total_valorfinal,
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
        -- Valores por categoria
        SUM(CASE WHEN loc_desc IN ('Chopp','Baldes','Pegue e Pague','PP','Venda Volante','Bar') THEN valorfinal ELSE 0 END) as valor_bebidas,
        SUM(CASE WHEN loc_desc IN ('Cozinha','Cozinha 1','Cozinha 2') THEN valorfinal ELSE 0 END) as valor_comidas
    INTO contahub_ana
    FROM contahub_analitico
    WHERE trn_dtgerencial = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- 6. BUSCAR DADOS NIBO CUSTOS
    -- =================================================
    SELECT 
        SUM(CASE WHEN categoria_nome = 'Atrações Programação' THEN valor ELSE 0 END) as custo_artistico,
        SUM(CASE WHEN categoria_nome = 'Produção Eventos' THEN valor ELSE 0 END) as custo_producao
    INTO nibo_custos
    FROM nibo_agendamentos
    WHERE data_competencia = evento_record.data_evento;
    
    -- =================================================
    -- 7. BUSCAR DADOS SYMPLA
    -- =================================================
    SELECT 
        SUM(sp_ped.valor_liquido) AS sympla_liquido,
        COUNT(DISTINCT sp_ped.pedido_sympla_id) AS sympla_total_pedidos,
        COUNT(DISTINCT sp_part.participante_sympla_id) AS sympla_participantes,
        SUM(CASE WHEN sp_part.fez_checkin = true THEN 1 ELSE 0 END) AS sympla_checkins
    INTO sympla_data
    FROM sympla_pedidos sp_ped
    LEFT JOIN sympla_participantes sp_part ON sp_ped.evento_sympla_id = sp_part.evento_sympla_id
    WHERE CAST(SUBSTRING(sp_ped.evento_sympla_id FROM '[0-9]+') AS INTEGER) = 
          CAST(SUBSTRING(evento_record.nome FROM '[0-9]+') AS INTEGER);
    
    -- =================================================
    -- 8. BUSCAR YUZER FATURAMENTO POR HORA (DOMINGOS)
    -- =================================================
    SELECT 
        SUM(CASE 
            WHEN SUBSTRING(hora_formatada FROM '\d{2}:\d{2}') BETWEEN '14:00' AND '18:00' 
            THEN faturamento 
            ELSE 0 
        END) as fat_14_18h,
        SUM(faturamento) as fat_total
    INTO yuzer_fatporhora
    FROM yuzer_fatporhora
    WHERE data_evento = evento_record.data_evento 
    AND bar_id = evento_record.bar_id;
    
    -- =================================================
    -- APLICAR REGRAS DE CÁLCULO
    -- =================================================
    
    -- REGRA 1: CLIENTES REAIS
    IF is_domingo_or_special THEN
        calculated_cl_real := COALESCE(yuzer_data.quantidade_ingressos, 0) + 
                             COALESCE(sympla_data.sympla_checkins, 0) + 
                             COALESCE(contahub_per.total_pessoas, 0);
    ELSE
        calculated_cl_real := COALESCE(contahub_per.total_pessoas_pagantes, 0);
    END IF;
    
    -- REGRA 2: REAL RECEITA
    IF is_domingo_or_special THEN
        calculated_real_r := COALESCE(contahub_pag.total_liquido, 0) + 
                            COALESCE(yuzer_data.faturamento_liquido, 0);
    ELSE
        calculated_real_r := COALESCE(contahub_pag.total_liquido, 0);
    END IF;
    
    -- REGRA 3: TICKET MÉDIO REAL (TE_REAL)
    IF is_domingo_or_special THEN
        IF calculated_cl_real > 0 THEN
            calculated_te_real := (COALESCE(contahub_per.total_couvert, 0) + 
                                 COALESCE(sympla_data.sympla_checkins, 0) + 
                                 COALESCE(yuzer_data.receita_ingressos, 0)) / calculated_cl_real;
        ELSE
            calculated_te_real := 0;
        END IF;
    ELSE
        IF COALESCE(contahub_per.total_pessoas_pagantes, 0) > 0 THEN
            calculated_te_real := COALESCE(contahub_per.total_couvert, 0) / contahub_per.total_pessoas_pagantes;
        ELSE
            calculated_te_real := 0;
        END IF;
    END IF;
    
    -- REGRA 4: TICKET BAR REAL (TB_REAL)
    IF is_domingo_or_special THEN
        IF calculated_cl_real > 0 THEN
            calculated_tb_real := (COALESCE(contahub_per.total_pagamentos, 0) + 
                                 (COALESCE(yuzer_data.faturamento_liquido, 0) - COALESCE(yuzer_data.receita_ingressos, 0))) / calculated_cl_real;
        ELSE
            calculated_tb_real := 0;
        END IF;
    ELSE
        IF COALESCE(contahub_per.total_pessoas_pagantes, 0) > 0 THEN
            -- CORREÇÃO: tb_real deve ser (total_pagamentos - couvert) / pessoas
            -- total_pagamentos já inclui couvert, então subtraímos o couvert total, não o te_real
            calculated_tb_real := (COALESCE(contahub_per.total_pagamentos, 0) - COALESCE(contahub_per.total_couvert, 0)) / contahub_per.total_pessoas_pagantes;
        ELSE
            calculated_tb_real := 0;
        END IF;
    END IF;
    
    -- REGRA 5: TICKET MÉDIO TOTAL
    calculated_t_medio := calculated_te_real + calculated_tb_real;
    
    -- REGRA 6: LOTAÇÃO MÁXIMA
    IF COALESCE(evento_record.cl_plan, 0) > 0 THEN
        calculated_lot_max := evento_record.cl_plan / 1.3;
    ELSE
        calculated_lot_max := 0;
    END IF;
    
    -- REGRA 7: PERCENTUAIS (%B, %D, %C)
    IF is_domingo_or_special THEN
        calculated_percent_b := COALESCE(yuzer_data.percent_bebidas, 0);
        calculated_percent_d := COALESCE(yuzer_data.percent_drinks, 0);
        calculated_percent_c := COALESCE(yuzer_data.percent_comidas, 0);
    ELSE
        calculated_percent_b := COALESCE(contahub_ana.percent_bebidas, 0);
        calculated_percent_d := COALESCE(contahub_ana.percent_drinks, 0);
        calculated_percent_c := COALESCE(contahub_ana.percent_comidas, 0);
    END IF;
    
    -- REGRA 8: T.COZ E T.BAR
    IF is_domingo_or_special THEN
        calculated_t_coz := 0;
        calculated_t_bar := 0;
    ELSE
        IF COALESCE(contahub_per.total_pessoas_pagantes, 0) > 0 THEN
            calculated_t_coz := COALESCE(contahub_ana.valor_comidas, 0) / contahub_per.total_pessoas_pagantes;
            calculated_t_bar := COALESCE(contahub_ana.valor_bebidas, 0) / contahub_per.total_pessoas_pagantes;
        ELSE
            calculated_t_coz := 0;
            calculated_t_bar := 0;
        END IF;
    END IF;
    
    -- REGRA 9: FAT.19H PERCENTUAL
    IF is_domingo_or_special THEN
        IF COALESCE(yuzer_fatporhora.fat_total, 0) > 0 THEN
            calculated_fat_19h_percent := (COALESCE(yuzer_fatporhora.fat_14_18h, 0) / yuzer_fatporhora.fat_total) * 100;
        ELSE
            calculated_fat_19h_percent := 0;
        END IF;
    ELSE
        IF calculated_real_r > 0 THEN
            calculated_fat_19h_percent := (COALESCE(contahub_fat.fat_ate_19h, 0) / calculated_real_r) * 100;
        ELSE
            calculated_fat_19h_percent := 0;
        END IF;
    END IF;
    
    -- REGRA 10: CUSTOS E %ART/FAT
    calculated_c_art := COALESCE(nibo_custos.custo_artistico, 0);
    calculated_c_prod := COALESCE(nibo_custos.custo_producao, 0);
    
    IF calculated_real_r > 0 THEN
        calculated_percent_art_fat := ((calculated_c_art + calculated_c_prod) / calculated_real_r) * 100;
    ELSE
        calculated_percent_art_fat := 0;
    END IF;
    
    -- =================================================
    -- ATUALIZAR TABELA EVENTOS_BASE
    -- =================================================
    UPDATE eventos_base SET
        -- Dados calculados
        cl_real = calculated_cl_real,
        real_r = calculated_real_r,
        te_real = calculated_te_real,
        tb_real = calculated_tb_real,
        t_medio = calculated_t_medio,
        lot_max = calculated_lot_max,
        percent_b = calculated_percent_b,
        percent_d = calculated_percent_d,
        percent_c = calculated_percent_c,
        t_coz = calculated_t_coz,
        t_bar = calculated_t_bar,
        fat_19h_percent = calculated_fat_19h_percent,
        c_art = calculated_c_art,
        c_prod = calculated_c_prod,
        percent_art_fat = calculated_percent_art_fat,
        
        -- Dados de integração
        sympla_liquido = COALESCE(sympla_data.sympla_liquido, 0),
        sympla_checkins = COALESCE(sympla_data.sympla_checkins, 0),
        yuzer_liquido = COALESCE(yuzer_data.faturamento_liquido, 0),
        yuzer_ingressos = COALESCE(yuzer_data.receita_ingressos, 0),
        
        -- Controle
        calculado_em = NOW(),
        precisa_recalculo = FALSE,
        atualizado_em = NOW()
    WHERE id = evento_id;
    
    RAISE NOTICE 'Métricas calculadas para evento %: Real=% | Clientes=% | TE=% | TB=% | T.Médio=%', 
        evento_id, calculated_real_r, calculated_cl_real, calculated_te_real, calculated_tb_real, calculated_t_medio;
        
END;
$$;
