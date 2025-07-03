-- =============================================================================
-- SCRIPT: CORRIGIR HIERARQUIA CONFUSA DE PRODUTOS
-- PROBLEMA: Produtos finais têm ingredientes básicos em vez de sub-produtos
-- SOLUÇÃO: Reestruturar para hierarquia correta
-- =============================================================================

-- 1. BACKUP das receitas atuais (caso precise reverter)
CREATE TABLE IF NOT EXISTS receitas_backup_hierarquia AS 
SELECT * FROM receitas WHERE bar_id = 3;

-- 2. LIMPAR receitas dos produtos FINAIS (eles deveriam usar sub-produtos)
DELETE FROM receitas 
WHERE bar_id = 3 
    AND produto_id IN (
        SELECT id FROM produtos 
        WHERE codigo IN ('pc0053', 'pc0024', 'pc0079', 'pc0040', 'pc0050')  -- Produtos finais
        AND bar_id = 3
    );

-- 3. CRIAR receitas corretas para produtos FINAIS
-- COXINHA = Massa de coxinha + Recheio para coxinha
INSERT INTO receitas (bar_id, produto_id, insumo_id, quantidade_necessaria)
SELECT 
    3 as bar_id,
    p_final.id as produto_id,
    p_sub.id as insumo_id,  -- Sub-produto como "ingrediente"
    dados.quantidade
FROM produtos p_final
CROSS JOIN (
    SELECT 'pc0033' as sub_codigo, 1.0 as quantidade UNION ALL  -- Massa de coxinha (1 unidade)
    SELECT 'pc0036' as sub_codigo, 1.0 as quantidade            -- Recheio para coxinha (1 unidade)
) dados
JOIN produtos p_sub ON p_sub.codigo = dados.sub_codigo AND p_sub.bar_id = 3
WHERE p_final.codigo = 'pc0053' AND p_final.bar_id = 3;  -- Coxinha

-- CROQUETE = Massa Croquete + Recheio (frango)
INSERT INTO receitas (bar_id, produto_id, insumo_id, quantidade_necessaria)
SELECT 
    3 as bar_id,
    p_final.id as produto_id,
    p_sub.id as insumo_id,
    dados.quantidade
FROM produtos p_final
CROSS JOIN (
    SELECT 'pc0078' as sub_codigo, 1.0 as quantidade   -- Massa Croquete (1 unidade)
) dados
JOIN produtos p_sub ON p_sub.codigo = dados.sub_codigo AND p_sub.bar_id = 3
WHERE p_final.codigo = 'pc0024' AND p_final.bar_id = 3;  -- Croquete

-- Para o croquete, também adicionar frango diretamente (se não houver recheio específico)
INSERT INTO receitas (bar_id, produto_id, insumo_id, quantidade_necessaria)
SELECT 
    3 as bar_id,
    p.id as produto_id,
    i.id as insumo_id,
    500.0 as quantidade
FROM produtos p
JOIN insumos i ON i.codigo = 'i0120' AND i.bar_id = 3  -- Frango a passarinho
WHERE p.codigo = 'pc0024' AND p.bar_id = 3;  -- Croquete

-- 4. VERIFICAR estrutura corrigida
SELECT 
    'HIERARQUIA CORRIGIDA' as status,
    p.codigo as produto_codigo,
    p.nome as produto_nome,
    CASE 
        WHEN i.nome IS NOT NULL THEN i.nome 
        WHEN p_sub.nome IS NOT NULL THEN '📦 ' || p_sub.nome 
        ELSE 'ERROR'
    END as componente,
    r.quantidade_necessaria
FROM receitas r
JOIN produtos p ON p.id = r.produto_id
LEFT JOIN insumos i ON i.id = r.insumo_id
LEFT JOIN produtos p_sub ON p_sub.id = r.insumo_id  -- Caso seja sub-produto
WHERE r.bar_id = 3 
    AND p.codigo IN ('pc0053', 'pc0024')  -- Coxinha, Croquete
ORDER BY p.nome, r.quantidade_necessaria DESC;

-- 5. APLICAR LÓGICA DE INSUMOS CHEFE NOS RECHEIOS (onde estão as proteínas)
UPDATE receitas 
SET insumo_chefe_id = (
    SELECT r2.insumo_id 
    FROM receitas r2 
    JOIN insumos i2 ON i2.id = r2.insumo_id
    WHERE r2.produto_id = receitas.produto_id
        AND r2.bar_id = 3
        AND (
            LOWER(i2.nome) LIKE '%frango%' OR 
            LOWER(i2.nome) LIKE '%carne%' OR 
            LOWER(i2.nome) LIKE '%peixe%' OR 
            LOWER(i2.nome) LIKE '%bacon%'
        )
    ORDER BY r2.quantidade_necessaria DESC
    LIMIT 1
)
WHERE bar_id = 3 
    AND produto_id IN (
        SELECT id FROM produtos 
        WHERE codigo IN ('pc0036', 'pc0048', 'pc0054')  -- Recheios
        AND bar_id = 3
    );

COMMIT; 