-- ========================================
-- 🚀 WINDSOR.AI MULTI-ACCOUNT INTEGRATION
-- ========================================
-- Sistema para 2 contas Windsor.ai:
-- Conta 1: Menos é Mais (Standard) - 5 fontes
-- Conta 2: Ordinário + Deboche (Basic) - 3 fontes, 6 contas

-- ========================================
-- 📊 CONFIGURAÇÃO DAS CONTAS WINDSOR.AI
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_accounts (
  id SERIAL PRIMARY KEY,
  windsor_account_name VARCHAR(100) NOT NULL, -- 'menos-e-mais' ou 'ordinario-deboche'
  windsor_plan VARCHAR(20) NOT NULL, -- 'basic' ou 'standard'
  api_key VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT windsor_account_name_unique UNIQUE (windsor_account_name)
);

-- ========================================
-- 🏢 MAPEAMENTO EMPRESAS → CONTAS WINDSOR
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_company_mapping (
  id SERIAL PRIMARY KEY,
  windsor_account_id INTEGER NOT NULL REFERENCES windsor_accounts(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL, -- 'menos-e-mais', 'ordinario', 'deboche'
  bar_id INTEGER REFERENCES bars(id),
  platform VARCHAR(50) NOT NULL, -- 'facebook_ads', 'instagram', 'google_ads', 'youtube', 'twitter', 'meta_business'
  platform_account_id VARCHAR(100) NOT NULL, -- ID da conta na plataforma
  platform_account_name VARCHAR(255), -- Nome da conta na plataforma
  enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT windsor_company_platform_account_unique UNIQUE (windsor_account_id, company_name, platform, platform_account_id)
);

-- ========================================
-- 📊 DADOS COLETADOS POR CONTA WINDSOR
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_data_v2 (
  id BIGSERIAL PRIMARY KEY,
  windsor_account_id INTEGER NOT NULL REFERENCES windsor_accounts(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL,
  bar_id INTEGER REFERENCES bars(id),
  platform VARCHAR(50) NOT NULL,
  platform_account_id VARCHAR(100) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  connector VARCHAR(100) NOT NULL,
  raw_data JSONB NOT NULL,
  processed_data JSONB NOT NULL,
  metrics_collected TEXT[] NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT windsor_data_v2_unique UNIQUE (windsor_account_id, company_name, platform, platform_account_id, date_from, date_to)
);

CREATE INDEX IF NOT EXISTS idx_windsor_data_v2_account ON windsor_data_v2(windsor_account_id);
CREATE INDEX IF NOT EXISTS idx_windsor_data_v2_company ON windsor_data_v2(company_name);
CREATE INDEX IF NOT EXISTS idx_windsor_data_v2_platform ON windsor_data_v2(platform);
CREATE INDEX IF NOT EXISTS idx_windsor_data_v2_date_range ON windsor_data_v2(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_windsor_data_v2_collected_at ON windsor_data_v2(collected_at);

-- ========================================
-- 📈 MÉTRICAS CONSOLIDADAS MULTI-EMPRESA
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_metrics_daily_v2 (
  id BIGSERIAL PRIMARY KEY,
  windsor_account_id INTEGER NOT NULL REFERENCES windsor_accounts(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL,
  bar_id INTEGER REFERENCES bars(id),
  platform VARCHAR(50) NOT NULL,
  platform_account_id VARCHAR(100) NOT NULL,
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
  ctr DECIMAL(5,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Metadados
  data_source VARCHAR(20) DEFAULT 'windsor_ai',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT windsor_metrics_daily_v2_unique UNIQUE (windsor_account_id, company_name, platform, platform_account_id, date, campaign_name, adset_name)
);

CREATE INDEX IF NOT EXISTS idx_windsor_metrics_v2_account ON windsor_metrics_daily_v2(windsor_account_id);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_v2_company ON windsor_metrics_daily_v2(company_name);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_v2_date ON windsor_metrics_daily_v2(date);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_v2_platform ON windsor_metrics_daily_v2(platform);

-- ========================================
-- 🔍 LOGS E MONITORAMENTO MULTI-CONTA
-- ========================================

CREATE TABLE IF NOT EXISTS windsor_logs_v2 (
  id BIGSERIAL PRIMARY KEY,
  windsor_account_id INTEGER REFERENCES windsor_accounts(id) ON DELETE CASCADE,
  company_name VARCHAR(100),
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  event_type VARCHAR(100) NOT NULL,
  platform VARCHAR(50),
  platform_account_id VARCHAR(100),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_windsor_logs_v2_account ON windsor_logs_v2(windsor_account_id);
CREATE INDEX IF NOT EXISTS idx_windsor_logs_v2_company ON windsor_logs_v2(company_name);
CREATE INDEX IF NOT EXISTS idx_windsor_logs_v2_level ON windsor_logs_v2(level);
CREATE INDEX IF NOT EXISTS idx_windsor_logs_v2_created_at ON windsor_logs_v2(created_at);

-- ========================================
-- 🔄 FUNÇÃO PARA PROCESSAR DADOS MULTI-CONTA
-- ========================================

CREATE OR REPLACE FUNCTION process_windsor_data_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Processar dados do Windsor.ai e inserir na tabela de métricas
  INSERT INTO windsor_metrics_daily_v2 (
    windsor_account_id,
    company_name,
    bar_id,
    platform,
    platform_account_id,
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
    NEW.windsor_account_id,
    NEW.company_name,
    (value->>'bar_id')::INTEGER,
    NEW.platform,
    NEW.platform_account_id,
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
  ON CONFLICT (windsor_account_id, company_name, platform, platform_account_id, date, campaign_name, adset_name)
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
DROP TRIGGER IF EXISTS trigger_process_windsor_data_v2 ON windsor_data_v2;
CREATE TRIGGER trigger_process_windsor_data_v2
  AFTER INSERT OR UPDATE ON windsor_data_v2
  FOR EACH ROW
  EXECUTE FUNCTION process_windsor_data_v2();

-- ========================================
-- 📊 VIEWS PARA ANÁLISE MULTI-EMPRESA
-- ========================================

-- View para métricas consolidadas por empresa
CREATE OR REPLACE VIEW windsor_metrics_summary_v2 AS
SELECT 
  wa.windsor_account_name,
  wmd.company_name,
  b.nome as bar_nome,
  wmd.platform,
  wmd.platform_account_id,
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
FROM windsor_metrics_daily_v2 wmd
JOIN windsor_accounts wa ON wa.id = wmd.windsor_account_id
LEFT JOIN bars b ON b.id = wmd.bar_id
GROUP BY wa.windsor_account_name, wmd.company_name, b.nome, wmd.platform, wmd.platform_account_id, wmd.date
ORDER BY wmd.date DESC, wmd.company_name, wmd.platform;

-- View para status das integrações
CREATE OR REPLACE VIEW windsor_integration_status_v2 AS
SELECT 
  wa.windsor_account_name,
  wa.windsor_plan,
  wa.enabled as account_enabled,
  wcm.company_name,
  wcm.platform,
  wcm.platform_account_name,
  wcm.enabled as mapping_enabled,
  wcm.last_sync_at,
  COUNT(wd.id) as total_records,
  MAX(wd.collected_at) as last_collection
FROM windsor_accounts wa
LEFT JOIN windsor_company_mapping wcm ON wcm.windsor_account_id = wa.id
LEFT JOIN windsor_data_v2 wd ON wd.windsor_account_id = wa.id 
  AND wd.company_name = wcm.company_name 
  AND wd.platform = wcm.platform
GROUP BY wa.id, wa.windsor_account_name, wa.windsor_plan, wa.enabled, 
         wcm.company_name, wcm.platform, wcm.platform_account_name, wcm.enabled, wcm.last_sync_at
ORDER BY wa.windsor_account_name, wcm.company_name, wcm.platform;

-- ========================================
-- 🔧 FUNÇÕES UTILITÁRIAS MULTI-CONTA
-- ========================================

-- Função para verificar status da integração por empresa
CREATE OR REPLACE FUNCTION get_windsor_integration_status_v2(company_name_param VARCHAR(100))
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company_name', company_name_param,
    'accounts', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'windsor_account_name', wa.windsor_account_name,
          'plan', wa.windsor_plan,
          'enabled', wa.enabled,
          'platforms', (
            SELECT jsonb_object_agg(wcm.platform, jsonb_build_object(
              'account_name', wcm.platform_account_name,
              'enabled', wcm.enabled,
              'last_sync', wcm.last_sync_at,
              'total_records', COUNT(wd.id)
            ))
            FROM windsor_company_mapping wcm
            LEFT JOIN windsor_data_v2 wd ON wd.windsor_account_id = wa.id 
              AND wd.company_name = wcm.company_name 
              AND wd.platform = wcm.platform
            WHERE wcm.windsor_account_id = wa.id 
              AND wcm.company_name = company_name_param
            GROUP BY wcm.platform, wcm.platform_account_name, wcm.enabled, wcm.last_sync_at
          )
        )
      )
      FROM windsor_accounts wa
      WHERE EXISTS (
        SELECT 1 FROM windsor_company_mapping wcm 
        WHERE wcm.windsor_account_id = wa.id 
          AND wcm.company_name = company_name_param
      )
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados antigos por conta
CREATE OR REPLACE FUNCTION cleanup_old_windsor_data_v2(windsor_account_id_param INTEGER, days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM windsor_data_v2 
  WHERE windsor_account_id = windsor_account_id_param
    AND collected_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO windsor_logs_v2 (windsor_account_id, level, event_type, message, details)
  VALUES (windsor_account_id_param, 'info', 'cleanup', 'Limpeza de dados antigos Windsor.ai', 
          jsonb_build_object('deleted_records', deleted_count, 'older_than_days', days_to_keep));
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📋 DADOS INICIAIS DE CONFIGURAÇÃO
-- ========================================

-- Inserir configuração das contas Windsor.ai
INSERT INTO windsor_accounts (windsor_account_name, windsor_plan, api_key, enabled) VALUES
('menos-e-mais', 'standard', 'YOUR_WINDSOR_STANDARD_API_KEY', true),
('ordinario-deboche', 'basic', 'YOUR_WINDSOR_BASIC_API_KEY', true)
ON CONFLICT (windsor_account_name) DO NOTHING;

-- ========================================
-- 📋 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

/*
SISTEMA WINDSOR.AI MULTI-ACCOUNT

ESTRUTURA:
- 2 contas Windsor.ai
- Conta 1: Menos é Mais (Standard) - 5 fontes
- Conta 2: Ordinário + Deboche (Basic) - 3 fontes, 6 contas

CUSTO TOTAL: $118/mês ($99 + $19)

CONFIGURAÇÃO:
1. Criar 2 contas Windsor.ai
2. Configurar API keys nas variáveis de ambiente
3. Mapear empresas e plataformas
4. Configurar coleta automática

USO:
- Dados salvos localmente para histórico completo
- Integração com sistema existente
- Suporte a múltiplas empresas
- Monitoramento centralizado
*/ 