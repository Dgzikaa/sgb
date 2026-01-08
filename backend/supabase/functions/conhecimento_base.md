# 🧠 BASE DE CONHECIMENTO - ZYKOR (SGB)

> Documento de referência para os agentes de IA entenderem o contexto do negócio e as regras do sistema.

---

## 📊 SOBRE O NEGÓCIO

### O que é o Zykor?
O Zykor (Sistema de Gestão de Bares - SGB) é uma plataforma completa para gestão de bares, casas noturnas e restaurantes. O sistema integra dados de múltiplas fontes para fornecer insights de negócio, controle operacional e análise de performance.

### Clientes Principais
- **Ordinário Bar** (bar_id: 3) - Principal cliente, localizado em São Paulo
- Outros bares podem ser adicionados ao sistema

---

## 🏢 ESTRUTURA DO NEGÓCIO

### Modelo Operacional
- **Eventos**: Cada dia de operação é considerado um "evento"
- **Faturamento**: Baseado em vendas de bebidas, comidas e entradas
- **Público (PAX)**: Número de pessoas que frequentaram o evento
- **Ticket Médio**: Faturamento dividido pelo público

### Métricas Principais (KPIs)

| Métrica | Descrição | Como Calcular |
|---------|-----------|---------------|
| **Faturamento Real (real_r)** | Total faturado no dia | Soma de todas as vendas |
| **Público Real (pax_r)** | Número de clientes | Contagem de pessoas |
| **Ticket Entrada (te_r)** | Ticket médio | real_r / pax_r |
| **Ticket Bebida (tb_r)** | Gasto médio em bebidas | bebidas / pax_r |
| **CMV** | Custo Mercadoria Vendida | custo / faturamento × 100 |

### Metas e Benchmarks

| Dia da Semana | Meta Faturamento (M1) | Ticket Entrada | Ticket Bebida |
|---------------|----------------------|----------------|---------------|
| Segunda       | R$ 4.742,88          | R$ 18,00       | R$ 82,50      |
| Terça         | R$ 0,00              | R$ 21,00       | R$ 75,00      |
| Quarta        | R$ 33.200,17         | R$ 21,00       | R$ 75,00      |
| Quinta        | R$ 18.971,53         | R$ 21,00       | R$ 75,00      |
| Sexta         | R$ 58.811,74         | R$ 21,00       | R$ 82,50      |
| Sábado        | R$ 47.428,82         | R$ 21,00       | R$ 82,50      |
| Domingo       | R$ 58.811,74         | R$ 21,00       | R$ 87,50      |

---

## 📦 FONTES DE DADOS

### 1. ContaHub (PDV)
Sistema de ponto de venda. Fornece dados de:
- **Analítico**: Vendas detalhadas por produto
- **FatPorHora**: Faturamento por hora do dia
- **Pagamentos**: Formas de pagamento utilizadas
- **Período**: Dados de comandas e clientes
- **Tempo**: Tempos de produção e entrega

### 2. NIBO (Financeiro)
Sistema financeiro. Fornece:
- **Agendamentos**: Contas a pagar e receber
- **Categorias**: Classificação de despesas/receitas
- **Stakeholders**: Fornecedores e clientes

### 3. Yuzer (Eventos)
Sistema de gestão de eventos especiais:
- **Eventos**: Shows, festas programadas
- **Produtos**: Vendas durante eventos
- **Pagamentos**: Formas de pagamento em eventos

### 4. GetIn (Reservas)
Sistema de reservas:
- **Reservas**: Agendamentos de mesas
- **Clientes**: Dados de quem reservou

### 5. Sympla (Ingressos)
Venda de ingressos para eventos especiais.

---

## 🗄️ TABELAS PRINCIPAIS DO BANCO

### Tabela: `eventos`
**Descrição**: Consolidado de cada dia/evento
```
Campos principais:
- id: ID único
- bar_id: ID do bar
- data_evento: Data (YYYY-MM-DD)
- nome: Nome do evento
- real_r: Faturamento real
- pax_r: Público real
- te_r: Ticket entrada
- tb_r: Ticket bebida
- m1_r: Meta de faturamento
- c_art: Custo artístico
- c_prod: Custo produção
```

### Tabela: `contahub_analitico`
**Descrição**: Vendas detalhadas por produto
```
Campos principais:
- trn_dtgerencial: Data
- prd_desc: Nome do produto
- grp_desc: Grupo/categoria
- qtd: Quantidade
- valorfinal: Valor final
- custo: Custo unitário
```

### Tabela: `contahub_fatporhora`
**Descrição**: Faturamento por hora
```
Campos principais:
- vd_dtgerencial: Data
- hora: Hora (0-23)
- valor: Faturamento na hora
- qtd: Quantidade de vendas
```

### Tabela: `contahub_pagamentos`
**Descrição**: Formas de pagamento
```
Campos principais:
- dt_gerencial: Data
- meio: Tipo (Crédito, Débito, PIX, Dinheiro)
- valor: Valor pago
- taxa: Taxa aplicada
- liquido: Valor líquido
```

### Tabela: `contahub_periodo`
**Descrição**: Dados de comandas/clientes
```
Campos principais:
- dt_gerencial: Data
- cli_nome: Nome cliente
- cli_email: Email
- pessoas: Pessoas na mesa
- vr_pagamentos: Total pago
```

