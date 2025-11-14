# 🔐 Sistema de Permissões - SGB v2

## 📋 Visão Geral

Sistema completo de controle de acesso baseado em **roles (funções)** e **módulos**, permitindo definir quem pode acessar e fazer o quê no sistema.

## 🎭 Roles (Funções) Disponíveis

### 1. **Admin** 👑
- **Acesso**: Total e irrestrito
- **Pode fazer**: Tudo no sistema
- **Casos de uso**: Donos, gerentes gerais, TI

### 2. **Producao** 👨‍🍳
- **Acesso**: Apenas produção e insumos
- **Pode fazer**:
  - ✅ Iniciar/finalizar produções
  - ✅ Visualizar receitas (sem editar)
  - ✅ Editar insumos durante produção
  - ✅ Ver relatórios de desempenho
  - ❌ **NÃO pode**: Alterar receitas, acessar financeiro, configurações
- **Casos de uso**: **Isaías**, chefs, equipe de cozinha

### 3. **Operacional** 🛠️
- **Acesso**: Operações gerais
- **Pode fazer**:
  - ✅ Produção e insumos
  - ✅ Gestão de receitas
  - ✅ Contagem de estoque
  - ✅ Relatórios operacionais
  - ❌ **NÃO pode**: Configurações avançadas, gestão de usuários
- **Casos de uso**: Supervisores, coordenadores

### 4. **Visualizador** 👀
- **Acesso**: Apenas leitura
- **Pode fazer**:
  - ✅ Ver relatórios
  - ✅ Ver dashboards
  - ✅ Ver produção (sem editar)
  - ❌ **NÃO pode**: Editar nada
- **Casos de uso**: Investidores, auditores, análise

## 📊 Matriz de Permissões

| Módulo | Admin | Producao | Operacional | Visualizador |
|--------|-------|----------|-------------|--------------|
| **Produção** | ✅✏️🗑️ | ✅✏️ | ✅✏️ | ✅ |
| **Insumos** | ✅✏️🗑️ | ✅✏️ | ✅✏️ | ✅ |
| **Receitas** | ✅✏️🗑️ | ✅ | ✅✏️ | ✅ |
| **Relatórios** | ✅✏️🗑️ | ✅ | ✅ | ✅ |
| **Configurações** | ✅✏️🗑️ | ❌ | ✅ | ❌ |
| **Usuários** | ✅✏️🗑️ | ❌ | ❌ | ❌ |
| **Financeiro** | ✅✏️🗑️ | ❌ | ✅ | ❌ |

**Legenda**: ✅ Leitura | ✏️ Escrita | 🗑️ Exclusão

## 🚀 Como Funciona

### 1. **Configuração no Banco de Dados**

```sql
-- Tabela usuarios já tem campos:
usuarios (
  role VARCHAR,                    -- 'admin', 'producao', 'operacional', 'visualizador'
  modulos_permitidos JSONB,        -- Permissões customizadas (opcional)
  nivel_acesso TEXT                -- Informações adicionais
)
```

### 2. **Criar Usuário com Acesso de Produção (Isaías)**

```sql
-- Exemplo: Criar usuário Isaías com acesso apenas a produção
INSERT INTO usuarios (
  bar_id,
  email,
  nome,
  role,
  modulos_permitidos,
  ativo
) VALUES (
  3,
  'isaias@zykor.com',
  'Isaías',
  'producao',
  '{
    "producao": {"leitura": true, "escrita": true, "exclusao": false},
    "insumos": {"leitura": true, "escrita": true, "exclusao": false},
    "receitas": {"leitura": true, "escrita": false, "exclusao": false}
  }'::jsonb,
  true
);
```

### 3. **No Frontend: Verificar Permissões**

```typescript
import { usePermissoes } from '@/middleware/checkPermissions';

function MeuComponente() {
  const { temPermissao, podeAcessarRota } = usePermissoes(
    user.role,
    user.modulos_permitidos
  );

  // Verificar se pode editar insumos
  if (temPermissao('insumos', 'escrita')) {
    // Mostrar botão de editar
  }

  // Verificar se pode acessar configurações
  if (podeAcessarRota('/configuracoes')) {
    // Mostrar menu de configurações
  }
}
```

