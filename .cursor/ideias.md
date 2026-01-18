# IDEIAS EM ANDAMENTO - ZYKOR

> Adicione suas ideias aqui. O agente lera automaticamente.
> Ultima atualizacao: 2026-01-09

---

## PRIORIDADE ALTA

### 1. Eventos Externos que Impactam o Bar
**Status:** EM DESENVOLVIMENTO (outro chat)
**Descricao:** Detectar e correlacionar eventos externos com desempenho:
- Shows na cidade (Mane Garrincha, bares concorrentes)
- Jogos de futebol (Flamengo, Vasco, Corinthians em Brasilia)
- Feriados e pontos facultativos
- Copa do Mundo 2026 (PRIORIDADE!)
- Eventos governamentais (posse, manifestacoes)
**Impacto:** Contextualizar analises, prever demanda, ajustar estoque
**Proximos passos:**
- [ ] Definir fontes de dados (APIs de eventos)
- [ ] Criar tabela de eventos externos
- [ ] Integrar na analise diaria
- [ ] Alertas de eventos proximos

### 2. Analise de Atracoes nas Redes Sociais + Marketing Automatizado
**Status:** 🔄 PARCIALMENTE IMPLEMENTADO
**Descricao:** Verificar engajamento das atracoes com @ordinariobar:
- Posts marcando o bar
- Stories compartilhados
- Alcance e impressoes
- Engajamento (likes, comentarios)
**Impacto:** Medir ROI real das atracoes, decidir quem contratar
**Atracoes frequentes a monitorar:**
- Breno Alves (Quarta de Bamba)
- Pe no Chao (Pe no Ordi)
- Bonsai (Pagode Vira Lata)
- STZ, Sambadona (Legado do Samba)
- 7naRoda (Terca)
- DJs: Afrika, Vinny, Caju, Jess Ullun, Negritah, Leo Cabral
**Implementado em 16/01/2026:**
- [x] Tabela `marketing_semanal` criada
- [x] Edge Function `sync-marketing-meta` (Meta Ads funcionando)
- [x] Edge Function `sync-marketing-google` (aguardando credenciais)
- [x] Edge Function `sync-marketing-auto` (cron diário 07:00 BRT)
- [x] Dados históricos Meta sincronizados (Fev/2025 - Jan/2026)
- [x] Frontend exibindo dados de marketing no cockpit
**Proximos passos:**
- [ ] Obter acesso ao Business Manager (Supersal) para Instagram Organic Insights
- [ ] Configurar Google Ads Customer ID e Developer Token
- [ ] Configurar Google My Business Location ID
- [ ] Correlacionar posts com faturamento do dia
- [ ] Dashboard de performance de atracoes
- [ ] Ranking de atracoes por ROI

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

### 5. Dashboard de Performance de Atracoes
**Status:** IDEIA
**Descricao:** Ranking completo de atracoes por:
- ROI (custo da atracao vs faturamento gerado)
- Publico atraido (PAX)
- Ticket medio quando toca
- Engajamento social
- Frequencia de shows
- Tendencia (melhorando/piorando)
**Impacto:** Decidir quais atracoes contratar/repetir
**Dados necessarios:**
- Custo por atracao (ja temos em eventos_base.custo_atracao)
- Faturamento do dia (eventos_base.faturamento_liquido)
- PAX (eventos_base.cl_real)
- Posts nas redes (a implementar)
**Metricas sugeridas:**
- ROI = (Faturamento - Custo Atracao) / Custo Atracao
- Ticket/PAX quando toca vs media geral
- Lotacao % quando toca

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

### 10. Copa do Mundo 2026 - Preparacao
**Status:** IDEIA
**Descricao:** Preparar sistema para Copa do Mundo:
- Calendario de jogos do Brasil
- Previsao de demanda por jogo
- Ajuste automatico de metas
- Estoque especial
- Escalas diferenciadas
**Impacto:** Maximizar faturamento em evento historico
**Datas importantes:** Junho-Julho 2026

---

## PRIORIDADE BAIXA (FUTURO)

### 11. App Mobile para Gestores
**Status:** IDEIA FUTURA
**Descricao:** Versao mobile do SGB com dashboards principais e alertas push
**Impacto:** Acompanhamento em tempo real

### 12. Multi-bar Comparativo
**Status:** PARCIALMENTE IMPLEMENTADO
**Descricao:** Ja temos Ordinario (id 3) e Deboche (id 4)
- Comparar performance entre bares
- Identificar melhores praticas
- Benchmark interno
**Impacto:** Aprendizado entre unidades

### 13. Integracao com Fornecedores
**Status:** IDEIA FUTURA
**Descricao:** Pedidos automaticos baseado em estoque e previsao
**Impacto:** Automatizacao de compras

### 14. Open Finance (Pluggy)
**Status:** IDEIA FUTURA
**Descricao:** Conectar contas bancarias para fluxo de caixa automatico
**Impacto:** Visao financeira completa

### 15. Integracao Banco Inter
**Status:** IDEIA FUTURA
**Descricao:** Pagamentos, cobranças, conciliacao automatica
**Impacto:** Reduzir trabalho financeiro manual

---

## IDEIAS IMPLEMENTADAS

| Ideia | Data | Detalhes |
|-------|------|----------|
| Analise diaria automatica | 2026-01-09 | Roda 10:00 BRT, envia Discord |
| Analise semanal automatica | 2026-01-09 | Roda segunda 08:00 BRT |
| Analise mensal automatica | 2026-01-09 | Roda dia 2, 08:00 BRT |
| Comparacao inteligente | 2026-01-09 | Ignora dias fechados, busca ultimo aberto |
| Estatisticas historicas | 2026-01-09 | Ultimas 4 operacoes do mesmo dia |
| Sistema de agente com memoria | 2026-01-08 | Tabelas agente_* |
| Sync ContaHub automatico | 2025 | Diario 07:00 BRT |
| Sync Nibo automatico | 2025 | Diario 10:00 BRT |
| Sync Sympla | 2025 | Semanal |
| Sync Yuzer | 2025 | Semanal |
| Sync NPS | 2025 | Diario 05:00 BRT |
| Sync Fichas Tecnicas | 2025 | Diario |
| CMV Semanal automatico | 2025 | Segunda 07:00 BRT |
| Desempenho Semanal automatico | 2025 | Segunda 06:00 BRT |
| Notificacoes Discord | 2025 | Multiplos webhooks |
| Alertas proativos | 2025 | Manha e tarde |
| Checklist auto-scheduler | 2025 | A cada 15 min |
| Context files para agente | 2026-01-09 | .cursor/*.md |
| Operacao 7 dias/semana | 2026-01-09 | Segunda e Terca adicionados |

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