### Tabela: `nibo_agendamentos`
**Descrição**: Contas financeiras
```
Campos principais:
- data_competencia: Data competência
- tipo: receita/despesa
- valor: Valor
- categoria_nome: Categoria
- descricao: Descrição
```

---

## 📊 CATEGORIAS DE PRODUTOS

### Bebidas
- Cervejas
- Drinks Autorais
- Drinks Clássicos
- Drinks sem Álcool
- Doses
- Garrafas
- Vinhos

### Alimentos
- Pratos Individuais
- Pratos para Compartilhar
- Sanduíches
- Sobremesas
- Combos

### Outros
- Couvert/Entrada
- Ingressos
- Produção (cancelamentos)

---

## 🔄 SYNCS AUTOMÁTICOS

| Sistema | Frequência | Horário |
|---------|------------|---------|
| ContaHub | Diário | 06:00 e 10:00 |
| NIBO | Diário | 07:00 |
| GetIn | Contínuo | A cada 30 min |
| Yuzer | Diário | 08:00 |

---

## ⚙️ REGRAS DE NEGÓCIO IMPORTANTES

### 1. Cálculo de CMV
```
CMV = (Custo Total dos Produtos Vendidos / Faturamento Bruto) × 100
Meta: CMV < 30%
```

### 2. Taxa de Cartões
```
Crédito: 3.5% de taxa
Débito: 1.5% de taxa
PIX: 1.5% de taxa
Dinheiro: 0% de taxa
```

### 3. Percentual Artístico
```
% Artístico = (Custo Artístico / Faturamento Real) × 100
Meta: % Artístico < 15%
```

### 4. Horário de Funcionamento
- Abertura: 18:00
- Fechamento: 05:00 (dia seguinte)
- Horário de Pico: 23:00 - 02:00

### 5. Dias da Semana
- Segunda: Eventos menores ou fechado
- Terça: Geralmente fechado
- Quarta: Eventos médios (Open Bar típico)
- Quinta: Eventos médios
- Sexta: Eventos grandes
- Sábado: Eventos grandes
- Domingo: Eventos especiais/festas

---

## 🎯 PERGUNTAS FREQUENTES

### Faturamento
- "Qual foi o faturamento da última semana?"
- "Como foi o faturamento de ontem?"
- "Qual o faturamento do mês?"

### Produtos
- "Quais são os produtos mais vendidos?"
- "Qual bebida vende mais?"
- "Top 10 produtos da semana"

### Clientes
- "Quantas pessoas vieram ontem?"
- "Qual o ticket médio?"
- "Quais são os clientes mais frequentes?"

### Comparativos
- "Compare essa semana com a anterior"
- "Como está o mês comparado ao anterior?"
- "Qual foi o melhor dia da semana?"

### Operacional
- "Quanto tempo leva para entregar um pedido?"
- "Qual o horário de maior movimento?"
- "Quais produtos têm maior tempo de produção?"

---

## 🤖 INSTRUÇÕES PARA AGENTES

### Ao responder sobre faturamento:
1. Sempre usar a tabela `eventos` para dados consolidados
2. Usar `real_r` para faturamento real
3. Formatar valores em R$ com 2 casas decimais

### Ao responder sobre produtos:
1. Usar `contahub_analitico` para detalhamento
2. Agrupar por `prd_desc` ou `grp_desc`
3. Ordenar por quantidade ou valor

### Ao responder sobre clientes:
1. Usar `contahub_periodo` para dados de clientes
2. Usar `getin_reservas` para reservas
3. Filtrar clientes com nome não vazio

### Ao fazer comparativos:
1. Sempre calcular variação percentual
2. Indicar tendência (📈 Alta, 📉 Queda, ➡️ Estável)
3. Usar mesmos critérios para ambos períodos

### Formato de respostas:
- Usar emojis para facilitar leitura
- Formatar números (R$ 1.234,56)
- Usar markdown para estruturar
- Ser conciso mas informativo

---

## 📝 NOTAS IMPORTANTES

1. **bar_id = 3** é o Ordinário Bar (principal cliente)
2. Datas sempre em formato **YYYY-MM-DD**
3. Valores monetários sempre com **2 casas decimais**
4. Horários em formato **24h**
5. Dia da semana: 0 = Segunda, 6 = Domingo

---

## 📱 PÁGINAS DO SISTEMA E FUNCIONALIDADES

### 🎯 MÓDULO ESTRATÉGICO (`/estrategico/`)

#### 1. Planejamento Comercial (`/estrategico/planejamento-comercial`)
**Objetivo**: Visualizar e editar planejamento vs realizado de cada evento/dia

**Interface**:
- Tabela com todos os eventos do mês selecionado
- Colunas: Data, Evento, Receita Real vs M1, Clientes, Tickets, Custos
- Cores indicando performance (verde = acima da meta, vermelho = abaixo)
- Modal para edição de valores planejados e reais

