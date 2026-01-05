# 🔌 Configuração do Pluggy (Open Finance)

## 📋 Passo a Passo

### 1. Criar conta no Pluggy

1. Acesse: https://dashboard.pluggy.ai/
2. Clique em "Sign Up" (Criar conta)
3. Preencha seus dados e confirme email

### 2. Criar uma Application

1. No dashboard do Pluggy, vá em "Applications"
2. Clique em "Create Application"
3. Nome: "Zykor FP" (ou o que preferir)
4. Ambiente: Comece com **Sandbox** (teste grátis)

### 3. Obter Credenciais

1. Após criar a application, você verá:
   - **Client ID** (ex: `abc123...`)
   - **Client Secret** (ex: `xyz789...`)
2. **IMPORTANTE**: Copie e guarde o Client Secret (só aparece uma vez!)

### 4. Configurar no Zykor

Adicione as variáveis no arquivo `.env.local`:

```env
# Pluggy (Open Finance)
PLUGGY_CLIENT_ID=seu_client_id_aqui
PLUGGY_CLIENT_SECRET=seu_client_secret_aqui
```

### 5. Testar

1. Reinicie o servidor Next.js
2. Acesse `/fp/pluggy`
3. Clique em "Conectar Banco"
4. Escolha um banco e conecte!

---

## 💰 Planos e Preços

### **Sandbox (Desenvolvimento)**
- ✅ **Grátis**
- ✅ Todos os bancos
- ✅ Dados de teste
- ⚠️ Não funciona com contas reais

### **Production Free**
- ✅ **100 requisições/mês GRÁTIS**
- ✅ Dados reais
- ✅ Ideal para uso pessoal
- Conectar 1 conta + sincronizar 1x/dia = ~30 req/mês

### **Starter (R$ 199/mês)**
- 1.000 requisições/mês
- Suporte prioritário

---

## 🏦 Bancos Suportados

✅ Nubank
✅ Bradesco
✅ Itaú
✅ Banco do Brasil
✅ Caixa Econômica
✅ Santander
✅ Inter
✅ C6 Bank
✅ Next
✅ Original
✅ E mais de 200 instituições!

---

## 🔐 Segurança

- ✅ Suas credenciais são criptografadas pelo Pluggy
- ✅ Nunca armazenamos suas senhas
- ✅ Conexão via Open Finance (regulamentado pelo Banco Central)
- ✅ Você pode desconectar a qualquer momento

---

## 📚 Documentação Oficial

- Dashboard: https://dashboard.pluggy.ai/
- Docs: https://docs.pluggy.ai/
- Status: https://status.pluggy.ai/
- Suporte: support@pluggy.ai

---

## 🚀 Ativação

Para começar a usar o Pluggy no Zykor:

1. Configure as variáveis de ambiente (.env.local)
2. Reinicie o servidor: `npm run dev`
3. Acesse: http://localhost:3000/fp/pluggy
4. Conecte seu primeiro banco!

---

## ⚠️ Troubleshooting

### Erro: "Credenciais Pluggy não configuradas"
- Verifique se adicionou PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no .env.local
- Reinicie o servidor Next.js

### Erro: "Erro na autenticação Pluggy"
- Verifique se as credenciais estão corretas
- Certifique-se de que está usando o ambiente correto (Sandbox vs Production)

### Erro: "Erro ao conectar banco"
- Em Sandbox, use credenciais de teste fornecidas pelo Pluggy
- Em Production, use suas credenciais reais do banco
- Alguns bancos podem exigir autenticação de 2 fatores

---

## 📧 Contato

Dúvidas sobre o Pluggy:
- Email: support@pluggy.ai
- Discord: https://discord.gg/pluggy

Dúvidas sobre a integração no Zykor:
- Consulte a documentação do projeto
