-- Criar tabela para dados brutos do ContaAzul
CREATE TABLE IF NOT EXISTS contaazul_raw (
    id SERIAL PRIMARY KEY,
    data_coleta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fonte TEXT NOT NULL,
    dados_brutos JSONB NOT NULL,
    metadados JSONB,
    processado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contaazul_raw_data_coleta ON contaazul_raw(data_coleta);
CREATE INDEX IF NOT EXISTS idx_contaazul_raw_fonte ON contaazul_raw(fonte);
CREATE INDEX IF NOT EXISTS idx_contaazul_raw_processado ON contaazul_raw(processado);
CREATE INDEX IF NOT EXISTS idx_contaazul_raw_dados_brutos ON contaazul_raw USING GIN(dados_brutos);

-- Criar tabela final para dados processados
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras_contaazul (
    id SERIAL PRIMARY KEY,
    competencia DATE,
    tipo TEXT,
    descricao TEXT,
    cliente_fornecedor TEXT,
    categoria TEXT,
    condicao_pagamento TEXT,
    valor DECIMAL(15,2),
    data_vencimento DATE,
    data_pagamento DATE,
    documento TEXT,
    observacoes TEXT,
    raw_id INTEGER REFERENCES contaazul_raw(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tabela final
CREATE INDEX IF NOT EXISTS idx_movimentacoes_competencia ON movimentacoes_financeiras_contaazul(competencia);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_financeiras_contaazul(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor ON movimentacoes_financeiras_contaazul(valor);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_raw_id ON movimentacoes_financeiras_contaazul(raw_id);

-- Função para processar dados brutos
CREATE OR REPLACE FUNCTION processar_dados_contaazul_raw()
RETURNS INTEGER AS $$
DECLARE
    registro RECORD;
    dados_json JSONB;
    registros_processados INTEGER := 0;
    competencia_valor DATE;
    tipo_valor TEXT;
    descricao_valor TEXT;
    cliente_fornecedor_valor TEXT;
    categoria_valor TEXT;
    condicao_pagamento_valor TEXT;
    valor_numerico DECIMAL(15,2);
    data_vencimento_valor DATE;
    data_pagamento_valor DATE;
    documento_valor TEXT;
    observacoes_valor TEXT;
BEGIN
    -- Processar registros não processados
    FOR registro IN 
        SELECT id, dados_brutos, metadados 
        FROM contaazul_raw 
        WHERE processado = FALSE
    LOOP
        BEGIN
            dados_json := registro.dados_brutos;
            
            -- Extrair campos baseado na estrutura do Excel do ContaAzul
            -- Adaptar conforme estrutura real dos dados
            
            -- Competência (assumindo formato de data)
            competencia_valor := NULL;
            IF dados_json ? 'Competência' THEN
                competencia_valor := (dados_json->>'Competência')::DATE;
            ELSIF dados_json ? 'Data' THEN
                competencia_valor := (dados_json->>'Data')::DATE;
            END IF;
            
            -- Tipo (Receita/Despesa)
            tipo_valor := dados_json->>'Tipo';
            
            -- Descrição
            descricao_valor := dados_json->>'Descrição';
            
            -- Cliente/Fornecedor
            cliente_fornecedor_valor := dados_json->>'Cliente/Fornecedor';
            
            -- Categoria
            categoria_valor := dados_json->>'Categoria';
            
            -- Condição de pagamento
            condicao_pagamento_valor := dados_json->>'Cond. pagto';
            
            -- Valor (limpar formatação e converter)
            valor_numerico := NULL;
            IF dados_json ? 'Valor (R$)' THEN
                -- Remover formatação brasileira e converter
                valor_numerico := REPLACE(REPLACE(REPLACE(dados_json->>'Valor (R$)', 'R$', ''), '.', ''), ',', '.')::DECIMAL(15,2);
            ELSIF dados_json ? 'Valor' THEN
                valor_numerico := REPLACE(REPLACE(REPLACE(dados_json->>'Valor', 'R$', ''), '.', ''), ',', '.')::DECIMAL(15,2);
            END IF;
            
            -- Data de vencimento
            data_vencimento_valor := NULL;
            IF dados_json ? 'Vencimento' THEN
                data_vencimento_valor := (dados_json->>'Vencimento')::DATE;
            END IF;
            
            -- Data de pagamento
            data_pagamento_valor := NULL;
            IF dados_json ? 'Pagamento' THEN
                data_pagamento_valor := (dados_json->>'Pagamento')::DATE;
            END IF;
            
            -- Documento
            documento_valor := dados_json->>'Documento';
            
            -- Observações
            observacoes_valor := dados_json->>'Observações';
            
            -- Inserir na tabela final
            INSERT INTO movimentacoes_financeiras_contaazul (
                competencia,
                tipo,
                descricao,
                cliente_fornecedor,
                categoria,
                condicao_pagamento,
                valor,
                data_vencimento,
                data_pagamento,
                documento,
                observacoes,
                raw_id
            ) VALUES (
                competencia_valor,
                tipo_valor,
                descricao_valor,
                cliente_fornecedor_valor,
                categoria_valor,
                condicao_pagamento_valor,
                valor_numerico,
                data_vencimento_valor,
                data_pagamento_valor,
                documento_valor,
                observacoes_valor,
                registro.id
            );
            
            -- Marcar como processado
            UPDATE contaazul_raw 
            SET processado = TRUE, updated_at = NOW()
            WHERE id = registro.id;
            
            registros_processados := registros_processados + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log do erro (opcional)
            RAISE NOTICE 'Erro ao processar registro %: %', registro.id, SQLERRM;
            CONTINUE;
        END;
    END LOOP;
    
    RETURN registros_processados;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar automaticamente novos dados
CREATE OR REPLACE FUNCTION trigger_processar_contaazul()
RETURNS TRIGGER AS $$
BEGIN
    -- Processar apenas se não foi processado ainda
    IF NEW.processado = FALSE THEN
        PERFORM processar_dados_contaazul_raw();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_contaazul_raw_insert ON contaazul_raw;
CREATE TRIGGER trigger_contaazul_raw_insert
    AFTER INSERT ON contaazul_raw
    FOR EACH ROW
    EXECUTE FUNCTION trigger_processar_contaazul();

-- Função para estatísticas
CREATE OR REPLACE FUNCTION stats_contaazul()
RETURNS TABLE (
    total_raw INTEGER,
    processados INTEGER,
    pendentes INTEGER,
    total_movimentacoes INTEGER,
    soma_receitas DECIMAL(15,2),
    soma_despesas DECIMAL(15,2),
    saldo_total DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM contaazul_raw),
        (SELECT COUNT(*)::INTEGER FROM contaazul_raw WHERE processado = TRUE),
        (SELECT COUNT(*)::INTEGER FROM contaazul_raw WHERE processado = FALSE),
        (SELECT COUNT(*)::INTEGER FROM movimentacoes_financeiras_contaazul),
        (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes_financeiras_contaazul WHERE tipo ILIKE '%receita%'),
        (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes_financeiras_contaazul WHERE tipo ILIKE '%despesa%'),
        (SELECT COALESCE(SUM(CASE WHEN tipo ILIKE '%receita%' THEN valor ELSE -valor END), 0) FROM movimentacoes_financeiras_contaazul);
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE contaazul_raw IS 'Dados brutos coletados do ContaAzul via Playwright';
COMMENT ON TABLE movimentacoes_financeiras_contaazul IS 'Movimentações financeiras processadas do ContaAzul';
COMMENT ON FUNCTION processar_dados_contaazul_raw() IS 'Processa dados brutos do ContaAzul para tabela estruturada';
COMMENT ON FUNCTION stats_contaazul() IS 'Retorna estatísticas dos dados do ContaAzul';

-- ========================================
-- 📊 DADOS DE EXEMPLO PARA TESTE
-- ========================================

-- Inserir dados de exemplo para testar o relatório de competência
INSERT INTO movimentacoes_financeiras_contaazul (
    competencia, tipo, descricao, cliente_fornecedor, categoria, 
    condicao_pagamento, valor, data_vencimento, data_pagamento, 
    documento, observacoes
) VALUES
    -- RECEITAS 2024
    ('2024-01-15', 'Receita', 'Venda de produtos', 'Cliente A', 'Vendas', 'À vista', 1250.00, '2024-01-15', '2024-01-15', 'NF-001', 'Venda balcão'),
    ('2024-01-20', 'Receita', 'Venda de bebidas', 'Cliente B', 'Bar', 'Cartão', 850.50, '2024-01-20', '2024-01-20', 'NF-002', 'Venda evento'),
    ('2024-02-10', 'Receita', 'Entrada evento', 'Cliente C', 'Eventos', 'PIX', 2100.00, '2024-02-10', '2024-02-10', 'NF-003', 'Show especial'),
    ('2024-02-25', 'Receita', 'Venda comida', 'Cliente D', 'Cozinha', 'Dinheiro', 680.75, '2024-02-25', '2024-02-25', 'NF-004', 'Mesa 10'),
    ('2024-03-05', 'Receita', 'Happy hour', 'Cliente E', 'Bar', 'Cartão', 1450.00, '2024-03-05', '2024-03-05', 'NF-005', 'Promoção especial'),
    
    -- RECEITAS 2025
    ('2025-01-10', 'Receita', 'Venda janeiro', 'Cliente F', 'Vendas', 'PIX', 1890.00, '2025-01-10', '2025-01-10', 'NF-006', 'Início do ano'),
    ('2025-01-25', 'Receita', 'Evento carnaval', 'Cliente G', 'Eventos', 'Cartão', 3200.00, '2025-01-25', '2025-01-25', 'NF-007', 'Carnaval 2025'),
    ('2025-02-14', 'Receita', 'Dia dos namorados', 'Cliente H', 'Especiais', 'À vista', 2750.50, '2025-02-14', '2025-02-14', 'NF-008', 'Data especial'),
    ('2025-03-15', 'Receita', 'Aniversário bar', 'Cliente I', 'Eventos', 'PIX', 4100.00, '2025-03-15', '2025-03-15', 'NF-009', '5 anos do bar'),
    
    -- DESPESAS 2024
    ('2024-01-05', 'Despesa', 'Compra cerveja', 'Fornecedor A', 'Estoque', '30 dias', -800.00, '2024-02-05', '2024-02-05', 'NF-101', 'Estoque mensal'),
    ('2024-01-12', 'Despesa', 'Energia elétrica', 'CEMIG', 'Utilidades', 'À vista', -340.80, '2024-01-12', '2024-01-12', 'FATURA-001', 'Conta janeiro'),
    ('2024-02-03', 'Despesa', 'Compra alimentos', 'Fornecedor B', 'Cozinha', '15 dias', -950.25, '2024-02-18', '2024-02-18', 'NF-102', 'Ingredientes'),
    ('2024-02-20', 'Despesa', 'Marketing digital', 'Agência X', 'Marketing', 'À vista', -500.00, '2024-02-20', '2024-02-20', 'NF-103', 'Redes sociais'),
    ('2024-03-01', 'Despesa', 'Aluguel', 'Imobiliária Y', 'Fixos', 'À vista', -2800.00, '2024-03-01', '2024-03-01', 'RECIBO-001', 'Aluguel março'),
    
    -- DESPESAS 2025
    ('2025-01-03', 'Despesa', 'Fornecedores janeiro', 'Fornecedor C', 'Estoque', '30 dias', -1200.00, '2025-02-03', '2025-02-03', 'NF-104', 'Estoque 2025'),
    ('2025-01-15', 'Despesa', 'Equipamentos som', 'Som & Cia', 'Equipamentos', 'Cartão', -750.00, '2025-01-15', '2025-01-15', 'NF-105', 'Manutenção'),
    ('2025-02-01', 'Despesa', 'Funcionários', 'RH Folha', 'Pessoal', 'À vista', -4500.00, '2025-02-01', '2025-02-01', 'FOLHA-001', 'Salários fevereiro'),
    ('2025-02-28', 'Despesa', 'Licenças software', 'Tech Solutions', 'TI', 'Boleto', -380.90, '2025-03-30', null, 'BOL-001', 'Sistema POS'),
    ('2025-03-10', 'Despesa', 'Reforma banheiro', 'Construção Z', 'Reformas', '60 dias', -2200.00, '2025-05-10', null, 'NF-106', 'Melhorias estrutura');

-- Log da inserção
DO $$
BEGIN
    RAISE NOTICE 'Dados de exemplo inseridos na tabela movimentacoes_financeiras_contaazul';
    RAISE NOTICE 'Total de registros de exemplo: 19';
    RAISE NOTICE 'Período: 2024-2025';
    RAISE NOTICE 'Dados prontos para teste do relatório de competência';
END
$$; 