**Dados utilizados**:
| Campo | Tabela | Descrição |
|-------|--------|-----------|
| `real_receita` | eventos | Faturamento real do dia |
| `m1_receita` | eventos | Meta de faturamento (M1) |
| `clientes_plan` | eventos | Público planejado |
| `clientes_real` | eventos | Público real (PAX) |
| `te_plan/te_real` | eventos | Ticket entrada planejado/real |
| `tb_plan/tb_real` | eventos | Ticket bebida planejado/real |
| `c_art` | eventos | Custo artístico |
| `c_prod` | eventos | Custo produção |

**Regras de negócio**:
- Terças: Só exibir se tiver evento ou dados
- "Fechado": Não exibir na lista
- Domingos: Buscar dados Sympla/Yuzer separadamente
- Cores de performance: Verde se realizado ≥ 90% da meta

**API**: `/api/estrategico/planejamento-comercial?mes={mes}&ano={ano}`

---

#### 2. Desempenho (`/estrategico/desempenho`)
**Objetivo**: Análise de desempenho semanal e mensal com metas

**Dados por semana**:
| Indicador | Meta Padrão | Regra de Cor |
|-----------|-------------|--------------|
| Faturamento Total | R$ 263.000 | Verde se ≥ meta |
| Faturamento Couvert | R$ 38.000 | Verde se ≥ meta |
| Faturamento Bar | R$ 225.000 | Verde se ≥ meta |
| Ticket Médio | R$ 103 | Verde se ≥ meta |
| TM Entrada | R$ 15,50 | Verde se ≥ meta |
| TM Bar | R$ 77,50 | Verde se ≥ meta |
| CMV % | 33% | Verde se ≤ meta |
| CMO % | 20% | Verde se ≤ meta |
| Atração % | 17% | Verde se ≤ meta |
| Clientes Atendidos | 2.645 | Verde se ≥ meta |
| Clientes Ativos | 3.000 | Verde se ≥ meta |
| Reservas | 650/800 | Verde se ≥ meta |

**Integração**: Google Sheets (spreadsheet_id configurável por bar)
**API**: `/api/estrategico/desempenho?ano={ano}&mes={mes}`

---

#### 3. Orçamentação (`/estrategico/orcamentacao`)
**Objetivo**: Planejamento e controle orçamentário detalhado

**Categorias de Despesas**:
| Categoria | Subcategorias |
|-----------|---------------|
| Despesas Variáveis | IMPOSTO/TX MAQ/COMISSÃO |
| CMV | CMV Geral |
| Pessoal | Funcionários, Adicionais, Freelas (Bar, Cozinha, Limpeza, Segurança), Pro Labore |
| Administrativas | Escritório Central, Administrativo, RH, VT |
| Marketing e Eventos | Marketing, Atrações, Produção |
| Operacionais | Materiais, Equipamentos, Descartáveis, Utensílios |
| Ocupação | Aluguel, Água, Gás, Internet, Manutenção, Luz |
| Receitas | Receita Bruta |
| Não Operacionais | Contratos |

**Cálculos**:
```
Lucro Planejado = Receita Planejada - Despesas Planejadas
Margem Planejada = (Lucro / Receita) × 100%
```

**API**: `/api/estrategico/orcamentacao?bar_id={bar_id}&ano={ano}&mes={mes}`

---

#### 4. Visão Geral Estratégica (`/estrategico/visao-geral`)
**Objetivo**: Dashboard executivo com indicadores anuais e trimestrais

**Indicadores Anuais**:
| Indicador | Meta 2025 | Formato |
|-----------|-----------|---------|
| Faturamento | Configurável | R$ |
| Pessoas | Configurável | Número |
| Reputação | 5.0 | ⭐ (decimal) |

**Indicadores Trimestrais**:
| Indicador | Meta | Descrição |
|-----------|------|-----------|
| Clientes Ativos | 3.000 | Únicos nos últimos 90 dias |
| Clientes Totais | 12.000 | Total do trimestre |
| Retenção | 40% | % que visitou 2+ vezes |
| Retenção Real | 5% | % do trimestre anterior que voltou |
| CMV Limpo | 34% | Custo mercadoria (quanto MENOR, melhor) |
| CMO | 20% | Custo mão de obra (quanto MENOR, melhor) |
| % Artística | 17% | Custo artístico (quanto MENOR, melhor) |

**Trimestres**:
- T2: Abril-Junho
- T3: Julho-Setembro
- T4: Outubro-Dezembro

**Cache**: Dados trimestrais são cacheados para navegação rápida
**API**: `/api/visao-geral/indicadores?periodo={anual|trimestral}&trimestre={2|3|4}`

---

#### 5. Visão Mensal (`/estrategico/visao-mensal`)
**Objetivo**: Comparativo de performance entre meses

**Componente**: `<ComparativoMensalNovo />`
- Cards comparando mês atual vs anterior
- Setas verdes = crescimento
- Setas vermelhas = queda
- Mês atual destacado com borda azul

---

### 📊 MÓDULO ANALÍTICO (`/analitico/`)

#### 1. Dashboard Analítico (`/analitico`)
**Objetivo**: Hub central com acesso a todas as análises
**Status**: 7 análises implementadas, 2 em desenvolvimento

