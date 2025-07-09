-- ========================================
-- 🔄 TABELA DE STATUS DE SINCRONIZAÇÃO
-- ========================================

-- Criar tabela para controlar status das sincronizações
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    servico VARCHAR(50) NOT NULL, -- 'contaazul', 'contahub', etc.
    status VARCHAR(20) NOT NULL CHECK (status IN ('em_andamento', 'concluida', 'erro', 'nunca_executada')),
    tipo VARCHAR(20) DEFAULT 'completa', -- 'completa', 'incremental', 'forcada'
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizado_em TIMESTAMP WITH TIME ZONE,
    resultados JSONB, -- Dados do resultado da sincronização
    detalhes JSONB, -- Detalhes adicionais como usuário, configurações, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sync_status_bar_id ON sync_status(bar_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_servico ON sync_status(servico);
CREATE INDEX IF NOT EXISTS idx_sync_status_bar_servico ON sync_status(bar_id, servico);
CREATE INDEX IF NOT EXISTS idx_sync_status_iniciado_em ON sync_status(iniciado_em);

-- Comentários para documentação
COMMENT ON TABLE sync_status IS 'Tabela para rastrear o status das sincronizações de dados externos';
COMMENT ON COLUMN sync_status.bar_id IS 'ID do bar/estabelecimento';
COMMENT ON COLUMN sync_status.servico IS 'Nome do serviço (contaazul, contahub, etc.)';
COMMENT ON COLUMN sync_status.status IS 'Status atual da sincronização';
COMMENT ON COLUMN sync_status.tipo IS 'Tipo de sincronização executada';
COMMENT ON COLUMN sync_status.resultados IS 'Dados JSON com resultados da sincronização';
COMMENT ON COLUMN sync_status.detalhes IS 'Detalhes adicionais da sincronização';

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER sync_status_update_trigger
    BEFORE UPDATE ON sync_status
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_status_updated_at();

-- RLS (Row Level Security) para garantir que cada bar veja apenas seus próprios dados
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY sync_status_policy ON sync_status
    USING (bar_id = current_setting('request.jwt.claims', true)::json->>'bar_id'::integer); 