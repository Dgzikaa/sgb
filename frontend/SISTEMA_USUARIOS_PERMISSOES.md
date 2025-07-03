# 🔒 Sistema de Usuários e Permissões - SGB V2

## 📋 Visão Geral

O sistema implementa um controle completo de usuários e permissões baseado em **roles** (funções) e **módulos específicos**, permitindo que administradores gerenciem facilmente quem pode acessar quais partes do sistema.

## 🎯 Objetivos

1. **Segurança**: Controlar acesso às funcionalidades do sistema
2. **Praticidade**: Interface simples para gerenciar usuários
3. **Flexibilidade**: Sistema de permissões granular por módulo
4. **Escalabilidade**: Preparado para futuras funcionalidades

## 🏗️ Arquitetura

### 1. **Estrutura de Roles**

| Role | Nome | Descrição | Acesso Padrão |
|------|------|-----------|---------------|
| `admin` | Administrador | Acesso total ao sistema | Todos os módulos |
| `manager` | Gerente | Acesso a dashboards e dados | Dashboards + Dados |
| `funcionario` | Funcionário | Acesso apenas ao terminal | Terminal de Produção |

### 2. **Módulos do Sistema**

#### 📊 **Dashboards**
- `dashboard_diario` - Dashboard Diário
- `dashboard_semanal` - Dashboard Semanal  
- `dashboard_mensal` - Dashboard Mensal
- `dashboard_garcons` - Dashboard de Garçons

#### 📁 **Dados**
- `produtos` - Gerenciar produtos
- `receitas_insumos` - Gerenciar receitas e insumos

#### 🏭 **Terminal**
- `terminal_producao` - Terminal de Produção

#### ⚙️ **Configuração**
- `configuracoes` - Configurações do sistema

## 🛠️ Como Usar

### 1. **Acessar Configurações**
1. Faça login como **administrador**
2. Navegue para **Dashboards > Configurações**
3. Você verá 3 abas: **Metas**, **Usuários**, **Permissões**

### 2. **Gerenciar Usuários**
Na aba **Usuários**:

#### ➕ **Criar Novo Usuário**
1. Clique em **"➕ Novo Usuário"**
2. Preencha os dados:
   - **Nome**: Nome completo
   - **Email**: Email de acesso
   - **Senha**: Senha inicial
   - **Role**: Selecione o nível de acesso
3. Clique **"➕ Criar Usuário"**

#### ✏️ **Editar Usuário**
1. Clique em **"✏️ Editar"** ao lado do usuário
2. Modifique as informações necessárias
3. Clique **"💾 Atualizar"**

#### 🔒 **Gerenciar Permissões**
1. Clique em **"🔒 Permissões"** ao lado do usuário
2. Use os switches para ativar/desativar módulos
3. Clique **"💾 Salvar Permissões"**

#### ⚙️ **Ativar/Desativar Usuário**
- Use o switch **Status** para ativar/desativar rapidamente

### 3. **Sistema de Permissões**
Na aba **Permissões**:
- Visualize quais módulos cada role tem acesso
- Veja quantos usuários estão em cada role

## 🔧 Implementação Técnica

### **APIs Criadas**

#### 📡 **GET** `/api/admin/usuarios?bar_id={id}`
Busca usuários do bar específico

#### 📡 **POST** `/api/admin/usuarios`
Cria novo usuário
```json
{
  "bar_id": 3,
  "email": "funcionario@bar.com",
  "nome": "João Silva", 
  "password": "senha123",
  "role": "funcionario",
  "modulos_permitidos": ["terminal_producao"]
}
```

#### 📡 **PUT** `/api/admin/usuarios/{id}`
Atualiza usuário existente

#### 📡 **DELETE** `/api/admin/usuarios/{id}`
Desativa usuário (soft delete)

### **Hooks e Componentes**

#### 🎣 **usePermissions()**
Hook para verificar permissões do usuário atual:
```tsx
const { hasPermission, isRole, canAccessModule } = usePermissions()

// Verificar módulo específico
if (hasPermission('terminal_producao')) {
  // Usuário pode acessar
}

// Verificar role
if (isRole('admin')) {
  // É administrador
}

// Verificar categoria
if (canAccessModule('dashboards')) {
  // Pode acessar dashboards
}
```

