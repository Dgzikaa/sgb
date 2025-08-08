# 💳 Configuração de Pagamento Real - Sistema Fidelidade

## 🏢 Dados do Negócio
- **CNPJ**: 57.960.083/0001-88
- **Nome**: Ordinário Bar
- **Localização**: Brasília/DF
- **PIX**: 57.960.083/0001-88

## 🔧 Configuração Mercado Pago

### 1. Variáveis de Ambiente Necessárias

Adicione no arquivo `.env.local`:

```bash
# MERCADO PAGO - PRODUÇÃO
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua_public_key_aqui
MERCADO_PAGO_COLLECTOR_ID=seu_collector_id
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret

# URL DA APLICAÇÃO
NEXT_PUBLIC_APP_URL=https://seudominio.com

# DADOS DO NEGÓCIO
BUSINESS_PIX_KEY=57.960.083/0001-88
BUSINESS_NAME="Ordinário Bar"
```

### 2. Como Obter as Credenciais

#### A. Acesso ao Painel
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login com a conta do Ordinário Bar
3. Crie uma aplicação ou use existente

#### B. Credenciais Necessárias
- **Access Token**: Para fazer chamadas à API
- **Public Key**: Para checkout transparente
- **Collector ID**: Seu ID de usuário MP
- **Webhook Secret**: Para validar notificações

#### C. Configurar Webhooks
1. No painel MP, vá em "Webhooks"
2. Adicione URL: `https://seudominio.com/api/fidelidade/pagamento/webhook`
3. Eventos: `payment`, `merchant_order`

## 💰 Valores Configurados

| Item | Valor |
|------|-------|
| Mensalidade VIP | R$ 100,00 |
| Créditos Mensais | R$ 150,00 |
| Taxa PIX | 0% |
| Taxa Cartão | ~3,99% |

## 🔒 Segurança Implementada

✅ **SSL/HTTPS obrigatório**
✅ **Validação de webhook com signature**
✅ **Dados criptografados**
✅ **Logs de todas transações**
✅ **Validation de CPF/CNPJ**

## 🚀 Fluxo de Pagamento

### PIX
1. Cliente escolhe PIX
2. Sistema gera QR Code via MP
3. Cliente paga no app bancário
4. Webhook confirma pagamento
5. Créditos liberados automaticamente

### Cartão
1. Cliente escolhe cartão
2. Redirecionado para checkout MP
3. Preenche dados do cartão
4. MP processa pagamento
5. Webhook confirma aprovação
6. Créditos liberados automaticamente

## 🔄 Webhooks - URLs Configuradas

```
POST /api/fidelidade/pagamento/webhook
```

**Eventos processados:**
- `payment.created`
- `payment.updated` 
- `merchant_order.updated`

## 🧪 Teste Antes da Produção

### 1. Usar Credenciais de Teste
```bash
MERCADO_PAGO_ACCESS_TOKEN=TEST-sua_test_key_aqui
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-sua_public_test_key_aqui
```

### 2. Cartões de Teste
- **Aprovado**: 4235 6477 2802 5682
- **Recusado**: 4000 0000 0000 0002
- **CVV**: 123
- **Validade**: 12/25

### 3. PIX de Teste
- Simulado automaticamente no ambiente de teste
- QR Code gerado mas sem cobrança real

## 📊 Monitoramento

Todos pagamentos são salvos na tabela `fidelidade_pagamentos`:

```sql
SELECT 
  p.id,
  p.status,
  p.valor,
  p.metodo_pagamento,
  p.created_at,
  m.nome as cliente
FROM fidelidade_pagamentos p
JOIN fidelidade_membros m ON p.membro_id = m.id
ORDER BY p.created_at DESC;
```

## 🆘 Troubleshooting

### Erro 400: Bad Request
- Verificar se todas variáveis de ambiente estão configuradas
- Validar formato do CPF/telefone do cliente

### Erro 401: Unauthorized  
- Access Token inválido ou expirado
- Verificar se está usando credenciais corretas (TEST vs PROD)

### Erro 500: Internal Server Error
- Verificar logs do servidor
- Confirmar conectividade com Supabase

### PIX não gera QR Code
- Verificar se CNPJ está validado no MP
- Confirmar configuração do collector_id

## 📞 Suporte Mercado Pago

- **Documentação**: https://dev.mercadopago.com/
- **Suporte**: https://www.mercadopago.com.br/ajuda
- **Status API**: https://status.mercadopago.com/

---

**⚠️ IMPORTANTE**: Teste tudo em ambiente de desenvolvimento antes de ativar produção!
