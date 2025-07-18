-- ========================================
-- 🚀 WINDSOR.AI INTEGRATION SYSTEM
-- ========================================
-- Sistema para integração com Windsor.ai
-- Armazena dados localmente para preservar histórico
-- Funciona com plano Free (30 dias) ou pago

-- ========================================
-- 📊 TABELA PRINCIPAL DE DADOS WINDSOR.AI
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_data (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- facebook_ads, instagram, google_ads, etc
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  connector VARCHAR(100) NOT NULL, -- Connector Windsor.ai usado
  raw_data JSONB NOT NULL, -- Dados brutos do Windsor.ai
  processed_data JSONB NOT NULL, -- Dados processados e normalizados
  metrics_collected TEXT[] NOT NULL, -- Array de métricas coletadas
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT windsor_data_bar_platform_date_idx UNIQUE (bar_id, platform, date_from, date_to)
);

CREATE INDEX IF NOT EXISTS idx_windsor_data_bar_id ON windsor_data(bar_id);
CREATE INDEX IF NOT EXISTS idx_windsor_data_platform ON windsor_data(platform);
CREATE INDEX IF NOT EXISTS idx_windsor_data_date_range ON windsor_data(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_windsor_data_collected_at ON windsor_data(collected_at);

-- ========================================
-- 🔄 TABELA DE WEBHOOKS WINDSOR.AI
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_webhook_data (
  id BIGSERIAL PRIMARY KEY,
  connector VARCHAR(100) NOT NULL, -- facebook_ads, instagram, etc
  event_type VARCHAR(50) NOT NULL DEFAULT 'data_update', -- Tipo de evento
  raw_payload JSONB NOT NULL, -- Payload completo do webhook
  processed_data JSONB NOT NULL, -- Dados processados
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT windsor_webhook_connector_event_idx UNIQUE (connector, event_type, received_at)
);

CREATE INDEX IF NOT EXISTS idx_windsor_webhook_connector ON windsor_webhook_data(connector);
CREATE INDEX IF NOT EXISTS idx_windsor_webhook_received_at ON windsor_webhook_data(received_at);

-- ========================================
-- ⚙️ CONFIGURAÇÕES WINDSOR.AI POR BAR
-- ========================================

-- Adicionar coluna windsor_config na tabela bars
ALTER TABLE bars ADD COLUMN IF NOT EXISTS windsor_config JSONB DEFAULT '{}';

-- Configuração padrão para Windsor.ai
UPDATE bars SET windsor_config = '{
  "enabled": false,
  "api_key": null,
  "webhook_url": null,
  "connectors": {
    "facebook_ads": {
      "enabled": false,
      "account_ids": [],
      "metrics": ["impressions", "reach", "clicks", "spend", "conversions"],
      "dimensions": ["date", "campaign_name", "adset_name"]
    },
    "instagram": {
      "enabled": false,
      "account_ids": [],
      "metrics": ["impressions", "reach", "clicks", "spend"],
      "dimensions": ["date", "campaign_name"]
    },
    "google_ads": {
      "enabled": false,
      "account_ids": [],
      "metrics": ["impressions", "clicks", "cost", "conversions"],
      "dimensions": ["date", "campaign_name"]
    }
  },
  "sync_schedule": {
    "frequency": "daily",
    "time": "09:00",
    "timezone": "America/Sao_Paulo"
  },
  "filters": {},
  "plan": "free"
}' WHERE windsor_config = '{}';

-- ========================================
-- 📈 TABELA DE MÉTRICAS CONSOLIDADAS
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_metrics_daily (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  campaign_name VARCHAR(255),
  adset_name VARCHAR(255),
  
  -- Métricas principais
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  
  -- Métricas calculadas
  ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate
  cpc DECIMAL(10,2) DEFAULT 0, -- Cost per click
  cpm DECIMAL(10,2) DEFAULT 0, -- Cost per mille
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Metadados
  data_source VARCHAR(20) DEFAULT 'windsor_ai',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT windsor_metrics_daily_unique UNIQUE (bar_id, platform, date, campaign_name, adset_name)
);

