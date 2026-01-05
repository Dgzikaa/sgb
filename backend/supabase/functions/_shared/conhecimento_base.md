# 🧠 BASE DE CONHECIMENTO - ZYKOR

Este arquivo contém **TODA** a inteligência de negócio que os Agentes IA usam para análises contextualizadas.

---

## 📊 INDICADORES SEMANAIS PRIORITÁRIOS

### 1. FATURAMENTO BRUTO
```sql
-- Fonte: contahub_analitico
-- Período: Semanal (Segunda a Domingo)
SELECT 
  bar_id,
  DATE_TRUNC('week', data) as semana,
  SUM(valor_bruto) as faturamento_bruto,
  COUNT(DISTINCT data) as dias_operacao,
  SUM(valor_bruto) / NULLIF(COUNT(DISTINCT data), 0) as media_diaria
FROM contahub_analitico
WHERE data >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
GROUP BY bar_id, DATE_TRUNC('week', data)
```

**METAS POR BAR:**
- Windsor: R$ 50.000 - 70.000/semana
- Outros bares: R$ 30.000 - 50.000/semana

**ALERTAS:**
- ⚠️ Se até quinta-feira < 60% da meta
- 🔴 Se final de semana < 80% da meta
- ✅ Se > 110% da meta (comemorar!)

**AÇÕES AUTOMÁTICAS:**
- Comparar com mesma semana mês anterior
- Comparar com média das últimas 4 semanas
- Identificar causa de queda > 15%

---

### 2. CMV (CUSTO DE MERCADORIA VENDIDA)
```sql
-- Fonte: cmv_semanal
-- Meta: 25-32% (varia por bar)
SELECT 
  bar_id,
  semana_referencia,
  (custo_total_periodo / NULLIF(faturamento_periodo, 0)) * 100 as cmv_percentual,
  custo_total_periodo,
  faturamento_periodo
FROM cmv_semanal
WHERE semana_referencia >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
```

**METAS:**
- Ideal: 25-30%
- Aceitável: 30-32%
- Crítico: > 35% ou < 20%

**ALERTAS:**
- 🔴 CMV > 35% - Investigar desperdício, roubo ou erro de lançamento
- 🔴 CMV < 20% - Possível erro de dados (falta lançamento de custos)
- ⚠️ CMV > 32% - Revisar precificação ou fornecedores

**CAUSAS COMUNS DE CMV ALTO:**
1. Desperdício na cozinha
2. Porções muito grandes
3. Roubo/quebra não contabilizada
4. Preço de venda baixo
5. Custo de insumo aumentou

---

### 3. TICKET MÉDIO
```sql
-- Fonte: contahub_analitico
-- Meta: R$ 80-120 por comanda
SELECT 
  bar_id,
  data,
  valor_bruto / NULLIF(quantidade_comandas, 0) as ticket_medio
FROM contahub_analitico
WHERE data >= CURRENT_DATE - INTERVAL '30 days'
```

**METAS:**
- Ideal: R$ 100-120
- Aceitável: R$ 80-100
- Baixo: < R$ 70

**ESTRATÉGIAS PARA AUMENTAR:**
- Upsell (sugerir entrada/sobremesa)
- Combos promocionais
- Happy hour com ticket mínimo
- Treinamento de garçons

---

### 4. FATURAMENTO POR HORA (PRODUTIVIDADE)
```sql
-- Fonte: contahub_fatporhora
-- Identifica horários de pico e ociosidade
SELECT 
  bar_id,
  data,
  hora,
  valor_hora,
  quantidade_pedidos
FROM contahub_fatporhora
WHERE data >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY valor_hora DESC
```

**PADRÕES ESPERADOS:**
- 18h-20h: Chegada (10-15% do faturamento)
- 21h-23h: PICO (40-50% do faturamento)
- 00h-02h: Fechamento (20-30% do faturamento)

**ALERTAS:**
- Se horário de pico (21h-23h) < 30% do total
- Se madrugada (00h-02h) > 50% (possível problema operacional)

