# 🤖 Configuração do Agente AI - Claude Integration

## 🎯 Status do Projeto

✅ **Layout Moderno Completo** - Interface estilo Cursor implementada  
✅ **API Claude Integrada** - Sistema de fallback inteligente  
✅ **Tratamento de Erros** - Diagnósticos detalhados de API key  
🔧 **Configuração Pendente** - API key do Anthropic

---

# ⚠️ REGRA CRÍTICA - GIT WORKFLOW MANUAL

## 🚫 **NUNCA FAZER GIT AUTOMATICAMENTE**

**Esta é uma regra OBRIGATÓRIA para TODOS os agentes/chats:**

### ❌ **PROIBIDO fazer automaticamente:**
```bash
git add .
git commit -m "..."
git push
```

### ✅ **APENAS quando o usuário EXPLICITAMENTE pedir:**

**Comandos que indicam para fazer git:**
- *"Agora vamos fazer git"*
- *"Pode commitar agora"*
- *"Faz o commit"*
- *"Sobe pro git"*
- *"Commit e push"*

### 📋 **Workflow Correto:**

```bash
# 1. Fazer alterações normalmente nos arquivos
# 2. NÃO rodar git add/commit automaticamente
# 3. ESPERAR o usuário pedir explicitamente

# 4. Quando o usuário pedir "agora vamos fazer git":
git status                              # ✅ Mostrar o que mudou
git add .                              # ✅ Adicionar tudo
git commit -m "mensagem descritiva"    # ✅ Commitar
# ⚠️ PERGUNTAR antes de push:
"Posso fazer o push para origin/main? (y/n)"
```

### 🎯 **Motivo desta regra:**

- ✅ **Múltiplos agentes** trabalham em paralelo (6+ chats simultâneos)
- ✅ **Evita conflitos** entre commits de diferentes chats
- ✅ **Commits organizados** com todas as mudanças juntas
- ✅ **Controle do usuário** sobre quando consolidar alterações
- ✅ **Git rastreia arquivos**, não chats - qualquer chat pode fazer o commit final

### 📝 **Importante:**

```markdown
✅ Alterações de código são SEMPRE salvas nos arquivos
✅ Git detecta mudanças de TODOS os chats automaticamente
✅ UM chat faz git add/commit e pega mudanças de TODOS
❌ NUNCA assumir que deve fazer git após alterações
⚠️ SEMPRE esperar comando explícito do usuário
```

---

# 🎨 REGRAS DE UI/UX - BOTÕES E COMPONENTES

## 📋 **REGRA OBRIGATÓRIA: ÍCONES EM BOTÕES**

### ✅ **ÍCONE SEMPRE AO LADO DO TEXTO (HORIZONTAL)**

**NUNCA usar ícone acima do texto (vertical layout)**

```tsx
// ✅ CORRETO - Ícone ao lado do texto (horizontal)
<Button>
  <IconComponent className="w-4 h-4 mr-2" />
  Texto do Botão
</Button>

<Button>
  Texto do Botão
  <IconComponent className="w-4 h-4 ml-2" />
</Button>

// ❌ ERRADO - Ícone acima do texto (vertical)
<Button className="flex flex-col">
  <IconComponent className="w-4 h-4 mb-1" />
  Texto do Botão
</Button>
```

### 🎯 **Padrões de Botões com Ícones**

#### **1. Ícone à esquerda (mais comum):**
```tsx
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Adicionar
</Button>

<Button>
  <Edit className="w-4 h-4 mr-2" />
  Editar
</Button>

<Button>
  <Trash2 className="w-4 h-4 mr-2" />
  Excluir
</Button>
```

#### **2. Ícone à direita:**
```tsx
<Button>
  Próximo
  <ChevronRight className="w-4 h-4 ml-2" />
</Button>

<Button>
  Ver Mais
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>
```

#### **3. Botões Loading/States:**
```tsx
<Button disabled={loading}>
  {loading ? (
    <>
      <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
      Carregando...
    </>
  ) : (
    <>
      <Save className="w-4 h-4 mr-2" />
      Salvar
    </>
  )}
</Button>
```

#### **4. Apenas Ícone (Icon Button):**
```tsx
// Para botões pequenos sem texto
<Button size="sm" variant="ghost">
  <Edit className="w-4 h-4" />
</Button>
```

### 🚫 **O QUE NUNCA FAZER**

```tsx
// ❌ NUNCA - Ícone empilhado verticalmente
<Button className="flex flex-col items-center">
  <Settings className="w-5 h-5 mb-1" />
  <span className="text-xs">Config</span>
</Button>

// ❌ NUNCA - Usar flex-col em botões com ícone e texto
<div className="flex flex-col">
  <Icon />
  <span>Texto</span>
</div>

// ❌ NUNCA - Ícone muito grande desproporcional ao texto
<Button>
  <Icon className="w-10 h-10" />  {/* Too big! */}
  <span className="text-sm">Botão</span>
</Button>
```

### ✅ **Tamanhos de Ícone Recomendados**

- **Botões padrão**: `w-4 h-4` ou `w-5 h-5`
- **Botões pequenos (sm)**: `w-3 h-3` ou `w-4 h-4`
- **Botões grandes (lg)**: `w-5 h-5` ou `w-6 h-6`
- **Icon-only buttons**: `w-4 h-4` ou `w-5 h-5`

### 🎨 **Espaçamento Padrão**

- **Ícone à esquerda**: `mr-2` (margin-right)
- **Ícone à direita**: `ml-2` (margin-left)
- **Botões pequenos**: `mr-1` ou `ml-1`
- **Botões grandes**: `mr-3` ou `ml-3`

