# CMV Semanal - Cron Job Automático

Edge Function que processa automaticamente o CMV Semanal toda segunda-feira às 6h da manhã.

## 🚀 O que faz

1. **Busca dados automáticos** da semana atual:
   - Faturamento e comissões (ContaHub)
   - Consumo dos sócios e contas especiais
   - Compras por categoria (NIBO)
   - Estoque final (contagem_estoque_insumos)

2. **Calcula estoque inicial** (= estoque final da semana anterior)

3. **Cria ou atualiza** registro no `cmv_semanal`:
   - Se não existe: cria novo
   - Se existe: atualiza, **preservando campos manuais**

## 📋 Setup Manual (Primeira Vez)

### 1. Deploy da Edge Function

```bash
cd F:\Zykor
supabase functions deploy cmv-semanal-cron --no-verify-jwt
```

### 2. Configurar pg_cron no Supabase

Acesse o **SQL Editor** no Supabase Dashboard e execute:

```sql
-- Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar job que roda toda segunda-feira às 6h (horário UTC)
SELECT cron.schedule(
  'cmv-semanal-automatico',           -- Nome do job
  '0 6 * * 1',                         -- Segunda-feira às 6h UTC (3h BRT)
  $$
  SELECT
    net.http_post(
      url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/cmv-semanal-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);
```

### 3. Verificar se o job foi criado

```sql
-- Listar todos os cron jobs
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 🔧 Gerenciar Cron Job

### Ver status do job
```sql
SELECT * FROM cron.job WHERE jobname = 'cmv-semanal-automatico';
```

### Desabilitar temporariamente
```sql
UPDATE cron.job SET active = false WHERE jobname = 'cmv-semanal-automatico';
```

### Reabilitar
```sql
UPDATE cron.job SET active = true WHERE jobname = 'cmv-semanal-automatico';
```

### Remover job
```sql
SELECT cron.unschedule('cmv-semanal-automatico');
```

### Executar manualmente (teste)
```sql
SELECT
  net.http_post(
    url := 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/cmv-semanal-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object()
  ) AS request_id;
```

## 📅 Cronograma

- **Frequência**: Toda segunda-feira às 6h UTC (3h BRT)
- **Formato cron**: `0 6 * * 1`
  - `0` = minuto 0
  - `6` = hora 6 (UTC)
  - `*` = todo dia do mês
  - `*` = todo mês
  - `1` = segunda-feira

## 🔍 Monitoramento

### Ver logs da Edge Function
No Supabase Dashboard:
1. Vá em **Edge Functions**
2. Selecione `cmv-semanal-cron`
3. Clique em **Logs**

### Ver histórico de execuções do cron
```sql
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
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cmv-semanal-automatico')
ORDER BY start_time DESC
LIMIT 20;
```

## ⚠️ Importante

1. **Campos Manuais Preservados**:
   - `outros_ajustes`
   - `ajuste_bonificacoes`
   - `cmv_teorico_percent`
   
   Estes campos **NÃO** são sobrescritos quando o cron atualiza um registro existente.

2. **Horário UTC**: O cron usa horário UTC. Para BRT (UTC-3):
   - 6h UTC = 3h BRT
   - Ajuste conforme necessário

3. **Service Role Key**: O job usa a service role key do Supabase. Certifique-se de que ela está configurada corretamente.

## 🧪 Testar Manualmente

Você também pode testar chamando a Edge Function direto via HTTP:

```bash
curl -X POST https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/cmv-semanal-cron \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Ou via frontend:

```typescript
const response = await fetch('/api/cron/cmv-semanal', {
  method: 'POST'
});
```

## 📊 Dados Processados

A Edge Function busca e calcula:

- ✅ **ContaHub**: Faturamento, comissões, consumos
- ✅ **NIBO**: Compras por categoria
- ✅ **Estoque**: Valores finais por tipo
- ✅ **Estoque Inicial**: Da semana anterior
- ✅ **Contas Especiais**: Sócios, Banda/DJ, Benefícios, ADM

## 🛠️ Troubleshooting

**Problema**: Job não executa
```sql
-- Verificar se está ativo
SELECT * FROM cron.job WHERE jobname = 'cmv-semanal-automatico';

-- Verificar logs de erro
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

**Problema**: Dados não batem
- Verifique os logs da Edge Function
- Execute manualmente para debug
- Confira se os dados fonte estão corretos (ContaHub, NIBO, Estoque)

