# 🔧 Environment Variables - Sistema Meta Marketing

Este documento lista todas as environment variables necessárias para o funcionamento completo do sistema de Marketing 360° com integração Meta API.

## 📱 Meta API Configuration

```bash
# Token de acesso Meta API (long-lived) - válido até setembro 2025
META_ACCESS_TOKEN=EAAKMWfvNNX0BPFK3LYnPW8j06ZCZB0AFiUeED5i3PowBIgTeZBEC1jp8q3rWAeVbjFJ8rjBgmB5P7KMfHOeQQTXXikP87wJhoOM7BYqKjZANZBmDAmvMA8ys17JBv1kfmebjiE9rfv2EDe4G7DgjMZAZBpG9yhWUhBz5bNDZCc1wI8uZAnQCy7GCM7198QghIoAQ8tJCeKVobVdWG1sYl

# Configurações da aplicação Facebook
META_APP_ID=your_facebook_app_id_here
META_APP_SECRET=your_facebook_app_secret_here

# IDs específicos do Ordinário Bar
META_PAGE_ID=707425499121505
META_BUSINESS_ID=2164664530223231
META_INSTAGRAM_ACCOUNT_ID=to_be_configured_when_available
```

## 🔔 Discord Webhooks

```bash
# Webhook específico para notificações de marketing
DISCORD_MARKETING_WEBHOOK_URL=https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75

# Webhook principal do sistema (se houver)
DISCORD_WEBHOOK_URL=your_main_discord_webhook_here
```

## 🚀 Automation & Cron

```bash
# Token para proteger endpoints de automação
AUTOMATION_TOKEN=sgb-meta-cron-2025

# Configurações de coleta automática
META_COLLECTION_FREQUENCY=6  # horas
META_AUTO_COLLECTION_ENABLED=true
META_API_RATE_LIMIT=200
```

## 💾 Backup & Storage

```bash
# Configurações de backup
BACKUP_BUCKET_NAME=backups
BACKUP_FREQUENCY_DAYS=7
BACKUP_RETENTION_DAYS=30
METRICS_RETENTION_DAYS=90
```

## 🎯 Milestones & Notifications

```bash
# Habilitar sistema de marcos importantes
MILESTONES_ENABLED=true

# Metas para notificações automáticas
MILESTONE_FOLLOWER_TARGETS=1000,5000,10000
MILESTONE_ENGAGEMENT_TARGETS=5.0,10.0,15.0
MILESTONE_REACH_TARGETS=10000,50000,100000
```

## 🏢 Bar Configuration

```bash
# Configurações específicas do Ordinário Bar
DEFAULT_BAR_ID=3
BAR_NAME=Ordinário Bar
DEFAULT_TIMEZONE=America/Sao_Paulo
```

## 📊 Dashboard & Analytics

```bash
# Configurações de performance e cache
METRICS_CACHE_ENABLED=true
METRICS_CACHE_TTL=300  # segundos
MAX_CHART_DATA_POINTS=100
AI_INSIGHTS_ENABLED=true
```

## 🔒 Security

```bash
# Configurações de segurança
JWT_SECRET=your_jwt_secret_here
ADMIN_PASSWORD=your_admin_password_here
```

## 🚀 Deployment

```bash
# Configurações de ambiente
NODE_ENV=production  # ou development
NEXT_PUBLIC_APP_URL=https://sgb-v2.vercel.app
DEBUG_ENABLED=false  # true em desenvolvimento
```

## 📈 Monitoring

```bash
# Monitoramento e alertas
PERFORMANCE_MONITORING=true
ERROR_WEBHOOK_URL=your_error_webhook_here
```

---

## 🔧 Como Configurar

### 1. **Desenvolvimento Local**
Crie um arquivo `.env.local` na raiz do projeto com as variáveis necessárias:

```bash
cp .env.example .env.local
# Edite .env.local com seus valores
```

### 2. **Produção (Vercel)**
Configure as environment variables no painel do Vercel:

1. Acesse seu projeto no Vercel Dashboard
2. Vá em Settings > Environment Variables
3. Adicione cada variável listada acima
4. Redeploy o projeto

### 3. **Banco de Dados (Supabase)**
Execute os scripts SQL na ordem correta:

```sql
-- 1. Executar migrations básicas
001_create_all_tables.sql
004_whatsapp_business_system.sql

-- 2. Executar sistema Meta
007_meta_automation_system.sql

-- 3. Configurar pgcron (se disponível)
SELECT cron.schedule('meta_coleta_automatica_6h', '0 0,6,12,18 * * *', 'SELECT executar_coleta_meta_automatica_com_discord();');
```

---

## ⚡ Configuração Rápida

Para começar rapidamente, use estes valores mínimos:

```bash
# Essenciais
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Meta API (token fornecido)
META_ACCESS_TOKEN=EAAKMWfvNNX0BPFK3LYnPW8j06ZCZB0AFiUeED5i3PowBIgTeZBEC1jp8q3rWAeVbjFJ8rjBgmB5P7KMfHOeQQTXXikP87wJhoOM7BYqKjZANZBmDAmvMA8ys17JBv1kfmebjiE9rfv2EDe4G7DgjMZAZBpG9yhWUhBz5bNDZCc1wI8uZAnQCy7GCM7198QghIoAQ8tJCeKVobVdWG1sYl

# Discord Marketing
DISCORD_MARKETING_WEBHOOK_URL=https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75

# Automação
AUTOMATION_TOKEN=sgb-meta-cron-2025
DEFAULT_BAR_ID=3
```

---

## 🔍 Verificação

Para verificar se as variáveis estão configuradas corretamente:

1. **Via API**: `GET /api/admin/meta-config?action=test`
2. **Via Discord**: `POST /api/meta/test-marketing`
3. **Via Automação**: `GET /api/admin/meta-automation`

---

## 📞 Suporte

- **Token Meta**: Expira em setembro 2025
- **Discord Webhook**: Configurado e testado
- **Automação**: Executará a cada 6 horas quando ativada
- **Backup**: Automático via pgcron (se configurado) 