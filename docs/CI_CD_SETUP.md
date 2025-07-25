# 🚀 Configuração de CI/CD com Lint Automático

## 📋 Visão Geral

Este documento explica como configurar um pipeline de CI/CD completo com verificação automática de qualidade de código para o projeto SGB_V3.

## 🏗️ Estrutura dos Workflows

### 1. **Lint Check** (`.github/workflows/lint.yml`)
- ✅ Executa ESLint, TypeScript e Prettier
- ✅ Comenta PRs com resultados
- ✅ Bloqueia merge se houver erros

### 2. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
- ✅ Quality Check (lint + testes)
- ✅ Build da aplicação
- ✅ Deploy automático (staging/production)

## 🔧 Configuração Local

### Pré-requisitos
```bash
# Instalar dependências
cd frontend
npm install

# Instalar Husky (hooks do Git)
npm install --save-dev husky
npx husky install
```

### Scripts Disponíveis

#### **Verificação Manual**
```bash
# Executar lint
npx eslint . --ext .ts,.tsx --max-warnings 0

# Verificar TypeScript
npx tsc --noEmit

# Verificar formatação
npx prettier --check .

# Executar todos os checks
npm run lint:check
```

#### **Scripts de Pre-commit**
```bash
# Linux/Mac
./scripts/pre-commit.sh

# Windows (PowerShell)
.\scripts\pre-commit.ps1
```

## 🔄 Workflow de Desenvolvimento

### 1. **Desenvolvimento Local**
```bash
# Antes de fazer commit
git add .
./scripts/pre-commit.sh  # ou .\scripts\pre-commit.ps1
git commit -m "feat: nova funcionalidade"tt
```

### 2. **Pull Request**
1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Desenvolver e testar localmente
3. Fazer commit com verificação automática
4. Criar PR no GitHub
5. CI/CD executa automaticamente
6. Merge apenas se todos os checks passarem

### 3. **Deploy Automático**
- **Branch `develop`** → Deploy para Staging
- **Branch `main`** → Deploy para Production

## 🔐 Configuração de Secrets

### GitHub Secrets Necessários
```bash
# Vercel (para deploy)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Supabase (para build)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Como Configurar
1. Ir para Settings > Secrets and variables > Actions
2. Adicionar cada secret com o valor correspondente
3. Os secrets ficam disponíveis nos workflows

## 📊 Monitoramento

### Status Checks
- ✅ **ESLint**: Verifica qualidade do código
- ✅ **TypeScript**: Verifica tipos
- ✅ **Prettier**: Verifica formatação
- ✅ **Tests**: Executa testes automatizados
- ✅ **Build**: Verifica se a aplicação compila
- ✅ **Deploy**: Deploy automático

### Relatórios
- **Coverage**: Relatório de cobertura de testes
- **Lint Results**: Comentários automáticos em PRs
- **Build Status**: Status do build e deploy

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
# Executar lint localmente
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix

# Verificar formatação
npm run format:check

# Formatar código automaticamente
npm run format:fix

# Executar testes
npm test

# Build local
npm run build
```

### CI/CD
```bash
# Verificar se o workflow está funcionando
gh workflow list

# Ver logs de um workflow
gh run list --workflow=ci.yml

# Re-executar um workflow
gh run rerun <run-id>
```

## 🚨 Troubleshooting

### Problemas Comuns

#### **1. Lint falhando no CI**
```bash
# Executar localmente para ver erros
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

#### **2. TypeScript errors**
```bash
# Verificar tipos
npx tsc --noEmit

# Verificar arquivo específico
npx tsc --noEmit src/app/example.tsx
```

#### **3. Prettier conflicts**
```bash
# Formatar automaticamente
npx prettier --write .

# Verificar formatação
npx prettier --check .
```

#### **4. Build falhando**
```bash
# Verificar build local
npm run build

# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 📈 Benefícios

### **Qualidade de Código**
- ✅ Detecção automática de problemas
- ✅ Padrões consistentes
- ✅ Prevenção de bugs

### **Produtividade**
- ✅ Feedback rápido
- ✅ Deploy automático
- ✅ Menos revisões manuais

### **Confiança**
- ✅ Build sempre testado
- ✅ Código sempre verificado
- ✅ Deploy seguro

## 🔄 Atualizações

### Adicionar Novas Regras
1. Editar `.eslintrc.js`
2. Atualizar configurações
3. Testar localmente
4. Commit e push

### Modificar Workflows
1. Editar arquivos em `.github/workflows/`
2. Testar com PR
3. Verificar logs
4. Merge quando aprovado

---

**📝 Nota**: Este setup garante que todo código que chega à produção tenha passado por verificações rigorosas de qualidade. 