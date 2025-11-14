# 🔄 Cron Job - NPS e Pesquisa da Felicidade

Configuração automática para sincronizar dados de NPS e Pesquisa da Felicidade do Google Sheets.

## 🚀 O que faz

### Edge Function: `sync-nps`
- Sincroniza dados de **NPS** do Google Sheets
- Planilha: `1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4` (aba "NPS")
- Converte percentuais para escala 1-5
- Calcula médias automaticamente

### Edge Function: `sync-pesquisa-felicidade`
- Sincroniza dados de **Pesquisa da Felicidade** do Google Sheets  
- Planilha: `1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn` (aba "Pesquisa da Felicidade")
- Converte percentuais para escala 1-5
- Calcula médias automaticamente

## 📋 Setup

### 1. Deploy das Edge Functions (se ainda não feito)

```bash
cd F:\Zykor\backend

# Deploy NPS
npx supabase functions deploy sync-nps --no-verify-jwt

# Deploy Pesquisa da Felicidade
npx supabase functions deploy sync-pesquisa-felicidade --no-verify-jwt
```

### 2. Configurar pg_cron no Supabase

Acesse o **SQL Editor** no Supabase Dashboard (`https://supabase.com/dashboard/project/uqtgsvujwcbymjmvkjhy/sql`) e execute:

```sql
-- ============================================
-- 🔧 CONFIGURAÇÃO CRON - NPS E FELICIDADE
-- ============================================

-- 1. Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Remover jobs antigos (se existirem)
SELECT cron.unschedule('sync-nps-diario');
SELECT cron.unschedule('sync-felicidade-diario');
SELECT cron.unschedule('sync-pesquisas-diario');

-- 3. Criar job para NPS - Diário às 8h UTC (5h BRT)
SELECT cron.schedule(
  'sync-nps-diario',
  '0 8 * * *',  -- 08:00 UTC = 05:00 Brasília
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-nps',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI0MTQwNCwiZXhwIjoyMDQzODE3NDA0fQ.Z2Nb6XdqDFk9TkRYaD_gRWHYo-0dVZpjVVGmLrZ5G5Y'
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);

-- 4. Criar job para Pesquisa da Felicidade - Diário às 8h05 UTC (5h05 BRT)
SELECT cron.schedule(
  'sync-felicidade-diario',
  '5 8 * * *',  -- 08:05 UTC = 05:05 Brasília (5min após NPS)
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-pesquisa-felicidade',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI0MTQwNCwiZXhwIjoyMDQzODE3NDA0fQ.Z2Nb6XdqDFk9TkRYaD_gRWHYo-0dVZpjVVGmLrZ5G5Y'
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);

-- 5. Verificar se os jobs foram criados
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE jobname IN ('sync-nps-diario', 'sync-felicidade-diario')
ORDER BY jobname;
```

### 3. Verificar Jobs Criados

```sql
-- Listar todos os cron jobs de pesquisas
SELECT * FROM cron.job WHERE jobname LIKE '%sync-%';

-- Ver histórico de execuções
SELECT 
  jobid,
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
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname IN ('sync-nps-diario', 'sync-felicidade-diario')
)
ORDER BY start_time DESC 
LIMIT 20;
```

## 🔧 Gerenciar Cron Jobs

### Ver status dos jobs
```sql
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE jobname IN ('sync-nps-diario', 'sync-felicidade-diario');
```

### Desabilitar temporariamente
```sql
-- Desabilitar NPS
UPDATE cron.job SET active = false WHERE jobname = 'sync-nps-diario';

-- Desabilitar Felicidade
UPDATE cron.job SET active = false WHERE jobname = 'sync-felicidade-diario';
```

### Reabilitar
```sql
-- Reabilitar NPS
UPDATE cron.job SET active = true WHERE jobname = 'sync-nps-diario';

-- Reabilitar Felicidade
UPDATE cron.job SET active = true WHERE jobname = 'sync-felicidade-diario';
```

