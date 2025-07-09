-- ========================================
-- 📊 SISTEMA DE COMPETÊNCIA MENSAL
-- Agregação automática dos dados semanais
-- ========================================

-- Tabela principal de competência mensal
CREATE TABLE IF NOT EXISTS competencia_mensal (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Identificação da competência
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL, -- 1-12
    nome_mes VARCHAR(20) NOT NULL, -- 'Janeiro', 'Fevereiro', etc.
    
    -- Faturamento Mensal
    faturamento_total_mes DECIMAL(12,2) DEFAULT 0,
    faturamento_entrada_mes DECIMAL(12,2) DEFAULT 0,
    faturamento_bar_mes DECIMAL(12,2) DEFAULT 0,
    
    -- Clientes e Reservas Mensais
    clientes_total_mes INTEGER DEFAULT 0,
    reservas_totais_mes INTEGER DEFAULT 0,
    reservas_presentes_mes INTEGER DEFAULT 0,
    
    -- Métricas Calculadas Mensais
    ticket_medio_mes DECIMAL(8,2) DEFAULT 0,
    cmv_teorico_mes DECIMAL(5,2) DEFAULT 0, -- %
    cmv_limpo_mes DECIMAL(5,2) DEFAULT 0,   -- %
    
    -- Metas Mensais
    meta_faturamento_mes DECIMAL(12,2) DEFAULT 0,
    meta_clientes_mes INTEGER DEFAULT 0,
    meta_ticket_medio_mes DECIMAL(8,2) DEFAULT 0,
    
    -- Performance Mensal
    atingimento_faturamento DECIMAL(5,2) DEFAULT 0, -- %
    atingimento_clientes DECIMAL(5,2) DEFAULT 0,    -- %
    atingimento_ticket DECIMAL(5,2) DEFAULT 0,      -- %
    
    -- Estatísticas do Mês
    total_semanas INTEGER DEFAULT 0,
    melhor_semana INTEGER, -- numero_semana com maior faturamento
    pior_semana INTEGER,   -- numero_semana com menor faturamento
    variacao_semanal DECIMAL(5,2) DEFAULT 0, -- % de variação entre melhor e pior
    
    -- Comparação com Mês Anterior
    crescimento_faturamento DECIMAL(5,2) DEFAULT 0, -- % vs mês anterior
    crescimento_clientes DECIMAL(5,2) DEFAULT 0,    -- % vs mês anterior
    crescimento_ticket DECIMAL(5,2) DEFAULT 0,      -- % vs mês anterior
    
    -- Observações e Status
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'fechado', 'projecao'
    observacoes TEXT,
    
    -- Controle
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única por bar/ano/mes
    UNIQUE(bar_id, ano, mes)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_competencia_bar_ano_mes ON competencia_mensal(bar_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_competencia_status ON competencia_mensal(status);
CREATE INDEX IF NOT EXISTS idx_competencia_ano_mes ON competencia_mensal(ano, mes);

-- ========================================
-- 🔄 FUNÇÃO PARA CALCULAR COMPETÊNCIA
-- ========================================
CREATE OR REPLACE FUNCTION calcular_competencia_mensal(
    p_bar_id INTEGER,
    p_ano INTEGER,
    p_mes INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_nome_mes VARCHAR(20);
    v_faturamento_total DECIMAL(12,2) := 0;
    v_faturamento_entrada DECIMAL(12,2) := 0;
    v_faturamento_bar DECIMAL(12,2) := 0;
    v_clientes_total INTEGER := 0;
    v_reservas_totais INTEGER := 0;
    v_reservas_presentes INTEGER := 0;
    v_total_semanas INTEGER := 0;
    v_melhor_semana INTEGER;
    v_pior_semana INTEGER;
    v_variacao DECIMAL(5,2) := 0;
    v_max_faturamento DECIMAL(12,2) := 0;
    v_min_faturamento DECIMAL(12,2) := 999999999;
    v_ticket_medio DECIMAL(8,2) := 0;
    v_cmv_medio DECIMAL(5,2) := 0;
BEGIN
    -- Definir nome do mês
    v_nome_mes := CASE p_mes
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro'
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
    END;
    
    -- Agregar dados das semanas do mês
    SELECT 
        COALESCE(SUM(faturamento_total), 0),
        COALESCE(SUM(faturamento_entrada), 0),
        COALESCE(SUM(faturamento_bar), 0),
        COALESCE(SUM(clientes_atendidos), 0),
        COALESCE(SUM(reservas_totais), 0),
        COALESCE(SUM(reservas_presentes), 0),
        COUNT(*),
        COALESCE(AVG(CASE WHEN clientes_atendidos > 0 THEN faturamento_total / clientes_atendidos ELSE 0 END), 0),
        COALESCE(AVG(cmv_limpo), 0)
    INTO 
        v_faturamento_total,
        v_faturamento_entrada,
        v_faturamento_bar,
        v_clientes_total,
        v_reservas_totais,
        v_reservas_presentes,
        v_total_semanas,
        v_ticket_medio,
        v_cmv_medio
    FROM desempenho_semanal
    WHERE bar_id = p_bar_id
    AND ano = p_ano
    AND EXTRACT(MONTH FROM data_inicio) = p_mes;
    
    -- Encontrar melhor e pior semana
    SELECT numero_semana, faturamento_total
    INTO v_melhor_semana, v_max_faturamento
    FROM desempenho_semanal
    WHERE bar_id = p_bar_id
    AND ano = p_ano
    AND EXTRACT(MONTH FROM data_inicio) = p_mes
    ORDER BY faturamento_total DESC
    LIMIT 1;
    
    SELECT numero_semana, faturamento_total
    INTO v_pior_semana, v_min_faturamento
    FROM desempenho_semanal
    WHERE bar_id = p_bar_id
    AND ano = p_ano
    AND EXTRACT(MONTH FROM data_inicio) = p_mes
    ORDER BY faturamento_total ASC
    LIMIT 1;
    
    -- Calcular variação
    IF v_min_faturamento > 0 THEN
        v_variacao := ((v_max_faturamento - v_min_faturamento) / v_min_faturamento) * 100;
    END IF;
    
    -- Inserir ou atualizar competência
    INSERT INTO competencia_mensal (
        bar_id, ano, mes, nome_mes,
        faturamento_total_mes, faturamento_entrada_mes, faturamento_bar_mes,
        clientes_total_mes, reservas_totais_mes, reservas_presentes_mes,
        ticket_medio_mes, cmv_limpo_mes,
        total_semanas, melhor_semana, pior_semana, variacao_semanal,
        meta_faturamento_mes, meta_clientes_mes, meta_ticket_medio_mes,
        ultima_atualizacao
    ) VALUES (
        p_bar_id, p_ano, p_mes, v_nome_mes,
        v_faturamento_total, v_faturamento_entrada, v_faturamento_bar,
        v_clientes_total, v_reservas_totais, v_reservas_presentes,
        v_ticket_medio, v_cmv_medio,
        v_total_semanas, v_melhor_semana, v_pior_semana, v_variacao,
        -- Metas baseadas em 4-5 semanas por mês
        200000 * GREATEST(v_total_semanas, 4), -- Meta faturamento
        500 * GREATEST(v_total_semanas, 4),    -- Meta clientes  
        45,  -- Meta ticket médio
        NOW()
    )
    ON CONFLICT (bar_id, ano, mes)
    DO UPDATE SET
        faturamento_total_mes = EXCLUDED.faturamento_total_mes,
        faturamento_entrada_mes = EXCLUDED.faturamento_entrada_mes,
        faturamento_bar_mes = EXCLUDED.faturamento_bar_mes,
        clientes_total_mes = EXCLUDED.clientes_total_mes,
        reservas_totais_mes = EXCLUDED.reservas_totais_mes,
        reservas_presentes_mes = EXCLUDED.reservas_presentes_mes,
        ticket_medio_mes = EXCLUDED.ticket_medio_mes,
        cmv_limpo_mes = EXCLUDED.cmv_limpo_mes,
        total_semanas = EXCLUDED.total_semanas,
        melhor_semana = EXCLUDED.melhor_semana,
        pior_semana = EXCLUDED.pior_semana,
        variacao_semanal = EXCLUDED.variacao_semanal,
        meta_faturamento_mes = EXCLUDED.meta_faturamento_mes,
        meta_clientes_mes = EXCLUDED.meta_clientes_mes,
        meta_ticket_medio_mes = EXCLUDED.meta_ticket_medio_mes,
        ultima_atualizacao = NOW();
        
    -- Calcular atingimentos
    UPDATE competencia_mensal 
    SET 
        atingimento_faturamento = CASE 
            WHEN meta_faturamento_mes > 0 THEN (faturamento_total_mes / meta_faturamento_mes) * 100
            ELSE 0 
        END,
        atingimento_clientes = CASE 
            WHEN meta_clientes_mes > 0 THEN (clientes_total_mes::DECIMAL / meta_clientes_mes) * 100
            ELSE 0 
        END,
        atingimento_ticket = CASE 
            WHEN meta_ticket_medio_mes > 0 THEN (ticket_medio_mes / meta_ticket_medio_mes) * 100
            ELSE 0 
        END
    WHERE bar_id = p_bar_id AND ano = p_ano AND mes = p_mes;
    
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔄 TRIGGER AUTOMÁTICO
-- ========================================
CREATE OR REPLACE FUNCTION trigger_atualizar_competencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular competência do mês quando semana for inserida/atualizada
    PERFORM calcular_competencia_mensal(
        NEW.bar_id,
        NEW.ano,
        EXTRACT(MONTH FROM NEW.data_inicio)::INTEGER
    );
    
    -- Se for UPDATE e mudou de mês, recalcular o mês anterior também
    IF TG_OP = 'UPDATE' AND OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN
        PERFORM calcular_competencia_mensal(
            OLD.bar_id,
            OLD.ano,
            EXTRACT(MONTH FROM OLD.data_inicio)::INTEGER
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_competencia_update ON desempenho_semanal;
CREATE TRIGGER trigger_competencia_update
    AFTER INSERT OR UPDATE ON desempenho_semanal
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_competencia();

-- ========================================
-- 📊 VIEWS ÚTEIS
-- ========================================

-- View para comparação mês a mês
CREATE OR REPLACE VIEW vw_competencia_comparativa AS
SELECT 
    c.bar_id,
    c.ano,
    c.mes,
    c.nome_mes,
    c.faturamento_total_mes,
    c.clientes_total_mes,
    c.ticket_medio_mes,
    c.atingimento_faturamento,
    
    -- Mês anterior
    LAG(c.faturamento_total_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes) as faturamento_mes_anterior,
    LAG(c.clientes_total_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes) as clientes_mes_anterior,
    LAG(c.ticket_medio_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes) as ticket_mes_anterior,
    
    -- Crescimento calculado
    CASE 
        WHEN LAG(c.faturamento_total_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes) > 0 
        THEN ((c.faturamento_total_mes - LAG(c.faturamento_total_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes)) / 
              LAG(c.faturamento_total_mes) OVER (PARTITION BY c.bar_id ORDER BY c.ano, c.mes)) * 100
        ELSE 0 
    END as crescimento_faturamento_pct,
    
    -- Ano anterior (mesmo mês)
    LAG(c.faturamento_total_mes) OVER (PARTITION BY c.bar_id, c.mes ORDER BY c.ano) as faturamento_ano_anterior
    
FROM competencia_mensal c
ORDER BY c.bar_id, c.ano, c.mes;

-- View para resumo anual
CREATE OR REPLACE VIEW vw_competencia_anual AS
SELECT 
    bar_id,
    ano,
    COUNT(*) as meses_com_dados,
    SUM(faturamento_total_mes) as faturamento_total_ano,
    SUM(clientes_total_mes) as clientes_total_ano,
    AVG(ticket_medio_mes) as ticket_medio_ano,
    AVG(atingimento_faturamento) as atingimento_medio_ano,
    MAX(faturamento_total_mes) as melhor_mes_faturamento,
    MIN(faturamento_total_mes) as pior_mes_faturamento,
    
    -- Identificar melhor e pior mês
    (SELECT nome_mes FROM competencia_mensal c2 
     WHERE c2.bar_id = c1.bar_id AND c2.ano = c1.ano 
     ORDER BY c2.faturamento_total_mes DESC LIMIT 1) as nome_melhor_mes,
     
    (SELECT nome_mes FROM competencia_mensal c2 
     WHERE c2.bar_id = c1.bar_id AND c2.ano = c1.ano 
     ORDER BY c2.faturamento_total_mes ASC LIMIT 1) as nome_pior_mes
     
FROM competencia_mensal c1
GROUP BY bar_id, ano
ORDER BY bar_id, ano;

-- ========================================
-- 📊 POPULAR DADOS INICIAIS
-- ========================================

-- Calcular competências para dados existentes
DO $$
DECLARE
    bar_record RECORD;
    ano_mes RECORD;
BEGIN
    -- Para cada bar
    FOR bar_record IN SELECT DISTINCT bar_id FROM desempenho_semanal LOOP
        -- Para cada ano/mês com dados
        FOR ano_mes IN 
            SELECT DISTINCT 
                ano, 
                EXTRACT(MONTH FROM data_inicio)::INTEGER as mes
            FROM desempenho_semanal 
            WHERE bar_id = bar_record.bar_id
        LOOP
            PERFORM calcular_competencia_mensal(
                bar_record.bar_id,
                ano_mes.ano,
                ano_mes.mes
            );
        END LOOP;
    END LOOP;
END $$;

-- ========================================
-- 💬 COMENTÁRIOS
-- ========================================
COMMENT ON TABLE competencia_mensal IS 'Agregação mensal dos dados semanais de desempenho - visão executiva por competência';
COMMENT ON COLUMN competencia_mensal.variacao_semanal IS 'Percentual de diferença entre melhor e pior semana do mês';
COMMENT ON COLUMN competencia_mensal.atingimento_faturamento IS 'Percentual de atingimento da meta mensal de faturamento';
COMMENT ON VIEW vw_competencia_comparativa IS 'Comparação mês a mês com crescimento calculado';
COMMENT ON VIEW vw_competencia_anual IS 'Resumo anual agregando todos os meses'; 