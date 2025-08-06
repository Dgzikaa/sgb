# REORGANIZAÇÃO SISTEMA SGB v3 - REGRAS E ESTRUTURA

## 📋 OVERVIEW DA REORGANIZAÇÃO

Este documento contém todas as regras e estruturas definidas para a reorganização completa do sistema SGB v3 conforme reunião de 31/01/2025.

## 🎯 1. NOVA ESTRUTURA DA VISÃO GERAL (HOME)

### 1.1 Indicadores Anuais (Meta 2025)

#### Faturamento 2025
- **Meta**: R$ 10.000.000,00
- **Cálculo**: 
  - `contahub_pagamentos.liquido` (soma)
  - `+ yuzer_pagamentos.valor_liquido` (soma)
  - `+ sympla_pedidos.valor_liquido` (soma)
- **Visualização**: Card com barra de progresso

#### Número de Pessoas
- **Meta**: 12.000 mensal (144.000 anual)
- **Cálculo**:
  - `contahub_periodo.pessoas` (soma)
  - `+ yuzer_produtos.quantidade` (soma onde `produto_nome` contém 'ingresso' ou 'entrada')
  - `+ sympla_participantes` (count onde `fez_checkin = true`)
- **Visualização**: Card com barra de progresso

#### Reputação
- **Meta**: Google 4.8
- **Cálculo**: `windsor_google.review_average_rating_total` (média)
- **Visualização**: Card com barra de progresso

#### EBITDA 2025
- **Meta**: R$ 1.000.000,00
- **Cálculo**: Baseado na DRE (view a ser construída com `nibo_agendamentos`)
- **Status**: Manter zerado inicialmente
- **Visualização**: Card com barra de progresso

### 1.2 Indicadores Trimestrais (3º Tri - Jul/Ago/Set)

#### Número de Clientes Ativos
- **Meta**: 3.000
- **Definição**: Clientes que visitaram pelo menos 2 vezes em 90 dias
- **Cálculo**: 
  - Analisar `contahub_periodo.celular`
  - Contar quantos números aparecem 2+ vezes no período de 90 dias

#### Número de Clientes Totais
- **Meta**: 10.000
- **Cálculo**: Mesmo cálculo de "Número de Pessoas" anual, mas filtrado para o trimestre

#### Retenção
- **Meta**: 10%
- **Status**: Input manual inicialmente

#### CMV Limpo
- **Meta**: 34%
- **Status**: Input manual inicialmente

#### CMO (Custo Mão de Obra)
- **Meta**: 20%
- **Cálculo**: 
  - Soma de `nibo_agendamentos` no trimestre com categorias:
    - Salários
    - Alimentação
    - Provisão Trabalhista
    - Vale Transporte
    - Adicionais
    - Freela Atendimento
    - Freela Bar
    - Freela Cozinha
    - Freela Limpeza
    - Freela Segurança
    - CUSTO-EMPRESA FUNCIONÁRIOS
  - Dividido pelo faturamento do trimestre

#### % Artística
- **Meta**: 17%
- **Cálculo**: `planejamento_comercial_view.percent_art_fat` (média no trimestre)

## 🗂️ 2. NOVA ESTRUTURA DO MENU LATERAL

### Estratégico
- **Visão Geral** (nova Home)
- **Tabela de Desempenho** (melhorar existente)
- **Planejamento Comercial** (finalizar existente)
- **Orçamentação** (criar nova)

### Operacional
- **Agendamento** (manter existente)

### Analítico
- **Agente IA** (implementar futuramente)
  - Análises textuais inicialmente
  - Gráficos de evolução no futuro
  - Comparativos e insights automáticos

## 📊 3. TABELA DE DESEMPENHO - MELHORIAS

### Correções Necessárias
- **Bug**: Rota atual está direcionando para `/gestao/tempo` - corrigir para rota correta
- **Funcionalidade**: Permitir edição manual de valores ao clicar em cada semana

### Indicadores da Tabela (Por Semana/Mês)

#### Faturamento Total
- Mesma lógica da Visão Geral, filtrado por período

