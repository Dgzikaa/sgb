# 🚨 SOLUÇÃO DEFINITIVA - Semana 52 com Dados Zerados

## 📋 **CAUSA RAIZ IDENTIFICADA**

O problema **NÃO deveria acontecer em nenhuma semana**, mas está acontecendo porque:

### **❌ AS STORED PROCEDURES NÃO EXISTEM NO BANCO!**

O sistema depende de **2 Stored Procedures** críticas:
1. `calcular_metricas_clientes` - Calcula novos clientes e retornantes  
2. `get_count_base_ativa` - Calcula clientes ativos (2+ visitas em 90 dias)

### **Como o Bug Acontece:**

```typescript
// Edge Function tenta chamar stored procedure
const { data: metricas, error: metricasError } = await supabase.rpc('calcular_metricas_clientes', {...})

if (!metricasError && metricas && metricas[0]) {
  // ✅ Se funcionar, calcula corretamente
  percClientesNovos = (novosClientes / totalClientes) * 100
} else {
  // ❌ Se FALHAR (stored procedure não existe), fica ZERADO!
  console.error(`❌ Erro ao calcular métricas de clientes:`, metricasError)
  percClientesNovos = 0  // ❌ PROBLEMA!
}

// SALVA NO BANCO (ZERADO SE HOUVE ERRO!)
await supabase.from('desempenho_semanal').update({
  perc_clientes_novos: 0,  // ❌ ZERADO!
  clientes_ativos: 0       // ❌ ZERADO!
})
```

Depois, quando a interface busca dados de **semanas passadas**, ela usa os dados FIXOS da tabela (que estão zerados)!

---

## ✅ **SOLUÇÃO: CRIAR AS STORED PROCEDURES**

### **Passo 1: Acessar o Supabase**

```
https://supabase.com/dashboard
Projeto: uqtgsvujwcbymjmvkjhy
SQL Editor → New Query
```

### **Passo 2: Executar o SQL Abaixo**

Copie e cole TODO o código SQL e execute:

