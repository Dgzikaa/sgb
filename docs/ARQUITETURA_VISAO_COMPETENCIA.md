# 🏗️ Arquitetura - Visão de Competência

## 📊 **Fluxo de Dados**

```
ContaAzul API → Processar/Normalizar → Supabase → Frontend Dashboard
```

## 🗄️ **Estrutura do Banco de Dados**

### 1. **Tabela: `contaazul_financeiro`**
```sql
CREATE TABLE contaazul_financeiro (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificadores
  bar_id INTEGER NOT NULL,
  conta_id VARCHAR(50) NOT NULL, -- ID único do ContaAzul
  
  -- Dados da transação
  tipo VARCHAR(20) NOT NULL, -- 'RECEITA' ou 'DESPESA'  
  status VARCHAR(20) NOT NULL, -- 'EM_ABERTO', 'RECEBIDO', 'ATRASADO', etc
  descricao TEXT,
  valor DECIMAL(15,2) NOT NULL,
  
  -- Datas importantes
  data_vencimento DATE NOT NULL,
  data_competencia DATE,
  data_pagamento DATE,
  
  -- Categorização
  categoria_id VARCHAR(50),
  categoria_nome VARCHAR(255),
  conta_financeira_id VARCHAR(50),
  conta_financeira_nome VARCHAR(255),
  centro_custo_id VARCHAR(50),
  
  -- Dados brutos e metadados
  dados_originais JSONB, -- Dados completos da API
  
  -- Controle
  ultima_sincronizacao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices e constraints
  FOREIGN KEY (bar_id) REFERENCES bars(id),
  UNIQUE(bar_id, conta_id) -- Evita duplicatas
);

-- Índices para performance
CREATE INDEX idx_contaazul_financeiro_bar_id ON contaazul_financeiro(bar_id);
CREATE INDEX idx_contaazul_financeiro_tipo ON contaazul_financeiro(tipo);
CREATE INDEX idx_contaazul_financeiro_data_competencia ON contaazul_financeiro(data_competencia);
CREATE INDEX idx_contaazul_financeiro_data_vencimento ON contaazul_financeiro(data_vencimento);
CREATE INDEX idx_contaazul_financeiro_status ON contaazul_financeiro(status);
```

### 2. **Tabela: `contaazul_sincronizacao`**
```sql
CREATE TABLE contaazul_sincronizacao (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL,
  
  -- Controle de sincronização
  ultima_execucao TIMESTAMP NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Resultados
  total_receitas_processadas INTEGER DEFAULT 0,
  total_despesas_processadas INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'EXECUTANDO', -- 'SUCESSO', 'ERRO', 'EXECUTANDO'
  detalhes_execucao JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bar_id) REFERENCES bars(id)
);
```

### 3. **Tabela: `contaazul_categorias`** (Cache local)
```sql
CREATE TABLE contaazul_categorias (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL,
  categoria_id VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20), -- 'RECEITA' ou 'DESPESA'
  ativa BOOLEAN DEFAULT true,
  ultima_atualizacao TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (bar_id) REFERENCES bars(id),
  UNIQUE(bar_id, categoria_id)
);
```

## ⚡ **APIs para Sincronização**

### 1. **Endpoint de Sincronização**: `/api/contaazul/sincronizar-financeiro`
```typescript
// POST /api/contaazul/sincronizar-financeiro
{
  "barId": 3,
  "periodo": {
    "inicio": "2024-01-01",
    "fim": "2027-01-01"
  },
  "forcarRessincronizacao": false
}
```

### 2. **Endpoint da Visão**: `/api/dashboard/visao-competencia`
```typescript
// GET /api/dashboard/visao-competencia?barId=3&mes=2025-01
{
  "periodo": "2025-01",
  "resumo": {
    "totalReceitas": 15000.00,
    "totalDespesas": 8000.00,
    "saldo": 7000.00
  },
  "receitas": [
    {
      "id": "ca_123",
      "descricao": "Vendas Bar",
      "valor": 5000.00,
      "dataVencimento": "2025-01-15",
      "status": "RECEBIDO",
      "categoria": "Vendas"
    }
  ],
  "despesas": [
    {
      "id": "ca_456", 
      "descricao": "Fornecedor X",
      "valor": 2000.00,
      "dataVencimento": "2025-01-20",
      "status": "EM_ABERTO",
      "categoria": "Compras"
    }
  ]
}
```

## 🔄 **Processo de Sincronização**

1. **Buscar dados na API ContaAzul** (receitas e despesas)
2. **Normalizar dados** (padronizar campos, datas, valores)
3. **Verificar duplicatas** (usar ID único do ContaAzul)
4. **Inserir/atualizar** na tabela `contaazul_financeiro`
5. **Registrar log** na tabela `contaazul_sincronizacao`

## 📱 **Interface - Visão de Competência**

### Componentes:
- **📊 Dashboard principal** com cards de resumo
- **📅 Filtro por mês/período** 
- **💰 Lista de receitas** (grid com status, valores, datas)
- **💸 Lista de despesas** (grid similar)
- **📈 Gráficos** (entradas x saídas por período)
- **🔄 Botão sincronizar** (manual + automático)

### Estados:
- ✅ **Dados carregados** 
- 🔄 **Sincronizando**
- ⚠️ **Erro na sincronização**
- 📭 **Sem dados no período**

## 🎯 **Vantagens desta Arquitetura:**

1. **Performance**: Dados locais = consultas rápidas
2. **Offline**: Funciona mesmo se ContaAzul estiver indisponível  
3. **Auditoria**: Histórico completo de sincronizações
4. **Flexibilidade**: Dados brutos preservados em JSONB
5. **Escalabilidade**: Suporta múltiplos bares
6. **Cache inteligente**: Evita requests desnecessários

## 🚀 **Próximos Passos:**

1. ✅ Testar endpoint oficial (já feito)
2. 🔄 Criar tabelas no Supabase
3. 📡 Implementar API de sincronização
4. 🎨 Desenvolver interface da visão
5. ⚡ Configurar sincronização automática 