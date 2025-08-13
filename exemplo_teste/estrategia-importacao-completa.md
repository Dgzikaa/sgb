# 🚀 ESTRATÉGIA DE IMPORTAÇÃO COMPLETA CONTAHUB

## 📅 PERÍODO: 31/01/2025 até 31/07/2025

### ✅ CORREÇÕES JÁ IMPLEMENTADAS:
1. **Worker-periodo**: adicionados motivo, vr_desconto, cli_dtnasc, etc
2. **Worker-analitico**: adicionados comandaorigem e itemorigem  
3. **Worker-pagamentos**: adicionado motivodesconto

### 📋 PASSO A PASSO:

#### 1️⃣ **PREPARAÇÃO DO AMBIENTE**
```sql
-- Verificar espaço no banco
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Verificar registros existentes
SELECT 
    'contahub_raw_data' as tabela, COUNT(*) as total FROM contahub_raw_data
UNION ALL
SELECT 'contahub_periodo', COUNT(*) FROM contahub_periodo
UNION ALL
SELECT 'contahub_analitico', COUNT(*) FROM contahub_analitico
UNION ALL
SELECT 'contahub_pagamentos', COUNT(*) FROM contahub_pagamentos;
```

#### 2️⃣ **ESTRATÉGIA DE IMPORTAÇÃO POR MÊS**
Para evitar sobrecarga, vamos importar mês a mês:

```javascript
// Importar Janeiro (31/01 apenas)
await executarSync('2025-01-31', '2025-01-31');

// Importar Fevereiro
await executarSync('2025-02-01', '2025-02-28');

// Importar Março
await executarSync('2025-03-01', '2025-03-31');

// E assim por diante...
```

#### 3️⃣ **SCRIPT DE IMPORTAÇÃO**
```javascript
async function executarImportacaoCompleta() {
  const meses = [
    { inicio: '2025-01-31', fim: '2025-01-31' }, // Janeiro (apenas 31)
    { inicio: '2025-02-01', fim: '2025-02-28' }, // Fevereiro
    { inicio: '2025-03-01', fim: '2025-03-31' }, // Março
    { inicio: '2025-04-01', fim: '2025-04-30' }, // Abril
    { inicio: '2025-05-01', fim: '2025-05-31' }, // Maio
    { inicio: '2025-06-01', fim: '2025-06-30' }, // Junho
    { inicio: '2025-07-01', fim: '2025-07-31' }  // Julho
  ];

  for (const mes of meses) {
    console.log(`\n📅 Importando de ${mes.inicio} até ${mes.fim}...`);
    
    // 1. Executar sync
    await executarSync(mes.inicio, mes.fim);
    
    // 2. Aguardar processamento
    await aguardarProcessamento();
    
    // 3. Verificar integridade
    await verificarIntegridade(mes.inicio, mes.fim);
  }
}
```

#### 4️⃣ **MONITORAMENTO**
```sql
-- Query para monitorar progresso
SELECT 
    DATE_TRUNC('month', data_date) as mes,
    data_type,
    COUNT(*) as total_raw,
    SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processados,
    SUM(CASE WHEN NOT processed THEN 1 ELSE 0 END) as pendentes
FROM contahub_raw_data
WHERE data_date >= '2025-01-31'
GROUP BY DATE_TRUNC('month', data_date), data_type
ORDER BY mes, data_type;
```

#### 5️⃣ **VALIDAÇÃO FINAL**
```sql
-- Verificar totais por mês
SELECT 
    DATE_TRUNC('month', dt_gerencial) as mes,
    COUNT(DISTINCT dt_gerencial) as dias_distintos,
    COUNT(*) as total_registros,
    SUM(vr_pagamentos) as total_pagamentos
FROM contahub_periodo
WHERE dt_gerencial >= '2025-01-31'
GROUP BY DATE_TRUNC('month', dt_gerencial)
ORDER BY mes;
```

### ⚠️ PONTOS DE ATENÇÃO:
1. **Analítico não processa todos os dias** - investigar limite de registros
2. **Campos vazios no raw** - vd_localizacao, cli_email, taxa, perc, dt_credito
3. **Duplicatas** - sistema já trata com idempotency_key
4. **Performance** - processar mês a mês para evitar timeout

### 🔧 COMANDOS ÚTEIS:
```bash
# Deploy de workers (se necessário)
npx supabase functions deploy contahub-sync-automatico --no-verify-jwt
npx supabase functions deploy contahub-orchestrator --no-verify-jwt
npx supabase functions deploy contahub-worker-periodo --no-verify-jwt
npx supabase functions deploy contahub-worker-analitico --no-verify-jwt
npx supabase functions deploy contahub-worker-pagamentos --no-verify-jwt
npx supabase functions deploy contahub-worker-fatporhora --no-verify-jwt
npx supabase functions deploy contahub-worker-tempo --no-verify-jwt
```

### 📊 ESTIMATIVAS:
- **Janeiro**: ~1 dia (apenas 31/01)
- **Fevereiro a Julho**: ~180 dias
- **Total estimado**: ~500.000 registros
- **Tempo de processamento**: ~2-3 horas por mês

### ✅ PRÓXIMOS PASSOS:
1. Criar script de importação automatizada
2. Executar importação mês a mês
3. Monitorar logs e erros
4. Validar integridade dos dados
5. Gerar relatório final
