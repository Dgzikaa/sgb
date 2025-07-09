# Configuração OAuth Conta Azul - Guia Completo

## Problema com URLs de Desenvolvimento

O Conta Azul não aceita URLs de redirecionamento com `localhost` ou `http://` (exceto para HTTPS) por questões de segurança. Este é um comportamento padrão em muitos provedores OAuth.

## Soluções Disponíveis

### 1. Usando Ngrok (Recomendado para Desenvolvimento)

O Ngrok cria um túnel HTTPS público para seu servidor local.

**Passos:**

1. Instale o ngrok (já instalado globalmente):
   ```bash
   npm install -g ngrok
   ```

2. Em um terminal, inicie seu servidor Next.js:
   ```bash
   npm run dev
   ```

3. Em outro terminal, inicie o ngrok:
   ```bash
   npm run dev:ngrok
   ```
   
   Ou diretamente:
   ```bash
   ngrok http 3001
   ```

4. O ngrok fornecerá uma URL como:
   ```
   https://abc123.ngrok.io
   ```

5. Use essa URL no Conta Azul:
   ```
   https://abc123.ngrok.io/contaazul-callback
   ```

### 2. Usando RedirectMeTo (Alternativa Rápida)

Se você não quiser instalar nada, pode usar o serviço RedirectMeTo:

1. No Conta Azul, configure a URL de redirecionamento como:
   ```
   https://redirectmeto.com/http://localhost:3001/contaazul-callback
   ```

2. O serviço redirecionará automaticamente para seu localhost.

### 3. Configuração para Produção

Para produção, use seu domínio real:

```
https://seudominio.com.br/contaazul-callback
```

### 4. Usando um Domínio Local (Windows)

1. Edite o arquivo `C:\Windows\System32\drivers\etc\hosts` como administrador

2. Adicione:
   ```
   127.0.0.1    dev.seudominio.local
   ```

3. Use no Conta Azul:
   ```
   https://dev.seudominio.local:3001/contaazul-callback
   ```

   **Nota:** Ainda precisará de HTTPS, então combine com mkcert para certificados locais.

## Configuração no Conta Azul

1. Acesse o [Gerenciador de Aplicações](https://developers.contaazul.com)

2. Na sua aplicação, vá em **Configurações**

3. Em **URL de Redirecionamento**, adicione:
   - Para desenvolvimento com ngrok: `https://[sua-url-ngrok].ngrok.io/contaazul-callback`
   - Para produção: `https://seudominio.com.br/contaazul-callback`

4. **Importante**: Você pode adicionar múltiplas URLs de redirecionamento

## Configuração no Código

O código já está preparado para usar a URL atual:

```typescript
// Em ContaAzulOAuth.tsx
redirectUri: `${window.location.origin}/contaazul-callback`
```

Isso automaticamente usará:
- Em desenvolvimento com ngrok: `https://abc123.ngrok.io/contaazul-callback`
- Em produção: `https://seudominio.com.br/contaazul-callback`

## Fluxo de Autenticação

1. Usuário clica em "Conectar Conta Azul"
2. É redirecionado para: `https://auth.contaazul.com/oauth2/authorize?...`
3. Após autorizar, Conta Azul redireciona para sua URL configurada
4. Seu app processa o callback em `/contaazul-callback`
5. Tokens são salvos no banco de dados

## Variáveis de Ambiente

Certifique-se de ter configurado em `.env.local`:

```env
# Para desenvolvimento
NEXT_PUBLIC_APP_URL=https://[sua-url-ngrok].ngrok.io

# Para produção
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
```

## Troubleshooting

### Erro: "URL de redirecionamento inválida"
- Verifique se a URL está exatamente igual no Conta Azul e no seu código
- URLs são case-sensitive
- Certifique-se de usar HTTPS (exceto localhost com algumas ferramentas)

### Ngrok URL muda toda vez
- Considere uma conta paga do ngrok para subdomínios fixos
- Ou atualize a URL no Conta Azul a cada sessão de desenvolvimento

### Callback não funciona
- Verifique o console do navegador para erros
- Confirme que a rota `/contaazul-callback` existe
- Verifique os logs do servidor

## Segurança

- **Nunca** commite URLs de desenvolvimento (ngrok) em produção
- Use variáveis de ambiente para URLs
- Em produção, sempre use HTTPS
- Mantenha `client_secret` apenas no servidor 