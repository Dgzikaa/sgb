-- =============================================
-- DRE ARQUITETURA SIMPLES
-- =============================================
-- 1. VIEW view_dre: Categoriza automaticamente nibo_agendamentos
-- 2. Tabela dre_manual: Lançamentos manuais diretos
-- =============================================

-- 1. CRIAR VIEW PARA CATEGORIZAR NIBO_AGENDAMENTOS
CREATE OR REPLACE VIEW view_dre AS
SELECT 
    nibo_id,
    data_competencia,
    descricao,
    categoria_nome,
    valor,
    tipo,
    -- Categorização DRE
    CASE 
        -- RECEITAS
        WHEN categoria_nome IN (
            'Stone Crédito', 'Stone Débito', 'Stone Pix', 
            'Pix Direto na Conta', 'Dinheiro', 
            'Receita de Eventos', 'Outras Receitas'
        ) THEN 'Receita'
        
        -- CMV (Custo das Mercadorias Vendidas)
        WHEN categoria_nome IN (
            'CUSTO BEBIDAS', 'CUSTO COMIDA', 'CUSTO INSUMOS'
        ) THEN 'CMV'
        
        -- DESPESAS OPERACIONAIS
        WHEN categoria_nome IN (
            'Aluguel', 'Energia Elétrica', 'Água e Esgoto', 
            'Internet e Telefone', 'Limpeza e Conservação',
            'Segurança', 'Manutenção e Reparos'
        ) THEN 'Despesas Operacionais'
        
        -- DESPESAS COM PESSOAL
        WHEN categoria_nome IN (
            'Salários', 'Encargos Sociais', 'Benefícios',
            'Treinamento e Capacitação', 'Recursos Humanos'
        ) THEN 'Despesas com Pessoal'
        
        -- DESPESAS ADMINISTRATIVAS
        WHEN categoria_nome IN (
            'Administrativo Ordinário', 'Material de Escritório',
            'Serviços Contábeis', 'Serviços Jurídicos',
            'Consultoria', 'Software e Licenças'
        ) THEN 'Despesas Administrativas'
        
        -- DESPESAS COMERCIAIS
        WHEN categoria_nome IN (
            'Marketing e Publicidade', 'Comissões de Vendas',
            'Eventos e Promoções', 'Material Promocional'
        ) THEN 'Despesas Comerciais'
        
        -- DESPESAS FINANCEIRAS
        WHEN categoria_nome IN (
            'Juros e Multas', 'Tarifas Bancárias', 
            'IOF', 'Descontos Concedidos'
        ) THEN 'Despesas Financeiras'
        
        -- IMPOSTOS E TAXAS
        WHEN categoria_nome IN (
            'ICMS', 'PIS', 'COFINS', 'ISS', 
            'Taxas Governamentais', 'Alvará e Licenças'
        ) THEN 'Impostos e Taxas'
        
        -- COMPENSAÇÕES/RATEIOS
        WHEN categoria_nome IN (
            'Escritório Central', 'Rateio de Custos',
            'Compensação entre Filiais'
        ) THEN 'Compensações/Rateios'
        
        -- OUTRAS DESPESAS (default)
        ELSE 'Outras Despesas'
    END AS categoria_dre,
    
    -- Sinal do valor (Receitas positivas, Custos/Despesas negativas)
    CASE 
        WHEN categoria_nome IN (
            'Stone Crédito', 'Stone Débito', 'Stone Pix', 
            'Pix Direto na Conta', 'Dinheiro', 
            'Receita de Eventos', 'Outras Receitas'
        ) THEN valor
        ELSE -ABS(valor) -- Todas as despesas/custos como negativos
    END AS valor_dre,
    
    'automatico' as origem,
    criado_em,
    atualizado_em
FROM nibo_agendamentos 
WHERE deletado = false 
  AND data_competencia IS NOT NULL
  AND status IN ('pago', 'recebido');

