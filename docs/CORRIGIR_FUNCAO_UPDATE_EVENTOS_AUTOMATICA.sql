-- CORRIGIR FUNÇÃO update_eventos_after_contahub_processing() PARA SER AUTOMÁTICA
-- Execute este SQL no Supabase SQL Editor:

CREATE OR REPLACE FUNCTION update_eventos_after_contahub_processing(p_data_evento date, p_bar_id integer)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_receita_contahub numeric := 0;
    v_cl_real_contahub integer := 0;
    v_t_coz_contahub numeric := 0;  -- Tempo cozinha em minutos
    v_t_bar_contahub numeric := 0;  -- Tempo bar em minutos
    v_fat_19h_percent_contahub numeric := 0;
    v_percent_bebidas_contahub numeric := 0;
    v_percent_drinks_contahub numeric := 0;
    v_percent_comidas_contahub numeric := 0;
    v_total_couvert numeric := 0;  -- Total do couvert (TE)
    v_te_real_calculado numeric := 0;  -- Ticket Entrada (couvert médio)
    v_tb_real_calculado numeric := 0;  -- Ticket Bar (receita - couvert) / clientes
    v_dia_semana integer;
    v_is_domingo boolean := false;
BEGIN
    -- Verificar se é domingo (usar Yuzer/Sympla) ou dia normal (usar ContaHub)
    SELECT EXTRACT(DOW FROM p_data_evento) INTO v_dia_semana;
    v_is_domingo := (v_dia_semana = 0);
    
    IF v_is_domingo THEN
        -- DOMINGO: Usar dados Yuzer/Sympla (não processar ContaHub)
        RETURN 'Domingo detectado - dados devem vir da Yuzer/Sympla, não do ContaHub';
    END IF;
    
    -- DIAS NORMAIS: Processar dados ContaHub
    
    -- 1. RECEITA TOTAL (contahub_pagamentos - usando VR_LIQUIDO!)
    SELECT COALESCE(SUM(vr_liquido), 0) 
    INTO v_receita_contahub
    FROM contahub_pagamentos 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- 2. TOTAL COUVERT (contahub_periodo)
    SELECT COALESCE(SUM(vr_couvert), 0)
    INTO v_total_couvert
    FROM contahub_periodo 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- 3. CLIENTES REAIS (contahub_periodo)
    SELECT COALESCE(SUM(cl_real), 0)
    INTO v_cl_real_contahub
    FROM contahub_periodo 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- 4. TEMPOS MÉDIOS (contahub_tempo) - EM MINUTOS
    SELECT 
        COALESCE(AVG(CASE WHEN grp_desc IN ('Pratos Individuais', 'Pratos Para Compartilhar - P/ 4 Pessoas', 'Sanduíches', 'Sobremesas') 
                         THEN t0_t2 END), 0),
        COALESCE(AVG(CASE WHEN grp_desc IN ('Cervejas', 'Bebidas Não Alcoólicas', 'Happy Hour', 'Drinks Classicos', 'Baldes', 'Drinks Autorais', 'Doses', 'Drinks sem Álcool', 'Bebidas Prontas', 'Vinhos', 'Combos', 'Garrafas') 
                         THEN t0_t2 END), 0)
    INTO v_t_coz_contahub, v_t_bar_contahub
    FROM contahub_tempo 
    WHERE bar_id = p_bar_id AND DATE(t0_lancamento) = p_data_evento;
    
    -- 5. PERCENTUAL FATURAMENTO 19H (contahub_fatporhora)
    WITH receita_19h AS (
        SELECT COALESCE(SUM(vr_liquido), 0) as receita_ate_19h
        FROM contahub_fatporhora 
        WHERE bar_id = p_bar_id 
        AND DATE(data_evento) = p_data_evento 
        AND hora_num <= 19
    )
    SELECT CASE 
        WHEN v_receita_contahub > 0 THEN (receita_ate_19h / v_receita_contahub) * 100
        ELSE 0 
    END INTO v_fat_19h_percent_contahub
    FROM receita_19h;
    
    -- 6. PERCENTUAIS POR CATEGORIA (contahub_analitico)
    WITH categorias AS (
        SELECT 
            SUM(CASE WHEN grp_desc IN ('Cervejas', 'Bebidas Não Alcoólicas') THEN valorfinal ELSE 0 END) as receita_bebidas,
            SUM(CASE WHEN grp_desc IN ('Drinks Classicos', 'Drinks Autorais', 'Happy Hour', 'Doses', 'Drinks sem Álcool') THEN valorfinal ELSE 0 END) as receita_drinks,
            SUM(CASE WHEN grp_desc IN ('Pratos Individuais', 'Pratos Para Compartilhar - P/ 4 Pessoas', 'Sanduíches', 'Sobremesas') THEN valorfinal ELSE 0 END) as receita_comidas
        FROM contahub_analitico 
        WHERE bar_id = p_bar_id AND DATE(trn_dtgerencial) = p_data_evento
    )
    SELECT 
        CASE WHEN v_receita_contahub > 0 THEN (receita_bebidas / v_receita_contahub) * 100 ELSE 0 END,
        CASE WHEN v_receita_contahub > 0 THEN (receita_drinks / v_receita_contahub) * 100 ELSE 0 END,
        CASE WHEN v_receita_contahub > 0 THEN (receita_comidas / v_receita_contahub) * 100 ELSE 0 END
    INTO v_percent_bebidas_contahub, v_percent_drinks_contahub, v_percent_comidas_contahub
    FROM categorias;
    
    -- 7. CALCULAR TICKETS CORRETOS - LÓGICA CORRETA!
    IF v_cl_real_contahub > 0 THEN
        -- TE.Real = Ticket de Entrada (couvert médio por cliente)
        v_te_real_calculado := ROUND(v_total_couvert / v_cl_real_contahub, 2);
        
        -- TB.Real = Ticket de Bar (receita - couvert) / clientes  
        v_tb_real_calculado := ROUND((v_receita_contahub - v_total_couvert) / v_cl_real_contahub, 2);
    END IF;
    
    -- 8. ATUALIZAR TABELA EVENTOS - TODAS AS COLUNAS!
    UPDATE eventos
    SET
        -- Dados específicos ContaHub
        receita_contahub = v_receita_contahub,
        cl_real_contahub = v_cl_real_contahub,
        te_real_contahub = v_te_real_calculado,  -- Couvert médio
        tb_real_contahub = v_tb_real_calculado,  -- Receita bar médio
        fat_19h_percent_contahub = v_fat_19h_percent_contahub,
        percent_bebidas_contahub = v_percent_bebidas_contahub,
        percent_drinks_contahub = v_percent_drinks_contahub,
        percent_comidas_contahub = v_percent_comidas_contahub,
        
        -- Tempos em minutos
        t_coz = v_t_coz_contahub,
        t_bar = v_t_bar_contahub,
        
        -- ✅ ATUALIZAR COLUNAS PRINCIPAIS AUTOMATICAMENTE
        real_r = v_receita_contahub,
        cl_real = v_cl_real_contahub,
        te_real = v_te_real_calculado,  -- ✅ AUTOMÁTICO: Ticket Entrada
        tb_real = v_tb_real_calculado,  -- ✅ AUTOMÁTICO: Ticket Bar
        
        ultima_sync_contahub = NOW()
    WHERE data_evento = p_data_evento AND bar_id = p_bar_id;
    
    RETURN FORMAT(
        'Evento atualizado AUTOMATICAMENTE - Data: %s, Bar: %s | Receita: R$ %.2f | Clientes: %s | TE.Real: R$ %.2f | TB.Real: R$ %.2f | T.Coz: %.1f min | T.Bar: %.1f min',
        p_data_evento, p_bar_id, v_receita_contahub, v_cl_real_contahub, 
        v_te_real_calculado, v_tb_real_calculado, v_t_coz_contahub, v_t_bar_contahub
    );
END;
$$;

-- Executar a função corrigida para 06/08 para testar
SELECT update_eventos_after_contahub_processing('2025-08-06', 3);