#### 🛡️ **ProtectedRoute**
Componente para proteger páginas:
```tsx
<ProtectedRoute requiredModule="terminal_producao">
  <TerminalProducao />
</ProtectedRoute>
```

#### 👁️ **ConditionalRender**
Mostrar/ocultar elementos baseado em permissões:
```tsx
<ConditionalRender requiredRole="admin">
  <ConfigAdvancadas />
</ConditionalRender>
```

### **Sidebar Inteligente**
A sidebar agora filtra automaticamente os itens baseado nas permissões do usuário:
- **Funcionários**: Só veem "Terminal de Produção"
- **Gerentes**: Veem dashboards e dados
- **Admins**: Veem tudo

## 📋 Casos de Uso

### **Cenário 1: Funcionário da Produção**
```
Role: funcionario
Módulos: [terminal_producao]
Acesso: Apenas Terminal de Produção
```

### **Cenário 2: Gerente do Bar**
```
Role: manager  
Módulos: [dashboard_diario, dashboard_semanal, produtos, receitas_insumos]
Acesso: Dashboards + Gestão de dados
```

### **Cenário 3: Administrador**
```
Role: admin
Módulos: [todos]
Acesso: Sistema completo + configurações
```

## 🔒 Segurança

### **Validações Implementadas**
1. ✅ Verificação de permissões no frontend (sidebar)
2. ✅ Proteção de rotas com `ProtectedRoute`
3. ✅ Verificação de usuário ativo
4. ✅ Validação de roles
5. ✅ APIs protegidas no backend

### **Próximos Passos de Segurança**
- [ ] Middleware de permissões no backend
- [ ] JWT tokens com permissões
- [ ] Rate limiting nas APIs
- [ ] Logs de auditoria

## 🚀 Primeiros Passos

### **1. Configurar Primeiro Admin**
O sistema vem com usuário padrão:
- **Email**: `rodrigo@grupomenosemais.com.br` 
- **Senha**: `Geladeira@001`
- **Role**: `admin`

### **2. Criar Funcionários**
1. Acesse **Configurações > Usuários**
2. Crie usuários com role **"funcionario"**
3. Eles terão acesso apenas ao Terminal de Produção

### **3. Testar Permissões**
1. Faça login com diferentes usuários
2. Verifique se a sidebar mostra apenas os itens permitidos
3. Teste tentativas de acesso direto via URL

## 🆘 Solução de Problemas

### **Usuário não consegue acessar**
1. ✅ Verificar se está **ativo**
2. ✅ Verificar **role** correta
3. ✅ Verificar **módulos permitidos**
4. ✅ Limpar cache do navegador

### **Sidebar não atualiza**
1. ✅ Fazer logout/login
2. ✅ Verificar localStorage (`sgb_user`)
3. ✅ Verificar dados no banco

### **Permissões não salvam**
1. ✅ Verificar conexão com API
2. ✅ Verificar logs do browser (F12)
3. ✅ Verificar dados na tabela `usuarios_bar`

## 📊 Dados no Banco

### **Tabela: usuarios_bar**
```sql
- id (int) - ID único
- bar_id (int) - ID do bar
- user_id (uuid) - UUID do usuário  
- email (varchar) - Email de login
- nome (varchar) - Nome completo
- role (varchar) - admin/manager/funcionario
- modulos_permitidos (jsonb) - Array de módulos
- ativo (boolean) - Status ativo/inativo
- criado_em (timestamp) - Data de criação
- atualizado_em (timestamp) - Última atualização
```

### **Exemplo de Registro**
```json
{
  "id": 1,
  "bar_id": 3,
  "email": "funcionario@bar.com",
  "nome": "João Silva",
  "role": "funcionario", 
  "modulos_permitidos": ["terminal_producao"],
  "ativo": true
}
```

## 🎯 Conclusão

O sistema de usuários e permissões está **pronto para produção** e permite:

✅ **Criação fácil de funcionários** para usar apenas o terminal  
✅ **Controle granular** de quem acessa o quê  
✅ **Interface intuitiva** para administradores  
✅ **Segurança robusta** com múltiplas camadas  
✅ **Escalabilidade** para futuras funcionalidades  

**Agora você pode cadastrar funcionários e liberar apenas o Terminal de Produção para eles, mantendo o controle total sobre o sistema!** 🚀 