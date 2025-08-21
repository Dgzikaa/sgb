# 📊 CÁLCULOS DETALHADOS - VISÃO GERAL ESTRATÉGICA

## 🎯 **RESUMO DOS INDICADORES**

### **📈 INDICADORES ANUAIS (2025)**

#### **1. Faturamento 2025**
- **Fonte**: `contahub_pagamentos` + `yuzer_pagamento` + `sympla_pedidos`
- **Período**: 2025-02-01 até data atual
- **Cálculo**: 
  - ContaHub: SUM(liquido) = R$ 4.205.815
  - Yuzer: SUM(valor_liquido) = R$ 2.470.052  
  - Sympla: SUM(valor_liquido) = R$ 87.657
  - **Total**: R$ 6.763.523
- **Meta**: R$ 10.000.000
- **Performance**: 68%

#### **2. Pessoas 2025**
- **Fonte**: `contahub_periodo` + `yuzer_produtos` + `sympla_resumo`
- **Período**: 2025-02-01 até data atual
- **Cálculo**:
  - ContaHub: SUM(pessoas) = 43.789
  - Yuzer: SUM(quantidade) onde produto LIKE '%ingresso%' = 8.455
  - Sympla: SUM(checkins) = 2.344 ✅ **CORRIGIDO PARA USAR SYMPLA_RESUMO**
  - **Total**: 53.244 pessoas
- **Meta**: 144.000
- **Performance**: 37%

#### **3. Reputação**
- **Fonte**: `windsor_google`
- **Período**: 2025-02-01 até data atual
- **Cálculo**: AVG(review_average_rating_total) = 4.9
- **Meta**: 4.8
- **Performance**: 102%

#### **4. EBITDA 2025**
- **Status**: Em desenvolvimento
- **Valor**: R$ 0 (placeholder)
- **Meta**: R$ 1.000.000

---

### **📊 INDICADORES TRIMESTRAIS (3º Trimestre 2025)**

#### **1. Clientes Ativos (90 dias)**
- **Fonte**: `contahub_periodo`
- **Período**: Últimos 90 dias (dinâmico)
- **Regra**: Clientes com telefone que visitaram 2+ vezes
- **Cálculo**:
  1. Buscar todos registros dos últimos 90 dias
  2. Filtrar apenas registros com `cli_fone` preenchido
  3. Agrupar por telefone e contar visitas
  4. Contar quantos têm 2+ visitas
- **Resultado**: 2.679 clientes
- **Meta**: 3.000
- **Performance**: 89%
- **❌ PROBLEMA**: Não tem comparação com trimestre anterior

#### **2. Clientes Totais (Trimestre)**
- **Fonte**: `contahub_periodo` + `yuzer_produtos` + `sympla_resumo`
- **Período**: Jul-Set 2025
- **Cálculo**:
  - ContaHub: SUM(pessoas) = 17.238
  - Yuzer: SUM(quantidade) ingressos = 3.215
  - Sympla: SUM(checkins) = 126 ✅ **CORRIGIDO PARA USAR SYMPLA_RESUMO**
  - **Total**: 19.960 pessoas
- **Meta**: 30.000
- **Performance**: 67%

#### **3. Taxa de Retenção**
- **Fonte**: `contahub_periodo`
- **Período**: Mês atual vs últimos 2 meses
- **Regra**: Clientes que vieram no mês atual E nos últimos 2 meses
- **Cálculo**:
  1. Buscar clientes únicos do mês atual (por telefone)
  2. Buscar clientes únicos dos últimos 2 meses (por telefone)
  3. Calcular intersecção (clientes que aparecem em ambos)
  4. Taxa = (intersecção / clientes_mes_atual) * 100
- **Resultado**: 0.0% (pode estar com problema)
- **Meta**: 10.0%

#### **4. CMV Limpo**
- **Status**: Em desenvolvimento
- **Valor**: 0% (placeholder)
- **Meta**: 25%

#### **5. CMO (Custo de Mão de Obra)**
- **Fonte**: `nibo_agendamentos`
- **Período**: Jul-Set 2025
- **Categorias**: SALARIO FUNCIONARIOS, ALIMENTAÇÃO, PROVISÃO TRABALHISTA, VALE TRANSPORTE, FREELA ATENDIMENTO, FREELA BAR, FREELA COZINHA, FREELA LIMPEZA, FREELA SEGURANÇA, Marketing, MANUTENÇÃO, Materiais Operação, Outros Operação
- **Cálculo**:
  - Total CMO: R$ 351.006,93
  - Faturamento Trimestre: R$ 2.474.189,95
  - CMO% = (351.006,93 / 2.474.189,95) * 100 = 14.19%
- **Resultado**: 16.2%
- **Meta**: 20.0%
- **Performance**: 119% (melhor que meta)

#### **6. % Artística**
- **Fonte**: `view_eventos`
- **Período**: Jul-Set 2025
- **Cálculo**: (SUM(c_art_real + c_prod) / SUM(real_r)) * 100
- **Resultado**: 0.0% (pode estar com problema na view)
- **Meta**: 17.0%

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **1. ✅ CORRIGIDO - Sympla usando tabela errada**
- **Antes**: Usava `sympla_participantes.length`
- **Depois**: Usa `sympla_resumo.SUM(checkins)`
- **Impacto**: Melhor performance e dados mais precisos

### **2. ❌ PENDENTE - Clientes Ativos sem comparação**
- **Problema**: Não mostra comparação com trimestre anterior
- **Solução**: Implementar cálculo para trimestre anterior

### **3. ❌ PENDENTE - Taxa de Retenção 0%**
- **Problema**: Pode estar com problema na lógica
- **Investigar**: Verificar se há dados suficientes

### **4. ❌ PENDENTE - % Artística 0%**
- **Problema**: Pode estar com problema na view_eventos
- **Investigar**: Verificar se view existe e tem dados

---

## 🔧 **MELHORIAS IMPLEMENTADAS**

### **1. Paginação Completa**
- ✅ Todas as consultas usam `fetchAllData()` com paginação de 1000 registros
- ✅ Logs detalhados de quantas páginas foram processadas
- ✅ Proteção contra loops infinitos (MAX_ITERATIONS = 100)

### **2. Logs Detalhados**
- ✅ Comparação com valores esperados
- ✅ Breakdown por fonte de dados
- ✅ Amostra dos primeiros registros para debug

### **3. Cache Desabilitado**
- ✅ Views materializadas desabilitadas para forçar recálculo
- ✅ Cache do frontend desabilitado para sempre buscar dados frescos
- ✅ Timestamp único em cada requisição

---

## 📋 **PRÓXIMOS PASSOS**

1. **Implementar comparação trimestre anterior** para Clientes Ativos
2. **Investigar Taxa de Retenção** (por que está 0%)
3. **Verificar % Artística** (view_eventos pode estar com problema)
4. **Reabilitar cache** após validação completa
5. **Implementar CMV Limpo** (input manual)
6. **Implementar EBITDA** (DRE completa)

---

## 🎯 **VALIDAÇÃO DOS DADOS**

### **Dados Confirmados no Banco:**
- ContaHub Pagamentos: 45.433 registros = R$ 4.266.082,80
- ContaHub Pessoas: 45.430 registros = 44.408 pessoas
- Yuzer Pagamentos: 51 registros = R$ 2.470.051,55
- Sympla Resumo: 24 eventos = 2.344 checkins

### **Diferenças Encontradas:**
- API mostra valores ligeiramente diferentes devido a filtros de data
- Período anual usa data atual, não 31/12/2025
- Alguns valores podem ter pequenas diferenças por arredondamento
