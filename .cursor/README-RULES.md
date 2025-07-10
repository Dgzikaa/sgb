# Regras de Organização - SGB_V2

Este diretório contém as regras de organização do projeto SGB_V2 para o Cursor IDE.

## 📁 Estrutura de Regras

- **`.cursorrules`** (raiz do projeto) - Regras principais
- **`frontend-main-rule.mdc`** - Regras específicas do frontend
- **`backend-main-rule.mdc`** - Regras específicas do backend

## 🚀 Como Funciona

As regras são automaticamente aplicadas pelo Cursor quando você:
- Cria novos arquivos
- Move arquivos
- Renomeia arquivos
- Solicita ajuda para organização

## 📋 Resumo das Regras

### Frontend (`frontend/src/`)
```
✅ Páginas: app/admin/page.tsx
✅ Componentes: components/ui/Button.tsx
✅ APIs: app/api/admin/route.ts
✅ Hooks: hooks/useAuth.ts
✅ Utils: lib/api-client.ts
```

### Backend (`backend/supabase/functions/`)
```
✅ Edge Functions: login/index.ts
✅ Processamento: processar-dados/index.ts
✅ OAuth: contaazul-oauth/index.ts
```

## 🎯 Áreas do Projeto

### Admin (`frontend/src/app/admin/`)
- Páginas administrativas
- Relatórios administrativos
- Configurações do sistema

### Operações (`frontend/src/app/operacoes/`)
- Funcionalidades operacionais
- Checklists
- Processos do dia a dia

### Relatórios (`frontend/src/app/relatorios/`)
- Todos os tipos de relatórios
- Dashboards específicos

### Configurações (`frontend/src/app/configuracoes/`)
- Configurações do usuário
- Integrações
- Personalizações

## 📝 Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Pastas | kebab-case | `user-management` |
| Componentes | PascalCase.tsx | `UserForm.tsx` |
| Páginas | page.tsx | `page.tsx` |
| APIs | route.ts | `route.ts` |
| Edge Functions | index.ts | `index.ts` |
| Hooks | camelCase.ts | `useAuth.ts` |
| Utils | kebab-case.ts | `api-client.ts` |

## ⚡ Atalhos Mentais

### Antes de criar um arquivo, pergunte:

1. **Frontend ou Backend?**
   - Interface = Frontend
   - Lógica de servidor = Backend

2. **Qual categoria?**
   - Admin, Operações, Relatórios, Configurações

3. **Qual tipo?**
   - Página, Componente, API, Edge Function

4. **Nome correto?**
   - Seguir convenções de nomenclatura

## 🔍 Exemplos Práticos

### ✅ Correto
```
frontend/src/app/admin/usuarios/page.tsx
frontend/src/components/forms/UserForm.tsx
frontend/src/app/api/admin/usuarios/route.ts
backend/supabase/functions/processar-usuarios/index.ts
```

### ❌ Incorreto
```
frontend/pages/admin/usuarios.tsx
frontend/components/UserForm.tsx (sem pasta)
backend/api/usuarios.ts
frontend/functions/processar-usuarios.ts
```

## 🛠️ Ativando as Regras

As regras já estão ativas! O Cursor vai:
- Sugerir a estrutura correta ao criar arquivos
- Mostrar avisos se você colocar algo no lugar errado
- Ajudar na organização do código

## 📚 Mais Informações

- Consulte os arquivos `.mdc` para regras detalhadas
- O arquivo `.cursorrules` na raiz tem as regras principais
- Use o arquivo `workspace-rules.json` como referência rápida

---

**Dica**: Se tiver dúvidas, sempre priorize manter a estrutura existente e pergunte para confirmar! 