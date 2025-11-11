# 📊 INSTRUÇÕES - SINCRONIZAÇÃO DE CONTAGEM VIA GOOGLE SHEETS

## 🎯 Resumo

Sistema completo para importar contagens de estoque do Google Sheets para o Zykor automaticamente.

**Planilha**: [Pedidos e Estoque | Ordinário](https://docs.google.com/spreadsheets/d/1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8)

**Dados Disponíveis**:
- 📅 596 datas com dados (26/01/2025 até 14/09/2026)
- 📦 7.704 contagens disponíveis
- 🔧 ~200 insumos cadastrados

---

## 🚀 PASSO 1: Importação Histórica

### Listar datas disponíveis

```bash
node exemplo_teste/listar-datas-disponiveis.js
```

### Testar leitura de uma data específica

```bash
node exemplo_teste/testar-leitura-contagem.js 2025-11-03
```

### Importar TODO o histórico

**⚠️ IMPORTANTE**: Primeiro, inicie o servidor local:

```bash
cd frontend
npm run dev
```

Depois, em outro terminal:

```bash
# Importar TUDO (26/01/2025 até 14/09/2026)
node exemplo_teste/importar-contagem-sheets.js

# OU importar período específico
node exemplo_teste/importar-contagem-sheets.js 2025-01-26 2025-12-31

# OU importar apenas novembro/2025
node exemplo_teste/importar-contagem-sheets.js 2025-11-01 2025-11-30
```

**O que o script faz**:
1. ✅ Conecta no Google Sheets direto (sem CSV)
2. ✅ Identifica todas as datas com dados
3. ✅ Mapeia códigos de insumos (i0093, i0097, etc.)
4. ✅ Importa ESTOQUE FECHADO + PEDIDO
5. ✅ Calcula ESTOQUE INICIAL automaticamente
6. ✅ Calcula CONSUMO e VALOR automaticamente
7. ✅ Mostra relatório detalhado

**Tempo estimado**: ~5-10 minutos para importar tudo

---

## ⏰ PASSO 2: Configurar Sincronização Automática

### 2.1. Deploy da Edge Function

```bash
# Na raiz do projeto
bash scripts/deploy-sync-contagem.sh

# OU manualmente
cd backend
npx supabase functions deploy sync-contagem-sheets
```

### 2.2. Configurar Cron Job no Supabase

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em: **SQL Editor**
3. Execute os comandos SQL:

```sql
-- 1. Ativar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Obter URL do projeto
SELECT current_setting('app.settings.api_url');

-- 3. Criar cron job (executa todo dia às 18h - horário do servidor UTC)
SELECT cron.schedule(
  'sync-contagem-diaria',
  '0 21 * * *',  -- 21h UTC = 18h BRT (Brasília)
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJETO_AQUI.supabase.co/functions/v1/sync-contagem-sheets',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
    );
  $$
);

-- 4. Verificar se foi criado
SELECT * FROM cron.job WHERE jobname = 'sync-contagem-diaria';

-- 5. Listar todas as execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria')
ORDER BY start_time DESC 
LIMIT 10;
```

**⚠️ ATENÇÃO**: Substitua `SEU_PROJETO_AQUI` pela URL real do seu projeto!

### 2.3. (Opcional) Configurar Notificações Discord

Se quiser receber notificações de erros no Discord:

1. Crie um Webhook no Discord
2. No Supabase Dashboard, vá em **Settings → Edge Functions**
3. Adicione variável de ambiente:
   ```
   DISCORD_WEBHOOK_CONTAGEM = https://discord.com/api/webhooks/...
   ```

---

## 🔧 PASSO 3: Testar Sincronização Manual

### Testar a Edge Function direto

```bash
# Sincronizar hoje
curl -X POST "https://SEU_PROJETO.supabase.co/functions/v1/sync-contagem-sheets" \
  -H "Authorization: Bearer SEU_ANON_KEY"

# Sincronizar data específica
curl -X POST "https://SEU_PROJETO.supabase.co/functions/v1/sync-contagem-sheets?data=2025-11-10" \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

### Verificar logs da Edge Function

1. Supabase Dashboard → **Edge Functions**
2. Clique em `sync-contagem-sheets`
3. Ver **Logs** e **Invocations**

---

## 📱 PASSO 4: Interface Mobile Otimizada

A interface de contagem está otimizada para mobile/tablet:

**Acesse**: https://zykor.vercel.app/ferramentas/contagem-estoque

**Melhorias Mobile**:
- ✅ Cards grandes e fáceis de tocar
- ✅ Inputs ampliados (h-14) com fonte maior
- ✅ Labels com emojis para facilitar identificação
- ✅ Botão de salvar destacado e responsivo
- ✅ Feedback visual ao editar (borda amarela)
- ✅ Busca otimizada com foco no campo
- ✅ Sombras e transições suaves

---

## 🔄 Fluxo de Trabalho

### Durante a Transição (Atual)

```
1. Funcionário preenche Google Sheets manualmente (como hoje)
2. Cron job às 18h (21h UTC) importa automaticamente
3. Sistema Zykor fica sincronizado
4. Você pode visualizar em: /ferramentas/contagem-estoque
```

### Após Implementação Final

```
1. Funcionário usa direto o sistema Zykor
2. Dados salvos em tempo real no banco
3. Desativar cron job: SELECT cron.unschedule('sync-contagem-diaria');
```

---

## 🐛 Troubleshooting

### Problema: "Insumo não encontrado" durante importação

**Causa**: Código na planilha diferente do sistema

**Solução**:
1. Verificar código na planilha (coluna D, ex: i0093)
2. Verificar código no sistema: `/configuracoes/operacoes/insumos`
3. Ajustar para manter consistência

### Problema: Data não tem dados na planilha

**Causa**: Funcionário não preencheu ainda

**Solução**: Normal! Cron job tentará novamente amanhã

### Problema: Cron job não está executando

**Verificar**:
```sql
-- Ver se o job existe
SELECT * FROM cron.job WHERE jobname = 'sync-contagem-diaria';

-- Ver últimas execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria')
ORDER BY start_time DESC 
LIMIT 5;

-- Ver se houve erro
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria')
  AND status = 'failed'
ORDER BY start_time DESC;
```

**Recriar o job**:
```sql
-- Deletar job antigo
SELECT cron.unschedule('sync-contagem-diaria');

-- Recriar (ver passo 2.2)
```

### Problema: Edge Function com erro

**Ver logs**:
1. Supabase Dashboard → Edge Functions → sync-contagem-sheets → Logs
2. Procurar por mensagens de erro

**Testar manualmente**:
```bash
curl -X POST "https://SEU_PROJETO.supabase.co/functions/v1/sync-contagem-sheets" \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

---

## 📊 Monitoramento

### Ver contagens importadas

```sql
-- Contagens por data (últimos 30 dias)
SELECT 
  data_contagem,
  COUNT(*) as total,
  COUNT(DISTINCT tipo_local) as locais,
  SUM(CASE WHEN usuario_contagem LIKE '%Automát%' THEN 1 ELSE 0 END) as automaticas
FROM contagem_estoque_insumos
WHERE data_contagem >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY data_contagem
ORDER BY data_contagem DESC;

-- Total de contagens no sistema
SELECT COUNT(*) FROM contagem_estoque_insumos;

-- Contagens de hoje
SELECT COUNT(*) FROM contagem_estoque_insumos 
WHERE data_contagem = CURRENT_DATE;
```

### Verificar insumos sem código

```sql
-- Insumos ativos sem código ou com código inválido
SELECT id, nome, codigo, tipo_local
FROM insumos
WHERE ativo = true
  AND (codigo IS NULL OR codigo = '' OR codigo NOT LIKE 'i%')
ORDER BY tipo_local, nome;
```

---

## 📞 Comandos Úteis

### Parar cron temporariamente

```sql
SELECT cron.unschedule('sync-contagem-diaria');
```

### Reativar cron

```sql
-- Ver comandos no Passo 2.2
```

### Alterar horário do cron

```sql
-- Alterar para 19h BRT (22h UTC)
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria'),
  schedule := '0 22 * * *'
);
```

### Forçar execução manual

```bash
# Via curl
curl -X POST "https://SEU_PROJETO.supabase.co/functions/v1/sync-contagem-sheets" \
  -H "Authorization: Bearer SEU_ANON_KEY"

# Ou criar um botão no admin
```

---

## 🎯 Checklist Final

- [ ] Importação histórica concluída
- [ ] Edge Function deployed
- [ ] Cron job configurado (21h UTC = 18h BRT)
- [ ] Testado sincronização manual
- [ ] Verificado logs da Edge Function
- [ ] (Opcional) Discord webhook configurado
- [ ] Interface mobile testada
- [ ] Equipe treinada para usar o sistema

---

**Documentação completa**: `docs/SYNC_CONTAGEM_SHEETS.md`

**Dúvidas?** Verifique os logs ou execute os scripts de teste!

---

**Última atualização**: 11/11/2025

