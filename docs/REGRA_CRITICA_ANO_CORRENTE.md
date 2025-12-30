# 🚨 REGRA CRÍTICA - ANO CORRENTE E DATAS

## ⚠️ **PROBLEMA RECORRENTE IDENTIFICADO**

O Cursor AI tem um bug conhecido onde **assume o ano errado** em contextos de data, especialmente próximo à virada do ano (dezembro/janeiro).

### 📋 **Casos Documentados:**
- ✅ **30/12/2024**: Cursor interpretou como 2025
- ✅ Outros projetos tiveram o mesmo problema
- ✅ Afeta queries SQL, cálculos de data, e lógica de negócio

---

## 🔒 **REGRAS OBRIGATÓRIAS PARA DATAS**

### **1. SEMPRE VERIFICAR O ANO DO SISTEMA PRIMEIRO**

Antes de qualquer operação com datas, **SEMPRE** executar:

```bash
# Windows (PowerShell)
Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Linux/Mac
date '+%Y-%m-%d %H:%M:%S'
```

### **2. NUNCA ASSUMIR O ANO CORRENTE**

```typescript
// ❌ ERRADO - Assumir ano
const anoAtual = 2025; // NUNCA fazer isso!

// ✅ CORRETO - Obter do sistema
const anoAtual = new Date().getFullYear();
```

### **3. SEMPRE USAR Date() DO JAVASCRIPT/TYPESCRIPT**

```typescript
// ✅ CORRETO - Obter data atual
const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = hoje.getMonth() + 1; // 0-indexed
const diaAtual = hoje.getDate();

// ✅ CORRETO - Formatar para SQL
const dataSQL = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
```

### **4. EM QUERIES SQL - USAR FUNÇÕES DO BANCO**

```sql
-- ✅ CORRETO - PostgreSQL/Supabase
SELECT EXTRACT(YEAR FROM CURRENT_DATE) as ano_atual;
SELECT CURRENT_DATE as data_atual;
SELECT NOW() as timestamp_atual;

-- ❌ ERRADO - Hardcoded
WHERE ano = 2025
WHERE dt_gerencial >= '2025-01-01'
```

### **5. VALIDAR ANO EM EDGE FUNCTIONS**

```typescript
// ✅ SEMPRE incluir no início de Edge Functions
const hoje = new Date();
const anoAtual = hoje.getFullYear();

console.log(`🗓️ Ano atual do sistema: ${anoAtual}`);

// Usar em cálculos
const dataInicio = `${anoAtual}-01-01`;
const dataFim = `${anoAtual}-12-31`;
```

---

## 🛡️ **PROTEÇÕES IMPLEMENTADAS**

### **1. Função Helper de Data (CRIAR SE NÃO EXISTIR)**

```typescript
// frontend/src/lib/dateHelpers.ts ou backend/supabase/functions/_shared/dateHelpers.ts

/**
 * 🗓️ Obtém o ano atual do sistema
 * NUNCA hardcodar o ano - sempre usar esta função
 */
export function getAnoAtual(): number {
  return new Date().getFullYear();
}

/**
 * 🗓️ Obtém a data atual formatada para SQL (YYYY-MM-DD)
 */
export function getDataAtualSQL(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 🗓️ Obtém o timestamp atual formatado
 */
export function getTimestampAtual(): string {
  return new Date().toISOString();
}

/**
 * 🗓️ Valida se um ano é válido (entre 2020 e ano atual + 1)
 */
export function validarAno(ano: number): boolean {
  const anoAtual = getAnoAtual();
  return ano >= 2020 && ano <= anoAtual + 1;
}

/**
 * 🗓️ Obtém informações da semana atual
 */
export function getSemanaAtual(): { ano: number; semana: number; dataInicio: string; dataFim: string } {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  
  // Calcular número da semana (ISO 8601)
  const primeiroDiaAno = new Date(anoAtual, 0, 1);
  const diasPassados = Math.floor((hoje.getTime() - primeiroDiaAno.getTime()) / (24 * 60 * 60 * 1000));
  const numeroSemana = Math.ceil((diasPassados + primeiroDiaAno.getDay() + 1) / 7);
  
  // Calcular data início/fim da semana
  const diaSemana = hoje.getDay();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(hoje.getDate() - diaSemana);
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataInicio.getDate() + 6);
  
  return {
    ano: anoAtual,
    semana: numeroSemana,
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0]
  };
}
```

