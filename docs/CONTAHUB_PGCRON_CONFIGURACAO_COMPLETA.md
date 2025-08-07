# CONFIGURAÇÃO PG_CRON CONTAHUB - EXECUÇÃO DIÁRIA 07:00

## 🎯 **OBJETIVO**
Configurar pg_cron no Supabase para executar automaticamente a sincronização do ContaHub todos os dias às **07:00 (horário de Brasília)**.

## ⏰ **HORÁRIOS**
- **Brasília**: 07:00 
- **UTC**: 10:00 (usado no pg_cron)
- **Cron Expression**: `0 10 * * *`

## 📋 **ETAPA 1: EXECUTAR SQL NO SUPABASE**

Acesse o **Supabase SQL Editor** e execute o seguinte SQL:

```sql
-- =====================================================
-- CONFIGURAR PG_CRON PARA CONTAHUB - DIÁRIO 07:00
-- =====================================================

-- 1. REMOVER JOBS ANTIGOS (SE EXISTIREM)
SELECT cron.unschedule('contahub-sync-daily-07h');
SELECT cron.unschedule('contahub-sync-automatico');
SELECT cron.unschedule('contahub-daily');

-- 2. CRIAR NOVO JOB - DIÁRIO ÀS 07:00 BRASÍLIA (10:00 UTC)
SELECT cron.schedule(
  'contahub-sync-daily-07h',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-sync-automatico',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0"}'::jsonb,
      body := json_build_object(
        'bar_id', 3,
        'data_date', CURRENT_DATE::text
      )::text
    ) as request_id;
  $$
);
```

## 📋 **ETAPA 2: VERIFICAR CONFIGURAÇÃO**

Execute este SQL para verificar se o job foi criado:

```sql
-- VERIFICAR SE O JOB FOI CRIADO
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW()) < 10 THEN 'Hoje às 10:00 UTC (07:00 Brasília)'
    ELSE 'Amanhã às 10:00 UTC (07:00 Brasília)'
  END as proxima_execucao
FROM cron.job 
WHERE jobname = 'contahub-sync-daily-07h';
```

## 📋 **ETAPA 3: LISTAR TODOS OS JOBS ATIVOS**

```sql
-- LISTAR TODOS OS JOBS ATIVOS
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE active = true
ORDER BY jobname;
```

## 🔍 **MONITORAMENTO**

### Verificar Execuções:
```sql
-- VERIFICAR ÚLTIMAS EXECUÇÕES DO CONTAHUB
SELECT 
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE command LIKE '%contahub%'
ORDER BY start_time DESC 
LIMIT 10;
```

### Testar Manualmente:
```sql
-- EXECUTAR TESTE MANUAL (USAR APENAS SE NECESSÁRIO)
SELECT
  net.http_post(
    url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-sync-automatico',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0"}'::jsonb,
    body := json_build_object(
      'bar_id', 3,
      'data_date', CURRENT_DATE::text
    )::text
  ) as request_id;
```

## ✅ **RESULTADO ESPERADO**

Após executar o SQL, você deve ter:

1. **Job Ativo**: `contahub-sync-daily-07h`
2. **Schedule**: `0 10 * * *` (diário às 10:00 UTC)
3. **Status**: `active = true`
4. **Próxima Execução**: Amanhã às 07:00 (Brasília)

## 🎯 **FUNCIONAMENTO**

A partir de agora, **todos os dias às 07:00 (horário de Brasília)**:

1. 🕐 pg_cron executa automaticamente
2. 📞 Chama a Edge Function `contahub-sync-automatico`
3. 📊 Sincroniza dados do ContaHub para `bar_id=3`
4. 📅 Usa `CURRENT_DATE` como data dos dados
5. 🔔 Envia notificação Discord (se configurado)
6. ✅ Dados salvos na tabela `contahub_raw_data`

## 🚨 **IMPORTANTE**

- **Service Role Key**: Já configurada no SQL acima
- **Timezone**: UTC no pg_cron, automaticamente convertido para Brasília
- **Error Handling**: Nativo do pg_cron
- **Logs**: Disponíveis em `cron.job_run_details`

## 📱 **API DE VERIFICAÇÃO**

Você também pode usar a API criada para verificar status:

```bash
# Verificar status
curl -X GET http://localhost:3000/api/configuracoes/contahub/setup-pgcron

# Obter SQL de configuração
curl -X POST http://localhost:3000/api/configuracoes/contahub/setup-pgcron
```

---

**🎉 APÓS EXECUTAR ESTE SQL, O CONTAHUB SERÁ SINCRONIZADO AUTOMATICAMENTE TODOS OS DIAS ÀS 07:00!**
