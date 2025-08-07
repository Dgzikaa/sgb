-- ATUALIZAR EVENTOS PRINCIPAIS PARA 06/08 COM VALORES CORRETOS
-- Execute este SQL no Supabase SQL Editor:

-- 1. Primeiro, verificar quais colunas existem na tabela eventos
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND (column_name LIKE '%te%' OR column_name LIKE '%tb%')
ORDER BY column_name;

-- 2. Ver valores atuais do dia 06/08
SELECT 
  data_evento,
  -- Todas as possíveis colunas TE e TB
  te_real_contahub,
  tb_real_contahub,
  te_real,
  tb_real,
  real_te,
  real_tb
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 3. Atualizar TODAS as colunas relacionadas a TE e TB
UPDATE eventos 
SET 
  -- Colunas que podem aparecer no dashboard
  te_real = 18.43,  -- Valor correto calculado: R$ 1437,27 / 78 clientes
  tb_real = 79.82,  -- Valor correto calculado: R$ 6225,43 / 78 clientes
  real_te = 18.43,  -- Se existir
  real_tb = 79.82   -- Se existir
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 4. Verificar se atualizou corretamente
SELECT 
  data_evento,
  te_real_contahub as te_contahub,
  tb_real_contahub as tb_contahub,
  te_real as te_principal,
  tb_real as tb_principal,
  (COALESCE(te_real, 0) + COALESCE(tb_real, 0)) as soma_tickets_principal,
  cl_real,
  real_r
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 5. Se a VIEW usar outras colunas, verificar planejamento_comercial_view
SELECT 
  data_evento,
  te_real,
  tb_real,
  te_plan,
  tb_plan
FROM planejamento_comercial_view 
WHERE bar_id = 3 AND data_evento = '2025-08-06';