### **2. Validação em Edge Functions**

```typescript
// backend/supabase/functions/[qualquer-function]/index.ts

import { getAnoAtual, validarAno } from '../_shared/dateHelpers.ts';

serve(async (req) => {
  const anoAtual = getAnoAtual();
  console.log(`🗓️ [VALIDAÇÃO] Ano atual do sistema: ${anoAtual}`);
  
  // Se receber ano como parâmetro, validar
  const { ano } = await req.json();
  if (ano && !validarAno(ano)) {
    return new Response(
      JSON.stringify({ 
        error: `Ano inválido: ${ano}. Ano atual: ${anoAtual}` 
      }),
      { status: 400 }
    );
  }
  
  // Usar anoAtual em vez de hardcoded
  // ...
});
```

### **3. Logs de Auditoria**

```sql
-- Adicionar em tabelas críticas
ALTER TABLE desempenho_semanal 
ADD COLUMN IF NOT EXISTS ano_sistema INTEGER;

-- Trigger para validar ano
CREATE OR REPLACE FUNCTION validar_ano_sistema()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que o ano não é futuro
  IF NEW.ano > EXTRACT(YEAR FROM CURRENT_DATE) + 1 THEN
    RAISE EXCEPTION 'Ano inválido: %. Ano atual: %', 
      NEW.ano, EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
  
  -- Salvar ano do sistema no momento da inserção
  NEW.ano_sistema := EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_ano_desempenho
BEFORE INSERT OR UPDATE ON desempenho_semanal
FOR EACH ROW
EXECUTE FUNCTION validar_ano_sistema();
```

---

## 🧾 **CHECKLIST OBRIGATÓRIO - ANTES DE QUALQUER CÓDIGO COM DATAS**

Antes de escrever código que envolve datas, **SEMPRE** verificar:

- [ ] ✅ Executei `Get-Date` ou `date` para confirmar ano do sistema?
- [ ] ✅ Estou usando `new Date().getFullYear()` em vez de hardcoded?
- [ ] ✅ Estou usando `CURRENT_DATE` ou `NOW()` em SQL em vez de strings?
- [ ] ✅ Validei que o ano está correto antes de salvar no banco?
- [ ] ✅ Adicionei logs com `console.log` mostrando o ano usado?
- [ ] ✅ Testei a função com a data real do sistema?

---

## 🔍 **COMO DIAGNOSTICAR PROBLEMAS DE ANO**

### **1. Verificar ano no sistema operacional:**
```bash
Get-Date -Format "yyyy-MM-dd HH:mm:ss"
```

### **2. Verificar ano no banco de dados:**
```sql
SELECT 
  EXTRACT(YEAR FROM CURRENT_DATE) as ano_bd,
  CURRENT_DATE as data_bd,
  NOW() as timestamp_bd;
```

### **3. Verificar ano em Edge Functions (logs):**
```typescript
console.log('🗓️ Ano sistema:', new Date().getFullYear());
console.log('🗓️ Data completa:', new Date().toISOString());
```

### **4. Verificar dados salvos com ano errado:**
```sql
-- Encontrar registros com ano futuro
SELECT * FROM desempenho_semanal
WHERE ano > EXTRACT(YEAR FROM CURRENT_DATE);

-- Encontrar registros com ano muito antigo
SELECT * FROM desempenho_semanal
WHERE ano < 2020;
```

