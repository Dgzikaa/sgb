# 📋 DECISÕES ARQUITETURAIS - ZYKOR

> **IMPORTANTE**: Registre aqui TODAS as decisões importantes e o motivo.
> Consulte antes de tomar decisões que afetem a arquitetura.

---

## 🏗️ ARQUITETURA GERAL

### DEC-001: Estrutura de Pastas Frontend
**Data:** 2024
**Decisão:** Usar App Router do Next.js 14+
**Motivo:** Melhor performance, Server Components, layouts aninhados
**Regras:**
- APIs sempre em `/api/[funcionalidade]/route.ts`
- Páginas direto em `/src/app/[categoria]/page.tsx`
- Componentes em `/src/components/[categoria]/`
- **NUNCA** usar `/admin/` ou `/paginas/` - estas pastas foram eliminadas
- Hooks em `/src/hooks/`
- Libs/utils em `/src/lib/`

### DEC-002: Backend com Edge Functions
**Data:** 2024
**Decisão:** Usar Supabase Edge Functions (Deno) para backend
**Motivo:** 
- Melhor para tarefas agendadas (pg_cron)
- Mais próximo do banco
- Escala automática
- Ambiente isolado
**Regras:**
- Edge Functions em `/backend/supabase/functions/`
- Nomes em kebab-case (ex: `contahub-sync-automatico`)
- Sempre incluir CORS headers
- Sempre logar início/fim/erros

### DEC-003: Consolidação de Funções
**Data:** 2026-01-09
**Decisão:** Evitar proliferação de Edge Functions
**Motivo:** 
- Manutenção difícil com muitas funções
- Código duplicado
- Confusão sobre qual função faz o quê
- Custo de deploy
**Regras:**
- Antes de criar nova função, verificar se pode integrar com existente
- Funções devem ter propósito claro e único
- Deletar funções não usadas imediatamente
- Preferir parâmetros/contexto para variar comportamento

### DEC-004: Banco de Dados Supabase
**Data:** 2024
**Decisão:** PostgreSQL via Supabase
**Motivo:** Integração nativa com Edge Functions, RLS, realtime
**Project ID:** `uqtgsvujwcbymjmvkjhy`
**Regras:**
- Sempre usar MCP para queries durante desenvolvimento
- Não criar tabelas sem necessidade clara
- Limpar tabelas/dados antigos periodicamente
- Usar RLS para segurança

---

## 🤖 AGENTES IA

### DEC-010: Modelo Gemini
**Data:** 2026-01-09
**Decisão:** Usar `gemini-2.0-flash` com header `x-goog-api-key`
**Motivo:** 
- Modelo anterior (`gemini-1.5-pro-latest`) descontinuado
- Flash é mais rápido e suficiente para análises
- Header é mais seguro que query param
**Regras:**
- Sempre usar header `x-goog-api-key` (não query param)
- Ter fallback para quando quota esgota
- Logar uso para monitorar quota

### DEC-011: Análise de Dias Anteriores
**Data:** 2026-01-09
**Decisão:** Buscar última operação com faturamento > R$ 1000
**Motivo:** 
- Evitar comparar com dias fechados (ex: 01/01, feriados)
- Dias fechados têm faturamento ~0 e distorcem análise
**Regras:**
- Sempre filtrar por `real_r > 1000` ou `faturamento_liquido > 1000`
- Buscar mesmo dia da semana (ex: quinta com quinta)
- Comparar com últimas 4 operações do mesmo dia
- Se não encontrar 4, usar o que tiver

### DEC-012: Fallback Enriquecido
**Data:** 2026-01-09
**Decisão:** Quando IA indisponível, mostrar dados ricos mesmo assim
**Motivo:** Usuário não fica sem informação útil
**Regras:**
- Fallback deve ter: faturamento, PAX, tickets, histórico, comparações
- Indicar claramente que IA está indisponível (quota/erro)
- Nunca mostrar mensagem vazia ou erro genérico
- Calcular variações % mesmo sem IA

### DEC-013: Estrutura de Prompt
**Data:** 2026-01-09
**Decisão:** Prompt estruturado com seções claras
**Motivo:** Melhor qualidade de resposta da IA
**Estrutura obrigatória:**
1. Base de conhecimento (regras do negócio)
2. Contexto atual (dados do dia)
3. Memória (aprendizados anteriores)
4. Padrões detectados
5. Regras customizadas
6. Missão clara
7. Formato de resposta (JSON)

---

## 🎨 FRONTEND

