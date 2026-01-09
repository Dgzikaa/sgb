# 📋 DECISÕES ARQUITETURAIS - ZYKOR

> **IMPORTANTE**: Registre aqui TODAS as decisões importantes e o motivo.

---

## 🏗️ ARQUITETURA

### DEC-001: Estrutura de Pastas
**Data:** 2024
**Decisão:** Usar App Router do Next.js 14+
**Motivo:** Melhor performance, Server Components, layouts aninhados
**Regras:**
- APIs sempre em `/api/[funcionalidade]/route.ts`
- Páginas direto em `/src/app/[categoria]/page.tsx`
- Componentes em `/src/components/[categoria]/`
- NUNCA usar `/admin/` ou `/paginas/`

### DEC-002: Backend com Edge Functions
**Data:** 2024
**Decisão:** Usar Supabase Edge Functions (Deno) ao invés de API Routes
**Motivo:** Melhor para tarefas agendadas, mais próximo do banco
**Regras:**
- Edge Functions em `/backend/supabase/functions/`
- Nomes em snake_case ou kebab-case
- Sempre com CORS headers

### DEC-003: Consolidação de Funções
**Data:** 2026-01-09
**Decisão:** Evitar proliferação de Edge Functions
**Motivo:** Manutenção difícil, código duplicado, confusão
**Regras:**
- Antes de criar nova função, verificar se pode integrar com existente
- Funções devem ter propósito claro e único
- Deletar funções não usadas

---

## 🤖 AGENTES IA

### DEC-010: Modelo Gemini
**Data:** 2026-01-09
**Decisão:** Usar `gemini-2.0-flash` com header `x-goog-api-key`
**Motivo:** Modelo anterior (`gemini-1.5-pro-latest`) foi descontinuado
**Regras:**
- Sempre usar header ao invés de query param
- Ter fallback para quando quota esgota

### DEC-011: Análise de Dias Anteriores
**Data:** 2026-01-09
**Decisão:** Buscar última operação com faturamento > R$ 1000
**Motivo:** Evitar comparar com dias fechados (ex: 01/01)
**Regras:**
- Sempre filtrar por `real_r > 1000`
- Buscar mesmo dia da semana
- Comparar com últimas 4 operações

### DEC-012: Fallback Enriquecido
**Data:** 2026-01-09
**Decisão:** Quando IA indisponível, mostrar dados ricos mesmo assim
**Motivo:** Usuário não fica sem informação
**Regras:**
- Fallback deve ter: faturamento, PAX, tickets, histórico, comparações
- Indicar claramente que IA está indisponível

---

## 🎨 FRONTEND

### DEC-020: Dark Mode Obrigatório
**Data:** 2024
**Decisão:** Todas as páginas devem suportar dark mode
**Motivo:** Consistência visual, preferência do usuário
**Regras:**
- Usar classes `dark:` em todos os elementos
- Ver regras completas em `.cursorrules`

### DEC-021: Ícones em Botões
**Data:** 2024
**Decisão:** Ícones sempre ao lado do texto (horizontal)
**Motivo:** UX consistente
**Regras:**
- NUNCA ícone acima do texto (vertical)
- `mr-2` para ícone à esquerda, `ml-2` para direita

---

## 🔧 OPERACIONAL

### DEC-030: Git Push Manual
**Data:** 2024
**Decisão:** NUNCA fazer push automático
**Motivo:** Evitar deploy acidental
**Regras:**
- Sempre perguntar ao usuário antes de `git push`
- `git add` e `git commit` podem ser automáticos

### DEC-031: Sintaxe Windows
**Data:** 2024
**Decisão:** Usar sintaxe PowerShell/Windows
**Motivo:** Ambiente de desenvolvimento é Windows
**Regras:**
- Usar `Get-Content` ao invés de `cat`
- Usar `Invoke-WebRequest` ao invés de `curl`
- Ou usar Node.js para operações complexas

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