---

## 🔧 **CORREÇÃO DE DADOS COM ANO ERRADO**

### **Script de Correção (USAR COM CUIDADO!):**

```sql
-- 1. SEMPRE fazer backup antes
CREATE TABLE desempenho_semanal_backup AS 
SELECT * FROM desempenho_semanal;

-- 2. Identificar registros com ano errado
SELECT 
  id, bar_id, ano, numero_semana, 
  data_inicio, data_fim,
  EXTRACT(YEAR FROM data_inicio) as ano_correto
FROM desempenho_semanal
WHERE ano != EXTRACT(YEAR FROM data_inicio);

-- 3. Corrigir ano baseado em data_inicio (SE CONFIRMADO)
-- ⚠️ NUNCA executar sem validação manual!
-- UPDATE desempenho_semanal
-- SET ano = EXTRACT(YEAR FROM data_inicio)
-- WHERE ano != EXTRACT(YEAR FROM data_inicio);
```

---

## 📊 **CONTEXTO DO PROJETO SGB**

### **Bares e Anos de Operação:**

| Bar ID | Nome | Início Operação | Anos Válidos |
|--------|------|-----------------|--------------|
| 3 | Ordinário Bar | 2025 | 2025+ |
| 4 | Deboche Bar | 2024 | 2024+ |

### **Regras de Validação Específicas:**

```typescript
// Validar ano por bar
function validarAnoBar(barId: number, ano: number): boolean {
  const inicioOperacao: Record<number, number> = {
    3: 2025, // Ordinário Bar - começou em 2025
    4: 2024, // Deboche Bar - começou em 2024
  };
  
  const anoInicio = inicioOperacao[barId];
  if (!anoInicio) {
    throw new Error(`Bar ID ${barId} não encontrado`);
  }
  
  const anoAtual = new Date().getFullYear();
  return ano >= anoInicio && ano <= anoAtual;
}
```

---

## 🎯 **IMPLEMENTAÇÃO IMEDIATA**

### **Arquivos a Criar/Atualizar:**

1. ✅ **`frontend/src/lib/dateHelpers.ts`** - Helpers de data
2. ✅ **`backend/supabase/functions/_shared/dateHelpers.ts`** - Helpers backend
3. ✅ **Atualizar todas Edge Functions** - Adicionar validação de ano
4. ✅ **Criar trigger SQL** - Validar ano em desempenho_semanal
5. ✅ **Adicionar testes** - Garantir que ano está correto

---

## 📝 **IMPORTANTE - COMUNICAÇÃO COM CURSOR AI**

Quando trabalhar com Cursor AI em datas:

```markdown
✅ SEMPRE incluir no prompt:
"Verifique o ano atual do sistema antes de implementar"
"Use new Date().getFullYear() e nunca hardcode o ano"
"Valide que o ano está correto antes de salvar"

❌ NUNCA aceitar código que:
- Tenha anos hardcoded (2024, 2025, etc)
- Não valide o ano antes de usar
- Não tenha logs mostrando o ano usado
```

---

## 🚀 **RESUMO EXECUTIVO**

### **Problema:**
- Cursor AI assume ano errado próximo à virada do ano
- Causa dados incorretos no banco
- Dificulta análises e relatórios

### **Solução:**
1. ✅ **Sempre verificar** ano do sistema primeiro
2. ✅ **Nunca hardcodar** anos no código
3. ✅ **Usar funções** de data do sistema/banco
4. ✅ **Validar** ano antes de salvar
5. ✅ **Logar** ano usado para auditoria

### **Resultado:**
- 🎯 **Zero problemas** de ano incorreto
- 🎯 **Dados confiáveis** sempre
- 🎯 **Fácil diagnóstico** se houver problema
- 🎯 **Código à prova de futuro**

---

**Esta regra é OBRIGATÓRIA e deve ser seguida em 100% do código que envolve datas!** 🗓️
