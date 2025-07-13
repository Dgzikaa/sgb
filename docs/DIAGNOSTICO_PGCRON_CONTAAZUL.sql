-- ============================================
-- 🔍 DIAGNÓSTICO PGCRON CONTAAZUL - SGB V2
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. VERIFICAR SE PG_CRON ESTÁ HABILITADO
SELECT 
    extname as extensao,
    extversion as versao,
    case when extname = 'pg_cron' then '✅ Habilitado' else '❌ Não encontrado' end as status
FROM pg_extension 
WHERE extname = 'pg_cron';

-- 2. LISTAR TODOS OS JOBS DE CRON ATIVOS
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname,
    case 
        when jobname LIKE '%contaazul%' then '🟡 ContaAzul'
        when jobname LIKE '%meta%' then '🔵 Meta'
        else '⚪ Outro'
    end as tipo
FROM cron.job
ORDER BY jobname;

-- 3. VERIFICAR JOBS ESPECÍFICOS DO CONTAAZUL
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job 
WHERE jobname LIKE '%contaazul%'
   OR command LIKE '%contaazul%';

-- 4. ÚLTIMAS EXECUÇÕES DOS JOBS
SELECT 
    j.jobname,
    r.runid,
    r.job_pid,
    r.database,
    r.username,
    r.command,
    r.status,
    r.return_message,
    r.start_time AT TIME ZONE 'America/Sao_Paulo' as inicio_brasilia,
    r.end_time AT TIME ZONE 'America/Sao_Paulo' as fim_brasilia,
    EXTRACT(EPOCH FROM (r.end_time - r.start_time)) as duracao_segundos
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname LIKE '%contaazul%'
   OR j.command LIKE '%contaazul%'
ORDER BY r.start_time DESC
LIMIT 10;

-- 5. VERIFICAR SE HÁ JOBS FALHANDO
SELECT 
    j.jobname,
    COUNT(*) as total_execucoes,
    COUNT(CASE WHEN r.status = 'succeeded' THEN 1 END) as sucessos,
    COUNT(CASE WHEN r.status = 'failed' THEN 1 END) as falhas,
    ROUND(
        COUNT(CASE WHEN r.status = 'succeeded' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as taxa_sucesso_percent
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname LIKE '%contaazul%'
   OR j.command LIKE '%contaazul%'
GROUP BY j.jobname
ORDER BY taxa_sucesso_percent DESC;

-- ============================================
-- 🛠️ COMANDOS DE CONFIGURAÇÃO
-- ============================================

-- PARA REMOVER UM JOB ESPECÍFICO (substitua o nome):
-- SELECT cron.unschedule('contaazul_sync_bar_1');

-- PARA CRIAR UM NOVO JOB (substitua barId pelo ID do seu bar):
/*
SELECT cron.schedule(
    'contaazul_sync_bar_1', -- Nome do job
    '0 0,4,8,12,16,20 * * *', -- A cada 4 horas
    $$
    SELECT net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contaazul-sync-automatico',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY_AQUI'
      ),
      body := jsonb_build_object(
        'barId', '1',
        'source', 'pgcron'
      )
    );
    $$
);
*/

-- PARA TESTAR A EDGE FUNCTION MANUALMENTE:
/*
SELECT net.http_post(
  url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contaazul-sync-automatico',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY_AQUI'
  ),
  body := jsonb_build_object(
    'barId', '1',
    'source', 'teste_manual'
  )
);
*/

-- PARA VERIFICAR SE A EXTENSÃO http ESTÁ HABILITADA:
SELECT extname FROM pg_extension WHERE extname = 'http';

-- SE NÃO ESTIVER, HABILITE:
-- CREATE EXTENSION IF NOT EXISTS http;

-- ============================================
-- 📊 RELATÓRIO COMPLETO
-- ============================================

-- RESUMO DO STATUS
SELECT 
    'PGCRON STATUS' as categoria,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
        THEN '✅ pg_cron habilitado'
        ELSE '❌ pg_cron NÃO habilitado'
    END as status

UNION ALL

SELECT 
    'HTTP EXTENSION' as categoria,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') 
        THEN '✅ http habilitado'
        ELSE '❌ http NÃO habilitado'
    END as status

UNION ALL

SELECT 
    'JOBS CONTAAZUL' as categoria,
    COALESCE(
        (SELECT COUNT(*)::text || ' jobs ativos' 
         FROM cron.job 
         WHERE jobname LIKE '%contaazul%' AND active = true),
        '0 jobs ativos'
    ) as status

UNION ALL

SELECT 
    'ÚLTIMA EXECUÇÃO' as categoria,
    COALESCE(
        (SELECT r.start_time AT TIME ZONE 'America/Sao_Paulo'::text
         FROM cron.job_run_details r
         JOIN cron.job j ON r.jobid = j.jobid
         WHERE j.jobname LIKE '%contaazul%'
         ORDER BY r.start_time DESC LIMIT 1),
        'Nunca executado'
    ) as status;

-- ============================================
-- 📋 INSTRUÇÕES DE USO
-- ============================================

/*
🔧 COMO USAR ESTE SCRIPT:

1. DIAGNÓSTICO:
   - Execute as queries 1-5 para ver o status atual
   - Verifique se há jobs ativos e se estão funcionando

2. CONFIGURAÇÃO:
   - Se não há jobs: use a query de criação (descomente e configure)
   - Se há jobs com problemas: remova e recrie
   - Substitua barId pelo ID do seu bar
   - Substitua SEU_SERVICE_ROLE_KEY_AQUI pela sua service role key

3. TESTE:
   - Use a query de teste manual para verificar se a edge function funciona
   - Monitore as execuções na query 4

4. NOVA API:
   - Alternativamente, use: /api/contaazul/configurar-pgcron-v2
   - POST com { "barId": "1", "action": "configure" }

🎯 ARQUITETURA ATUAL:
pgcron → edge function → /api/contaazul/sync-dados-brutos → /api/contaazul/sync-categorizado-corrigido

✅ RESULTADO ESPERADO:
- Jobs executando de 4 em 4 horas
- Dados sendo coletados automaticamente
- Notificações no Discord
*/ 