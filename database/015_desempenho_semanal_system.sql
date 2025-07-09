-- ========================================
-- 📊 SISTEMA DE DESEMPENHO SEMANAL
-- Baseado na planilha de acompanhamento estratégico
-- ========================================

-- Tabela principal de indicadores semanais
CREATE TABLE IF NOT EXISTS desempenho_semanal (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Identificação da semana
    ano INTEGER NOT NULL,
    numero_semana INTEGER NOT NULL, -- 1-52
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    
    -- Faturamento
    faturamento_total DECIMAL(12,2) DEFAULT 0,
    faturamento_entrada DECIMAL(12,2) DEFAULT 0,
    faturamento_bar DECIMAL(12,2) DEFAULT 0,
    
    -- Clientes e Reservas
    clientes_atendidos INTEGER DEFAULT 0,
    reservas_totais INTEGER DEFAULT 0,
    reservas_presentes INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    ticket_medio DECIMAL(8,2) DEFAULT 0,
    cmv_teorico DECIMAL(5,2) DEFAULT 0, -- %
    cmv_limpo DECIMAL(5,2) DEFAULT 0,   -- %
    
    -- Metas e Performance
    meta_semanal DECIMAL(12,2) DEFAULT 0,
    atingimento DECIMAL(5,2) DEFAULT 0, -- %
    
    -- Observações e notas
    observacoes TEXT,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única por bar/ano/semana
    UNIQUE(bar_id, ano, numero_semana)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_desempenho_semanal_bar_ano ON desempenho_semanal(bar_id, ano);
CREATE INDEX IF NOT EXISTS idx_desempenho_semanal_periodo ON desempenho_semanal(data_inicio, data_fim);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_desempenho_semanal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_desempenho_semanal_timestamp
    BEFORE UPDATE ON desempenho_semanal
    FOR EACH ROW
    EXECUTE FUNCTION update_desempenho_semanal_timestamp();

-- Função para calcular ticket médio automaticamente
CREATE OR REPLACE FUNCTION calculate_ticket_medio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clientes_atendidos > 0 THEN
        NEW.ticket_medio = NEW.faturamento_total / NEW.clientes_atendidos;
    ELSE
        NEW.ticket_medio = 0;
    END IF;
    
    -- Calcular atingimento se houver meta
    IF NEW.meta_semanal > 0 THEN
        NEW.atingimento = (NEW.faturamento_total / NEW.meta_semanal) * 100;
    ELSE
        NEW.atingimento = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_metrics
    BEFORE INSERT OR UPDATE ON desempenho_semanal
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ticket_medio();

-- Inserir dados de exemplo baseados na planilha (Ordinário Bar - ID 3)
INSERT INTO desempenho_semanal (
    bar_id, ano, numero_semana, data_inicio, data_fim,
    faturamento_total, faturamento_entrada, faturamento_bar,
    clientes_atendidos, reservas_totais, reservas_presentes,
    cmv_teorico, cmv_limpo, meta_semanal
) VALUES
    (3, 2025, 17, '2025-04-21', '2025-04-27', 169775.55, 33377.12, 136398.43, 1960, 521, 608, 28.8, 35.7, 200000.00),
    (3, 2025, 18, '2025-04-28', '2025-05-04', 221415.99, 41590.66, 179825.33, 2401, 571, 578, 32.0, 39.1, 200000.00),
    (3, 2025, 19, '2025-05-05', '2025-05-11', 159472.19, 27999.86, 131472.33, 1794, 644, 650, 31.0, 36.8, 200000.00),
    (3, 2025, 20, '2025-05-12', '2025-05-18', 147412.36, 20310.00, 127102.36, 1459, 760, 622, 29.2, 43.3, 200000.00),
    (3, 2025, 21, '2025-05-19', '2025-05-25', 178423.96, 29949.43, 148474.53, 1668, 870, 2738, 28.2, 39.1, 200000.00),
    (3, 2025, 22, '2025-05-26', '2025-06-01', 188457.06, 28576.50, 159880.56, 2036, 806, 2478, 28.8, 31.9, 200000.00)
ON CONFLICT (bar_id, ano, numero_semana) DO NOTHING;

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW vw_desempenho_resumo AS
SELECT 
    bar_id,
    ano,
    COUNT(*) as total_semanas,
    AVG(faturamento_total) as faturamento_medio,
    SUM(faturamento_total) as faturamento_total_ano,
    AVG(clientes_atendidos) as clientes_medio,
    SUM(clientes_atendidos) as clientes_total_ano,
    AVG(ticket_medio) as ticket_medio_geral,
    AVG(atingimento) as atingimento_medio,
    AVG(cmv_limpo) as cmv_medio
FROM desempenho_semanal
GROUP BY bar_id, ano;

-- Comentários na tabela
COMMENT ON TABLE desempenho_semanal IS 'Indicadores estratégicos semanais baseados na planilha de acompanhamento';
COMMENT ON COLUMN desempenho_semanal.numero_semana IS 'Semana do ano (1-52)';
COMMENT ON COLUMN desempenho_semanal.cmv_teorico IS 'CMV teórico em percentual';
COMMENT ON COLUMN desempenho_semanal.cmv_limpo IS 'CMV limpo/real em percentual';
COMMENT ON COLUMN desempenho_semanal.atingimento IS 'Percentual de atingimento da meta semanal'; 