-- 2. CRIAR TABELA PARA LANÇAMENTOS MANUAIS
CREATE TABLE IF NOT EXISTS dre_manual (
    id SERIAL PRIMARY KEY,
    data_competencia DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    categoria_dre VARCHAR(100) NOT NULL CHECK (categoria_dre IN (
        'Receita',
        'CMV',
        'Despesas Operacionais',
        'Despesas com Pessoal', 
        'Despesas Administrativas',
        'Despesas Comerciais',
        'Despesas Financeiras',
        'Impostos e Taxas',
        'Compensações/Rateios',
        'Outras Despesas'
    )),
    observacoes TEXT,
    usuario_criacao VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRIGGER PARA ATUALIZAR atualizado_em
CREATE OR REPLACE FUNCTION update_dre_manual_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dre_manual_timestamp
    BEFORE UPDATE ON dre_manual
    FOR EACH ROW
    EXECUTE FUNCTION update_dre_manual_timestamp();

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_view_dre_competencia ON nibo_agendamentos(data_competencia) WHERE deletado = false;
CREATE INDEX IF NOT EXISTS idx_dre_manual_competencia ON dre_manual(data_competencia);
CREATE INDEX IF NOT EXISTS idx_dre_manual_categoria ON dre_manual(categoria_dre);

-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON VIEW view_dre IS 'VIEW que categoriza automaticamente os dados do nibo_agendamentos para DRE';
COMMENT ON TABLE dre_manual IS 'Tabela para lançamentos manuais da DRE';
COMMENT ON COLUMN dre_manual.valor IS 'Valor do lançamento (positivo para receitas, negativo para custos/despesas)';
COMMENT ON COLUMN dre_manual.categoria_dre IS 'Categoria DRE padronizada';

-- 6. FUNÇÃO PARA OBTER DRE CONSOLIDADA POR MÊS
CREATE OR REPLACE FUNCTION get_dre_consolidada(
    p_ano INTEGER,
    p_mes INTEGER
)
RETURNS TABLE (
    categoria_dre VARCHAR(100),
    valor_automatico DECIMAL(15,2),
    valor_manual DECIMAL(15,2),
    valor_total DECIMAL(15,2),
    origem TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH dre_automatica AS (
        SELECT 
            v.categoria_dre,
            COALESCE(SUM(v.valor_dre), 0) as valor_automatico
        FROM view_dre v
        WHERE EXTRACT(YEAR FROM v.data_competencia) = p_ano
          AND EXTRACT(MONTH FROM v.data_competencia) = p_mes
        GROUP BY v.categoria_dre
    ),
    dre_manual_agg AS (
        SELECT 
            dm.categoria_dre,
            COALESCE(SUM(dm.valor), 0) as valor_manual
        FROM dre_manual dm
        WHERE EXTRACT(YEAR FROM dm.data_competencia) = p_ano
          AND EXTRACT(MONTH FROM dm.data_competencia) = p_mes
        GROUP BY dm.categoria_dre
    ),
    todas_categorias AS (
        SELECT DISTINCT categoria_dre FROM dre_automatica
        UNION
        SELECT DISTINCT categoria_dre FROM dre_manual_agg
    )
    SELECT 
        tc.categoria_dre,
        COALESCE(da.valor_automatico, 0) as valor_automatico,
        COALESCE(dm.valor_manual, 0) as valor_manual,
        COALESCE(da.valor_automatico, 0) + COALESCE(dm.valor_manual, 0) as valor_total,
        CASE 
            WHEN da.valor_automatico IS NOT NULL AND dm.valor_manual IS NOT NULL THEN 'hibrido'
            WHEN da.valor_automatico IS NOT NULL THEN 'automatico'
            ELSE 'manual'
        END as origem
    FROM todas_categorias tc
    LEFT JOIN dre_automatica da ON tc.categoria_dre = da.categoria_dre
    LEFT JOIN dre_manual_agg dm ON tc.categoria_dre = dm.categoria_dre
    ORDER BY 
        CASE tc.categoria_dre
            WHEN 'Receita' THEN 1
            WHEN 'CMV' THEN 2
            WHEN 'Despesas Operacionais' THEN 3
            WHEN 'Despesas com Pessoal' THEN 4
            WHEN 'Despesas Administrativas' THEN 5
            WHEN 'Despesas Comerciais' THEN 6
            WHEN 'Despesas Financeiras' THEN 7
            WHEN 'Impostos e Taxas' THEN 8
            WHEN 'Compensações/Rateios' THEN 9
            ELSE 10
        END;
END;
$$ LANGUAGE plpgsql;

-- 7. EXEMPLO DE USO
-- SELECT * FROM get_dre_consolidada(2025, 8); -- DRE de Agosto 2025