CREATE INDEX IF NOT EXISTS idx_windsor_metrics_bar_date ON windsor_metrics_daily(bar_id, date);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_platform ON windsor_metrics_daily(platform);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_campaign ON windsor_metrics_daily(campaign_name);

-- ========================================
-- 🔍 TABELA DE LOGS E MONITORAMENTO
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_logs (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, error
  event_type VARCHAR(100) NOT NULL, -- collect_start, collect_success, collect_error, webhook_received
  connector VARCHAR(100),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_windsor_logs_bar_id ON windsor_logs(bar_id);
CREATE INDEX IF NOT EXISTS idx_windsor_logs_level ON windsor_logs(level);
CREATE INDEX IF NOT EXISTS idx_windsor_logs_created_at ON windsor_logs(created_at);

-- ========================================
-- 🔄 FUNÇÃO PARA PROCESSAR DADOS WINDSOR.AI
-- ========================================

CREATE OR REPLACE FUNCTION process_windsor_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Processar dados do Windsor.ai e inserir na tabela de métricas
  INSERT INTO windsor_metrics_daily (
    bar_id,
    platform,
    date,
    campaign_name,
    adset_name,
    impressions,
    reach,
    clicks,
    spend,
    conversions,
    ctr,
    cpc,
    cpm,
    conversion_rate,
    data_source,
    last_updated
  )
  SELECT 
    (value->>'bar_id')::INTEGER,
    NEW.platform,
    (value->>'date')::DATE,
    value->>'campaign_name',
    value->>'adset_name',
    (value->>'impressions')::BIGINT,
    (value->>'reach')::BIGINT,
    (value->>'clicks')::BIGINT,
    (value->>'spend')::DECIMAL(10,2),
    (value->>'conversions')::BIGINT,
    (value->>'ctr')::DECIMAL(5,4),
    (value->>'cpc')::DECIMAL(10,2),
    (value->>'cpm')::DECIMAL(10,2),
    CASE 
      WHEN (value->>'clicks')::BIGINT > 0 THEN 
        (value->>'conversions')::BIGINT::DECIMAL / (value->>'clicks')::BIGINT::DECIMAL
      ELSE 0 
    END,
    'windsor_ai',
    NOW()
  FROM jsonb_array_elements(NEW.processed_data) AS value
  ON CONFLICT (bar_id, platform, date, campaign_name, adset_name)
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    reach = EXCLUDED.reach,
    clicks = EXCLUDED.clicks,
    spend = EXCLUDED.spend,
    conversions = EXCLUDED.conversions,
    ctr = EXCLUDED.ctr,
    cpc = EXCLUDED.cpc,
    cpm = EXCLUDED.cpm,
    conversion_rate = EXCLUDED.conversion_rate,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar dados automaticamente
DROP TRIGGER IF EXISTS trigger_process_windsor_data ON windsor_data;
CREATE TRIGGER trigger_process_windsor_data
  AFTER INSERT OR UPDATE ON windsor_data
  FOR EACH ROW
  EXECUTE FUNCTION process_windsor_data();

-- ========================================
-- 📊 VIEWS PARA ANÁLISE DE DADOS
-- ========================================

-- View para métricas consolidadas por bar
CREATE OR REPLACE VIEW windsor_metrics_summary AS
SELECT 
  b.id as bar_id,
  b.nome as bar_nome,
  wmd.platform,
  wmd.date,
  SUM(wmd.impressions) as total_impressions,
  SUM(wmd.reach) as total_reach,
  SUM(wmd.clicks) as total_clicks,
  SUM(wmd.spend) as total_spend,
  SUM(wmd.conversions) as total_conversions,
  CASE 
    WHEN SUM(wmd.impressions) > 0 THEN 
      SUM(wmd.clicks)::DECIMAL / SUM(wmd.impressions)::DECIMAL
    ELSE 0 
  END as avg_ctr,
  CASE 
    WHEN SUM(wmd.clicks) > 0 THEN 
      SUM(wmd.spend) / SUM(wmd.clicks)
    ELSE 0 
  END as avg_cpc,
  CASE 
    WHEN SUM(wmd.impressions) > 0 THEN 
      (SUM(wmd.spend) / SUM(wmd.impressions)) * 1000
    ELSE 0 
  END as avg_cpm
FROM windsor_metrics_daily wmd
JOIN bars b ON b.id = wmd.bar_id
GROUP BY b.id, b.nome, wmd.platform, wmd.date
ORDER BY wmd.date DESC, b.nome, wmd.platform;

-- View para comparação com dados Meta existentes
CREATE OR REPLACE VIEW windsor_vs_meta_comparison AS
SELECT 
  'windsor' as data_source,
  bar_id,
  platform,
  date,
  SUM(impressions) as impressions,
  SUM(reach) as reach,
  SUM(clicks) as clicks,
  SUM(spend) as spend
FROM windsor_metrics_daily
GROUP BY bar_id, platform, date

UNION ALL

SELECT 
  'meta' as data_source,
  bar_id,
  'facebook' as platform,
  data_coleta as date,
  SUM(page_impressions) as impressions,
  SUM(page_reach) as reach,
  SUM(post_clicks) as clicks,
  0 as spend -- Meta não tem spend no sistema atual
FROM facebook_daily
GROUP BY bar_id, data_coleta;

-- ========================================
-- 🔧 FUNÇÕES UTILITÁRIAS
-- ========================================

-- Função para limpar dados antigos (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_windsor_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM windsor_data 
  WHERE collected_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO windsor_logs (level, event_type, message, details)
  VALUES ('info', 'cleanup', 'Limpeza de dados antigos Windsor.ai', 
          jsonb_build_object('deleted_records', deleted_count, 'older_than_days', 90));
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar status da integração
CREATE OR REPLACE FUNCTION get_windsor_integration_status(bar_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'bar_id', bar_id_param,
    'enabled', (windsor_config->>'enabled')::BOOLEAN,
    'plan', windsor_config->>'plan',
    'last_collection', (
      SELECT MAX(collected_at) 
      FROM windsor_data 
      WHERE bar_id = bar_id_param
    ),
    'total_records', (
      SELECT COUNT(*) 
      FROM windsor_data 
      WHERE bar_id = bar_id_param
    ),
    'platforms', (
      SELECT jsonb_object_agg(platform, count)
      FROM (
        SELECT platform, COUNT(*) as count
        FROM windsor_data
        WHERE bar_id = bar_id_param
        GROUP BY platform
      ) t
    ),
    'connectors_enabled', windsor_config->'connectors'
  ) INTO result
  FROM bars
  WHERE id = bar_id_param;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📋 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE windsor_data IS 'Dados coletados via Windsor.ai - preserva histórico completo mesmo com plano Free';
COMMENT ON TABLE windsor_webhook_data IS 'Dados recebidos via webhooks Windsor.ai em tempo real';
COMMENT ON TABLE windsor_metrics_daily IS 'Métricas consolidadas diárias para análise e relatórios';
COMMENT ON TABLE windsor_logs IS 'Logs de monitoramento da integração Windsor.ai';

COMMENT ON COLUMN windsor_data.raw_data IS 'Dados brutos do Windsor.ai - preserva formato original';
COMMENT ON COLUMN windsor_data.processed_data IS 'Dados processados e normalizados para uso interno';
COMMENT ON COLUMN bars.windsor_config IS 'Configuração Windsor.ai por bar - planos, conectores, métricas';

-- ========================================
-- ✅ MIGRAÇÃO CONCLUÍDA
-- ========================================

-- Log de conclusão
INSERT INTO windsor_logs (level, event_type, message, details)
VALUES ('info', 'migration', 'Migração Windsor.ai concluída com sucesso', 
        jsonb_build_object('version', '1.0', 'tables_created', 4, 'views_created', 2)); 