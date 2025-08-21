# 🚀 Guia de Correção dos Problemas de Performance Supabase

Este guia resolve os problemas identificados pelos arquivos CSV do Supabase Linter.

## 📊 Resumo dos Problemas

- **22 Foreign Keys** sem índices (CRÍTICO)
- **2 Tabelas** sem chave primária (CRÍTICO)  
- **61 Políticas RLS** não otimizadas (ALTO)
- **48 Políticas múltiplas** permissivas (ALTO)
- **4 Índices duplicados** (MÉDIO)
- **157 Índices** não utilizados (MÉDIO)

## 🎯 Ordem de Execução (por prioridade)

### 1. **CRÍTICO - Executar IMEDIATAMENTE**

#### A) Adicionar Índices para Foreign Keys
```bash
# Executar o arquivo principal
psql -f database/migrations/fix_supabase_performance_issues.sql
```

**Impacto**: Melhora **drasticamente** a performance de JOINs e consultas relacionadas.

#### B) Adicionar Chaves Primárias
```sql
-- Já incluído no arquivo acima
-- Resolve problemas de replicação e performance
```

### 2. **ALTO - Executar em seguida**

#### A) Otimizar Políticas RLS
```bash
# Executar gradualmente (não tudo de uma vez)
psql -f database/migrations/optimize_rls_policies.sql
```

**Como fazer**:
1. Testar uma política por vez
2. Verificar se não quebrou funcionalidade
3. Continuar com as próximas

**Template para demais políticas**:
```sql
-- ANTES (LENTO):
-- auth.uid()

-- DEPOIS (RÁPIDO):  
-- (select auth.uid())
```

#### B) Consolidar Políticas Múltiplas
Para cada tabela com múltiplas políticas:
1. Identificar as políticas existentes
2. Combinar em uma única política com OR
3. Testar extensivamente

### 3. **MÉDIO - Executar quando possível**

#### A) Remover Índices Duplicados
```sql
-- Já incluído no arquivo principal
DROP INDEX IF EXISTS public.idx_contahub_analitico_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_fatporhora_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_pagamentos_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_periodo_dt_bar;
```

#### B) Remover Índices Não Utilizados
```bash
# ⚠️  FAZER BACKUP ANTES!
psql -f database/migrations/remove_unused_indexes.sql
```

**CUIDADO**: 
- Fazer backup completo antes
- Executar em ambiente de teste primeiro
- Monitorar performance após execução

## 🔍 Verificações Importantes

### Antes de Executar
```sql
-- 1. Verificar foreign keys sem índices
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes pi 
        WHERE tc.table_name = pi.tablename 
        AND pi.indexdef LIKE '%' || kcu.column_name || '%'
    );

-- 2. Verificar tabelas sem PK
SELECT tablename 
FROM pg_tables t
WHERE schemaname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.tablename
    AND tc.constraint_type = 'PRIMARY KEY'
);
```

### Após Executar
```sql
-- 1. Verificar se FKs agora têm índices
-- (mesmo query acima - deve retornar vazio)

-- 2. Verificar políticas otimizadas
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');

-- 3. Verificar performance
EXPLAIN ANALYZE SELECT * FROM sua_query_crítica;
```

## 📈 Impacto Esperado

### Performance de Queries
- **JOINs**: 50-90% mais rápidos
- **Consultas por bar_id**: 70-95% mais rápidos  
- **Políticas RLS**: 60-80% mais rápidos

### Uso de Recursos
- **Menos CPU**: 30-50% redução
- **Menos I/O**: 40-70% redução
- **Menos locks**: 50-80% redução

## ⚠️ Precauções

### Backup Obrigatório
```bash
# Fazer backup completo antes de qualquer alteração
pg_dump -h your_host -U your_user -d your_db > backup_pre_optimization.sql
```

### Teste Gradual
1. **Executar primeiro em desenvolvimento**
2. **Testar funcionalidades críticas**
3. **Monitorar logs de erro**
4. **Só então aplicar em produção**

### Rollback Plan
```sql
-- Se algo der errado, restaurar do backup
psql -h your_host -U your_user -d your_db < backup_pre_optimization.sql
```

## 🎯 Scripts por Arquivo

| Arquivo | Prioridade | Impacto | Risco |
|---------|-----------|---------|--------|
| `fix_supabase_performance_issues.sql` | 🔴 Crítico | ⭐⭐⭐⭐⭐ | 🟢 Baixo |
| `optimize_rls_policies.sql` | 🟡 Alto | ⭐⭐⭐⭐ | 🟡 Médio |
| `remove_unused_indexes.sql` | 🟢 Médio | ⭐⭐⭐ | 🟡 Médio |

## 📝 Próximos Passos

1. **Executar scripts críticos** (foreign keys + PKs)
2. **Monitorar performance** por 24-48h
3. **Otimizar políticas RLS** gradualmente  
4. **Remover índices** não utilizados com cuidado
5. **Documentar melhorias** alcançadas

## 🎉 Resultado Final

Após todas as otimizações:
- ✅ **Zero foreign keys** sem índices
- ✅ **Todas as tabelas** com chave primária  
- ✅ **Políticas RLS** otimizadas
- ✅ **Zero índices** duplicados
- ✅ **Apenas índices** realmente utilizados
- ✅ **Performance** significativamente melhorada

---

**⚡ A performance do seu sistema Supabase será drasticamente melhorada!**
