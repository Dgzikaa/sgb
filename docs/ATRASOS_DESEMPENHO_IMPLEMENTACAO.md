# Implementação de Atrasos de Entrega no Sistema

## 📋 Visão Geral

Este documento descreve a implementação do sistema de contagem de atrasos de entrega na cozinha e bar, adicionado à tabela `desempenho_semanal`.

## 🎯 Objetivo

Medir a quantidade de itens que ultrapassam os tempos aceitáveis de preparo/entrega:
- **Cozinha (COMIDA)**: Tempo > 1200 segundos (20 minutos)
- **Bar (DRINK)**: Tempo > 600 segundos (10 minutos)

## 🗄️ Estrutura do Banco de Dados

### Novos Campos em `desempenho_semanal`

```sql
-- Campos adicionados
atrasos_cozinha INTEGER DEFAULT 0  -- Quantidade de itens de comida com atraso
atrasos_bar INTEGER DEFAULT 0       -- Quantidade de itens de drink com atraso
```

### Função de Cálculo

```sql
-- Função: calcular_atrasos_periodo
-- Calcula atrasos para um período específico

SELECT * FROM calcular_atrasos_periodo(
  p_data_inicio DATE,      -- Data inicial do período
  p_data_fim DATE,         -- Data final do período
  p_bar_id INTEGER         -- ID do bar (default: 3)
);

-- Exemplo de uso:
SELECT * FROM calcular_atrasos_periodo('2025-11-01', '2025-11-07', 3);
```

**Retorno:**
- `atrasos_cozinha`: Quantidade de itens de comida com tempo > 20min
- `atrasos_bar`: Quantidade de itens de drink com tempo > 10min

## 📊 Fonte de Dados

Os dados são extraídos da tabela `contahub_tempo`:
- **Campo de data**: `data`
- **Campo de categoria**: `categoria` (valores: 'comida', 'drink', 'bebida', 'outros')
- **Campo de tempo**: `t1_t3` (tempo em segundos do início da produção até entrega)

## 🔄 Como Atualizar os Dados

### Opção 1: Atualizar Todas as Semanas de 2025

```sql
-- Atualizar todas as semanas automaticamente
UPDATE desempenho_semanal ds
SET 
  atrasos_cozinha = atrasos.atrasos_cozinha,
  atrasos_bar = atrasos.atrasos_bar,
  updated_at = NOW()
FROM (
  SELECT 
    ds2.id,
    COALESCE((SELECT atrasos_cozinha FROM calcular_atrasos_periodo(ds2.data_inicio, ds2.data_fim, ds2.bar_id)), 0) as atrasos_cozinha,
    COALESCE((SELECT atrasos_bar FROM calcular_atrasos_periodo(ds2.data_inicio, ds2.data_fim, ds2.bar_id)), 0) as atrasos_bar
  FROM desempenho_semanal ds2
  WHERE ds2.ano = 2025
    AND ds2.bar_id = 3
    AND ds2.data_inicio >= '2025-02-01'
) as atrasos
WHERE ds.id = atrasos.id;
```

### Opção 2: Atualizar Semana Específica

```sql
-- Atualizar uma semana específica (exemplo: semana 44)
UPDATE desempenho_semanal
SET 
  atrasos_cozinha = (SELECT atrasos_cozinha FROM calcular_atrasos_periodo(data_inicio, data_fim, bar_id)),
  atrasos_bar = (SELECT atrasos_bar FROM calcular_atrasos_periodo(data_inicio, data_fim, bar_id)),
  updated_at = NOW()
WHERE ano = 2025 
  AND numero_semana = 44
  AND bar_id = 3;
```

## 📈 Consultas e Análises

### Ver Atrasos por Semana

```sql
SELECT 
  ano,
  numero_semana,
  data_inicio,
  data_fim,
  tempo_saida_cozinha,
  atrasos_cozinha,
  tempo_saida_bar,
  atrasos_bar,
  ROUND(tempo_saida_cozinha / 60, 2) as tempo_medio_coz_min,
  ROUND(tempo_saida_bar / 60, 2) as tempo_medio_bar_min,
  CASE 
    WHEN atrasos_cozinha > 100 THEN 'Alto'
    WHEN atrasos_cozinha > 50 THEN 'Médio'
    ELSE 'Baixo'
  END as nivel_atraso_cozinha,
  CASE 
    WHEN atrasos_bar > 20 THEN 'Alto'
    WHEN atrasos_bar > 10 THEN 'Médio'
    ELSE 'Baixo'
  END as nivel_atraso_bar
FROM desempenho_semanal
WHERE ano = 2025 
  AND bar_id = 3
ORDER BY numero_semana DESC;
```

### Análise Comparativa Mensal

