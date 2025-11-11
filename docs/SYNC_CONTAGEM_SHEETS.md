# 📊 Sincronização Automática de Contagem - Google Sheets

## 🎯 Visão Geral

Sistema completo de sincronização automática das contagens de estoque entre Google Sheets e o sistema Zykor.

## 📋 Componentes

### 1. Script de Importação Histórica

**Arquivo**: `exemplo_teste/importar-contagem-sheets.js`

**Uso**:
```bash
# Importar todas as datas
node exemplo_teste/importar-contagem-sheets.js

# Importar período específico
node exemplo_teste/importar-contagem-sheets.js 2025-11-01 2025-11-10

# Usar servidor de produção
node exemplo_teste/importar-contagem-sheets.js 2025-11-01 2025-11-10 https://zykor.vercel.app
```

**Funcionalidades**:
- ✅ Lê diretamente do Google Sheets (sem CSV)
- ✅ Identifica automaticamente as datas na planilha
- ✅ Mapeia códigos de insumos
- ✅ Importa ESTOQUE FECHADO e PEDIDO
- ✅ Processa em lotes para não sobrecarregar
- ✅ Relatório detalhado de sucesso/erros

### 2. Edge Function com Cron Job

**Arquivo**: `backend/supabase/functions/sync-contagem-sheets/index.ts`

**Execução**:
- 🕐 **Automática**: Todo dia às 18h via cron job
- 🔧 **Manual**: Via requisição HTTP

**URL Manual**:
```bash
# Sincronizar data específica
curl -X POST "https://seu-projeto.supabase.co/functions/v1/sync-contagem-sheets?data=2025-11-08"

# Sincronizar hoje
curl -X POST "https://seu-projeto.supabase.co/functions/v1/sync-contagem-sheets"
```

## 📊 Estrutura da Planilha

**Planilha**: `1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8`
**Aba**: INSUMOS

**Estrutura**:
```
Linha 1-3: Cabeçalhos gerais
Linha 4:   COZINHA | ... | 26/01/2025 | ... | 27/01/2025 | ...
Linha 5:   (vazia)
Linha 6:   PREÇO | ÁREA | Localização | Cód | Categoria | Un | INSUMOS | ESTOQUE FECHADO | ESTOQUE FLUTUANTE | PEDIDO | ...
Linha 7+:  Dados dos insumos
```

**Colunas Fixas** (A-G):
- A: PREÇO
- B: ÁREA
- C: Localização (ARMAZÉM, MERCADO, etc.)
- D: **Cód** (código do insumo, ex: i0093) ← **IMPORTANTE**
- E: Categoria
- F: Un de Contagem
- G: **INSUMOS** (nome) ← **IMPORTANTE**

**Colunas Dinâmicas** (por data):
- Para cada data na linha 4:
  - Coluna N: **ESTOQUE FECHADO** ← Importado como `estoque_final`
  - Coluna N+1: ESTOQUE FLUTUANTE (não usado)
  - Coluna N+2: **PEDIDO** ← Importado como `quantidade_pedido`

## 🚀 Como Configurar

### 1. Fazer Deploy da Edge Function

```bash
# Navegar para o diretório backend
cd backend

# Deploy
npx supabase functions deploy sync-contagem-sheets
```

### 2. Configurar Variáveis de Ambiente

No Supabase Dashboard:
```
DISCORD_WEBHOOK_CONTAGEM = [URL do webhook Discord para notificações]
```

### 3. Configurar Cron Job

**Opção A: Via Supabase Dashboard**
1. Ir em Database → Cron Jobs
2. Criar novo job:
   - Nome: `sync-contagem-diaria`
   - Schedule: `0 18 * * *` (18h todos os dias)
   - Command: Invocar edge function `sync-contagem-sheets`

**Opção B: Via SQL**
```sql
-- Ativar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job
SELECT cron.schedule(
  'sync-contagem-diaria',
  '0 18 * * *',  -- Todo dia às 18h (horário do servidor)
  $$
  SELECT
    net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/sync-contagem-sheets',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
    );
  $$
);

-- Verificar cron jobs
SELECT * FROM cron.job;
```

### 4. Importar Histórico

```bash
# Importar todo o histórico disponível
node exemplo_teste/importar-contagem-sheets.js
```

## 📱 Melhorias Mobile/Tablet

A interface de contagem (`frontend/src/app/ferramentas/contagem-estoque/page.tsx`) já está otimizada para mobile/tablet:

**Mobile (cards):**
- ✅ Layout em cards responsivos
- ✅ Inputs grandes para toque
- ✅ Botões de ação destacados
- ✅ Scroll otimizado

**Tablet:**
- ✅ Grid adaptativo
- ✅ Tabela compacta
- ✅ Ações rápidas

## 🔄 Fluxo de Trabalho

### Período de Transição (Atual)

```
1. Funcionário preenche Google Sheets manualmente
2. Cron job às 18h importa automaticamente
3. Sistema fica sincronizado
```

### Após Implementação Final

```
1. Funcionário usa interface do sistema
2. Dados salvos diretamente no banco
3. Cron job desativado
```

## 📊 Monitoramento

### Verificar Logs do Cron Job

```sql
-- Ver últimas execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria')
ORDER BY start_time DESC
LIMIT 10;
```

### Verificar Contagens Importadas

```sql
-- Contagens por data (últimos 10 dias)
SELECT 
  data_contagem,
  COUNT(*) as total_contagens,
  COUNT(DISTINCT tipo_local) as locais,
  SUM(CASE WHEN usuario_contagem = 'Sistema Automático' THEN 1 ELSE 0 END) as automaticas
FROM contagem_estoque_insumos
WHERE data_contagem >= CURRENT_DATE - INTERVAL '10 days'
GROUP BY data_contagem
ORDER BY data_contagem DESC;
```

### Verificar Insumos Não Encontrados

```bash
# Executar script de importação em modo teste
node exemplo_teste/importar-contagem-sheets.js 2025-11-08 2025-11-08
```

Os códigos não encontrados serão listados ao final.

## 🔧 Manutenção

### Adicionar Novos Insumos

Se um código aparecer como "não encontrado":
1. Cadastrar insumo no sistema com o código correto (ex: `i0093`)
2. Executar importação manual para data específica
3. Cron job pegará automaticamente nos próximos dias

### Ajustar Horário do Cron

```sql
-- Alterar para 19h
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'sync-contagem-diaria'),
  schedule := '0 19 * * *'
);
```

### Desativar Temporariamente

```sql
-- Desativar
SELECT cron.unschedule('sync-contagem-diaria');

-- Reativar
SELECT cron.schedule(
  'sync-contagem-diaria',
  '0 18 * * *',
  $$ [comando SQL aqui] $$
);
```

## ⚠️ Troubleshooting

### Problema: Data não encontrada na planilha

**Causa**: Funcionário não preencheu ainda
**Solução**: Normal, cron job tentará no dia seguinte

### Problema: Muitos insumos não encontrados

**Causa**: Códigos diferentes entre planilha e sistema
**Solução**: 
1. Verificar códigos na planilha (coluna D)
2. Verificar códigos no sistema (`/api/operacional/receitas/insumos`)
3. Ajustar cadastros para manter consistência

### Problema: Erros ao importar

**Causa**: Problema de conexão ou permissões
**Solução**:
1. Verificar logs da edge function
2. Verificar permissões da API Key do Google
3. Verificar se planilha está acessível

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs no Supabase Dashboard
2. Executar script manual para diagnóstico
3. Verificar notificações no Discord (se configurado)

---

**Última atualização**: 11/11/2025
**Versão**: 1.0