#### Faturamento Couvert
- `contahub_periodo.vr_couvert` (soma)
- `+ yuzer_produtos.quantidade` (soma onde `produto_nome` contém 'ingresso' ou 'entrada')
- `+ sympla_pedido` (count onde `fez_checkin = true`)

#### Faturamento Bar
- Faturamento Total - Faturamento Couvert

#### Faturamento CMvível
- Faturamento Bar - `nibo_agendamentos` (onde categoria contém 'comissão')

#### CMV R$
- Input manual

#### Ticket Médio
- Faturamento Total / Clientes Atendidos

#### CMV Limpo %
- CMV / Faturamento CMvível

#### CMO %
- Mesma lógica da Visão Geral, por período

#### Atração/Faturamento
- Mesma lógica da Visão Geral, por período

#### Clientes Atendidos
- Mesma lógica da Visão Geral, por período

#### Reservas Totais
- Input manual

#### Reservas Presentes
- Input manual

### Dados da Tabela
- Utilizar tabela existente `desempenho_semanal`
- Implementar edição inline dos valores

## 💰 4. PÁGINA DE ORÇAMENTAÇÃO

### Estrutura
- **Filtro**: Seleção de mês (agosto pré-selecionado)
- **Colunas**:
  - PLANEJADO (manual)
  - PROJEÇÃO (manual)
  - REALIZADO (automático de `nibo_agendamentos`)

### Categorias e Subcategorias

#### Despesas Variáveis
- IMPOSTO/TX MAQ/COMISSÃO

#### Custo Insumos (CMV) vs BP
- CMV (manual)

#### Mão-de-Obra
- CUSTO-EMPRESA FUNCIONÁRIOS
- SALÁRIOS
- ALIMENTAÇÃO
- PROVISÃO TRABALHISTA
- VALE TRANSPORTE
- ADICIONAIS
- FREELA ATENDIMENTO
- FREELA BAR
- FREELA COZINHA
- FREELA LIMPEZA
- FREELA SEGURANÇA
- PRO LABORE

#### Despesas Administrativas
- Escritório Central
- Administrativo Ordinário
- RECURSOS HUMANOS

#### Despesas Comerciais
- Marketing
- Atrações Programação
- Produção Eventos

#### Despesas Operacionais
- Estorno
- Materiais Operação
- Equipamentos Operação
- Materiais de Limpeza e Descartáveis
- Utensílios
- Outros Operação

#### Despesas de Ocupação (Contas)
- ALUGUEL/CONDOMÍNIO/IPTU
- ÁGUA
- GÁS
- INTERNET
- Manutenção
- LUZ

#### Não Operacionais
- CONTRATOS

### Implementação
- Criar tabela `orcamentacao` no banco
- Implementar sistema de atualização automática (triggers ou colunas calculadas)
- Valores de agosto conforme print fornecido

## 🔧 5. IMPLEMENTAÇÃO TÉCNICA

### Ordem de Execução
1. Criar arquivo de documentação (este arquivo) ✅
2. Ajustar estrutura do menu lateral
3. Criar/Melhorar página Visão Geral como nova Home
4. Corrigir e melhorar Tabela de Desempenho
5. Criar página de Orçamentação
6. Criar tabela `orcamentacao` no banco
7. Implementar sistema de triggers/atualizações automáticas

### Considerações Técnicas
- Utilizar views para cálculos complexos quando possível
- Implementar cache para queries pesadas
- Permitir edição manual onde necessário
- Manter histórico de alterações manuais
- Implementar validações de dados

## 📈 6. METAS E KPIs

### Metas Anuais 2025
- Faturamento: R$ 10.000.000,00
- Pessoas: 144.000 (12.000/mês)
- Reputação: Google 4.8
- EBITDA: R$ 1.000.000,00

### Metas Trimestrais (3º Tri)
- Clientes Ativos: 3.000
- Clientes Totais: 10.000
- Retenção: 10%
- CMV Limpo: 34%
- CMO: 20%
- % Artística: 17%

## 🚀 PRÓXIMOS PASSOS

1. Implementar as mudanças conforme prioridade definida
2. Testar cada componente individualmente
3. Validar cálculos com dados reais
4. Ajustar conforme feedback
5. Deploy em produção após aprovação

---

**Última atualização**: 31/01/2025
**Responsável**: Sistema SGB v3
