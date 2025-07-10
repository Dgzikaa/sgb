# 📊 ContaAzul - Estrutura Final Organizada

## 🎯 **OBJETIVO**
Reproduzir automaticamente a planilha `visao_competencia.xls` através da API do ContaAzul, coletando:
- **Categoria** e **Centro de Custo** de cada lançamento
- Dados por **competência** (não vencimento)
- Receitas e Despesas com detalhes completos

---

## 🏗️ **ESTRUTURA DO PROJETO**

### **Frontend (`frontend/src/app/api/contaazul/`)**
```
frontend/src/app/api/contaazul/
├── auth/                    # ✅ OAuth e configuração
├── coletar-com-detalhes/    # ✅ Coleta manual com detalhes
├── setup-visao-competencia/ # ✅ Configuração inicial da estrutura  
└── trigger-automacao/       # ✅ Trigger para Edge Functions
```

### **Backend (`backend/supabase/functions/`)**
```
backend/supabase/functions/
├── contaazul-sync/          # ✅ Sincronização automática
├── contaazul-cron/          # ✅ Cron job (4 em 4 horas)
├── login/                   # Autenticação geral
└── test-simple-insert/      # Teste básico
```

---

## 📊 **ESTRUTURA DE BANCO DE DADOS**

### **Tabela Principal**
```sql
contaazul_visao_competencia (
  id, bar_id, parcela_id, evento_id,
  tipo, descricao, valor,
  data_vencimento, data_competencia, data_pagamento,
  categoria_id, categoria_nome, categoria_valor,
  centro_custo_id, centro_custo_nome, centro_custo_valor,
  cliente_fornecedor_id, cliente_fornecedor_nome,
  status, conta_financeira_id, conta_financeira_nome,
  coletado_em, atualizado_em
)
```

### **Tabelas Auxiliares (Cache)**
```sql
contaazul_categorias         # Cache de categorias
contaazul_centros_custo      # Cache de centros de custo  
contaazul_contas_financeiras # Cache de contas financeiras
contaazul_config             # Configurações por bar
contaazul_sync_log           # Logs de sincronização
```

---

## 🔄 **FLUXO DE FUNCIONAMENTO**

### **1. COLETA MANUAL (Interface)**
```
Usuário → [Coletar Dados] → coletar-com-detalhes/ → Resultado
```

### **2. AUTOMAÇÃO (4 em 4 horas)**
```
Cron → contaazul-cron/ → contaazul-sync/ → Database
```

### **3. FLUXO TÉCNICO DETALHADO**
```
1. Buscar parcelas por competência:
   GET /contas-a-receber/buscar?data_competencia_de=X&data_competencia_ate=Y

2. Para cada parcela, buscar evento completo:
   GET /parcelas/{id} → evento.rateio[]

3. Extrair categoria e centro de custo:
   evento.rateio[].id_categoria
   evento.rateio[].rateio_centro_custo[].id_centro_custo

4. Inserir na visão de competência com todos os detalhes
```

---

## 🚀 **ENDPOINTS DISPONÍVEIS**

### **Frontend (Interface)**

#### **1. Configuração OAuth**
```
POST /api/contaazul/auth
- Configurar credenciais
- Autorizar acesso
- Renovar tokens
```

#### **2. Coleta Manual**
```
POST /api/contaazul/coletar-com-detalhes
Body: { bar_id, data_inicio?, data_fim? }
- Executa coleta completa com categoria e centro de custo
- Retorna estatísticas detalhadas
```

#### **3. Setup Inicial**
```
POST /api/contaazul/setup-visao-competencia  
Body: { bar_id }
- Cria estrutura de tabelas limpa
- Configura índices de performance
```

#### **4. Trigger Automação**
```
POST /api/contaazul/trigger-automacao
Body: { tipo: "sync" | "cron", bar_id?, force? }
- Executa Edge Functions de automação
```

### **Backend (Edge Functions)**

#### **1. Sincronização Automática**
```
POST /functions/v1/contaazul-sync
Body: { bar_id, data_inicio?, data_fim?, force? }
- Executa coleta completa automatizada
- Verifica se já foi executada hoje
- Registra logs detalhados
```

#### **2. Cron Job**
```
POST /functions/v1/contaazul-cron
- Executa sincronização para todos os bares ativos
- Controla frequência (4 em 4 horas)
- Gerencia tokens expirados
```

---

## ⚙️ **CONFIGURAÇÃO DE AUTOMAÇÃO**

### **1. Interface (Manual)**
- **Configurar**: Credenciais OAuth
- **Autorizar**: Conectar com ContaAzul  
- **Coletar Dados**: Executar coleta manual
- **Processar Dados**: (removido - tudo integrado)

### **2. Automação (4 em 4 horas)**
```sql
-- Configurar automação para um bar
INSERT INTO contaazul_config (bar_id, sincronizacao_ativa) 
VALUES (3, true);

-- Verificar última sincronização
SELECT * FROM contaazul_sync_log 
WHERE bar_id = 3 
ORDER BY iniciado_em DESC LIMIT 5;
```

### **3. Cron Job Setup**
```bash
# Via cron do sistema (opcional)
0 */4 * * * curl -X POST https://your-project.supabase.co/functions/v1/contaazul-cron

# Via Supabase Cron (recomendado)
# Configurar no painel do Supabase
```

---

## 📈 **MONITORAMENTO**

### **1. Logs de Sincronização**
```sql
SELECT 
  tipo_operacao,
  total_processado,
  total_sucesso,
  total_erro,
  tempo_execucao_ms,
  iniciado_em
FROM contaazul_sync_log 
WHERE bar_id = 3
ORDER BY iniciado_em DESC;
```

### **2. Dados Coletados**
```sql
SELECT 
  COUNT(*) as total,
  tipo,
  COUNT(CASE WHEN categoria_id IS NOT NULL THEN 1 END) as com_categoria,
  COUNT(CASE WHEN centro_custo_id IS NOT NULL THEN 1 END) as com_centro_custo
FROM contaazul_visao_competencia 
WHERE bar_id = 3
GROUP BY tipo;
```

### **3. Performance**
```sql
-- Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'contaazul%';

-- Estatísticas por competência
SELECT 
  data_competencia,
  tipo,
  COUNT(*) as registros,
  SUM(valor) as total_valor
FROM contaazul_visao_competencia 
WHERE bar_id = 3
  AND data_competencia >= '2025-01-01'
GROUP BY data_competencia, tipo
ORDER BY data_competencia DESC;
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **✅ Estrutura criada e organizada**
2. **✅ Coleta com detalhes implementada**
3. **✅ Edge Functions de automação**
4. **🔄 Dashboard de visão de competência**
5. **🔄 Configuração de cron no Supabase**
6. **🔄 Alertas de falha na sincronização**

---

## 📋 **CHECKLIST DE DEPLOY**

### **Banco de Dados**
- ✅ Estrutura de tabelas criada
- ✅ Índices de performance configurados
- ✅ Logs de sincronização ativos

### **Edge Functions**
- ✅ contaazul-sync/ implementada
- ✅ contaazul-cron/ implementada  
- ⏳ Deploy no Supabase pendente

### **Frontend**
- ✅ Interface limpa e organizada
- ✅ Endpoints essenciais mantidos
- ✅ Automação configurável

### **Automação**
- ⏳ Cron job no Supabase (configurar)
- ⏳ Monitoramento de falhas
- ⏳ Dashboard de acompanhamento

---

**🎉 ESTRUTURA FINAL: Organizada, automatizada e pronta para produção!** 