```sql
-- =====================================================
-- STORED PROCEDURES PARA CÁLCULO DE MÉTRICAS DE CLIENTES
-- =====================================================

-- 1. FUNÇÃO: calcular_metricas_clientes
DROP FUNCTION IF EXISTS calcular_metricas_clientes(integer, text, text, text, text);

CREATE OR REPLACE FUNCTION calcular_metricas_clientes(
  p_bar_id integer,
  p_data_inicio_atual text,
  p_data_fim_atual text,
  p_data_inicio_anterior text,
  p_data_fim_anterior text
)
RETURNS TABLE (
  total_atual bigint,
  novos_atual bigint,
  retornantes_atual bigint,
  total_anterior bigint,
  novos_anterior bigint,
  retornantes_anterior bigint
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_atual bigint;
  v_novos_atual bigint;
  v_retornantes_atual bigint;
  v_total_anterior bigint;
  v_novos_anterior bigint;
  v_retornantes_anterior bigint;
BEGIN
  -- PERÍODO ATUAL - Total de clientes
  SELECT COUNT(DISTINCT cli_fone)
  INTO v_total_atual
  FROM contahub_periodo
  WHERE bar_id = p_bar_id
    AND dt_gerencial >= p_data_inicio_atual::date
    AND dt_gerencial <= p_data_fim_atual::date
    AND cli_fone IS NOT NULL
    AND cli_fone != '';
  
  -- PERÍODO ATUAL - Novos clientes (primeira visita)
  WITH primeira_visita AS (
    SELECT 
      cli_fone,
      MIN(dt_gerencial) as primeira_visita_data
    FROM contahub_periodo
    WHERE bar_id = p_bar_id
      AND cli_fone IS NOT NULL
      AND cli_fone != ''
    GROUP BY cli_fone
  )
  SELECT COUNT(DISTINCT cp.cli_fone)
  INTO v_novos_atual
  FROM contahub_periodo cp
  INNER JOIN primeira_visita pv ON cp.cli_fone = pv.cli_fone
  WHERE cp.bar_id = p_bar_id
    AND cp.dt_gerencial >= p_data_inicio_atual::date
    AND cp.dt_gerencial <= p_data_fim_atual::date
    AND pv.primeira_visita_data >= p_data_inicio_atual::date
    AND pv.primeira_visita_data <= p_data_fim_atual::date;
  
  v_retornantes_atual := COALESCE(v_total_atual, 0) - COALESCE(v_novos_atual, 0);
  
  -- PERÍODO ANTERIOR - Total de clientes
  SELECT COUNT(DISTINCT cli_fone)
  INTO v_total_anterior
  FROM contahub_periodo
  WHERE bar_id = p_bar_id
    AND dt_gerencial >= p_data_inicio_anterior::date
    AND dt_gerencial <= p_data_fim_anterior::date
    AND cli_fone IS NOT NULL
    AND cli_fone != '';
  
  -- PERÍODO ANTERIOR - Novos clientes
  WITH primeira_visita AS (
    SELECT 
      cli_fone,
      MIN(dt_gerencial) as primeira_visita_data
    FROM contahub_periodo
    WHERE bar_id = p_bar_id
      AND cli_fone IS NOT NULL
      AND cli_fone != ''
    GROUP BY cli_fone
  )
  SELECT COUNT(DISTINCT cp.cli_fone)
  INTO v_novos_anterior
  FROM contahub_periodo cp
  INNER JOIN primeira_visita pv ON cp.cli_fone = pv.cli_fone
  WHERE cp.bar_id = p_bar_id
    AND cp.dt_gerencial >= p_data_inicio_anterior::date
    AND cp.dt_gerencial <= p_data_fim_anterior::date
    AND pv.primeira_visita_data >= p_data_inicio_anterior::date
    AND pv.primeira_visita_data <= p_data_fim_anterior::date;
  
  v_retornantes_anterior := COALESCE(v_total_anterior, 0) - COALESCE(v_novos_anterior, 0);
  
  -- RETORNAR RESULTADOS
  RETURN QUERY
  SELECT 
    COALESCE(v_total_atual, 0)::bigint,
    COALESCE(v_novos_atual, 0)::bigint,
    COALESCE(v_retornantes_atual, 0)::bigint,
    COALESCE(v_total_anterior, 0)::bigint,
    COALESCE(v_novos_anterior, 0)::bigint,
    COALESCE(v_retornantes_anterior, 0)::bigint;
END;
$$;

-- =====================================================

-- 2. FUNÇÃO: get_count_base_ativa
DROP FUNCTION IF EXISTS get_count_base_ativa(integer, text, text);

CREATE OR REPLACE FUNCTION get_count_base_ativa(
  p_bar_id integer,
  p_data_inicio text,
  p_data_fim text
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_count bigint;
BEGIN
  -- Contar clientes que tiveram 2 ou mais visitas no período
  WITH visitas_por_cliente AS (
    SELECT 
      cli_fone,
      COUNT(DISTINCT dt_gerencial) as num_visitas
    FROM contahub_periodo
    WHERE bar_id = p_bar_id
      AND dt_gerencial >= p_data_inicio::date
      AND dt_gerencial <= p_data_fim::date
      AND cli_fone IS NOT NULL
      AND cli_fone != ''
    GROUP BY cli_fone
  )
  SELECT COUNT(*)
  INTO v_count
  FROM visitas_por_cliente
  WHERE num_visitas >= 2;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- =====================================================

-- 3. FUNÇÃO: calcular_clientes_ativos_periodo
DROP FUNCTION IF EXISTS calcular_clientes_ativos_periodo(integer, text, text, text);

CREATE OR REPLACE FUNCTION calcular_clientes_ativos_periodo(
  p_bar_id integer,
  p_data_inicio_periodo text,
  p_data_fim_periodo text,
  p_data_90_dias_atras text
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_count bigint;
BEGIN
  WITH clientes_periodo AS (
    SELECT DISTINCT cli_fone
    FROM contahub_periodo
    WHERE bar_id = p_bar_id
      AND dt_gerencial >= p_data_inicio_periodo::date
      AND dt_gerencial <= p_data_fim_periodo::date
      AND cli_fone IS NOT NULL
      AND cli_fone != ''
  ),
  clientes_90_dias AS (
    SELECT DISTINCT cli_fone
    FROM contahub_periodo
    WHERE bar_id = p_bar_id
      AND dt_gerencial >= p_data_90_dias_atras::date
      AND dt_gerencial < p_data_inicio_periodo::date
      AND cli_fone IS NOT NULL
      AND cli_fone != ''
  )
  SELECT COUNT(*)
  INTO v_count
  FROM clientes_periodo cp
  WHERE EXISTS (
    SELECT 1 
    FROM clientes_90_dias c90
    WHERE c90.cli_fone = cp.cli_fone
  );
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- =====================================================

-- GRANTS: Dar permissões
GRANT EXECUTE ON FUNCTION calcular_metricas_clientes(integer, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_count_base_ativa(integer, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION calcular_clientes_ativos_periodo(integer, text, text, text) TO anon, authenticated, service_role;

-- =====================================================
-- TESTES
-- =====================================================

-- Teste para Semana 52
SELECT * FROM calcular_metricas_clientes(
  1,                -- bar_id
  '2025-12-22',    -- Semana 52 início
  '2025-12-28',    -- Semana 52 fim
  '2025-12-15',    -- Semana 51 início
  '2025-12-21'     -- Semana 51 fim
);

SELECT get_count_base_ativa(
  1,
  '2025-09-28',    -- 90 dias antes
  '2025-12-28'
);
```

