-- RECRIAR FUNÇÃO update_eventos_after_contahub_processing() CORRIGIDA
-- Execute este SQL no Supabase SQL Editor:

-- 1. Deletar função antiga
DROP FUNCTION IF EXISTS update_eventos_after_contahub_processing(date, integer);

-- 2. Criar função nova com lógica correta
CREATE OR REPLACE FUNCTION update_eventos_after_contahub_processing(p_data_evento date, p_bar_id integer)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_receita_contahub numeric := 0;
    v_cl_real_contahub integer := 0;
    v_total_couvert numeric := 0;
    v_te_real_calculado numeric := 0;
    v_tb_real_calculado numeric := 0;
    v_dia_semana integer;
    v_is_domingo boolean := false;
BEGIN
    -- Verificar se é domingo (usar Yuzer/Sympla) ou dia normal (usar ContaHub)
    SELECT EXTRACT(DOW FROM p_data_evento) INTO v_dia_semana;
    v_is_domingo := (v_dia_semana = 0);
    
    IF v_is_domingo THEN
        RETURN 'Domingo detectado - dados devem vir da Yuzer/Sympla, não do ContaHub';
    END IF;
    
    -- DIAS NORMAIS: Processar dados ContaHub com lógica correta
    
    -- Receita total (contahub_pagamentos - VR_LIQUIDO)
    SELECT COALESCE(SUM(vr_liquido), 0) 
    INTO v_receita_contahub
    FROM contahub_pagamentos 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- Total couvert (contahub_periodo)
    SELECT COALESCE(SUM(vr_couvert), 0)
    INTO v_total_couvert
    FROM contahub_periodo 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- Clientes reais (contahub_periodo)
    SELECT COALESCE(SUM(cl_real), 0)
    INTO v_cl_real_contahub
    FROM contahub_periodo 
    WHERE bar_id = p_bar_id AND DATE(data_evento) = p_data_evento;
    
    -- Calcular tickets corretos
    IF v_cl_real_contahub > 0 THEN
        -- TE.Real = Ticket de Entrada (couvert médio por cliente)
        v_te_real_calculado := ROUND(v_total_couvert / v_cl_real_contahub, 2);
        
        -- TB.Real = Ticket de Bar (receita - couvert) / clientes  
        v_tb_real_calculado := ROUND((v_receita_contahub - v_total_couvert) / v_cl_real_contahub, 2);
    END IF;
    
    -- Atualizar tabela eventos - AUTOMATICAMENTE
    UPDATE eventos
    SET
        receita_contahub = v_receita_contahub,
        cl_real_contahub = v_cl_real_contahub,
        te_real_contahub = v_te_real_calculado,
        tb_real_contahub = v_tb_real_calculado,
        
        -- ✅ ATUALIZAR COLUNAS PRINCIPAIS AUTOMATICAMENTE
        real_r = v_receita_contahub,
        cl_real = v_cl_real_contahub,
        te_real = v_te_real_calculado,  -- Ticket Entrada automático
        tb_real = v_tb_real_calculado,  -- Ticket Bar automático
        
        ultima_sync_contahub = NOW()
    WHERE data_evento = p_data_evento AND bar_id = p_bar_id;
    
    RETURN FORMAT(
        'Evento atualizado AUTOMATICAMENTE - Data: %s, Bar: %s | Receita: R$ %.2f | Clientes: %s | TE.Real: R$ %.2f | TB.Real: R$ %.2f',
        p_data_evento, p_bar_id, v_receita_contahub, v_cl_real_contahub, 
        v_te_real_calculado, v_tb_real_calculado
    );
END;
$$;

-- 3. Testar função corrigida para 06/08
SELECT update_eventos_after_contahub_processing('2025-08-06', 3);