---

## 🎯 METAS OPERACIONAIS CRÍTICAS

### CHECKLISTS (Compliance Operacional)
```sql
-- Fonte: checklist_executions
-- Meta: 95%+ de conclusão no prazo
SELECT 
  ce.bar_id,
  COUNT(*) as total_agendado,
  COUNT(*) FILTER (WHERE ce.status = 'concluido') as concluidos,
  COUNT(*) FILTER (WHERE ce.concluido_em > ce.prazo_execucao) as atrasados,
  ROUND(
    COUNT(*) FILTER (WHERE ce.status = 'concluido')::NUMERIC / COUNT(*) * 100, 
    2
  ) as taxa_conclusao
FROM checklist_executions ce
WHERE ce.agendado_para >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ce.bar_id
```

**METAS:**
- Taxa conclusão: ≥ 95%
- Atraso médio: < 2 horas
- Execução até: 12h do dia seguinte

**ALERTAS:**
- 🔴 Taxa < 80% - Problema sério de gestão
- ⚠️ Atraso > 24h - Falta comprometimento
- ✅ Taxa > 98% - Equipe exemplar

---

### ESTOQUE (Controle de Insumos)
```sql
-- Fonte: estoque_insumos
-- Prevenir stockout e estoque parado
SELECT 
  i.nome as insumo,
  ei.quantidade_atual,
  ei.unidade,
  ei.ultima_contagem,
  CURRENT_DATE - ei.ultima_contagem::date as dias_sem_contar
FROM estoque_insumos ei
JOIN insumos i ON i.id = ei.insumo_id
WHERE ei.bar_id = $1
ORDER BY dias_sem_contar DESC
```

**METAS:**
- Giro ideal: 7-14 dias
- Contagem: Semanal mínimo
- Estoque mínimo: 2-3 dias de operação

**ALERTAS:**
- 🔴 Estoque negativo (impossível - erro de sistema)
- 🔴 Sem contagem há > 15 dias
- ⚠️ Estoque > 30 dias parado (capital imobilizado)
- ⚠️ Produtos críticos < 2 dias

---

## 📈 PADRÕES DE NEGÓCIO (APRENDIDOS)

### DIAS DE OPERAÇÃO POR BAR
```
Windsor:
- Terça a Sábado: Operação normal
- Domingo: Ocasionalmente (eventos)
- Segunda: Fechado

Outros Bares:
- Verificar padrão individual via análise de períodos
```

### SAZONALIDADE (HISTÓRICO 2024-2025)
```
Janeiro: -15 a -25% (pós-festas, verão)
Fevereiro: -10 a -20% (carnaval, férias)
Março: Retorno ao normal
Abril: +5% (início outono)
Maio: Normal
Junho: +10 a +15% (festas juninas)
Julho: +10% (férias, frio)
Agosto: Normal
Setembro: +5% (primavera)
Outubro: +10% (pré-festas)
Novembro: +15% (black friday, início festas)
Dezembro: +30 a +50% (festas fim de ano)
```

### DIAS DA SEMANA (Média de Faturamento)
```
Segunda: 0% (fechado)
Terça: 8-12%
Quarta: 10-15%
Quinta: 15-20%
Sexta: 30-35% (maior dia)
Sábado: 25-30%
Domingo: 5-10% (se abrir)
```

---

## ⚠️ ALERTAS CRÍTICOS (PRIORIDADE MÁXIMA)

### 1. GAPS DE DADOS
```
DETECTAR:
- Qualquer dia que deveria ter dados e não tem
- Dias com faturamento = 0 em dia de operação
- Gaps > 2 dias consecutivos

AÇÕES:
1. Verificar se bar estava realmente aberto
2. Checar logs de sync ContaHub
3. Executar sync retroativo se necessário
4. Validar com gerente do bar
```