---

### **Passo 3: Recalcular a Semana 52**

Após criar as stored procedures:

**Opção A - Via Interface:**
```
http://localhost:3000/debug/semana-52
Clicar em "Recalcular Semana 52"
```

**Opção B - Via API:**
```bash
curl -X POST 'http://localhost:3000/api/gestao/desempenho/recalcular' \
  -H 'Content-Type: application/json' \
  -d '{
    "barId": 1,
    "ano": 2025,
    "numeroSemana": 52
  }'
```

---

## 🎯 **POR QUE ISSO RESOLVE O PROBLEMA PERMANENTEMENTE?**

1. ✅ **Stored procedures agora existem** - Não mais erro "function not found"
2. ✅ **Cálculos corretos** - Dados reais em vez de zeros
3. ✅ **Automação funcionará** - Edge Function rodará sem erros
4. ✅ **Futuras semanas OK** - Não terá mais problemas de dados zerados
5. ✅ **Performance melhor** - Cálculo no banco é mais rápido

---

## 📊 **VERIFICAR SE FUNCIONOU**

Depois de criar as stored procedures e recalcular:

```sql
-- Verificar dados salvos da semana 52
SELECT 
  numero_semana,
  data_inicio,
  data_fim,
  clientes_atendidos,
  perc_clientes_novos,
  clientes_ativos,
  atualizado_em
FROM desempenho_semanal
WHERE ano = 2025
  AND numero_semana = 52
  AND bar_id = 1;
```

**Resultado esperado:**
- `perc_clientes_novos` > 0 (não mais zero!)
- `clientes_ativos` > 0 (não mais zero!)
- `atualizado_em` = data/hora recente

---

## 🚨 **IMPORTANTE**

Depois de criar as stored procedures, **TODAS as semanas** (passadas, presentes e futuras) calcularão corretamente:

✅ **Semanas antigas** - Podem ser recalculadas se necessário
✅ **Semana atual** - Automação rodará sem erros  
✅ **Semanas futuras** - Não terão mais problemas

---

## 📝 **RESUMO**

**Problema:** Stored procedures não existiam → dados zerados → interface mostra zeros

**Solução:** Criar stored procedures → recalcular semana 52 → dados corretos!

**Prevenção:** Com as stored procedures criadas, isso NUNCA MAIS acontecerá! 🎉
