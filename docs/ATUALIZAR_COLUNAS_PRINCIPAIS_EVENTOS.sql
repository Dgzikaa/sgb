-- ATUALIZAR COLUNAS PRINCIPAIS DA TABELA EVENTOS PARA 06/08
-- Execute este SQL no Supabase SQL Editor:

-- 1. Verificar quais são as colunas que aparecem no dashboard
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND (column_name LIKE '%te%' OR column_name LIKE '%tb%' OR column_name LIKE '%real%')
ORDER BY column_name;

-- 2. Verificar valores atuais
SELECT 
  data_evento,
  -- Colunas ContaHub específicas
  te_real_contahub,
  tb_real_contahub,
  -- Possíveis colunas principais
  te_real,
  tb_real,
  real_te,
  real_tb
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 3. Atualizar TODAS as colunas possíveis com os valores corretos
UPDATE eventos 
SET 
  -- Atualizar colunas principais que podem aparecer no dashboard
  te_real = te_real_contahub,  -- Se existir
  tb_real = tb_real_contahub,  -- Se existir
  real_te = te_real_contahub,  -- Se existir  
  real_tb = tb_real_contahub   -- Se existir
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 4. Verificar se atualizou corretamente
SELECT 
  data_evento,
  te_real_contahub as te_contahub_correto,
  tb_real_contahub as tb_contahub_correto,
  te_real as te_principal,
  tb_real as tb_principal,
  (te_real_contahub + tb_real_contahub) as soma_tickets
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';