**Cards disponíveis**:
- Eventos (análise de horários de pico, produtos e resumos semanais)
- Comparativo de Eventos (compare performance entre eventos)
- Clientes (análise de clientes mais recorrentes)
- Sócios (análise detalhada de sócios e membros)
- Resumo (resumo geral de métricas e indicadores)
- Análise Semanal (performance por semana)
- Produtos (produtos mais vendidos)

---

#### 2. Clientes (`/analitico/clientes`)
**Objetivo**: Análise completa de base de clientes

**Interface**:
- Tabs: Clientes (ContaHub) | Reservantes (GetIn) | Clientes Ativos
- Filtro por dia da semana
- Busca por nome/telefone
- Exportação CSV

**Cards de Estatísticas**:
| Card | Descrição |
|------|-----------|
| Clientes Únicos | Total de clientes únicos no ContaHub |
| Total de Visitas | Soma de todas as visitas |
| Ticket Médio Geral | Faturamento total / visitas pagas |
| Ticket Entrada | Couvert médio |
| Ticket Consumo | Consumação média por visita |

**Dados por cliente**:
```typescript
interface Cliente {
  identificador_principal: string;
  nome_principal: string;
  telefone: string | null;
  total_visitas: number;
  valor_total_gasto: number;
  valor_total_entrada: number;  // Couvert
  valor_total_consumo: number;  // Bar
  ticket_medio_geral: number;
  ticket_medio_entrada: number;
  ticket_medio_consumo: number;
  ultima_visita: string;
  tempo_medio_estadia_minutos: number;
}
```

**Perfil de Consumo (Modal)**:
- Top 5 produtos favoritos
- Categorias favoritas
- Tags automáticas (VIP, frequente, cervejeiro, etc.)
- Dias preferidos
- Histórico de visitas detalhado

**APIs**: 
- `/api/analitico/clientes` - Lista de clientes
- `/api/analitico/clientes/detalhes?telefone=X` - Visitas do cliente
- `/api/analitico/clientes/perfil-consumo?telefone=X` - Perfil de consumo
- `/api/analitico/reservantes` - Lista de reservantes (GetIn)

---

#### 3. Eventos (`/analitico/eventos`)
**Objetivo**: Performance detalhada por evento
**Dados**: `eventos`, `contahub_analitico`

#### 4. Comparativo de Eventos (`/analitico/eventos/comparativo`)
**Objetivo**: Comparar performance entre diferentes eventos

#### 5. Produtos (`/analitico/produtos`)
**Objetivo**: Análise de vendas por produto
**Dados**: `contahub_analitico` agrupado por `prd_desc` e `grp_desc`

#### 6. Resumo (`/analitico/resumo`)
**Objetivo**: Resumo consolidado do período

#### 7. Semanal (`/analitico/semanal`)
**Objetivo**: Análise semana a semana

#### 8. Sócios (`/analitico/socios`)
**Objetivo**: Visão específica para sócios com dados agregados

---

### 💰 MÓDULO FINANCEIRO PESSOAL (`/fp/`)

> Sistema de controle financeiro pessoal integrado

#### 1. Hub FP (`/fp`)
**Objetivo**: Central de finanças pessoais com 5 módulos

**Módulos disponíveis**:
| Módulo | Descrição | Status |
|--------|-----------|--------|
| Contas | Gerenciamento de contas bancárias e cartões | ✅ Ativo |
| Categorias | Organização de transações por categoria | ✅ Ativo |
| Transações | Registro de receitas e despesas | ✅ Ativo |
| Dashboard | Visualização de dados financeiros | ✅ Ativo |
| Conexões | Open Finance via Pluggy | ✅ Ativo |

---

#### 2. Dashboard Financeiro (`/fp/dashboard`)
**Objetivo**: Visão geral consolidada das finanças

**Interface**:
- Cards de resumo: Saldo Total, Receitas, Despesas, Saldo do Período
- Filtro por período: Semana, Mês, Trimestre, Ano, Tudo
- Gráfico de pizza: Despesas por Categoria
- Gráfico de barras: Receitas por Categoria
- Gráfico de linha: Evolução (últimos 30 dias)
- Cards com todas as contas e saldos

**Dados utilizados**:
```typescript
interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  data: string;
  categoria?: { nome: string };
  conta?: { nome: string; cor: string };
}
```

**Cálculos**:
```javascript
totalReceitas = transacoes.filter(t => t.tipo === 'receita').sum(t => t.valor)
totalDespesas = transacoes.filter(t => t.tipo === 'despesa').sum(t => t.valor)
saldo = totalReceitas - totalDespesas
saldoTotalContas = contas.sum(c => c.saldo_atual)
```

**API**: `/api/fp/transacoes`, `/api/fp/contas`

---

#### 3. Contas (`/fp/contas`)
**Objetivo**: Gerenciamento de contas bancárias e cartões
**Campos**: nome, banco, tipo (corrente, poupança, cartão), saldo_atual, cor

#### 4. Categorias (`/fp/categorias`)
**Objetivo**: Organização de transações
**Campos**: nome, tipo (receita, despesa), cor, icone

#### 5. Transações (`/fp/transacoes`)
**Objetivo**: Registro de movimentações financeiras
**Campos**: descricao, valor, tipo, data, categoria_id, conta_id

#### 6. Pluggy (`/fp/pluggy`)
**Objetivo**: Integração Open Finance
**Features**: Conexão com bancos brasileiros, sync automático de transações

