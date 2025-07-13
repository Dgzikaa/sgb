-- ========================================
-- 📅 TABELA PARA RESERVAS DO GETIN
-- ========================================
CREATE TABLE IF NOT EXISTS getin_reservas (
    id SERIAL PRIMARY KEY,
    id_externo VARCHAR(50) NOT NULL,
    bar_id INTEGER NOT NULL,
    data_reserva DATE NOT NULL,
    horario TIME,
    nome_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255),
    telefone_cliente VARCHAR(20),
    pessoas INTEGER NOT NULL DEFAULT 1,
    mesa VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    observacoes TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    valor_entrada DECIMAL(10,2) DEFAULT 0,
    unit_id VARCHAR(50) NOT NULL,
    unit_name VARCHAR(255),
    raw_data JSONB,
    sincronizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(id_externo, bar_id),
    INDEX idx_getin_reservas_bar_data (bar_id, data_reserva),
    INDEX idx_getin_reservas_status (status),
    INDEX idx_getin_reservas_cliente (nome_cliente),
    INDEX idx_getin_reservas_unit (unit_id),
    INDEX idx_getin_reservas_sync (sincronizado_em)
);

-- ========================================
-- 🔄 TRIGGER PARA ATUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_getin_reservas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_getin_reservas_updated_at
    BEFORE UPDATE ON getin_reservas
    FOR EACH ROW
    EXECUTE FUNCTION update_getin_reservas_updated_at();

-- ========================================
-- 📊 COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================
COMMENT ON TABLE getin_reservas IS 'Reservas sincronizadas do sistema getIn';
COMMENT ON COLUMN getin_reservas.id_externo IS 'ID da reserva no sistema getIn';
COMMENT ON COLUMN getin_reservas.bar_id IS 'ID do bar/restaurante no SGB';
COMMENT ON COLUMN getin_reservas.data_reserva IS 'Data da reserva';
COMMENT ON COLUMN getin_reservas.horario IS 'Horário da reserva';
COMMENT ON COLUMN getin_reservas.nome_cliente IS 'Nome do cliente';
COMMENT ON COLUMN getin_reservas.email_cliente IS 'Email do cliente';
COMMENT ON COLUMN getin_reservas.telefone_cliente IS 'Telefone do cliente';
COMMENT ON COLUMN getin_reservas.pessoas IS 'Número de pessoas';
COMMENT ON COLUMN getin_reservas.mesa IS 'Mesa reservada';
COMMENT ON COLUMN getin_reservas.status IS 'Status da reserva (pending, confirmed, cancelled, etc.)';
COMMENT ON COLUMN getin_reservas.observacoes IS 'Observações da reserva';
COMMENT ON COLUMN getin_reservas.valor_total IS 'Valor total da reserva';
COMMENT ON COLUMN getin_reservas.valor_entrada IS 'Valor da entrada/sinal';
COMMENT ON COLUMN getin_reservas.unit_id IS 'ID da unidade no getIn';
COMMENT ON COLUMN getin_reservas.unit_name IS 'Nome da unidade';
COMMENT ON COLUMN getin_reservas.raw_data IS 'Dados brutos da API getIn';
COMMENT ON COLUMN getin_reservas.sincronizado_em IS 'Timestamp da última sincronização';

-- ========================================
-- 🚀 DADOS INICIAIS / TESTES
-- ========================================
-- Inserir dados de teste (opcional)
/*
INSERT INTO getin_reservas (
    id_externo, bar_id, data_reserva, horario, nome_cliente, 
    email_cliente, telefone_cliente, pessoas, mesa, status, 
    observacoes, unit_id, unit_name
) VALUES 
    ('TEST001', 3, '2025-01-20', '19:00', 'João Silva', 'joao@email.com', '11999999999', 4, 'Mesa 1', 'confirmed', 'Aniversário', 'M1mAGM13', 'Ordinário Bar'),
    ('TEST002', 3, '2025-01-21', '20:30', 'Maria Santos', 'maria@email.com', '11888888888', 2, 'Mesa 5', 'pending', 'Jantar romântico', 'M1mAGM13', 'Ordinário Bar'),
    ('TEST003', 3, '2025-01-22', '18:00', 'Pedro Costa', 'pedro@email.com', '11777777777', 6, 'Mesa 10', 'confirmed', 'Reunião trabalho', 'M1mAGM13', 'Ordinário Bar');
*/ 