# 🚀 CI/CD com Lint Automático - SGB_V3

## 📋 Resumo Rápido

Este projeto está configurado com um pipeline completo de CI/CD que inclui verificação automática de qualidade de código.

## ⚡ Comandos Rápidos

### **Verificação Local**
```bash
# Verificar qualidade completa
npm run quality:check

# Corrigir problemas automaticamente
npm run quality:fix

# Apenas lint
npm run lint:check

# Apenas TypeScript
npm run type-check

# Apenas formatação
npm run format:check
```

### **Pre-commit (Automático)**
```bash
# Linux/Mac
./scripts/pre-commit.sh

# Windows
.\scripts\pre-commit.ps1
```

## 🔄 Workflow Automático

### **1. Desenvolvimento**
- ✅ Lint automático antes de commits
- ✅ Verificação de tipos TypeScript
- ✅ Formatação consistente

### **2. Pull Request**
- ✅ CI/CD executa automaticamente
- ✅ Comentários com resultados
- ✅ Bloqueia merge se houver erros

### **3. Deploy**
- ✅ **Branch `develop`** → Staging
- ✅ **Branch `main`** → Production

## 📁 Arquivos de Configuração

```
.github/workflows/
├── lint.yml          # Verificação de qualidade
└── ci.yml           # Pipeline completo

scripts/
├── pre-commit.sh    # Script Linux/Mac
└── pre-commit.ps1   # Script Windows

frontend/.husky/
└── pre-commit       # Hook automático
```

## 🎯 Benefícios

- **🔍 Qualidade**: Detecção automática de problemas
- **⚡ Velocidade**: Feedback rápido em PRs
- **🛡️ Segurança**: Deploy apenas com código verificado
- **📈 Produtividade**: Menos revisões manuais

## 🚨 Troubleshooting

### **Lint falhando?**
```bash
npm run quality:fix
```

### **Build falhando?**
```bash
npm run type-check
npm run build
```

### **Formatação inconsistente?**
```bash
npm run format:fix
```

---

**📝 Documentação completa**: [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) 