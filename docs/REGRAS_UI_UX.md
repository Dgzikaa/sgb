# 🎨 REGRAS DE UI/UX - SGB_V2

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

## 🎨 **OUTRAS REGRAS DE UI/UX**

### **1. Consistência Visual**
- Sempre usar as classes utilitárias definidas em `globals.css`
- Manter espaçamento consistente (px-4 py-6 para containers)
- Usar grid responsivo: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`

### **2. Dark Mode Obrigatório**
- Todo componente deve ter suporte a dark mode
- Usar classes `dark:` para todas as cores
- Testar em ambos os temas antes de commit

### **3. Responsividade**
- Mobile-first approach
- Testar em diferentes tamanhos de tela
- Usar breakpoints Tailwind (sm, md, lg, xl)

### **4. Acessibilidade**
- Labels descritivos em formulários
- Alt text em imagens
- Contraste adequado de cores
- Navegação por teclado funcional

### **5. Feedback Visual**
- Loading states em ações assíncronas
- Mensagens de sucesso/erro claras
- Animações suaves e naturais
- Indicadores de progresso quando necessário

---

**IMPORTANTE**: Essas regras são **OBRIGATÓRIAS** e devem ser seguidas em 100% do desenvolvimento. Qualquer desvio deve ser discutido e aprovado antes da implementação.

