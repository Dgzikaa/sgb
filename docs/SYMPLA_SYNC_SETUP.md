# 🎪 Sympla Sync - Documentação Completa

## 📋 Visão Geral

Sistema automatizado de sincronização de dados da Sympla com o banco de dados do SGB_V2. Coleta eventos, participantes e pedidos do Ordi automaticamente toda segunda-feira.

---

## 🏗️ Arquitetura

### Componentes:

1. **Edge Function** (`backend/supabase/functions/sympla-sync/`)
   - Responsável pela sincronização automática
   - Roda toda segunda-feira às 09:00
   - Busca dados da semana anterior (segunda a domingo)

2. **API Route** (`frontend/src/app/api/integracoes/sympla/route.ts`)
   - Interface para sincronização manual
   - Permite passar períodos customizados

3. **Script Retroativo** (`exemplo_teste/sympla/sync-retroativo-setembro-novembro.js`)
   - Para buscar dados de períodos anteriores
   - Preenche lacunas de dados

---

## 🚀 Setup Inicial

### 1. Configurar Secrets no Supabase

Adicionar o token da Sympla nos secrets do Supabase:

```bash
# Via Supabase Dashboard
Project Settings > Edge Functions > Secrets
SYMPLA_API_TOKEN = 97d7b77e99d40dc8fb5583f590f9b7db3072afe7969c167c493077d9c5a862a6
```

### 2. Deploy da Edge Function

```bash
cd backend
npx supabase functions deploy sympla-sync --project-ref uqtgsvujwcbymjmvkjhy
```

### 3. Configurar Cron Job (Automático)

O cron job já está configurado no `config.toml`:
- **Quando**: Toda segunda-feira às 09:00
- **O que faz**: Busca dados da semana anterior (seg-dom)
- **Configuração**: `sympla_sync = { schedule = "0 9 * * 1", function_name = "sympla-sync" }`

---

## 📊 Tabelas do Banco

### `sympla_eventos`
- Informações dos eventos
- Campos: nome, data, local, imagem, etc.

### `sympla_participantes`
- Lista de participantes por evento
- Check-ins, tipos de ingresso, etc.

### `sympla_pedidos`
- Pedidos e transações
- Valores, status, dados financeiros

### `sympla_sync_logs`
- Logs de sincronização
- Rastreamento de erros e sucessos

---

## 🔄 Uso

### 1. Sincronização Automática (Recomendado)
**Não fazer nada!** 
- O sistema roda sozinho toda segunda-feira às 09:00
- Busca dados da semana anterior automaticamente

### 2. Sincronização Manual via API

```typescript
// Via frontend
const response = await fetch('/api/integracoes/sympla', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventoId: 'opcional',
    tipo: 'completo' // ou 'participantes', 'pedidos'
  })
});
```

### 3. Sincronização Retroativa (Script Node.js)

Para buscar dados de períodos anteriores:

```bash
# Buscar dados de 29/09/2025 até 10/11/2025
node exemplo_teste/sympla/sync-retroativo-setembro-novembro.js
```

**Configuração necessária:**
1. Arquivo `.env.local` na pasta `frontend/` com:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://uqtgsvujwcbymjmvkjhy.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
   SYMPLA_API_TOKEN=97d7b77e99d40dc8fb5583f590f9b7db3072afe7969c167c493077d9c5a862a6
   ```

2. Instalar dependências:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

---

## 📅 Como Funciona o Cron Job

### Lógica de Período:
- **Hoje é segunda-feira (10/11/2025)**:
  - Busca dados de **03/11/2025 (seg) até 09/11/2025 (dom)**
  
- **Cálculo automático**:
  ```typescript
  const hoje = new Date();
  const diaDaSemana = hoje.getDay(); // 1 = segunda
  const diasParaSegundaPassada = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
  
  dataInicioPeriodo = hoje - diasParaSegundaPassada - 7; // Segunda passada
  dataFimPeriodo = dataInicioPeriodo + 6; // Domingo passado
  ```

### Processo de Sincronização:

1. **Buscar eventos** do período via API Sympla
2. **Filtrar eventos** que contêm "ordi" no nome
3. **Inserir eventos** no banco (upsert)
4. Para cada evento:
   - Buscar **participantes** (paginação completa)
   - Buscar **pedidos** (paginação completa)
   - Inserir no banco em lotes de 100
5. **Registrar logs** de sucesso/erro

---

## 🔍 Monitoramento

### Ver Logs da Edge Function:

```bash
# Via Supabase CLI
npx supabase functions logs sympla-sync --project-ref uqtgsvujwcbymjmvkjhy

# Via Dashboard
Supabase > Edge Functions > sympla-sync > Logs
```

### Verificar Dados no Banco:

```sql
-- Total de eventos
SELECT COUNT(*) FROM sympla_eventos;

-- Última data de evento
SELECT MAX(data_inicio) FROM sympla_eventos;

-- Total de participantes
SELECT COUNT(*) FROM sympla_participantes;

-- Total de pedidos
SELECT COUNT(*) FROM sympla_pedidos;

-- Logs de sincronização
SELECT * FROM sympla_sync_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### Edge Function não está rodando:
1. Verificar se está deployada:
   ```bash
   npx supabase functions list --project-ref uqtgsvujwcbymjmvkjhy
   ```

2. Verificar secrets:
   ```bash
   # Dashboard: Project Settings > Edge Functions > Secrets
   SYMPLA_API_TOKEN deve estar configurado
   ```

3. Verificar logs:
   ```bash
   npx supabase functions logs sympla-sync --project-ref uqtgsvujwcbymjmvkjhy
   ```

### Dados não estão sendo coletados:
1. Verificar se eventos têm "ordi" no nome
2. Verificar período de datas
3. Verificar rate limit da API Sympla
4. Ver logs de erro no banco (`sympla_sync_logs`)

### Token Sympla expirado:
1. Obter novo token da Sympla
2. Atualizar secret no Supabase Dashboard
3. Re-deployar Edge Function

---

## 📈 Estatísticas Coletadas

Para cada sincronização, o sistema coleta:

- **Eventos**: ID, nome, data, local, categoria
- **Participantes**: Nome, email, tipo ingresso, check-in
- **Pedidos**: Valor bruto, líquido, taxa Sympla, status
- **Financeiro**: Receita total, taxa Sympla, valor líquido

---

## 🔐 Segurança

- **Service Role Key**: Apenas Edge Function e scripts admin
- **Autenticação**: API route verifica nível de acesso admin
- **Secrets**: Tokens armazenados em Supabase Secrets
- **Rate Limiting**: Retry automático em caso de falha

---

## 📝 Notas Importantes

1. **Cron Job só funciona em produção** (não em localhost)
2. **Edge Function usa fuso horário UTC** (ajustar se necessário)
3. **Bar ID fixo = 3** (Ordi)
4. **Upsert**: Não cria duplicatas, atualiza dados existentes
5. **Paginação completa**: Busca TODOS os participantes/pedidos

---

## 🚦 Status Atual

✅ Edge Function criada e funcional
✅ Cron job configurado (toda segunda às 09:00)
✅ Script retroativo disponível
✅ API route atualizada
✅ Logs de sincronização implementados

**Próximo passo**: Deploy e teste em produção

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs da Edge Function
2. Consultar tabela `sympla_sync_logs`
3. Rodar script retroativo manualmente
4. Verificar configuração de secrets

---

**Última atualização**: 10/11/2025
**Versão**: 2.0
**Responsável**: Sistema SGB_V2

