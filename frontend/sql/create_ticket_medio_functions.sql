-- Função para calcular ticket médio completo por dia (ContaHub + Sympla + Yuzer)
-- Combinando dados de faturamento da tabela pagamentos com dados de clientes da tabela pessoas_diario_corrigido

CREATE OR REPLACE FUNCTION get_ticket_medio_completo_por_dia(
    p_bar_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    dt_gerencial DATE,
    ticket_medio DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH faturamento_por_dia AS (
        -- Faturamento completo do dia (pagamentos ContaHub)
        SELECT 
            p.dt_gerencial::DATE as data,
            COALESCE(SUM(p.liquido), 0) as faturamento_total
        FROM pagamentos p
        WHERE p.bar_id = p_bar_id
          AND p.dt_gerencial::DATE >= p_data_inicio
          AND p.dt_gerencial::DATE <= p_data_fim
          AND p.liquido IS NOT NULL
        GROUP BY p.dt_gerencial::DATE
    ),
    clientes_por_dia AS (
        -- Clientes pagantes do dia (excluindo cortesias)
        SELECT 
            pdc.dt_gerencial::DATE as data,
            COALESCE(pdc.pessoas_pagantes, 0) as clientes_pagantes
        FROM pessoas_diario_corrigido pdc
        WHERE pdc.dt_gerencial::DATE >= p_data_inicio
          AND pdc.dt_gerencial::DATE <= p_data_fim
        GROUP BY pdc.dt_gerencial::DATE, pdc.pessoas_pagantes
    )
    SELECT 
        COALESCE(f.data, c.data) as dt_gerencial,
        CASE 
            WHEN COALESCE(c.clientes_pagantes, 0) > 0 
            THEN ROUND((COALESCE(f.faturamento_total, 0) / c.clientes_pagantes)::NUMERIC, 2)
            ELSE 0
        END as ticket_medio
    FROM faturamento_por_dia f
    FULL OUTER JOIN clientes_por_dia c ON f.data = c.data
    WHERE (f.data IS NOT NULL OR c.data IS NOT NULL)
      AND COALESCE(c.clientes_pagantes, 0) > 0  -- Só retornar dias com clientes
    ORDER BY COALESCE(f.data, c.data);
END;
$$;

-- Função auxiliar para calcular faturamento completo por dia (usado na evolução de faturamento)
CREATE OR REPLACE FUNCTION get_faturamento_completo_por_dia(
    p_bar_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    dt_gerencial DATE,
    faturamento_total DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.dt_gerencial::DATE as dt_gerencial,
        COALESCE(SUM(p.liquido), 0) as faturamento_total
    FROM pagamentos p
    WHERE p.bar_id = p_bar_id
      AND p.dt_gerencial::DATE >= p_data_inicio
      AND p.dt_gerencial::DATE <= p_data_fim
      AND p.liquido IS NOT NULL
    GROUP BY p.dt_gerencial::DATE
    ORDER BY p.dt_gerencial::DATE;
END;
$$;

-- Função para calcular clientes completos por dia (ContaHub + Sympla)
CREATE OR REPLACE FUNCTION get_clientes_completos_por_dia(
    p_bar_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    dt_gerencial DATE,
    total_clientes INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pdc.dt_gerencial::DATE as dt_gerencial,
        COALESCE(pdc.total_pessoas_bruto, 0) as total_clientes
    FROM pessoas_diario_corrigido pdc
    WHERE pdc.dt_gerencial::DATE >= p_data_inicio
      AND pdc.dt_gerencial::DATE <= p_data_fim
    GROUP BY pdc.dt_gerencial::DATE, pdc.total_pessoas_bruto
    ORDER BY pdc.dt_gerencial::DATE;
END;
$$;

-- Função para calcular tempos médios por dia
CREATE OR REPLACE FUNCTION get_tempos_por_dia(
    p_bar_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE,
    p_campo_tempo TEXT
)
RETURNS TABLE(
    dt_gerencial DATE,
    tempo_medio_minutos DECIMAL
) 
LANGUAGE plpgsql
AS $$
DECLARE
    query_sql TEXT;
BEGIN
    -- Construir query dinamicamente baseada no campo solicitado
    query_sql := format('
        SELECT 
            TO_DATE(dia::TEXT, ''YYYYMMDD'') as dt_gerencial,
            ROUND(AVG(CASE 
                WHEN %I > 0 AND %I <= 14400 THEN %I / 60.0  -- Converter segundos para minutos, filtrar outliers > 4h
                ELSE NULL 
            END)::NUMERIC, 2) as tempo_medio_minutos
        FROM tempo t
        WHERE t.bar_id = %L
          AND TO_DATE(t.dia::TEXT, ''YYYYMMDD'') >= %L
          AND TO_DATE(t.dia::TEXT, ''YYYYMMDD'') <= %L
          AND %I IS NOT NULL
          AND %I > 0
        GROUP BY TO_DATE(t.dia::TEXT, ''YYYYMMDD'')
        HAVING COUNT(CASE WHEN %I > 0 AND %I <= 14400 THEN 1 END) >= 3  -- Mínimo 3 registros válidos
        ORDER BY TO_DATE(t.dia::TEXT, ''YYYYMMDD'');
    ', p_campo_tempo, p_campo_tempo, p_campo_tempo, p_bar_id, p_data_inicio, p_data_fim, 
       p_campo_tempo, p_campo_tempo, p_campo_tempo, p_campo_tempo);
    
    RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION get_ticket_medio_completo_por_dia IS 'Calcula ticket médio diário combinando faturamento (pagamentos) e clientes pagantes (pessoas_diario_corrigido)';
COMMENT ON FUNCTION get_faturamento_completo_por_dia IS 'Retorna faturamento total diário da tabela pagamentos';
COMMENT ON FUNCTION get_clientes_completos_por_dia IS 'Retorna total de clientes diário da tabela pessoas_diario_corrigido';
COMMENT ON FUNCTION get_tempos_por_dia IS 'Calcula tempos médios diários por campo especificado (t0_t2, t0_t3, etc.)'; 