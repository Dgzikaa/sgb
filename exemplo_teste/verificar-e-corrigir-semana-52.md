# 🔍 DIAGNÓSTICO E SOLUÇÃO - Semana 52 com Dados Zerados

## 📋 Problema Identificado

Na imagem fornecida, a **Semana 52 (22/12/2025 - 28/12/2025)** apresenta:

- ❌ **Novos Clientes**: 0 (0.0% do total) 
- ❌ **Clientes Retornantes**: 3.483 (100% do total)
- ⚠️  **Clientes Ativos**: 5.026 (0% variação - mesmo valor da semana anterior)

## 🔍 Análise do Código

### 1. **API `/api/clientes-ativos`** (linhas 189-344)

Para **semanas passadas** (já terminadas), a API busca **dados FIXOS** da tabela `desempenho_semanal`:

```typescript
// Se a semana já terminou, buscar dados fixos
if (fimSemanaDate < hoje) {
  const { data: dadosSemana } = await supabase
    .from('desempenho_semanal')
    .select('numero_semana, data_inicio, data_fim, perc_clientes_novos, clientes_ativos')
    .eq('bar_id', barId)
    .in('data_inicio', [inicioAtual, inicioAnterior])

  // Se temos dados fixos, usar eles
  if (semanaAtualData.perc_clientes_novos !== null && semanaAtualData.clientes_ativos !== null) {
    // Usa % fixo para calcular novos e retornantes
    const novosClientesFixo = Math.round(totalClientesAtual * (percNovosFixo / 100))
    // ...
  }
}
```

**Problema**: Se o campo `perc_clientes_novos` estiver **NULL ou 0** na tabela, os dados ficam zerados!

### 2. **Edge Function `desempenho-semanal-auto`** (linhas 341-362)

A automação semanal salva os dados:

```typescript
// Chamar stored procedure para métricas de clientes
const { data: metricas, error: metricasError } = await supabase.rpc('calcular_metricas_clientes', {
  p_bar_id: barId,
  p_data_inicio_atual: startDate,
  p_data_fim_atual: endDate,
  p_data_inicio_anterior: inicioAnteriorStr,
  p_data_fim_anterior: fimAnteriorStr
})

if (!metricasError && metricas && metricas[0]) {
  const totalClientes = Number(resultado.total_atual) || 0
  const novosClientes = Number(resultado.novos_atual) || 0
  percClientesNovos = totalClientes > 0 ? (novosClientes / totalClientes) * 100 : 0
}

// Salva no banco
dadosAtualizados = {
  perc_clientes_novos: parseFloat(percClientesNovos.toFixed(2)),
  clientes_ativos: clientesAtivos,
  // ...
}
```

**Possíveis causas do problema**:

1. ❌ **Stored procedure `calcular_metricas_clientes` retornou erro ou NULL**
2. ❌ **Stored procedure `get_count_base_ativa` retornou erro ou NULL**
3. ❌ **Não há dados do ContaHub para a semana 52**
4. ❌ **A automação não rodou para a semana 52**

## 🛠️ Soluções

### Solução 1: Verificar Dados Brutos do ContaHub

```sql
-- Verificar se existem dados para semana 52
SELECT 
  dt_gerencial,
  COUNT(DISTINCT cli_fone) as clientes_unicos,
  SUM(pessoas) as total_pessoas
FROM contahub_periodo
WHERE bar_id = 1
  AND dt_gerencial >= '2025-12-22'
  AND dt_gerencial <= '2025-12-28'
  AND cli_fone IS NOT NULL
GROUP BY dt_gerencial
ORDER BY dt_gerencial;
```

**Se retornar 0 registros**: O problema é que não há dados sincronizados do ContaHub!

### Solução 2: Verificar Stored Procedures

