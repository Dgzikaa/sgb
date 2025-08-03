-- =====================================================
-- REMOVER CONSTRAINT CONTAHUB RAW DATA
-- =====================================================
-- Problema: Constraint única impede múltiplos lotes
-- Solução: Remover constraint para permitir lotes sequenciais

-- Verificar se a constraint existe
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'contahub_raw_data' 
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name = 'contahub_raw_data_bar_id_data_type_data_date_key';

-- Remover a constraint única que impede múltiplos lotes
ALTER TABLE contahub_raw_data 
DROP CONSTRAINT IF EXISTS contahub_raw_data_bar_id_data_type_data_date_key;

-- Verificar se foi removida
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'contahub_raw_data' 
    AND tc.constraint_type = 'UNIQUE';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ Constraint removida com sucesso
-- ✅ Agora permite múltiplos lotes para mesma data/tipo
-- ✅ Edge Function pode inserir lotes sequenciais
-- ✅ Trigger pode processar todos os lotes independentemente
-- ===================================================== 