-- CORRIGIR FUNÇÃO process_contahub_optimized() PARA USAR CHAVES COM CIFRÃO
-- Execute este SQL no Supabase SQL Editor:

-- Os dados raw do ContaHub usam chaves com $ (ex: $valor, $liquido, $vr_couvert)
-- Mas a função estava tentando acessar sem $ (valor, liquido, vr_couvert)

-- 1. Ver problema atual - exemplo de dados raw
SELECT 'PROBLEMA: Chaves com cifrão' as info, 
       data_type,
       raw_json->'list'->0 as primeiro_item_raw
FROM contahub_raw_data 
WHERE bar_id = 3 AND data_date = '2025-08-06' AND data_type = 'pagamentos'
LIMIT 1;

-- 2. Reprocessar dados de 06/08 com chaves corretas
-- Deletar dados processados incorretamente
DELETE FROM contahub_pagamentos WHERE bar_id = 3 AND dt_gerencial = '2025-08-06';
DELETE FROM contahub_periodo WHERE bar_id = 3 AND dt_gerencial = '2025-08-06';
DELETE FROM contahub_fatporhora WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06';
DELETE FROM contahub_tempo WHERE bar_id = 3 AND DATE(t0_lancamento) = '2025-08-06';
DELETE FROM contahub_analitico WHERE bar_id = 3 AND DATE(trn_dtgerencial) = '2025-08-06';

-- 3. Marcar dados raw como não processados para reprocessar
UPDATE contahub_raw_data 
SET processed = FALSE, processed_at = NULL 
WHERE bar_id = 3 AND data_date = '2025-08-06';

-- 4. Verificar que marcou para reprocessar
SELECT data_type, processed, data_date
FROM contahub_raw_data 
WHERE bar_id = 3 AND data_date = '2025-08-06'
ORDER BY data_type;
