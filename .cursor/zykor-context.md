# ZYKOR - CONTEXTO DO AGENTE

> IMPORTANTE: Este arquivo e lido automaticamente em cada chat.

## VISAO GERAL DO PROJETO

Nome: SGB (Sistema de Gestao de Bares)
Versao: 2.0
Stack: Next.js 14+, Supabase Edge Functions, PostgreSQL, Gemini 2.0 Flash
Project ID Supabase: uqtgsvujwcbymjmvkjhy

## NEGOCIO

Bar Principal: Ordinario Bar (bar_id: 3)
Localizacao: Sao Paulo, Brasil
Operacao: TODOS OS DIAS (a partir de 2026!)

Dias tipicos e atracoes:
- Segunda: Novo! (definir atracao)
- Terca: Novo! (definir atracao)
- Quarta: Quarta de Bamba (Samba)
- Quinta: Pe no Ordi (Forro)
- Sexta: Sexta na Roca (Sertanejo)
- Sabado: Eventos especiais
- Domingo: Feijoada/Eventos

## METAS DE FATURAMENTO

| Dia | Meta |
|-----|------|
| Segunda | R$ 20.000 (novo!) |
| Terca | R$ 20.000 (novo!) |
| Quarta | R$ 35.000 |
| Quinta | R$ 25.000 |
| Sexta | R$ 70.000 |
| Sabado | R$ 60.000 |
| Domingo | R$ 58.000 |

KPIs: Ticket Medio R, CMV 28%, Margem 65%

## INTEGRACOES ATIVAS

- ContaHub: Faturamento, PAX, Tickets (contahub-sync-automatico)
- Nibo: Custos, Pagamentos (nibo-sync)
- Discord: Notificacoes (discord-notification)
- Gemini: Analise IA (agente-ia-analyzer)
- Yuzer/Sympla/Getin: Em integracao

## AGENDAMENTOS (pg_cron)

- 09:00 contahub-sync-automatico
- 10:00 agente-analise-diaria
- Segunda 08:00 agente-analise-semanal
- Dia 2 08:00 agente-analise-mensal

## FUNCIONALIDADES

Analise Diaria:
- Busca ultima operacao REAL (agora todos os dias sao operacionais!)
- Compara com ultimas 4 operacoes do mesmo dia
- ROI de atracao, margens, tendencias
- Gemini 2.0 Flash com fallback

## PONTOS DE ATENCAO

1. Quota Gemini limitada - sistema tem fallback
2. ATUALIZADO 2026: Bar opera todos os dias agora!
3. Consolidar funcoes existentes antes de criar novas
4. Dark mode obrigatorio em todas as paginas