### 4. **Rotas Permitidas por Role**

```typescript
// Admin
rotas: ['*'] // Todas as rotas

// Producao (Isaías)
rotas: [
  '/home',
  '/minha-conta',
  '/ferramentas/producao-insumos',
  '/ferramentas/terminal',
  '/relatorios/desempenho'
]

// Operacional
rotas: [
  '/home',
  '/minha-conta',
  '/operacoes',
  '/ferramentas/*',
  '/relatorios'
]

// Visualizador
rotas: [
  '/home',
  '/minha-conta',
  '/relatorios',
  '/dashboard'
]
```

## 🎯 Caso de Uso: Isaías (Produção)

### Configuração

```sql
-- 1. Criar usuário Isaías
INSERT INTO usuarios (
  bar_id,
  email,
  nome,
  role,
  ativo,
  senha_redefinida
) VALUES (
  3,
  'isaias@zykor.com',
  'Isaías',
  'producao',
  true,
  false -- Vai receber email para criar senha
);
```

### O que Isaías pode fazer:

✅ **Acessar Terminal de Produção**
- Iniciar produções
- Finalizar produções
- Preencher quantidades de insumos
- Adicionar insumos extras
- Ver receitas

✅ **Gestão de Insumos**
- Ver lista de insumos
- Editar quantidades durante produção
- Ver histórico de uso

✅ **Relatórios**
- Ver desempenho de produções
- Ver aderência às receitas
- Ver estatísticas pessoais

### O que Isaías **NÃO** pode fazer:

❌ Editar receitas (só visualizar)  
❌ Excluir insumos  
❌ Acessar configurações do sistema  
❌ Ver dados financeiros  
❌ Gerenciar outros usuários  
❌ Acessar módulos administrativos  

## 🛡️ Segurança

### Middleware de Proteção

```typescript
// No frontend - ProtectedRoute
<ProtectedRoute 
  requiredRole="producao"
  requiredModule="producao"
  requiredPermission="escrita"
>
  <TerminalProducao />
</ProtectedRoute>
```

### Validação no Backend

```typescript
// API Route
export async function POST(request: NextRequest) {
  const user = await getUser(request);
  
  if (!hasPermission(user.role, 'producao', 'escrita')) {
    return NextResponse.json(
      { error: 'Sem permissão' },
      { status: 403 }
    );
  }
  
  // Processar request...
}
```

## 📱 Interface Mobile-Friendly

### Otimizações para Tablet/Celular

✅ **Touch-friendly**: Botões grandes (min-h-12)  
✅ **Responsivo**: Grid adaptativo  
✅ **Inputs otimizados**: `inputMode="decimal"` para números  
✅ **Navegação simples**: Menu acessível  
✅ **Feedback visual**: Estados claros  

### Classes Responsivas

```tsx
// Exemplo: Inputs grandes para touch
<Input
  className="h-12 text-base"  // Maior em mobile
  inputMode="decimal"          // Teclado numérico
  type="number"
/>

// Exemplo: Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 🚀 Próximos Passos

### Para implementar acesso do Isaías:

1. **Criar usuário no banco**:
   ```sql
   INSERT INTO usuarios (email, nome, role, bar_id, ativo)
   VALUES ('isaias@zykor.com', 'Isaías', 'producao', 3, true);
   ```

2. **Enviar credenciais**:
   - Email com link de primeiro acesso
   - Isaías cria sua senha

3. **Testar acesso**:
   - Login com credenciais
   - Verificar rotas permitidas
   - Testar terminal de produção

4. **Tablet/Celular**:
   - Acessar via navegador mobile
   - Testar responsividade
   - Verificar usabilidade touch

## 📚 Referências

- **Arquivo**: `frontend/src/middleware/checkPermissions.ts`
- **API**: `frontend/src/app/api/operacional/pessoas-responsaveis/route.ts`
- **Terminal**: `frontend/src/app/ferramentas/terminal/page.tsx`
- **Banco**: Tabelas `usuarios`, `pessoas_responsaveis`

---

**Sistema**: SGB v2  
**Atualizado**: Novembro 2024  
**Responsável**: Equipe Zykor

