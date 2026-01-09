# 💡 IDEIAS EM ANDAMENTO - ZYKOR

> **IMPORTANTE**: Adicione suas ideias aqui. O agente lerá automaticamente.

---

## 🔥 PRIORIDADE ALTA

### 1. Eventos Externos que Impactam o Bar
**Status:** 🔄 Em desenvolvimento (outro chat)
**Descrição:** Detectar e correlacionar eventos externos (shows na cidade, jogos de futebol, feriados, clima extremo) com o desempenho do bar
**Impacto:** Contextualizar análises e prever demanda
**Próximos passos:**
- [ ] Definir fontes de dados (APIs de eventos, clima, etc.)
- [ ] Criar tabela de eventos externos
- [ ] Integrar na análise diária

### 2. Análise de Atrações nas Redes Sociais
**Status:** 💭 Ideia
**Descrição:** Verificar se atrações fizeram posts marcando @ordinariobar no Instagram
**Impacto:** Medir engajamento, alcance e ROI real das atrações
**Próximos passos:**
- [ ] Pesquisar API do Instagram/Meta Business
- [ ] Criar integração ou scraper
- [ ] Correlacionar posts com faturamento do dia
- [ ] Dashboard de performance de atrações

### 3. Integração Yuzer Completa (Reservas)
**Status:** 🔄 Em integração
**Descrição:** Puxar dados de reservas automaticamente e correlacionar com presença real
**Impacto:** Melhorar previsão de público, identificar no-shows
**Próximos passos:**
- [ ] Finalizar sync automático
- [ ] Comparar reservas vs PAX real
- [ ] Alertas de alta demanda de reservas

### 4. Integração Getin (Lista/Entrada)
**Status:** 🔄 Em integração
**Descrição:** Dados de entrada, listas VIP, promoters
**Impacto:** Análise de conversão lista → entrada
**Próximos passos:**
- [ ] Finalizar integração
- [ ] Dashboard de promoters
- [ ] ROI por promoter

---

## 🟡 PRIORIDADE MÉDIA

### 5. Dashboard de Performance de Atrações
**Status:** 💭 Ideia
**Descrição:** Ranking completo de atrações por:
- ROI (custo da atração vs faturamento gerado)
- Público atraído (PAX)
- Ticket médio quando toca
- Engajamento social
**Impacto:** Decidir quais atrações contratar/repetir
**Dados necessários:**
- Custo por atração (já temos em eventos_base)
- Faturamento do dia
- PAX
- Posts nas redes (a implementar)

### 6. Previsão de Demanda com IA
**Status:** 💭 Ideia
**Descrição:** IA prever faturamento baseado em:
- Histórico do mesmo dia da semana
- Eventos externos na cidade
- Clima previsto
- Atração escalada
- Tendência das últimas semanas
**Impacto:** Melhor planejamento de estoque, equipe e compras
**Próximos passos:**
- [ ] Coletar dados históricos estruturados
- [ ] Treinar modelo ou usar Gemini com contexto
- [ ] Interface de previsão

### 7. Análise de Cardápio/Mix de Vendas
**Status:** 💭 Ideia
**Descrição:** 
- Quais drinks/pratos vendem mais
- Margem por produto
- Análise ABC de produtos
- Sugestões de cardápio
**Impacto:** Otimizar cardápio, aumentar margem
**Dados necessários:**
- Vendas por produto do ContaHub
- Custos de insumos (já temos)

### 8. Sistema de Metas Inteligentes
**Status:** 💭 Ideia
**Descrição:** Metas que se ajustam baseado em:
- Histórico real
- Sazonalidade
- Eventos externos
**Impacto:** Metas mais realistas e motivadoras

### 9. Alertas Proativos por WhatsApp/Telegram
**Status:** 💭 Ideia
**Descrição:** Além do Discord, enviar alertas críticos para WhatsApp do gestor
**Impacto:** Resposta mais rápida a problemas

---

## 🟢 PRIORIDADE BAIXA (FUTURO)

### 10. App Mobile para Gestores
**Status:** 💭 Ideia futura
**Descrição:** Versão mobile do SGB com dashboards principais e alertas push
**Impacto:** Acompanhamento em tempo real

### 11. Multi-bar
**Status:** 💭 Ideia futura
**Descrição:** Suporte a múltiplos bares na mesma conta com comparativos
**Impacto:** Expansão do negócio

### 12. Integração com Fornecedores
**Status:** 💭 Ideia futura
**Descrição:** Pedidos automáticos baseado em estoque e previsão
**Impacto:** Automatização de compras

### 13. Open Finance (Pluggy)
**Status:** 💭 Ideia futura
**Descrição:** Conectar contas bancárias para fluxo de caixa automático
**Impacto:** Visão financeira completa

---

## ✅ IDEIAS IMPLEMENTADAS

| Ideia | Data | Detalhes |
|-------|------|----------|
| Análise diária automática | 2026-01-09 | Roda 10:00, envia Discord |
| Análise semanal automática | 2026-01-09 | Roda segunda 08:00 |
| Análise mensal automática | 2026-01-09 | Roda dia 2, 08:00 |
| Comparação inteligente (ignora dias fechados) | 2026-01-09 | Busca último dia aberto |
| Estatísticas históricas do mesmo dia | 2026-01-09 | Últimas 4 operações |
| Sistema de agente com memória | 2026-01-08 | Tabelas agente_* |
| Sync ContaHub automático | 2025 | Diário 09:00 |
| Sync Nibo automático | 2025 | Diário 08:00 |
| Sync Sympla | 2025 | Diário 06:00 |
| Notificações Discord | 2025 | Múltiplos webhooks |
| Desativar alertas duplicados | 2026-01-09 | Job alertas-inteligentes |
| Context files para agente | 2026-01-09 | .cursor/*.md |

---

## 🚫 IDEIAS DESCARTADAS

| Ideia | Motivo |
|-------|--------|
| Análise de clima/tempo | Pouco impacto direto, muito especulativo |
| Múltiplas Edge Functions por análise | Consolidar em funções existentes |

---

## 📝 COMO ADICIONAR IDEIAS

```markdown
### Nome da Ideia
**Status:** 💭 Ideia | 🔄 Em andamento | ✅ Implementado | 🚫 Descartado
**Descrição:** O que é a ideia
**Impacto:** Por que é importante
**Dados necessários:** O que precisa para funcionar
**Próximos passos:**
- [ ] Passo 1
- [ ] Passo 2
```