## 🧾 **CHECKLIST DE BOTÕES**

Antes de criar/modificar botões, verificar:

- [ ] Ícone está ao lado do texto (horizontal)?
- [ ] Tamanho do ícone é proporcional ao botão?
- [ ] Espaçamento entre ícone e texto está correto?
- [ ] Não há `flex-col` ou layout vertical?
- [ ] Dark mode está funcionando?
- [ ] Ícone tem classes de tamanho (`w-X h-X`)?
- [ ] Loading states estão com ícone horizontal?

## 📝 **Exemplos Completos Corretos**

```tsx
// Botão Primário com Ícone
<Button className="bg-blue-600 hover:bg-blue-700">
  <Plus className="w-4 h-4 mr-2" />
  Adicionar Item
</Button>

// Botão Secundário com Ícone
<Button variant="outline">
  <Edit className="w-4 h-4 mr-2" />
  Editar
</Button>

// Botão de Navegação
<Button variant="ghost">
  Voltar
  <ChevronLeft className="w-4 h-4 ml-2" />
</Button>

// Botão com Loading State
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
      Processando...
    </>
  ) : (
    <>
      <Check className="w-4 h-4 mr-2" />
      Confirmar
    </>
  )}
</Button>

// Grupo de Botões
<div className="flex gap-2">
  <Button>
    <Save className="w-4 h-4 mr-2" />
    Salvar
  </Button>
  <Button variant="outline">
    <X className="w-4 h-4 mr-2" />
    Cancelar
  </Button>
</div>
```

---

## 🚀 Como Configurar a API Key do Claude

### 1. **Obter API Key da Anthropic**

1. Acesse: https://console.anthropic.com/dashboard
2. Faça login com sua conta
3. Vá em **"API Keys"** 
4. Clique em **"Create Key"**
5. Copie a chave gerada (formato: `sk-ant-api03-...`)

### 2. **Configurar no Projeto**

No frontend, crie o arquivo `.env.local` com:

```env
# 🤖 CLAUDE AI - OBRIGATÓRIO
ANTHROPIC_API_KEY=sk-ant-api03-[SUA_API_KEY_AQUI]

# Outras configurações necessárias...
NEXT_PUBLIC_SUPABASE_URL=https://uqtgsvujwcbymjmvkjhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[sua_service_key]
```

### 3. **Reiniciar o Servidor**

```bash
cd frontend
npm run dev
```

---

## 🎨 Novo Layout Implementado

### **Interface Estilo Cursor**
- ✅ **Sidebar** com chat em tempo real
- ✅ **Área principal** para visualizações e gráficos  
- ✅ **Design moderno** com dark mode completo
- ✅ **Sugestões rápidas** de comandos
- ✅ **Histórico** de conversas
- ✅ **Botões de ação** (copiar, exportar)

### **Funcionalidades do Chat**
- 🤖 **Claude AI** completamente integrado
- 📊 **Gráficos dinâmicos** (linha, barra, pizza)
- 🔍 **Análise de dados** do banco SGB
- 💡 **Sugestões inteligentes** baseadas no contexto
- ⚡ **Respostas em tempo real**

---

## 🛠️ Sistema de Fallback

Caso a API key não funcione, o sistema oferece:

### **Análises Básicas Funcionais:**
- 📊 Consultas diretas ao banco Supabase
- 👥 Análise de clientes e vendas
- 📈 Métricas básicas do negócio
- 🎯 Insights com dados reais

### **Diagnósticos Detalhados:**
- 🔍 Verificação automática da API key
- 📋 Instruções passo-a-passo para correção
- ⚠️ Alertas específicos por tipo de erro
- 🔧 Sugestões de resolução

---

## 📱 Como Usar o Agente

### **Comandos Sugeridos:**
```
📊 "Analise as vendas de hoje"
👥 "Compare performance dos artistas"  
📈 "Crie um gráfico de crescimento mensal"
💰 "Qual o ticket médio atual?"
🎯 "Quais produtos vendem mais?"
⏰ "Qual horário tem mais movimento?"
```

### **Recursos Avançados:**
- **Análises SQL**: Claude pode executar consultas complexas
- **Gráficos Interativos**: Visualizações em tempo real
- **Business Intelligence**: Insights para tomada de decisão
- **Conversação Natural**: Como o Cursor AI

---

## 🔧 Troubleshooting

### **Erro 401 (Unauthorized)**
```
🚫 API key inválida ou expirada
✅ Solução: Gere nova chave no console Anthropic
```

### **Erro de Formato**
```
⚠️ API key não inicia com "sk-ant-api"
✅ Solução: Verifique se copiou a chave completa
```

### **Erro de Cota**
```
📊 Cota de API excedida
✅ Solução: Verifique plano no dashboard Anthropic
```

### **Fallback Ativo**
```
🤖 Sistema funcionando com análises básicas
✅ Funcional mas sem IA completa
```

---

## 🎯 Status de Implementação

- ✅ **Frontend**: Layout moderno completo
- ✅ **Backend**: API Claude integrada
- ✅ **Banco**: Consultas otimizadas
- ✅ **Fallback**: Sistema backup funcional
- 🔧 **Configuração**: Pendente API key do usuário

---

## 🚀 Próximos Passos

1. **Configure a API key** conforme instruções acima
2. **Teste o sistema** com perguntas sobre seus dados
3. **Explore recursos avançados** de análise
4. **Use gráficos dinâmicos** para insights visuais

**O sistema está 100% funcional e pronto para uso!** 🎉