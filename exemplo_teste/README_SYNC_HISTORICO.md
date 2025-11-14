# 📚 Sistema de Histórico Automático - Guia Completo

## 🎯 Visão Geral

O sistema **salva automaticamente** no histórico toda vez que você:
- ✏️ Editar um insumo (preço, nome, categoria, etc)
- ✏️ Editar uma receita (nome, rendimento, etc)
- ➕ Adicionar insumo a uma receita
- ➖ Remover insumo de uma receita
- 🔄 Alterar quantidade de insumo em receita

**NÃO PRECISA RODAR NENHUM SCRIPT!** Tudo é automático via triggers do banco de dados.

---

## 🔥 NOVO: Histórico Automático via Triggers

### Como Funciona

1. **Você edita** um insumo ou receita pela interface
2. **Trigger detecta** a mudança automaticamente
3. **Salva histórico** com versionamento automático
4. **Pronto!** Nada mais a fazer

### Exemplo Prático

```typescript
// Frontend: Você apenas atualiza normalmente
await fetch('/api/operacional/receitas/insumos', {
  method: 'PUT',
  body: JSON.stringify({
    id: 123,
    custo_unitario: 15.50 // Mudou de 14.20 para 15.50
  })
});

// ✅ O trigger AUTOMATICAMENTE salva:
// - Estado anterior (14.20) no histórico
// - Versão: 2025-11-14-v1
// - Origem: "sistema"
// - Data: timestamp exato
```

---

## 📊 O que é Salvo Automaticamente

### Insumos
Toda vez que você editar:
- Código
- Nome  
- Categoria
- Tipo local
- Unidade de medida
- **Custo unitário** (mais importante!)
- Observações

### Receitas
Toda vez que você editar:
- Código
- Nome
- Categoria
- Tipo local
- Rendimento esperado
- Observações
- **Lista completa de insumos com quantidades**

---

## 🔍 Consultar Histórico

### Ver mudanças de preço de um insumo

```sql
SELECT 
  versao,
  data_atualizacao,
  custo_unitario,
  origem
FROM insumos_historico
WHERE codigo = 'INS001'
ORDER BY data_atualizacao DESC;
```

### Ver evolução de uma receita

```sql
SELECT 
  versao,
  data_atualizacao,
  rendimento_esperado,
  jsonb_array_length(insumos) as total_insumos,
  origem
FROM receitas_historico
WHERE receita_codigo = 'REC001'
ORDER BY data_atualizacao DESC;
```

### Comparar custos antes/depois

```sql
-- Exemplo: Ver o que mudou hoje
SELECT 
  h.codigo,
  h.nome,
  h.custo_unitario as custo_anterior,
  i.custo_unitario as custo_atual,
  ROUND(
    ((i.custo_unitario - h.custo_unitario) / h.custo_unitario * 100)::numeric, 
    2
  ) as variacao_percentual
FROM insumos_historico h
JOIN insumos i ON i.id = h.insumo_id
WHERE h.data_atualizacao::date = CURRENT_DATE
  AND h.custo_unitario != i.custo_unitario;
```

---

## 📅 Script Manual (Opcional)

### Este script sincroniza insumos e receitas do Google Sheets para o Supabase, **mantendo histórico completo de todas as alterações** com versionamento automático.

## 📋 Características

✅ **Versionamento Automático**: Gera versões no formato `YYYY-MM-DD-vN`  
✅ **Histórico Completo**: Salva estado antes de cada atualização  
✅ **Rastreabilidade**: Origem (sheets/manual/sistema) e data de cada mudança  
✅ **Segurança**: Nunca perde dados - tudo fica registrado  
✅ **Auditoria**: Possibilita análise de mudanças ao longo do tempo  

## 🚀 Como Usar

### 1. Executar Sincronização

```bash
node exemplo_teste/sync-insumos-receitas-historico.js
```

### 2. O que o script faz:

1. **Gera versão automática** baseada na data
   - Exemplo: `2025-11-14-v1` (primeira sync do dia)
   - Exemplo: `2025-11-14-v2` (segunda sync do mesmo dia)

2. **Para cada INSUMO**:
   - ✅ Salva histórico do estado atual
   - ✅ Atualiza com novos valores do Sheets
   - ✅ Registra origem (sheets) e versão

3. **Para cada RECEITA**:
   - ✅ Salva histórico com lista de insumos
   - ✅ Atualiza receita e seus insumos
   - ✅ Registra origem (sheets) e versão

## 📊 Estrutura do Histórico

### Tabela: `insumos_historico`

```sql
CREATE TABLE insumos_historico (
  id BIGSERIAL PRIMARY KEY,
  insumo_id BIGINT REFERENCES insumos(id),
  codigo VARCHAR,
  nome VARCHAR,
  custo_unitario NUMERIC,
  versao VARCHAR,              -- Ex: "2025-11-14-v1"
  data_atualizacao TIMESTAMP,  -- Quando foi atualizado
  origem VARCHAR,              -- "sheets", "manual", "sistema"
  usuario_id UUID,
  ...outros campos...
);
```