### Remover job completamente
```sql
-- Remover NPS
SELECT cron.unschedule('sync-nps-diario');

-- Remover Felicidade
SELECT cron.unschedule('sync-felicidade-diario');
```

### Executar manualmente (teste)
```sql
-- Testar NPS
SELECT
  net.http_post(
    url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-nps',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI0MTQwNCwiZXhwIjoyMDQzODE3NDA0fQ.Z2Nb6XdqDFk9TkRYaD_gRWHYo-0dVZpjVVGmLrZ5G5Y"}'::jsonb
  );

-- Testar Felicidade
SELECT
  net.http_post(
    url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-pesquisa-felicidade',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODI0MTQwNCwiZXhwIjoyMDQzODE3NDA0fQ.Z2Nb6XdqDFk9TkRYaD_gRWHYo-0dVZpjVVGmLrZ5G5Y"}'::jsonb
  );
```

## 📅 Cronograma

### NPS
- **Horário**: 08:00 UTC (05:00 Brasília)
- **Frequência**: Diária
- **Formato cron**: `0 8 * * *`

### Pesquisa da Felicidade
- **Horário**: 08:05 UTC (05:05 Brasília)
- **Frequência**: Diária
- **Formato cron**: `5 8 * * *`

> **Nota**: 5 minutos de diferença para evitar sobrecarga no Google Sheets API

## 🔍 Monitoramento

### Ver últimas execuções
```sql
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time,
  EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) AS duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname IN ('sync-nps-diario', 'sync-felicidade-diario')
ORDER BY jrd.start_time DESC
LIMIT 10;
```

### Verificar próxima execução
```sql
SELECT 
  jobname,
  next_run AT TIME ZONE 'America/Sao_Paulo' AS proxima_execucao_brt,
  next_run AS proxima_execucao_utc
FROM cron.job 
WHERE jobname IN ('sync-nps-diario', 'sync-felicidade-diario');
```

## 🧪 Testar via UI (Manual)

Você também pode testar manualmente pela página:

1. Acesse: `/ferramentas/nps`
2. Clique no botão **"Sincronizar Planilha"**
3. Aguarde o processo (sincroniza ambos: NPS + Felicidade)

## 📊 Estrutura das Planilhas

### NPS
**ID**: `1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4`
**Aba**: "NPS" (gid=38070213)

Colunas esperadas:
- Col 0: Data
- Col 1: Setor
- Col 2: Quórum
- Cols 3-8: 6 perguntas (percentuais)
- Col 9: Nome do funcionário (opcional)

### Pesquisa da Felicidade
**ID**: `1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn`
**Aba**: "Pesquisa da Felicidade"

Colunas esperadas:
- Col 0: Data
- Col 1: Setor
- Col 2: Quórum
- Cols 3-7: 5 dimensões (percentuais)

## ⚠️ Importante

1. **Service Role Key**: Hard-coded no SQL (seguro dentro do Supabase)
2. **Horário UTC**: Sempre ajustar para BRT (UTC-3)
3. **Google Sheets API**: Usa Service Account autenticado
4. **Upsert**: Evita duplicatas (conflito em: `bar_id`, `data_pesquisa`, `funcionario_nome`, `setor`)

## 🔐 Permissões

As Edge Functions usam Service Account do Google:
- **Email**: `contaazul-sheets-service@canvas-landing-447918-h7.iam.gserviceaccount.com`
- **Acesso**: Somente leitura nas planilhas configuradas
- **Segurança**: Private key embutida nas Edge Functions (seguro no Supabase)

## ✅ Checklist de Deploy

- [ ] Edge Functions deployadas (`sync-nps` e `sync-pesquisa-felicidade`)
- [ ] pg_cron configurado (jobs criados)
- [ ] Jobs verificados (`SELECT * FROM cron.job`)
- [ ] Teste manual executado com sucesso
- [ ] Histórico monitorado (`cron.job_run_details`)
- [ ] Horários ajustados para BRT
- [ ] Planilhas com permissão para Service Account

---

**Última atualização**: 2025-01-14