### 2. CMV IMPOSSÍVEL
```
DETECTAR:
- CMV > 100% (prejuízo direto)
- CMV < 10% (erro de lançamento)
- Variação > 15% semana vs semana

AÇÕES:
1. Validar dados de custo (contagem estoque)
2. Validar dados de faturamento (sync ContaHub)
3. Verificar lançamentos manuais
4. Comparar com período similar
```

### 3. ESTOQUE NEGATIVO
```
DETECTAR:
- Qualquer insumo com quantidade < 0
- Produtos críticos zerados

AÇÕES:
1. Corrigir contagem imediatamente
2. Investigar causa (erro lançamento? uso não contabilizado?)
3. Revisar processo de contagem
```

### 4. SINCRONIZAÇÃO FALHA
```
DETECTAR:
- Sync ContaHub falhou por > 6 horas
- Último dado > 24h atrás
- Erro recorrente (> 3x no dia)

AÇÕES:
1. Verificar credenciais ContaHub
2. Testar conexão API
3. Executar sync manual
4. Notificar equipe técnica
```

---

## 🔄 PROCESSOS AUTOMÁTICOS CONFIGURADOS

### 1. SYNC CONTAHUB (CRÍTICO)
```
Frequência: A cada 1 hora (24x por dia)
Edge Function: contahub-sync-automatico
Horário Crítico: 02h-04h (fechamento dia anterior)
Tabelas Afetadas: contahub_analitico, contahub_fatporhora, contahub_pagamentos

MONITORAR:
- Taxa de sucesso: > 95%
- Tempo execução: < 2 minutos
- Último sync: < 2 horas atrás
```

### 2. CMV SEMANAL AUTO
```
Frequência: Segunda-feira 08h00
Edge Function: cmv-semanal-auto
Período: Semana anterior completa
Tabelas: cmv_semanal, estoque_insumos, receitas

MONITORAR:
- Execução até terça 12h
- CMV entre 20-35%
- Cobertura de dados > 80%
```

### 3. DESEMPENHO SEMANAL
```
Frequência: Segunda-feira 10h00
Edge Function: desempenho-semanal-auto
Consolida: Todos os KPIs da semana
Tabelas: desempenho_semanal, sistema_kpis

GERA:
- Faturamento total
- CMV médio
- Ticket médio
- Taxa conclusão checklists
- Score geral (0-100)
```

### 4. CHECKLIST AUTO-SCHEDULER
```
Frequência: Diária 06h00
Edge Function: checklist-auto-scheduler
Cria: Agendamentos do dia
Tabelas: checklist_agendamentos, checklist_schedules

REGRAS:
- Abertura: agendar para 11h
- Fechamento: agendar para 03h (dia seguinte)
- Limpeza: agendar para 10h
```

---

## 💡 REGRAS DE NEGÓCIO VALIDADAS

### PRECIFICAÇÃO E MARGEM
```
MARGEM MÍNIMA POR CATEGORIA:
- Bebidas (cerveja, chopp): 60-70%
- Drinks: 70-80%
- Comida (porções): 60-65%
- Pratos principais: 55-60%

CMV ALVO POR CATEGORIA:
- Bebidas: 25-30%
- Comida: 30-35%
- Drinks: 20-25%

FÓRMULA:
Preço Venda = Custo / (1 - Margem Desejada)
Ex: Custo R$ 10, Margem 70% → Preço = 10 / 0.30 = R$ 33,33
```

### EQUIPE E PERFORMANCE
```
FUNCIONÁRIO ATIVO:
- Checklist concluído toda semana (mínimo 1x)
- Tempo médio execução: 15-30 minutos
- Taxa atraso: < 10%

FUNCIONÁRIO INATIVO:
- Sem checklist há > 30 dias
- Taxa conclusão < 50%
- Sempre atrasado (> 24h)
```

### EVENTOS E PROMOÇÕES
```
EVENTO LUCRATIVO:
- ROI mínimo: 150% (faturamento / custo)
- Faturamento: 2-3x dia normal
- CMV aceitável: até 35%

HAPPY HOUR:
- Horário: 18h-20h
- Desconto máximo: 30%
- Ticket mínimo: R$ 50
- Meta: Aumentar fluxo em 40%
```

