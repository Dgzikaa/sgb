# Configurar Domínio Próprio no Vercel

## 1. No Vercel:
1. Acesse: https://vercel.com/dashboard
2. Clique no projeto `sgbv2`
3. Vá em "Settings" > "Domains"
4. Adicione seu domínio (ex: `app.seudominio.com.br`)

## 2. No seu provedor de DNS:
Adicione um registro CNAME:
- Nome: `app` (ou o subdomínio que escolher)
- Valor: `cname.vercel-dns.com`

## 3. Aguarde propagação DNS (até 48h)

## 4. Configure no código:
- Redirect URI: `https://app.seudominio.com.br/contaazul-callback` 