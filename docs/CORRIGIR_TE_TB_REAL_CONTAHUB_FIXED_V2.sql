-- CORREÇÃO IMEDIATA TE.REAL E TB.REAL - VERSÃO CORRIGIDA V2
-- Execute este SQL no Supabase SQL Editor:

-- 1. Verificar colunas da tabela eventos relacionadas a TE e TB
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND table_schema = 'public'
AND (column_name LIKE '%te_%' OR column_name LIKE '%tb_%' OR column_name LIKE '%real%')
ORDER BY column_name;

-- 2. Verificar dados disponíveis para 06/08/2025
SELECT 'CONTAHUB_PERIODO - VR_COUVERT' as tabela, COUNT(*) as registros, SUM(vr_couvert) as total_couvert
FROM contahub_periodo 
WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06'
UNION ALL
SELECT 'CONTAHUB_PAGAMENTOS - VR_LIQUIDO' as tabela, COUNT(*) as registros, SUM(vr_liquido) as total_receita
FROM contahub_pagamentos 
WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06'
UNION ALL
SELECT 'EVENTOS - CL_REAL' as tabela, cl_real as registros, real_r as total_receita
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 3. Calcular TE.Real e TB.Real corretos
WITH dados_contahub AS (
  SELECT 
    -- Soma do couvert (TE = Ticket de Entrada)
    COALESCE(SUM(cp.vr_couvert), 0) as total_couvert,
    
    -- Receita total dos pagamentos (VR_LIQUIDO!)
    COALESCE(SUM(cpag.vr_liquido), 0) as receita_total,
    
    -- Clientes reais do evento
    e.cl_real
  FROM eventos e
  LEFT JOIN contahub_periodo cp ON cp.bar_id = e.bar_id AND DATE(cp.data_evento) = e.data_evento
  LEFT JOIN contahub_pagamentos cpag ON cpag.bar_id = e.bar_id AND DATE(cpag.data_evento) = e.data_evento
  WHERE e.bar_id = 3 AND e.data_evento = '2025-08-06'
  GROUP BY e.cl_real
)
SELECT 
  total_couvert,
  receita_total,
  cl_real,
  -- TE.Real = Ticket de Entrada (couvert médio por cliente)
  CASE 
    WHEN cl_real > 0 THEN ROUND(total_couvert / cl_real, 2)
    ELSE 0 
  END as te_real_correto,
  
  -- TB.Real = Ticket de Bar (receita - couvert) / clientes
  CASE 
    WHEN cl_real > 0 THEN ROUND((receita_total - total_couvert) / cl_real, 2)
    ELSE 0 
  END as tb_real_correto,
  
  -- Verificação: TE.Real + TB.Real deve = Receita por cliente
  CASE 
    WHEN cl_real > 0 THEN ROUND(receita_total / cl_real, 2)
    ELSE 0 
  END as receita_por_cliente
FROM dados_contahub;

-- 4. Atualizar eventos com valores corretos (usando colunas _contahub)
UPDATE eventos 
SET 
  te_real_contahub = (
    SELECT CASE 
      WHEN cl_real > 0 THEN 
        COALESCE((SELECT SUM(vr_couvert) FROM contahub_periodo WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06'), 0) / cl_real
      ELSE 0 
    END
  ),
  tb_real_contahub = (
    SELECT CASE 
      WHEN cl_real > 0 THEN 
        (COALESCE((SELECT SUM(vr_liquido) FROM contahub_pagamentos WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06'), 0) - 
         COALESCE((SELECT SUM(vr_couvert) FROM contahub_periodo WHERE bar_id = 3 AND DATE(data_evento) = '2025-08-06'), 0)) / cl_real
      ELSE 0 
    END
  ),
  ultima_sync_contahub = NOW()
WHERE bar_id = 3 AND data_evento = '2025-08-06';

-- 5. Verificar resultado final
SELECT 
  data_evento,
  cl_real,
  real_r as receita_total,
  te_real_contahub as ticket_entrada_couvert,
  tb_real_contahub as ticket_bar,
  (te_real_contahub + tb_real_contahub) as soma_tickets,
  ROUND(real_r / NULLIF(cl_real, 0), 2) as receita_por_cliente_calculada,
  CASE 
    WHEN ABS((te_real_contahub + tb_real_contahub) - ROUND(real_r / NULLIF(cl_real, 0), 2)) < 0.01 THEN '✅ CORRETO'
    ELSE '❌ DIFERENÇA'
  END as validacao
FROM eventos 
WHERE bar_id = 3 AND data_evento = '2025-08-06';