---

### ⚙️ MÓDULO OPERACIONAL (`/operacoes/`)

> Central de operações e gestão diária do bar

#### 1. Hub Operacional (`/operacoes`)
**Objetivo**: Acesso rápido às ferramentas operacionais

**Cards disponíveis**:
| Card | Descrição | Destino |
|------|-----------|---------|
| Terminal de Produção | Acompanhe produção em tempo real | `/ferramentas/terminal` |
| Gestão de Insumos | Controle de insumos e receitas | `/ferramentas/producao-insumos` |
| Contagem de Estoque | Registro diário de estoque | `/ferramentas/contagem-estoque` |
| Planejamento de Tempo | Gestão de horários e escalas | `/operacoes/planejamento-tempo` |
| Desempenho | Análise de performance operacional | `/relatorios/desempenho` |
| Relatórios | Relatórios operacionais | `/relatorios` |

**Atalhos Rápidos**:
- Checklists → `/operacoes/checklists/checklists-funcionario`
- Receitas → `/ferramentas/producao-insumos?tab=receitas`
- Insumos → `/ferramentas/producao-insumos?tab=insumos`
- Configurações → `/configuracoes`

---

### 🛠️ MÓDULO FERRAMENTAS (`/ferramentas/`)

> 17 ferramentas especializadas para análise e operações

#### Hub de Ferramentas (`/ferramentas`)
**Objetivo**: Central de todas as ferramentas do sistema

**Estatísticas**:
- Total Ferramentas: 17
- Ativas: 16
- Em Desenvolvimento: 1 (Agente IA)

---

#### 1. Produção e Insumos (`/ferramentas/producao-insumos`)
**Objetivo**: Gestão completa de insumos, receitas e controle de produção
**Features**: Cadastro de Insumos, Receitas, Terminal de Produção
**Tabs**: Insumos | Receitas | Terminal

---

#### 2. Terminal de Produção (`/ferramentas/terminal`)
**Objetivo**: Registro de produção em tempo real
**Features**: Registro de Produção, Baixas, Controle
**Uso**: Operadores registram produções do dia

---

#### 3. CMV Semanal (`/ferramentas/cmv-semanal`)
**Objetivo**: Análise de Custo de Mercadoria Vendida semanal
**Features**: Tabela CMV, Visualização, Análise Semanal

**Subpáginas**:
- `/ferramentas/cmv-semanal/tabela` - Tabela detalhada
- `/ferramentas/cmv-semanal/visualizar` - Visualização gráfica

---

#### 4. DRE (`/ferramentas/dre`)
**Objetivo**: Demonstrativo de Resultado do Exercício

**Interface**:
- Abas: Visão Geral | Detalhado | Histórico
- Filtro por mês/ano
- Gráficos de pizza e linha

**Macro Categorias**:
| Categoria | Tipo | Ícone |
|-----------|------|-------|
| Receita | Entrada | TrendingUp |
| Custos Variáveis | Saída | TrendingDown |
| Custo insumos (CMV) | Saída | ShoppingCart |
| Mão-de-Obra | Saída | Users |
| Despesas Comerciais | Saída | Building2 |
| Despesas Administrativas | Saída | Wrench |
| Despesas Operacionais | Saída | Activity |

**Cálculos**:
```javascript
saldo = entradasTotais - saidasTotais
ebitda = receita - (custos + despesas)
```

**Lançamentos Manuais**: Modal para adicionar entradas/saídas não automáticas
**Dados**: NIBO + Lançamentos Manuais

---

#### 5. Contagem de Estoque (`/ferramentas/contagem-estoque`)
**Objetivo**: Sistema completo de contagem e gestão de estoque

**Interface**:
- Formulário de nova contagem
- Lista de contagens do dia
- Alertas de variação e anomalias
- Filtro por área/categoria

**Dados**:
```typescript
interface ContagemData {
  id: number;
  categoria: string;           // Bebidas, Alimentos, Insumos, etc.
  descricao: string;
  estoque_fechado: number;     // Estoque fechado (lacrado)
  estoque_flutuante: number;   // Estoque aberto
  estoque_total: number;       // Soma dos dois
  preco: number;
  valor_total: number;
  data_contagem: string;
  variacao_percentual: number | null;
  alerta_variacao: boolean;
  alerta_preenchimento: boolean;
  area_id: number | null;
  contagem_anomala?: boolean;
  score_anomalia?: number;
  tipo_anomalia?: string[];
}
```

**Subpáginas**:
- `/ferramentas/contagem-estoque/historico` - Histórico de contagens
- `/ferramentas/contagem-estoque/anomalias` - Contagens anômalas
- `/ferramentas/contagem-estoque/consolidado` - Visão consolidada

---

#### 6. Contagem Rápida (`/ferramentas/contagem-rapida`)
**Objetivo**: Contagem simplificada e rápida de itens
**Uso**: Contagem expressa durante operação

---

#### 7. Áreas de Contagem (`/ferramentas/areas-contagem`)
**Objetivo**: Gestão de áreas e locais de contagem
**Features**: Cadastro de áreas, organização por tipo

---

