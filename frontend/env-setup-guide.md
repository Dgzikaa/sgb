# 🔧 GUIA DE CONFIGURAÇÃO - ZYKOR

## ⚡ CONFIGURAÇÕES OBRIGATÓRIAS

### 1. **📝 Variáveis de Ambiente (.env.local)**

Crie o arquivo `frontend/.env.local` com essas variáveis:

```env
# =============================================================================
# 🔗 SUPABASE (JÁ CONFIGURADO)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://uqtgsvujwcbymjmvkjhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key-atual
SUPABASE_SERVICE_KEY=seu-service-key-atual

# =============================================================================
# 🤖 IA PROVIDERS (OBRIGATÓRIO - ESCOLHA UM)
# =============================================================================
# OpenAI (Recomendado)
OPENAI_API_KEY=sk-proj-sua-chave-openai-aqui

# OU Anthropic (Alternativa)
ANTHROPIC_API_KEY=sua-chave-anthropic-aqui

# =============================================================================
# 🔐 SEGURANÇA (OBRIGATÓRIO)
# =============================================================================
JWT_SECRET=zykor-jwt-super-secret-2024-muito-forte
JWT_REFRESH_SECRET=zykor-refresh-super-secret-2024-muito-forte

# =============================================================================
# 📊 MONITORAMENTO (RECOMENDADO)
# =============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://sua-dsn@sentry.io/project-id

# =============================================================================
# 🚨 ALERTAS (OPCIONAL)
# =============================================================================
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/seu-webhook
ALERT_EMAIL=rodrigo.zykor@gmail.com.br

# =============================================================================
# 🔢 APP INFO
# =============================================================================
NEXT_PUBLIC_APP_VERSION=2.0.0
```

---

## 🎯 **PRÓXIMOS PASSOS PRIORITÁRIOS**

### **PASSO 1: IA (OBRIGATÓRIO) 🤖**

Escolha **UM** destes provedores:

#### **Opção A: OpenAI (Recomendado)**
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma API Key
3. Adicione `OPENAI_API_KEY=sk-proj-...` no .env.local

#### **Opção B: Anthropic**
1. Acesse: https://console.anthropic.com/
2. Crie uma API Key  
3. Adicione `ANTHROPIC_API_KEY=...` no .env.local

### **PASSO 2: JWT Secrets (OBRIGATÓRIO) 🔐**

Gere chaves fortes:
```bash
# Execute no terminal para gerar chaves seguras:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### **PASSO 3: Sentry (RECOMENDADO) 📊**

1. Acesse: https://sentry.io/
2. Crie projeto Next.js
3. Adicione `NEXT_PUBLIC_SENTRY_DSN=...` no .env.local

### **PASSO 4: Alertas Discord (OPCIONAL) 🚨**

1. No seu Discord, vá em Configurações do Servidor
2. Integrações > Webhooks > Novo Webhook
3. Copie a URL e adicione `DISCORD_WEBHOOK_URL=...`

---

## 🧪 **TESTANDO AS FUNCIONALIDADES**

### **1. Teste da IA**
- Acesse qualquer página do sistema
- Abra o Zykor AI Assistant
- Faça uma pergunta: "Como foram as vendas hoje?"

### **2. Teste do Health Dashboard**
- Acesse: `/api/health`
- Deve retornar JSON com status dos serviços

### **3. Teste da Landing Page**
- Acesse: `/` (página inicial)
- Verifique o design ultra moderno
- Teste o formulário de contato

### **4. Teste do PWA**
- No Chrome: DevTools > Application > Service Workers
- Verifique se `sw-zykor.js` está registrado

### **5. Teste da Segurança MFA**
- Acesse área de configurações
- Configure MFA para usuário admin

---

## ⚠️ **PROBLEMAS COMUNS**

### **IA não funciona:**
- ✅ Verificar se API Key está correta
- ✅ Verificar se tem créditos na conta OpenAI/Anthropic
- ✅ Testar conexão: `/api/health`

### **JWT errors:**
- ✅ Verificar se JWT_SECRET está definido
- ✅ Logout e login novamente
- ✅ Limpar cookies do navegador

### **PWA não carrega:**
- ✅ Verificar se `sw-zykor.js` existe em `/public/`
- ✅ Hard refresh (Ctrl+Shift+R)
- ✅ Verificar console do browser

---

## 🚀 **DEPLOY EM PRODUÇÃO**

### **Vercel (Recomendado)**
1. Configure as variáveis de ambiente no painel da Vercel
2. Deploy automático via Git
3. Verifique domínio zykor.com.br

### **Supabase**
- ✅ Já configurado
- ✅ Verificar se Edge Functions estão deployadas

---

## 📋 **CHECKLIST FINAL**

- [ ] `.env.local` criado com todas as variáveis
- [ ] API Key da IA configurada (OpenAI ou Anthropic)
- [ ] JWT Secrets gerados
- [ ] Sentry configurado (opcional)
- [ ] Discord webhook configurado (opcional)
- [ ] Teste da IA funcionando
- [ ] Health check retornando status OK
- [ ] Landing page carregando corretamente
- [ ] PWA registrado no browser
- [ ] Deploy em produção realizado

---

## 🆘 **SUPORTE**

Se algo não funcionar:
1. Verifique o console do browser (F12)
2. Verifique logs do Vercel/Supabase
3. Teste `/api/health` para diagnóstico
4. Verifique se todas as variáveis estão definidas

**Tudo pronto para rodar! 🎉**