```sql
SELECT 
  EXTRACT(MONTH FROM data_inicio) as mes,
  COUNT(*) as total_semanas,
  SUM(atrasos_cozinha) as total_atrasos_cozinha,
  SUM(atrasos_bar) as total_atrasos_bar,
  ROUND(AVG(atrasos_cozinha), 2) as media_atrasos_cozinha,
  ROUND(AVG(atrasos_bar), 2) as media_atrasos_bar,
  ROUND(AVG(tempo_saida_cozinha), 2) as tempo_medio_cozinha,
  ROUND(AVG(tempo_saida_bar), 2) as tempo_medio_bar
FROM desempenho_semanal
WHERE ano = 2025 
  AND bar_id = 3
GROUP BY EXTRACT(MONTH FROM data_inicio)
ORDER BY mes;
```

### Top 5 Semanas com Mais Atrasos

```sql
-- Cozinha
SELECT 
  numero_semana,
  data_inicio,
  data_fim,
  atrasos_cozinha,
  tempo_saida_cozinha
FROM desempenho_semanal
WHERE ano = 2025 
  AND bar_id = 3
ORDER BY atrasos_cozinha DESC
LIMIT 5;

-- Bar
SELECT 
  numero_semana,
  data_inicio,
  data_fim,
  atrasos_bar,
  tempo_saida_bar
FROM desempenho_semanal
WHERE ano = 2025 
  AND bar_id = 3
ORDER BY atrasos_bar DESC
LIMIT 5;
```

## 🔧 Manutenção e Automação

### Gatilho Automático (Opcional)

Para atualizar automaticamente ao inserir/atualizar dados de tempo:

```sql
-- Criar trigger para atualizar automaticamente quando novos dados chegarem
-- (Implementação futura se necessário)
```

### Script de Atualização Periódica

```javascript
// exemplo_teste/atualizar-atrasos-desempenho.js
// Script já criado para atualizar periodicamente via Node.js

// Uso:
// node calcular-atrasos-desempenho.js periodo 2025-10-01 2025-10-31
// node calcular-atrasos-desempenho.js semana 2025 44
```

## 📊 Integração com Dashboard

Os campos `atrasos_cozinha` e `atrasos_bar` podem ser exibidos em:

1. **Dashboard de Desempenho Semanal**
   - Gráfico de linha mostrando evolução de atrasos
   - Comparativo com tempo médio de saída
   - Alertas quando atrasos ultrapassam limites

2. **Relatório Operacional**
   - % de itens com atraso vs total de itens
   - Identificação de dias/horários críticos
   - Correlação com volume de clientes

3. **Métricas de Qualidade**
   - KPI: % de itens entregues no prazo
   - Meta: Redução de X% de atrasos mês a mês
   - Benchmark: Comparação entre semanas

## 🎯 Metas e KPIs Sugeridos

### Metas de Atraso (por semana)
- 🟢 **Excelente**: < 30 atrasos cozinha, < 5 atrasos bar
- 🟡 **Aceitável**: 30-80 atrasos cozinha, 5-15 atrasos bar
- 🔴 **Crítico**: > 80 atrasos cozinha, > 15 atrasos bar

### KPIs Relacionados
- **Taxa de Atraso Cozinha**: (atrasos_cozinha / qtde_itens_cozinha) * 100
- **Taxa de Atraso Bar**: (atrasos_bar / qtde_itens_bar) * 100
- **Tempo Médio x Atrasos**: Correlação entre tempo_saida e quantidade de atrasos

## 📝 Notas Importantes

1. **Diferença entre Tempo Médio e Atrasos**:
   - `tempo_saida_cozinha/bar`: Tempo médio de TODOS os itens
   - `atrasos_cozinha/bar`: QUANTIDADE de itens que ultrapassaram o limite

2. **Fonte de Dados**:
   - Dados vêm do ContaHub via tabela `contahub_tempo`
   - Atualização depende do sync com ContaHub

3. **Períodos sem Dados**:
   - Se não houver dados de tempo para uma semana, atrasos = 0
   - Verificar se sync ContaHub está funcionando

4. **Bar ID**:
   - Atualmente configurado para bar_id = 3 (Ordinário)
   - Adaptar para outros bares conforme necessário

## 🔄 Histórico de Implementação

- **10/11/2025**: Criação inicial dos campos e função de cálculo
- **10/11/2025**: Atualização de dados de outubro e novembro/2025
- **10/11/2025**: Documentação e scripts de manutenção

## 📚 Referências

- Tabela: `desempenho_semanal`
- Tabela fonte: `contahub_tempo`
- Função: `calcular_atrasos_periodo(data_inicio, data_fim, bar_id)`
- Script: `exemplo_teste/calcular-atrasos-desempenho.js`

---

**Última atualização**: 10/11/2025  
**Responsável**: Sistema SGB v2

