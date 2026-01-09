# 🧠 ZYKOR - CONTEXTO DO AGENTE

> **IMPORTANTE**: Este arquivo é lido automaticamente em cada chat.
> Atualize-o conforme o projeto evolui.

---

## 📋 VISÃO GERAL DO PROJETO

**Nome:** SGB (Sistema de Gestão de Bares)
**Versão:** 2.0
**Stack:**
- Frontend: Next.js 14+ com TypeScript
- Backend: Supabase Edge Functions (Deno)
- Banco: PostgreSQL (Supabase)
- IA: Google Gemini 2.0 Flash

**Objetivo:** Sistema completo para gestão operacional de bares, com análises inteligentes via IA.

---

## 🏢 NEGÓCIO

**Bar Principal:** Ordinário Bar (bar_id: 3)
**Localização:** São Paulo, Brasil
**Operação:** Quarta a Domingo (fechado Seg/Ter)

**Dias típicos:**
- Quarta: Quarta de Bamba (Samba)
- Quinta: Pé no Ordi (Forró)
- Sexta: Sexta na Roça (Sertanejo)
- Sábado: Eventos especiais
- Domingo: Feijoada/Eventos

---

## 🎯 METAS E KPIs

| Dia | Meta Faturamento |
|-----|------------------|
| Domingo | R$ 58.000 |
| Segunda | R$ 5.000 (fechado/eventos) |
| Terça | R$ 0 (fechado) |
| Quarta | R$ 35.000 |
| Quinta | R$ 25.000 |
| Sexta | R$ 70.000 |
| Sábado | R$ 60.000 |

**Tickets Ideais:**
- Ticket Médio: R$ 120
- Ticket Bebida: R$ 90
- CMV Ideal: 28%
- Margem Ideal: 65%

---

## 🔧 INTEGRAÇÕES ATIVAS

| Sistema | Função | Status |
|---------|--------|--------|
| ContaHub | Faturamento, PAX, Tickets | ✅ Ativo |
| Nibo | Custos, Pagamentos, Fluxo de Caixa | ✅ Ativo |
| Discord | Notificações e Alertas | ✅ Ativo |
| Gemini | Análise IA | ✅ Ativo (quota limitada) |
| Yuzer | Reservas | 🔄 Em integração |
| Sympla | Eventos/Ingressos | 🔄 Em integração |
| Getin | Lista/Entrada | 🔄 Em integração |

---

## ⏰ AGENDAMENTOS (pg_cron)

| Job | Horário (Brasília) | Função |
|-----|-------------------|--------|
| contahub-sync-automatico | 09:00 | Sync dados ContaHub |
| agente-analise-diaria | 10:00 | Análise diária com IA |
| agente-analise-semanal | Segunda 08:00 | Resumo semanal |
| agente-analise-mensal | Dia 2, 08:00 | Resumo mensal |
| nibo-sync | 08:00 | Sync dados Nibo |

---

## 📊 TABELAS PRINCIPAIS

| Tabela | Descrição |
|--------|-----------|
| eventos | Dados consolidados de eventos/dias |
| eventos_base | Dados brutos dos eventos |
| contahub_daily_data | Dados diários do ContaHub |
| nibo_transactions | Transações do Nibo |
| agente_insights | Insights gerados pela IA |
| agente_base_conhecimento | Regras de negócio para IA |
| agente_memoria | Memória do agente IA |
| agente_padroes | Padrões detectados pela IA |

---

## 🚀 FUNCIONALIDADES IMPLEMENTADAS

### Análise Diária (agente-analise-diaria)
- ✅ Busca última operação real do mesmo dia (ignora fechados)
- ✅ Compara com últimas 4 operações do mesmo dia
- ✅ Calcula estatísticas históricas (média, tendência)
- ✅ ROI de atração (custo vs retorno)
- ✅ Análise profunda com Gemini
- ✅ Fallback rico quando IA indisponível
- ✅ Envio automático para Discord

### Sync Automático
- ✅ ContaHub: Faturamento, PAX, Tickets
- ✅ Nibo: Custos, Pagamentos
- ✅ Notificações Discord

---

## 📝 ÚLTIMA ATUALIZAÇÃO

**Data:** 2026-01-09
**O que foi feito:**
- Melhoria profunda na análise diária
- Busca inteligente de dias anteriores (ignora fechados)
- Estatísticas históricas do mesmo dia da semana
- Atualização do modelo Gemini para 2.0-flash
- Desativação de job duplicado (alertas-inteligentes-diario)
