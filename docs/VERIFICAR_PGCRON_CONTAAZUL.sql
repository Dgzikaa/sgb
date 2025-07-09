-- ========================================
-- 🔍 VERIFICAR E DESATIVAR CRON JOBS CONTAAZUL
-- ========================================
-- Execute no Supabase SQL Editor para verificar jobs ativos

-- 1. LISTAR TODOS OS CRON JOBS ATIVOS
SELECT 
  jobname, 
  schedule, 
  active,
  command,
  created_at
FROM cron.job 
ORDER BY jobname;

-- 2. VERIFICAR SE HÁ JOBS RELACIONADOS AO CONTAAZUL
SELECT 
  jobname, 
  schedule, 
  active,
  command
FROM cron.job 
WHERE LOWER(jobname) LIKE '%contaazul%' 
   OR LOWER(command) LIKE '%contaazul%'
   OR LOWER(jobname) LIKE '%conta_azul%';

-- 3. SE ENCONTRAR JOBS DO CONTAAZUL, DESATIVAR COM:
-- SELECT cron.unschedule('nome_do_job_contaazul_aqui');

-- 4. VERIFICAR JOBS RESTANTES (SÓ DEVE TER META)
SELECT 
  jobname, 
  schedule, 
  active,
  CASE 
    WHEN LOWER(jobname) LIKE '%meta%' THEN '✅ Meta - Manter ativo'
    WHEN LOWER(jobname) LIKE '%contaazul%' THEN '❌ ContaAzul - DESATIVAR'
    WHEN LOWER(jobname) LIKE '%contahub%' THEN '❌ ContaHub - DESATIVAR'
    ELSE '❓ Verificar manualmente'
  END as acao_recomendada
FROM cron.job 
ORDER BY jobname;

-- ========================================
-- ✅ RESULTADO ESPERADO APÓS LIMPEZA:
-- Só devem restar jobs do Meta:
-- • meta-collect-morning (8h)  
-- • meta-collect-evening (20h)
-- ======================================== 