#### 8. NPS e Felicidade (`/ferramentas/nps`)
**Objetivo**: Análise de satisfação e NPS dos clientes e funcionários

**Dados de NPS (Clientes)**:
```typescript
interface NPSDadoCategorizado {
  semana?: string;
  total_respostas: number;
  nps_geral: NPSMetrica;
  nps_ambiente: NPSMetrica;
  nps_atendimento: NPSMetrica;
  nps_limpeza: NPSMetrica;
  nps_musica: NPSMetrica;
  nps_comida: NPSMetrica;
  nps_drink: NPSMetrica;
  nps_preco: NPSMetrica;
  nps_reservas: NPSMetrica;
}
```

**Dados de Felicidade (Funcionários)**:
```typescript
interface FelicidadeData {
  funcionario_nome: string;
  setor: string;
  quorum: number;
  eu_comigo_engajamento: number;
  eu_com_empresa_pertencimento: number;
  eu_com_colega_relacionamento: number;
  eu_com_gestor_lideranca: number;
  justica_reconhecimento: number;
  media_geral: number;
}
```

**Análise de Sentimento**: IA analisa comentários para classificar como positivo/negativo/neutro

**Subpáginas**:
- `/ferramentas/nps/categorizado` - NPS por categoria

---

#### 9. Simulação CMO (`/ferramentas/simulacao-cmo`)
**Objetivo**: Simulador de Custo de Mão de Obra

**Interface**:
- Seleção de mês/ano
- Lista de funcionários editável
- Cálculos automáticos de encargos
- Histórico de simulações
- Guia de cálculos

**Dados por Funcionário**:
```typescript
interface Funcionario {
  id: string;
  nome: string;
  tipo_contratacao: 'CLT' | 'PJ';
  area: string;                    // Salão, Liderança, Bar, Cozinha
  diaria: number;
  vale: number;
  salario_bruto: number;
  adicionais: number;
  aviso_previo: number;
  estimativa: number;
  tempo_casa: number;
  mensalidade_sindical: number;
  dias_trabalhados: number;
}
```

**Cálculos**:
```javascript
total_folha = soma(salario_bruto + adicionais)
total_encargos = soma(vale + aviso_previo + estimativa + mensalidade_sindical)
total_geral = total_folha + total_encargos
cmo_percentual = (total_geral / faturamento) × 100
```

---

#### 10. Análise de Couvert (`/ferramentas/analise-couvert`)
**Objetivo**: Análise detalhada de couvert e cover charge
**Features**: Relatórios de couvert por período

---

#### 11. Calendário (`/ferramentas/calendario`)
**Objetivo**: Visualização de eventos e agenda
**Features**: Eventos, Agenda, Visualização mensal/semanal

---

#### 12. Agendamento Automático (`/ferramentas/agendamento`)
**Objetivo**: Automatização de processos e sincronização de dados
**Features**: Execução automática de syncs, logs de execução

---

#### 13. Controle Stockout (`/ferramentas/stockout`)
**Objetivo**: Monitore produtos em falta e disponibilidade em tempo real
**Features**: Análise Diária, Histórico, Por Local
**Dados**: Cruza vendas com estoque para identificar ruptura

---

#### 14. Dados Reunião (`/ferramentas/dados-reuniao`)
**Objetivo**: Dados consolidados para reuniões de gestão
**Features**: Export de métricas para apresentações

---

#### 15. Agente IA (`/ferramentas/agente`) 🚧
**Objetivo**: Assistente inteligente para análises e insights automáticos
**Status**: Em desenvolvimento
**Features planejadas**: Chat com IA, Análises automáticas, Alertas proativos

---

### 📋 MÓDULO RELATÓRIOS (`/relatorios/`)

> Relatórios analíticos e operacionais

#### 1. Clientes Ativos (`/relatorios/clientes-ativos`)
**Objetivo**: Análise de clientes ativos por período

**Interface**:
- Seletor de período: Dia, Semana, Mês
- Navegação de datas (anterior/próximo)
- Gráficos de evolução
- Insights automáticos

**Dados**:
```typescript
interface ClientesAtivosData {
  periodo: string;
  periodoAtual: { inicio: string; fim: string };
  periodoAnterior: { inicio: string; fim: string };
  atual: {
    totalClientes: number;
    novosClientes: number;
    clientesRetornantes: number;
    percentualNovos: number;
    percentualRetornantes: number;
    clientesAtivos: number;
  };
  anterior: {
    totalClientes: number;
    novosClientes: number;
    clientesRetornantes: number;
    clientesAtivos: number;
  };
  variacoes: {
    total: number;
    novos: number;
    retornantes: number;
    ativos: number;
  };
  insights: Array<{
    tipo: 'positivo' | 'atencao' | 'info';
    titulo: string;
    descricao: string;
  }>;
}
```

**Evolução Mensal**:
```typescript
interface EvolucaoMensal {
  mes: string;
  totalClientes: number;
  novosClientes: number;
  clientesRetornantes: number;
  percentualNovos: number;
  percentualRetornantes: number;
  baseAtiva: number;           // Clientes únicos nos últimos 90 dias
}
```

**API**: `/api/clientes-ativos?periodo={dia|semana|mes}&bar_id={id}&data_inicio={date}`

---

