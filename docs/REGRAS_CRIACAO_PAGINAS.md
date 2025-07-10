# 🚨 REGRAS OBRIGATÓRIAS - CRIAÇÃO DE PÁGINAS SGB_V2

## ⚠️ **ATENÇÃO: LEIA ANTES DE CRIAR QUALQUER PÁGINA**

**NUNCA MAIS** criar páginas sem seguir essas regras. Todo problema de layout/sidebar surge por não seguir este processo.

---

## 📋 **CHECKLIST OBRIGATÓRIO**

### ✅ **ANTES DE CRIAR QUALQUER PÁGINA:**

```
1. [ ] Vou criar layout.tsx na pasta da página?
2. [ ] O layout vai usar DarkSidebarLayout?
3. [ ] A página vai usar Card components?
4. [ ] Inclui header com título e descrição?
5. [ ] Inclui sistema de mensagens de feedback?
6. [ ] Usa loading states?
7. [ ] Segue estrutura de pastas correta?
8. [ ] Vou testar se sidebar/header/footer aparecem?
```

**❌ SE ALGUM ITEM NÃO ESTIVER MARCADO, NÃO CRIAR A PÁGINA!**

---

## 🛠️ **PROCESSO OBRIGATÓRIO**

### **PASSO 1: Criar Layout**
```tsx
// frontend/src/app/minha-secao/layout.tsx
import { DarkSidebarLayout } from '@/components/layouts'

export default function MinhaSecaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
}
```

### **PASSO 2: Criar Página**
```tsx
// frontend/src/app/minha-secao/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// ... outros imports

export default function MinhaSecaoPage() {
  return (
    <div className="space-y-6">
      {/* Header obrigatório */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Título</h1>
        <p className="text-gray-600">Descrição</p>
      </div>

      {/* Cards obrigatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Seção</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Conteúdo */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🚫 **ERROS COMUNS (NÃO FAZER)**

### ❌ **ERRO 1: Não criar layout.tsx**
```
❌ ERRADO:
frontend/src/app/minha-pagina/page.tsx (só a página)

✅ CORRETO:
frontend/src/app/minha-pagina/layout.tsx (layout)
frontend/src/app/minha-pagina/page.tsx (página)
```

### ❌ **ERRO 2: Usar PageBase na página**
```tsx
❌ ERRADO:
return (
  <PageBase>  // ← Não usar na página!
    <PageContent>
      ...
    </PageContent>
  </PageBase>
)

✅ CORRETO:
return (
  <div className="space-y-6">  // ← Usar div simples
    ...
  </div>
)
```

### ❌ **ERRO 3: Não usar Card components**
```tsx
❌ ERRADO:
<div className="bg-white p-4 rounded">
  ...
</div>

✅ CORRETO:
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    ...
  </CardContent>
</Card>
```

---

## 🎯 **TEMPLATE DE REFERÊNCIA**

Use sempre: `frontend/src/templates/page-template.tsx`

**COPIE E COLE** este template para criar novas páginas!

---

## 🔍 **VALIDAÇÃO AUTOMÁTICA**

### **Como verificar se está correto:**

1. **Página tem sidebar?** ✅ Sim → Correto
2. **Página tem header/footer?** ✅ Sim → Correto  
3. **Página sem sidebar?** ❌ Não → **ERRO! Falta layout.tsx**

### **Teste rápido:**
```bash
# A página deve aparecer COM sidebar
# Se aparecer sem sidebar = ERRO
```

---

## 📁 **ESTRUTURA OBRIGATÓRIA**

```
frontend/src/app/
├── minha-secao/
│   ├── layout.tsx        ← OBRIGATÓRIO!
│   ├── page.tsx          ← Página principal
│   ├── subsecao/
│   │   └── page.tsx      ← Herda layout da pasta pai
│   └── outra-subsecao/
│       ├── layout.tsx    ← Se precisar layout específico
│       └── page.tsx
```

---

## 🚨 **CONSEQUÊNCIAS DE NÃO SEGUIR**

1. **Página sem sidebar** → Usuário perdido
2. **Página sem header/footer** → Inconsistência visual
3. **Página quebrada** → Experiência ruim
4. **Perda de tempo** → Ter que refazer tudo

---

## ✅ **PÁGINAS QUE SEGUEM AS REGRAS (EXEMPLOS)**

- ✅ `/configuracoes` - Tem layout.tsx + DarkSidebarLayout
- ✅ `/admin` - Tem layout.tsx + DarkSidebarLayout  
- ✅ `/operacoes` - Tem layout.tsx + DarkSidebarLayout
- ✅ `/relatorios` - Tem layout.tsx + DarkSidebarLayout

## ❌ **PÁGINAS QUE ESTAVAM ERRADAS (CORRIGIDAS)**

- ❌→✅ `/minha-conta` - **CORRIGIDO:** Adicionado layout.tsx

---

## 🛡️ **GARANTIA DE QUALIDADE**

**SEMPRE** perguntar antes de criar página:

1. **"Onde vou criar o layout.tsx?"**
2. **"A página vai usar Card components?"**
3. **"Como vou testar se tem sidebar?"**

---

## 📞 **QUANDO EM DÚVIDA**

**SEMPRE** consultar:
- `frontend/src/templates/page-template.tsx`
- `frontend/src/app/configuracoes/` (exemplo funcionando)
- Esta documentação

**NUNCA** criar página sem confirmar estrutura!

---

**🎯 RESULTADO FINAL: TODAS AS PÁGINAS COM SIDEBAR, HEADER E FOOTER FUNCIONANDO!** 