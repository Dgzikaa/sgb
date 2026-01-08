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

*Última atualização: Janeiro 2025*
*Versão: 1.0*