#### 2. Tempo de Estadia (`/relatorios/tempo-estadia`)
**Objetivo**: Análise do tempo médio que clientes permanecem no bar
**Dados**: Calculado a partir de horário de entrada e última comanda

---

#### 3. Vendas por Categoria (`/relatorios/vendas-categorias`)
**Objetivo**: Análise de vendas agrupadas por categoria de produto
**Dados**: `contahub_analitico` agrupado por `grp_desc`

---

### 👥 MÓDULO CRM INTELIGENTE (`/crm/`)

> Sistema completo de gestão de relacionamento com clientes usando **Inteligência Artificial** e **Machine Learning**

#### 1. Hub CRM (`/crm`)
**Objetivo**: Dashboard central com acesso aos 7 módulos de CRM

**Módulos disponíveis**:
| Módulo | Descrição | Features |
|--------|-----------|----------|
| Segmentação RFM | Análise RFM com 7 segmentos | VIP Champions, Fiéis, Grande Potencial |
| Predição de Churn | IA identifica clientes em risco | Score 0-100%, Alertas, Níveis de Risco |
| Campanhas Automáticas | WhatsApp, Email, Cupons | Templates, Email Marketing, Métricas |
| Padrões de Comportamento | Hábitos e preferências | Dia Preferido, Horário, Tipo Evento |
| LTV e Engajamento | Lifetime Value e score | Projeção 12/24m, Score 0-100, ROI |
| Recomendações IA | Sugestões personalizadas | Eventos, Produtos, Cupons |
| Dashboard Retenção | Cohort analysis e funil | 5 Etapas, Taxa Retenção |

---

#### 2. Segmentação RFM Inteligente (`/crm/inteligente`)
**Objetivo**: Segmentar clientes usando modelo RFM (Recência, Frequência, Monetário)

**Segmentos**:
| Segmento | Critério | Ação Sugerida |
|----------|----------|---------------|
| VIP Champions | Alta frequência + alto gasto + recente | Programas de fidelidade exclusivos |
| Clientes Fiéis | Alta frequência + gasto médio | Ofertas de upgrade |
| Grande Potencial | Recente + baixa frequência + alto gasto | Incentivo à frequência |
| Em Risco | Não visita há tempo + era frequente | Campanha de reativação |
| Hibernando | Muito tempo sem visitar | Cupons agressivos |
| Novos | Primeira ou segunda visita | Welcome campaign |
| Perdidos | Sem visita há muito tempo | Re-engajamento ou descarte |

---

#### 3. Predição de Churn (`/crm/churn-prediction`)
**Objetivo**: IA que prevê quais clientes vão parar de frequentar

**Cálculo do Score**:
```javascript
// Fatores considerados:
- Dias desde última visita
- Frequência histórica
- Tendência de gastos
- Mudança de padrão
- Sazonalidade

// Score de Risco: 0-100%
// 0-30%: Baixo risco (verde)
// 30-60%: Médio risco (amarelo)
// 60-85%: Alto risco (laranja)
// 85-100%: Crítico (vermelho)
```

---

#### 4. Campanhas Automáticas (`/crm/campanhas`)
**Objetivo**: Criar e gerenciar campanhas de marketing

**Canais**:
- WhatsApp (via Twilio/WhatsApp Business)
- Email Marketing
- Cupons de desconto

**Templates**: Mensagens pré-definidas por segmento

---

#### 5. LTV e Engajamento (`/crm/ltv-engajamento`)
**Objetivo**: Calcular Lifetime Value e score de engajamento

**Cálculos**:
```javascript
// LTV Atual
LTV = Ticket_Medio × Frequencia_Mensal × Meses_Cliente

// Projeção LTV (12 meses)
LTV_12m = LTV_Atual × (1 + Taxa_Retencao)^12

// Score de Engajamento (0-100)
Engajamento = (Recência × 0.3) + (Frequência × 0.4) + (Interações × 0.3)
```

---

#### 6. Padrões de Comportamento (`/crm/padroes-comportamento`)
**Objetivo**: Identificar hábitos dos clientes

**Análises**:
- Dia da semana preferido
- Horário favorito de chegada
- Tipo de evento preferido
- Categorias de produtos mais consumidas

---

#### 7. Dashboard de Retenção (`/crm/retencao`)
**Objetivo**: Cohort analysis e funil de jornada

**5 Etapas do Funil**:
1. Atração (primeiro contato)
2. Primeira Visita
3. Segunda Visita (conversão)
4. Frequente (3+ visitas)
5. Fiel (6+ visitas ou membro)

**Cohort Analysis**: Taxa de retorno mês a mês

---

## 📈 FÓRMULAS E CÁLCULOS IMPORTANTES

### Indicadores de Custo (quanto MENOR, melhor)

```javascript
// CMV - Custo Mercadoria Vendida
CMV_Percentual = (Custo_Produtos / Faturamento_Bruto) × 100
// Meta: < 34%

// CMO - Custo Mão de Obra  
CMO_Percentual = (Custo_Pessoal / Faturamento_Bruto) × 100
// Meta: < 20%

// Percentual Artístico
Artistica_Percentual = (Custo_Atracoes / Faturamento_Bruto) × 100
// Meta: < 17%
```

