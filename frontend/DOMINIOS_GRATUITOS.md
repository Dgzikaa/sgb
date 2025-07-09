# Opções de Domínios Gratuitos para OAuth

## 1. Netlify (Recomendado) ✅
- **URL**: `https://seu-app.netlify.app`
- **Vantagens**: 
  - Deploy automático do GitHub
  - HTTPS grátis
  - URL fixa e profissional
  - Aceito pela maioria dos serviços OAuth

### Como configurar:
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod
```

## 2. GitHub Pages
- **URL**: `https://seu-usuario.github.io/nome-repo`
- **Vantagens**: 
  - Integrado com GitHub
  - HTTPS grátis
  - Confiável

### Como configurar:
1. Crie um repositório no GitHub
2. Ative GitHub Pages nas configurações
3. Use GitHub Actions para deploy automático

## 3. Render.com
- **URL**: `https://seu-app.onrender.com`
- **Vantagens**:
  - Deploy automático
  - HTTPS grátis
  - Suporta backend também

## 4. Railway.app
- **URL**: `https://seu-app.up.railway.app`
- **Vantagens**:
  - Deploy fácil
  - HTTPS grátis
  - $5 grátis por mês

## 5. Surge.sh
- **URL**: `https://seu-app.surge.sh`
- **Vantagens**:
  - Deploy super rápido
  - Linha de comando simples

### Como configurar:
```bash
npm install -g surge
cd frontend/out
surge
```

## 6. Cloudflare Pages
- **URL**: `https://seu-app.pages.dev`
- **Vantagens**:
  - Performance excelente
  - HTTPS grátis
  - Analytics incluído

## 7. Domínios Gratuitos (com limitações)
- **Freenom**: `.tk`, `.ml`, `.ga`, `.cf`
- **DuckDNS**: Subdomínios `.duckdns.org`
- **No-IP**: Subdomínios gratuitos

## ⚠️ Importante para OAuth
Alguns serviços OAuth (como Conta Azul) podem ter restrições sobre quais domínios aceitam. Geralmente:
- ✅ Netlify, Vercel, GitHub Pages = Aceitos
- ⚠️ Domínios gratuitos (.tk, .ml) = Podem ser rejeitados
- ❌ IPs diretos = Geralmente rejeitados 