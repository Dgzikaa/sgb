-- =====================================================
-- ANALISAR PROBLEMA ANALÍTICO - TIMEOUT ESPECÍFICO
-- =====================================================
-- Problema: Analítico está dando timeout mesmo sendo menor que tempo
-- Solução: Verificar estrutura e otimizar processamento

-- 1. VERIFICAR ESTRUTURA DA TABELA ANALÍTICO
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contahub_analitico'
ORDER BY ordinal_position;

-- 2. VERIFICAR ÍNDICES DA TABELA ANALÍTICO
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'contahub_analitico';

-- 3. VERIFICAR TRIGGERS ATIVOS
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'contahub_analitico';

-- 4. VERIFICAR DADOS RECENTES ANALÍTICO
SELECT 
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_registro,
    MAX(created_at) as ultimo_registro,
    COUNT(CASE WHEN processed = true THEN 1 END) as processados,
    COUNT(CASE WHEN processed = false THEN 1 END) as nao_processados
FROM contahub_analitico 
WHERE trn_dtgerencial = '2025-08-02';

-- 5. VERIFICAR TAMANHO DOS DADOS JSON
SELECT 
    data_type,
    COUNT(*) as total_registros,
    AVG(LENGTH(raw_json::text)) as tamanho_medio_json,
    MAX(LENGTH(raw_json::text)) as tamanho_maximo_json
FROM contahub_raw_data 
WHERE data_date = '2025-08-02'
GROUP BY data_type
ORDER BY tamanho_medio_json DESC;

-- 6. VERIFICAR SE HÁ DADOS DUPLICADOS
SELECT 
    bar_id,
    data_type,
    data_date,
    COUNT(*) as total_registros
FROM contahub_raw_data 
WHERE data_date = '2025-08-02'
GROUP BY bar_id, data_type, data_date
HAVING COUNT(*) > 1;

-- =====================================================
-- POSSÍVEIS SOLUÇÕES:
-- =====================================================

-- SOLUÇÃO 1: Otimizar trigger para analítico
-- Verificar se o trigger está processando dados muito grandes

-- SOLUÇÃO 2: Quebrar processamento do analítico em lotes menores
-- Reduzir de 500 para 100 registros por lote

-- SOLUÇÃO 3: Verificar se há campos problemáticos no analítico
-- Alguns campos podem estar causando problemas de conversão

-- SOLUÇÃO 4: Adicionar índices específicos para analítico
-- CREATE INDEX idx_contahub_analitico_trn_dtgerencial ON contahub_analitico(trn_dtgerencial);

-- ===================================================== 