### Indicadores de Ticket (quanto MAIOR, melhor)

```javascript
// Ticket Médio Geral
Ticket_Medio = Faturamento_Total / Clientes_Atendidos
// Meta: > R$ 103

// Ticket Entrada (couvert)
Ticket_Entrada = Faturamento_Couvert / Clientes_Atendidos
// Meta: > R$ 15,50

// Ticket Bar
Ticket_Bar = Faturamento_Bar / Clientes_Atendidos
// Meta: > R$ 77,50
```

### Indicadores de Retenção

```javascript
// Retenção Mensal
Retencao = (Clientes_Retornantes / Total_Clientes) × 100
// Meta: > 40%

// Retenção Real (trimestral)
Retencao_Real = (Clientes_Trimestre_Anterior_que_Voltaram / Clientes_Trimestre_Anterior) × 100
// Meta: > 5%
```

### Performance vs Meta

```javascript
// Indicador de cor para metas "quanto MAIOR melhor"
cor = realizado >= meta ? 'verde' : 'vermelho'

// Indicador de cor para metas "quanto MENOR melhor" (CMV, CMO, Artística)
cor = realizado <= meta ? 'verde' : 'vermelho'

// Percentual de atingimento
atingimento = (realizado / meta) × 100
```

---

## 🔗 ESTRUTURA DE APIs PRINCIPAIS

### APIs Estratégicas
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/estrategico/planejamento-comercial` | GET | Dados de eventos do mês |
| `/api/estrategico/desempenho` | GET | Performance semanal/mensal |
| `/api/estrategico/orcamentacao` | GET/POST | Orçamento planejado vs realizado |
| `/api/visao-geral/indicadores` | GET | KPIs anuais e trimestrais |

### APIs de Eventos
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/eventos` | GET | Lista de eventos |
| `/api/eventos/{id}` | GET/PUT | Detalhes e edição de evento |
| `/api/eventos/{id}/valores-reais` | PUT | Atualizar valores reais |

### APIs ContaHub
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/contahub/analitico` | GET | Vendas detalhadas |
| `/api/contahub/fatporhora` | GET | Faturamento por hora |
| `/api/contahub/pagamentos` | GET | Formas de pagamento |

---

## 📊 RESUMO EXECUTIVO DO SISTEMA

### Módulos Implementados

| Módulo | Páginas | Status | Descrição |
|--------|---------|--------|-----------|
| **Estratégico** | 5 | ✅ 100% | Planejamento, Desempenho, Orçamento, Visão Geral, Visão Mensal |
| **Analítico** | 8 | ✅ 100% | Clientes, Eventos, Produtos, Comparativos, Resumos |
| **CRM** | 7 | ✅ 100% | RFM, Churn, Campanhas, Comportamento, LTV, Retenção |
| **Ferramentas** | 17 | ✅ 94% | CMV, DRE, NPS, Estoque, Produção, Calendário, etc. |
| **Financeiro (FP)** | 5 | ✅ 100% | Dashboard, Contas, Categorias, Transações, Pluggy |
| **Operacional** | 6 | ✅ 100% | Terminal, Insumos, Estoque, Checklists |
| **Relatórios** | 4 | ✅ 100% | Clientes Ativos, Tempo Estadia, Vendas Categorias |

### Fontes de Dados Integradas

| Fonte | Tipo | Frequência Sync | Dados |
|-------|------|-----------------|-------|
| ContaHub | PDV | 06:00, 10:00 | Vendas, Produtos, Clientes |
| NIBO | Financeiro | 07:00 | Despesas, Receitas, Categorias |
| GetIn | Reservas | A cada 30min | Reservas, Clientes |
| Yuzer | Eventos | 08:00 | Eventos especiais, Ingressos |
| Sympla | Ingressos | Sob demanda | Domingos, Eventos grandes |

### Tabelas Principais

| Tabela | Registros Estimados | Uso Principal |
|--------|--------------------:|---------------|
| `eventos` | ~500/ano | Consolidado diário |
| `contahub_analitico` | ~100k/mês | Vendas detalhadas |
| `contahub_periodo` | ~10k/mês | Clientes e comandas |
| `contahub_pagamentos` | ~5k/mês | Formas de pagamento |
| `nibo_agendamentos` | ~200/mês | Contas a pagar/receber |

### Agentes de IA Disponíveis

| Agente | Função | Status |
|--------|--------|--------|
| `agente-supervisor` | Orquestrador principal | ✅ Ativo |
| `agente-sql-expert` | Consultas ao banco | ✅ Ativo |
| `agente-auditor` | Análise de contexto | ✅ Ativo |
| `agente-mapeador-tabelas` | Mapeia estrutura BD | ✅ Ativo |
| `agente-analise-periodos` | Análises temporais | ✅ Ativo |

### Próximos Passos

1. **Chat integrado**: Interface de chat com agentes no sistema
2. **WhatsApp Bot**: Integração para sócios consultarem dados
3. **Discord Alerts**: Alertas proativos de problemas detectados
4. **Dashboards IA**: Insights automáticos em dashboards
5. **Relatórios Automáticos**: Envio periódico de resumos

---

*Última atualização: Janeiro 2026*
*Versão: 3.0 - Base Completa*

