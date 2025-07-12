# Estrutura Unificada da Tabela `api_credentials`

## Visão Geral

A tabela `api_credentials` foi consolidada para armazenar **todas** as credenciais e configurações de APIs externas do sistema, incluindo:

- **Meta** (Facebook/Instagram)
- **ContaAzul** 
- **Webhook** (Discord)
- **ContaHub**
- **Sympla**
- **Yuzer**
- **Getin**

## Estrutura da Tabela

### Campos Principais

```sql
CREATE TABLE api_credentials (
  id INTEGER PRIMARY KEY,
  bar_id INTEGER,
  sistema VARCHAR NOT NULL CHECK (sistema IN ('contahub', 'sympla', 'yuzer', 'getin', 'contaazul', 'meta', 'webhook')),
  ambiente VARCHAR DEFAULT 'producao',
  
  -- Campos genéricos para credenciais
  api_token VARCHAR,
  username VARCHAR,
  password VARCHAR,
  api_key VARCHAR,
  access_token TEXT,
  refresh_token TEXT,
  client_id VARCHAR,
  client_secret VARCHAR,
  
  -- Campos específicos OAuth
  token_type VARCHAR DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT DEFAULT 'openid profile aws.cognito.signin.user.admin',
  redirect_uri VARCHAR,
  
  -- Campos de configuração
  webhook_url VARCHAR,
  base_url VARCHAR,
  configuracoes JSONB DEFAULT '{}',
  
  -- Campos de controle
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now(),
  
  -- Campos específicos do ContaAzul
  empresa_id VARCHAR,
  empresa_nome VARCHAR,
  empresa_cnpj VARCHAR,
  oauth_state VARCHAR,
  authorization_code VARCHAR,
  last_token_refresh TIMESTAMP WITH TIME ZONE,
  token_refresh_count INTEGER DEFAULT 0
);
```

## Configurações por Sistema

### 1. Meta (Facebook/Instagram)

```json
{
  "sistema": "meta",
  "access_token": "token_facebook",
  "client_id": "app_id",
  "client_secret": "app_secret",
  "configuracoes": {
    "api_version": "v18.0",
    "page_id": "facebook_page_id",
    "page_name": "Nome da Página",
    "instagram_account_id": "instagram_id",
    "instagram_username": "username",
    "business_id": "business_id",
    "frequencia_coleta_horas": 12,
    "ultima_coleta": "2025-01-01T00:00:00Z",
    "proxima_coleta": "2025-01-01T12:00:00Z",
    "configuracoes_adicionais": {
      "permissions": [...],
      "test_results": {...},
      "real_metrics": {...}
    }
  }
}
```

### 2. Webhook (Discord)

```json
{
  "sistema": "webhook",
  "configuracoes": {
    "meta": "https://discord.com/api/webhooks/123/token",
    "sistema": "https://discord.com/api/webhooks/456/token", 
    "contahub": "https://discord.com/api/webhooks/789/token",
    "contaazul": "https://discord.com/api/webhooks/101/token",
    "checklists": "https://discord.com/api/webhooks/202/token",
    "vendas": "",
    "reservas": ""
  }
}
```

### 3. ContaAzul

```json
{
  "sistema": "contaazul",
  "access_token": "token_oauth",
  "refresh_token": "refresh_token",
  "client_id": "client_id",
  "client_secret": "client_secret",
  "empresa_id": "empresa_id",
  "empresa_nome": "Nome da Empresa",
  "empresa_cnpj": "12.345.678/0001-00",
  "configuracoes": {
    "sync_automatico": true,
    "ultima_sincronizacao": "2025-01-01T00:00:00Z",
    "configuracoes_personalizadas": {...}
  }
}
```

### 4. ContaHub

```json
{
  "sistema": "contahub",
  "api_token": "token_contahub",
  "base_url": "https://api.contahub.com",
  "configuracoes": {
    "ambiente": "producao",
    "endpoints_ativos": ["vendas", "clientes", "produtos"],
    "configuracoes_especificas": {...}
  }
}
```

## Migração das Tabelas Antigas

### Tabelas Consolidadas

1. **`meta_configuracoes`** → `api_credentials` (sistema = 'meta')
2. **`webhook_configs`** → `api_credentials` (sistema = 'webhook')

### Processo de Migração

```sql
-- 1. Migrar Meta
UPDATE api_credentials 
SET 
  access_token = mc.access_token,
  client_id = mc.app_id,
  client_secret = mc.app_secret,
  configuracoes = jsonb_build_object(
    'api_version', 'v18.0',
    'page_id', mc.page_id,
    'page_name', mc.page_name,
    'instagram_account_id', mc.instagram_account_id,
    'instagram_username', mc.instagram_username,
    'configuracoes_adicionais', mc.configuracoes_adicionais,
    'frequencia_coleta_horas', mc.frequencia_coleta_horas,
    'ultima_coleta', mc.ultima_coleta,
    'proxima_coleta', mc.proxima_coleta
  )
FROM meta_configuracoes mc
WHERE api_credentials.sistema = 'meta' 
  AND api_credentials.bar_id = mc.bar_id;

-- 2. Migrar Webhook
INSERT INTO api_credentials (bar_id, sistema, configuracoes, ativo)
SELECT 
  CAST(bar_id AS INTEGER),
  'webhook',
  configuracoes,
  true
FROM webhook_configs
WHERE bar_id ~ '^[0-9]+$';
```

## Uso nos Serviços

### MetaSocialService

```typescript
async initializeConfig(): Promise<boolean> {
  const { data, error } = await this.supabase
    .from('api_credentials')
    .select('*')
    .eq('bar_id', this.barId)
    .eq('sistema', 'meta')
    .eq('ativo', true)
    .single()

  if (error || !data) return false

  const configs = data.configuracoes || {}
  this.config = {
    access_token: data.access_token,
    app_id: data.client_id,
    app_secret: data.client_secret,
    api_version: configs.api_version || 'v18.0',
    page_id: configs.page_id,
    instagram_account_id: configs.instagram_account_id,
    business_id: configs.business_id
  }

  return true
}
```

### APIs do Meta

```typescript
// Buscar configuração
const { data: config, error } = await supabase
  .from('api_credentials')
  .select('*')
  .eq('bar_id', barId)
  .eq('sistema', 'meta')
  .single()

const configs = config.configuracoes || {}
const accessToken = config.access_token
const pageId = configs.page_id
const instagramId = configs.instagram_account_id
```

## Vantagens da Estrutura Unificada

1. **Consistência**: Todas as credenciais em um local único
2. **Flexibilidade**: Campo `configuracoes` JSONB permite estruturas específicas
3. **Manutenibilidade**: Menos tabelas para gerenciar
4. **Escalabilidade**: Fácil adicionar novos sistemas
5. **Segurança**: Controle unificado de acesso e auditoria

## Próximos Passos

1. ✅ Migrar dados das tabelas antigas
2. ✅ Atualizar todos os serviços
3. ✅ Atualizar todas as APIs
4. 🔄 Remover tabelas antigas após validação completa
5. 📚 Documentar uso para novos sistemas

## Validação

Para validar a migração, execute:

```sql
-- Verificar Meta
SELECT bar_id, sistema, access_token IS NOT NULL as has_token, 
       configuracoes->>'page_id' as page_id 
FROM api_credentials WHERE sistema = 'meta';

-- Verificar Webhook  
SELECT bar_id, sistema, configuracoes 
FROM api_credentials WHERE sistema = 'webhook';
``` 