```sql
-- Testar calcular_metricas_clientes
SELECT * FROM calcular_metricas_clientes(
  p_bar_id := 1,
  p_data_inicio_atual := '2025-12-22',
  p_data_fim_atual := '2025-12-28',
  p_data_inicio_anterior := '2025-12-15',
  p_data_fim_anterior := '2025-12-21'
);

-- Testar get_count_base_ativa
SELECT * FROM get_count_base_ativa(
  p_bar_id := 1,
  p_data_inicio := '2025-09-28',  -- 90 dias antes de 28/12
  p_data_fim := '2025-12-28'
);
```

**Se retornar erro**: As stored procedures não existem ou estão com problemas!

### Solução 3: Recalcular Manualmente via API

```bash
# Chamar API de recálculo para a semana 52
curl -X POST 'http://localhost:3000/api/gestao/desempenho/recalcular' \
  -H 'Content-Type: application/json' \
  -d '{
    "barId": 1,
    "ano": 2025,
    "numeroSemana": 52
  }'
```

Esta API está em: `frontend/src/app/api/gestao/desempenho/recalcular/route.ts`

### Solução 4: Forçar Recálculo via Edge Function

```bash
# Chamar Edge Function manualmente
curl -X POST 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/desempenho-semanal-auto' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Solução 5: Atualizar Manualmente no Banco

Se tudo mais falhar, pode-se atualizar manualmente:

```sql
-- Primeiro, calcular os valores corretos
WITH clientes_semana_52 AS (
  SELECT DISTINCT cli_fone
  FROM contahub_periodo
  WHERE bar_id = 1
    AND dt_gerencial >= '2025-12-22'
    AND dt_gerencial <= '2025-12-28'
    AND cli_fone IS NOT NULL
),
clientes_historico AS (
  SELECT DISTINCT cli_fone
  FROM contahub_periodo
  WHERE bar_id = 1
    AND dt_gerencial < '2025-12-22'
    AND cli_fone IS NOT NULL
),
novos AS (
  SELECT COUNT(*) as total_novos
  FROM clientes_semana_52
  WHERE cli_fone NOT IN (SELECT cli_fone FROM clientes_historico)
),
totais AS (
  SELECT COUNT(*) as total_clientes
  FROM clientes_semana_52
)
SELECT 
  totais.total_clientes,
  novos.total_novos,
  ROUND((novos.total_novos::numeric / totais.total_clientes::numeric) * 100, 2) as perc_novos
FROM totais, novos;

-- Depois atualizar:
UPDATE desempenho_semanal
SET 
  perc_clientes_novos = [VALOR_CALCULADO],
  clientes_ativos = [VALOR_CALCULADO],
  atualizado_em = NOW(),
  observacoes = 'Recalculado manualmente em ' || NOW()::text
WHERE bar_id = 1
  AND ano = 2025
  AND numero_semana = 52;
```

## 📝 Checklist de Diagnóstico

Execute na ordem:

- [ ] 1. Verificar se há dados do ContaHub para 22-28/12
- [ ] 2. Verificar se stored procedures existem e funcionam
- [ ] 3. Verificar logs da Edge Function de automação
- [ ] 4. Executar recálculo manual via API
- [ ] 5. Se necessário, atualizar manualmente no banco

## 🔧 Próximos Passos Recomendados

1. **Executar script de diagnóstico** para identificar causa raiz
2. **Corrigir dados da semana 52** usando uma das soluções acima
3. **Garantir que automação rode corretamente** para semanas futuras
4. **Adicionar logs/alertas** para detectar problemas automaticamente

## 🚨 Prevenção Futura

Para evitar que isso aconteça novamente:

1. Adicionar **validação** após salvar dados:
   ```typescript
   if (dadosAtualizados.perc_clientes_novos === 0 || dadosAtualizados.clientes_ativos === 0) {
     console.error('⚠️ ALERTA: Dados zerados detectados!')
     // Tentar recalcular ou enviar notificação
   }
   ```

2. Criar **cron job de verificação** que roda diariamente e checa inconsistências

3. Adicionar **dashboard de monitoramento** para acompanhar execução das automações