### Tabela: `receitas_historico`

```sql
CREATE TABLE receitas_historico (
  id BIGSERIAL PRIMARY KEY,
  receita_id BIGINT REFERENCES receitas(id),
  receita_codigo TEXT,
  receita_nome TEXT,
  insumos JSONB,               -- Array com todos os insumos
  versao VARCHAR,              -- Ex: "2025-11-14-v1"
  data_atualizacao TIMESTAMP,
  origem VARCHAR,
  usuario_id UUID,
  ...outros campos...
);
```

## 🔍 Consultas Úteis

### Ver histórico de um insumo específico

```sql
SELECT 
  versao,
  data_atualizacao,
  custo_unitario,
  origem
FROM insumos_historico
WHERE codigo = 'INS001'
ORDER BY data_atualizacao DESC;
```

### Ver histórico de uma receita

```sql
SELECT 
  versao,
  data_atualizacao,
  rendimento_esperado,
  jsonb_array_length(insumos) as total_insumos,
  origem
FROM receitas_historico
WHERE receita_codigo = 'REC001'
ORDER BY data_atualizacao DESC;
```

### Ver todas as versões de um dia específico

```sql
SELECT 
  'insumo' as tipo,
  versao,
  COUNT(*) as total
FROM insumos_historico
WHERE versao LIKE '2025-11-14%'
GROUP BY versao

UNION ALL

SELECT 
  'receita' as tipo,
  versao,
  COUNT(*) as total
FROM receitas_historico
WHERE versao LIKE '2025-11-14%'
GROUP BY versao;
```

### Comparar custos entre versões

```sql
SELECT 
  h1.codigo,
  h1.nome,
  h1.custo_unitario as custo_anterior,
  h2.custo_unitario as custo_atual,
  ROUND(((h2.custo_unitario - h1.custo_unitario) / h1.custo_unitario * 100)::numeric, 2) as variacao_percentual
FROM insumos_historico h1
JOIN insumos_historico h2 ON h1.insumo_id = h2.insumo_id
WHERE h1.versao = '2025-11-14-v1'
  AND h2.versao = '2025-11-14-v2'
  AND h1.custo_unitario != h2.custo_unitario;
```

## 📅 Quando Rodar?

### Cenários Recomendados:

1. **Atualização de Preços** (semanal/mensal)
   ```bash
   # Antes: Atualizar planilha do Google Sheets
   # Depois: Rodar o script
   node exemplo_teste/sync-insumos-receitas-historico.js
   ```

2. **Novos Insumos/Receitas**
   ```bash
   # Adicionar na planilha, depois sincronizar
   node exemplo_teste/sync-insumos-receitas-historico.js
   ```

3. **Ajustes de Receitas**
   ```bash
   # Modificar quantidades na planilha, depois sincronizar
   node exemplo_teste/sync-insumos-receitas-historico.js
   ```

## ⚠️ Importante

- ✅ **Sempre verifique a planilha** antes de rodar
- ✅ **Backup automático** - histórico nunca é perdido
- ✅ **Rastreável** - toda mudança tem origem e data
- ⚠️ **Não rodar múltiplas vezes** sem necessidade (gera versões desnecessárias)

## 🎯 Benefícios do Histórico

1. **Auditoria Completa**: Sabe quem mudou o quê e quando
2. **Recuperação**: Pode voltar a versões anteriores se necessário
3. **Análise de Tendências**: Ver evolução de custos ao longo do tempo
4. **Conformidade**: Atende requisitos de rastreabilidade
5. **Transparência**: Toda mudança é registrada

## 📈 Exemplo de Uso Real

```bash
# 14/11/2024 - Manhã: Atualização de preços
$ node exemplo_teste/sync-insumos-receitas-historico.js
📌 Versão: 2025-11-14-v1
✅ Sincronização concluída!
📊 Resumo do Histórico:
   - Insumos salvos: 156
   - Receitas salvas: 78

# 14/11/2024 - Tarde: Correção de algumas quantidades
$ node exemplo_teste/sync-insumos-receitas-historico.js
📌 Versão: 2025-11-14-v2
✅ Sincronização concluída!
📊 Resumo do Histórico:
   - Insumos salvos: 156
   - Receitas salvas: 78
```

Agora você tem **histórico completo** das duas atualizações do dia! 🎉

## 🔗 Integração com Sistema

O histórico pode ser usado para:
- Dashboard de evolução de custos
- Relatórios de variação de preços
- Análise de impacto em receitas
- Auditoria de mudanças
- Recuperação de dados

## 💡 Dicas

1. **Faça backups** da planilha antes de grandes mudanças
2. **Documente** o motivo das atualizações (no Google Sheets)
3. **Revise** o histórico periodicamente
4. **Use versões** para marcos importantes (ex: início do mês)
5. **Mantenha** nomenclatura consistente na planilha

---

**Desenvolvido para**: Sistema de Gestão de Bares (SGB) v2  
**Data**: Novembro 2024  
**Autor**: Zykor Development Team

