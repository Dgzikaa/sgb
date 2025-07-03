-- Criação da tabela metas_bar para armazenar configurações de metas por bar
CREATE TABLE IF NOT EXISTS metas_bar (
    id BIGSERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    
    -- Metas diárias básicas
    faturamento_diario DECIMAL(10,2) DEFAULT 5000.00,
    clientes_diario INTEGER DEFAULT 80,
    
    -- Tickets médios
    ticket_entrada DECIMAL(10,2) DEFAULT 25.00,
    ticket_bar DECIMAL(10,2) DEFAULT 35.00,
    ticket_couvert DECIMAL(10,2) DEFAULT 50.00,
    ticket_medio_target DECIMAL(10,2) DEFAULT 93.00,
    
    -- Custos operacionais
    cmv_teorico DECIMAL(5,2) DEFAULT 30.00, -- Percentual
    cmo DECIMAL(5,2) DEFAULT 15.00, -- Percentual
    
    -- Metas mensais
    meta_mensal_faturamento DECIMAL(12,2) DEFAULT 150000.00,
    meta_mensal_clientes INTEGER DEFAULT 2400,
    
    -- Tempos de atendimento (em minutos)
    tempo_saida_cozinha INTEGER DEFAULT 12,
    tempo_saida_bar INTEGER DEFAULT 4,
    
    -- Reservas
    reservas_diarias INTEGER DEFAULT 133,
    reservas_semanais INTEGER DEFAULT 800,
    reservas_mensais INTEGER DEFAULT 3200,
    
    -- Metas específicas por dia da semana (JSON)
    -- Estrutura: {"0": {"faturamento": 0, "clientes": 0, "ativo": false}, ...}
    -- Onde 0=Domingo, 1=Segunda, ..., 6=Sábado
    metas_por_dia JSONB DEFAULT '{
        "0": {"faturamento": 0, "clientes": 0, "ativo": false},
        "1": {"faturamento": 0, "clientes": 0, "ativo": false},
        "2": {"faturamento": 0, "clientes": 0, "ativo": false},
        "3": {"faturamento": 40000, "clientes": 400, "ativo": true},
        "4": {"faturamento": 50000, "clientes": 500, "ativo": true},
        "5": {"faturamento": 60000, "clientes": 600, "ativo": true},
        "6": {"faturamento": 70000, "clientes": 700, "ativo": true}
    }'::jsonb,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir um registro por bar
    CONSTRAINT unique_bar_metas UNIQUE (bar_id)
);

-- Índice para busca rápida por bar_id
CREATE INDEX IF NOT EXISTS idx_metas_bar_bar_id ON metas_bar(bar_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_metas_bar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_metas_bar_updated_at_trigger ON metas_bar;
CREATE TRIGGER update_metas_bar_updated_at_trigger
    BEFORE UPDATE ON metas_bar
    FOR EACH ROW
    EXECUTE FUNCTION update_metas_bar_updated_at();

-- Comentários na tabela
COMMENT ON TABLE metas_bar IS 'Configurações de metas e targets por estabelecimento';
COMMENT ON COLUMN metas_bar.bar_id IS 'ID do bar/estabelecimento';
COMMENT ON COLUMN metas_bar.metas_por_dia IS 'Configurações específicas por dia da semana em formato JSON';
COMMENT ON COLUMN metas_bar.cmv_teorico IS 'Custo da Mercadoria Vendida teórico em percentual';
COMMENT ON COLUMN metas_bar.cmo IS 'Custo de Mão de Obra em percentual';
COMMENT ON COLUMN metas_bar.tempo_saida_cozinha IS 'Tempo limite para saída da cozinha em minutos';
COMMENT ON COLUMN metas_bar.tempo_saida_bar IS 'Tempo limite para saída do bar em minutos'; 