### DEC-020: Dark Mode Obrigatório
**Data:** 2024
**Decisão:** Todas as páginas devem suportar dark mode
**Motivo:** Consistência visual, preferência do usuário
**Regras:**
- Usar classes `dark:` em todos os elementos visuais
- `text-gray-900 dark:text-white` para títulos
- `bg-white dark:bg-gray-800` para cards
- `border-gray-200 dark:border-gray-700` para bordas
- Ver regras completas em `.cursorrules`

### DEC-021: Ícones em Botões
**Data:** 2024
**Decisão:** Ícones sempre ao lado do texto (horizontal)
**Motivo:** UX consistente, melhor legibilidade
**Regras:**
- NUNCA ícone acima do texto (vertical)
- `mr-2` para ícone à esquerda
- `ml-2` para ícone à direita
- Tamanho padrão: `w-4 h-4`

### DEC-022: Componentes Reutilizáveis
**Data:** 2024
**Decisão:** Usar biblioteca de componentes em `/components/ui/`
**Motivo:** Consistência, menos código duplicado
**Regras:**
- Button, Input, Card, etc. em `/components/ui/`
- Shadcn/ui como base
- Customizações específicas em componentes separados

---

## 🔧 OPERACIONAL

### DEC-030: Git Push Manual
**Data:** 2024
**Decisão:** NUNCA fazer push automático
**Motivo:** Evitar deploy acidental, revisar antes
**Regras:**
- Sempre perguntar ao usuário antes de `git push`
- `git add .` pode ser automático
- `git commit` pode ser automático
- `git pull` pode ser automático
- Só `push` precisa confirmação explícita

### DEC-031: Sintaxe Windows
**Data:** 2024
**Decisão:** Usar sintaxe PowerShell/Windows nos comandos
**Motivo:** Ambiente de desenvolvimento é Windows
**Regras:**
- `Get-Content` ao invés de `cat`
- `Invoke-WebRequest` ao invés de `curl`
- Paths com `\` ou usar Node.js para cross-platform
- Ou usar Node.js para operações complexas

### DEC-032: Não Criar Arquivos .md Automaticamente
**Data:** 2024
**Decisão:** Nunca criar arquivos .md sem pedir
**Motivo:** Evitar poluição do projeto com docs desnecessárias
**Regras:**
- Mostrar resumos no chat, não em arquivos
- Só criar .md se usuário pedir explicitamente
- Exceção: arquivos em `.cursor/` para contexto

### DEC-033: Verificação MCP Primeiro
**Data:** 2026-01-09
**Decisão:** Sempre verificar BD via MCP antes de implementar
**Motivo:** Evitar erros de schema, queries inválidas
**Regras:**
- Usar `mcp_supabase_list_tables` para ver estrutura
- Usar `mcp_supabase_execute_sql` para testar queries
- Não assumir nomes de colunas sem verificar

---

## 🔗 INTEGRAÇÕES

### DEC-040: Discord como Hub de Notificações
**Data:** 2024
**Decisão:** Discord é o canal principal de alertas
**Motivo:** Fácil de usar, webhooks simples, histórico
**Regras:**
- Webhooks separados por tipo (contahub, nibo, eventos)
- Formatação rica com embeds
- Cores: verde sucesso, vermelho erro, amarelo alerta
- Sempre incluir timestamp

### DEC-041: Agendamentos via pg_cron
**Data:** 2024
**Decisão:** Usar pg_cron do Supabase para jobs
**Motivo:** Nativo do Supabase, confiável, fácil de gerenciar
**Regras:**
- Horários em UTC (Brasília = UTC-3)
- Um job por função principal
- Nomear jobs de forma descritiva
- Desativar jobs obsoletos, não deletar (histórico)

---

## 📝 COMO ADICIONAR DECISÕES

```markdown
### DEC-XXX: Título da Decisão
**Data:** YYYY-MM-DD
**Decisão:** O que foi decidido
**Motivo:** Por que foi decidido assim
**Regras:**
- Regra 1
- Regra 2
```

---

## 📜 HISTÓRICO DE REVISÕES

| Data | Decisão | Alteração |
|------|---------|-----------|
| 2026-01-09 | DEC-010 | Atualizado para gemini-2.0-flash |
| 2026-01-09 | DEC-011 | Criado - comparação inteligente |
| 2026-01-09 | DEC-012 | Criado - fallback enriquecido |
| 2026-01-09 | DEC-003 | Criado - consolidação de funções |