---

## 📊 QUERIES SQL MAIS USADAS

### Top 10 Produtos Mais Vendidos (Últimos 30 dias)
```sql
SELECT 
  produto,
  SUM(quantidade) as total_vendido,
  SUM(valor_bruto) as faturamento_total,
  COUNT(DISTINCT data) as dias_vendidos
FROM contahub_analitico
WHERE bar_id = $1 
  AND data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY produto
ORDER BY total_vendido DESC
LIMIT 10
```

### Comparação Faturamento Mensal
```sql
SELECT 
  TO_CHAR(data, 'YYYY-MM') as mes,
  SUM(valor_bruto) as faturamento,
  COUNT(DISTINCT data) as dias_operacao,
  SUM(valor_bruto) / COUNT(DISTINCT data) as media_diaria
FROM contahub_analitico
WHERE bar_id = $1
  AND data >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY TO_CHAR(data, 'YYYY-MM')
ORDER BY mes DESC
```

### Identificar Dias com Problemas de Dados
```sql
WITH dias_esperados AS (
  SELECT generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'),
    CURRENT_DATE,
    '1 day'::interval
  )::date as data
),
dias_reais AS (
  SELECT DISTINCT data
  FROM contahub_analitico
  WHERE bar_id = $1
)
SELECT de.data
FROM dias_esperados de
LEFT JOIN dias_reais dr ON de.data = dr.data
WHERE dr.data IS NULL
  AND EXTRACT(DOW FROM de.data) NOT IN (0, 1) -- Não domingo/segunda
ORDER BY de.data DESC
```

---

## 🎓 APRENDIZADOS E INSIGHTS (EM EVOLUÇÃO)

### Descobertas até agora:
1. ✅ Faturamento sexta-feira representa 30-35% da semana
2. ✅ CMV > 35% geralmente indica erro de contagem, não problema real
3. ✅ Horário 21h-23h concentra 40-50% do faturamento diário
4. ✅ Eventos bem-sucedidos têm ROI > 200%
5. ✅ Checklists atrasados NÃO impactam faturamento significativamente

### Correlações encontradas:
- CMV alto + Estoque baixo = Compras emergenciais (preço alto)
- Ticket médio < R$ 70 + Sexta-feira = Possível problema operacional
- Faturamento 00h-02h > 40% = Time de garçons lento (acumula pedidos)

### Padrões detectados:
- Terça-feira com faturamento > R$ 8k = Evento especial
- Quarta-feira sempre 10-15% do total semanal
- Último sábado do mês: +20% vs outros sábados

---

## 🔮 PRÓXIMAS ANÁLISES (ROADMAP)

### Semana 1-2:
- [ ] Mapear 100% das tabelas em uso vs desuso
- [ ] Identificar todos os gaps de dados (1 ano)
- [ ] Auditar CMV impossíveis e corrigir
- [ ] Validar estoque negativo

### Semana 3-4:
- [ ] Análise de clientes (se houver dados)
- [ ] Correlação clima x faturamento
- [ ] Impacto eventos cidade
- [ ] Benchmarking entre bares

### Mês 2:
- [ ] Machine Learning preditivo
- [ ] Otimização automática de preços
- [ ] Sugestão inteligente de compras
- [ ] Detecção de anomalias em tempo real

---

**INSTRUÇÕES PARA AGENTES IA:**
- Este arquivo é a FONTE DA VERDADE sobre o negócio
- Use essas informações para contextualizar análises
- Atualize este arquivo quando descobrir novas regras
- Sempre cite a fonte (tabela + coluna) das informações
- Priorize alertas CRÍTICOS sobre insights gerais

**ÚLTIMA ATUALIZAÇÃO:** 2025-01-05  
**VERSÃO:** 2.0  
**STATUS:** Produção
