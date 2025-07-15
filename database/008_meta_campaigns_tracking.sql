-- 008_meta_campaigns_tracking.sql
-- Tabela para armazenar histórico diário de campanhas Meta
-- Permite tracking de variações de performance ao longo do tempo

-- =====================================================
-- 1. TABELA META_CAMPAIGNS_HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS meta_campaigns_history (
    id BIGSERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    
    -- Identificação da campanha
    campaign_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(500),
    ad_account_id VARCHAR(255),
    
    -- Status e configuração
    status VARCHAR(50), -- ACTIVE, PAUSED, ARCHIVED, etc.
    effective_status VARCHAR(50),
    objective VARCHAR(100), -- TRAFFIC, CONVERSIONS, REACH, etc.
    
    -- Período da campanha
    start_time TIMESTAMP WITH TIME ZONE,
    stop_time TIMESTAMP WITH TIME ZONE,
    
    -- Orçamento
    daily_budget DECIMAL(10,2),
    lifetime_budget DECIMAL(10,2),
    budget_remaining DECIMAL(10,2),
    
    -- Métricas de performance (do dia)
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4), -- Click-through rate
    cpc DECIMAL(8,4), -- Cost per click
    spend DECIMAL(10,2) DEFAULT 0,
    
    -- Conversões
    actions_count INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cost_per_conversion DECIMAL(8,4),
    
    -- Engagement
    post_engagements INTEGER DEFAULT 0,
    page_likes INTEGER DEFAULT 0,
    page_follows INTEGER DEFAULT 0,
    
    -- Metadados da coleta
    data_coleta DATE NOT NULL, -- Data que os dados se referem
    coletado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    platform VARCHAR(20) DEFAULT 'META', -- META, FACEBOOK, INSTAGRAM
    
    -- Dados brutos da API (para auditoria)
    raw_data JSONB,
    
    -- Constraints
    UNIQUE(bar_id, campaign_id, data_coleta),
    
    -- Indexes
    CONSTRAINT fk_campaigns_bar FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_bar_id ON meta_campaigns_history(bar_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_data_coleta ON meta_campaigns_history(data_coleta DESC);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_campaign_id ON meta_campaigns_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_status ON meta_campaigns_history(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_spend ON meta_campaigns_history(spend DESC) WHERE spend > 0;

-- =====================================================
-- 2. TABELA META_DAILY_SUMMARY
-- =====================================================

CREATE TABLE IF NOT EXISTS meta_daily_summary (
    id BIGSERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL,
    data_referencia DATE NOT NULL,
    
    -- Resumo Facebook
    facebook_followers INTEGER DEFAULT 0,
    facebook_posts_count INTEGER DEFAULT 0,
    facebook_total_reactions INTEGER DEFAULT 0,
    facebook_total_comments INTEGER DEFAULT 0,
    facebook_total_shares INTEGER DEFAULT 0,
    facebook_reach INTEGER DEFAULT 0,
    facebook_impressions INTEGER DEFAULT 0,
    
    -- Resumo Instagram  
    instagram_followers INTEGER DEFAULT 0,
    instagram_following INTEGER DEFAULT 0,
    instagram_posts_count INTEGER DEFAULT 0,
    instagram_total_likes INTEGER DEFAULT 0,
    instagram_total_comments INTEGER DEFAULT 0,
    instagram_total_shares INTEGER DEFAULT 0,
    instagram_reach INTEGER DEFAULT 0,
    instagram_impressions INTEGER DEFAULT 0,
    instagram_saves INTEGER DEFAULT 0,
    instagram_profile_visits INTEGER DEFAULT 0,
    instagram_website_clicks INTEGER DEFAULT 0,
    
    -- Resumo de Campanhas
    campaigns_active INTEGER DEFAULT 0,
    campaigns_total_spend DECIMAL(10,2) DEFAULT 0,
    campaigns_total_impressions INTEGER DEFAULT 0,
    campaigns_total_clicks INTEGER DEFAULT 0,
    campaigns_total_conversions INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    total_followers INTEGER GENERATED ALWAYS AS (facebook_followers + instagram_followers) STORED,
    total_engagement INTEGER GENERATED ALWAYS AS (
        facebook_total_reactions + facebook_total_comments + facebook_total_shares +
        instagram_total_likes + instagram_total_comments + instagram_total_shares
    ) STORED,
    total_reach INTEGER GENERATED ALWAYS AS (facebook_reach + instagram_reach) STORED,
    
    -- Variações em relação ao dia anterior (calculadas via trigger ou update)
    followers_change INTEGER DEFAULT 0,
    engagement_change INTEGER DEFAULT 0,
    reach_change INTEGER DEFAULT 0,
    
    -- Metadados
    coletado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, data_referencia),
    CONSTRAINT fk_daily_summary_bar FOREIGN KEY (bar_id) REFERENCES bars(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meta_daily_summary_bar_data ON meta_daily_summary(bar_id, data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_meta_daily_summary_followers ON meta_daily_summary(total_followers DESC);

-- =====================================================
-- 3. FUNÇÃO PARA CALCULAR VARIAÇÕES DIÁRIAS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_daily_variations()
RETURNS TRIGGER AS $$
DECLARE
    prev_record meta_daily_summary%ROWTYPE;
BEGIN
    -- Buscar registro do dia anterior
    SELECT * INTO prev_record
    FROM meta_daily_summary
    WHERE bar_id = NEW.bar_id 
    AND data_referencia = NEW.data_referencia - INTERVAL '1 day';
    
    -- Calcular variações se encontrou registro anterior
    IF FOUND THEN
        NEW.followers_change = NEW.total_followers - prev_record.total_followers;
        NEW.engagement_change = NEW.total_engagement - prev_record.total_engagement;
        NEW.reach_change = NEW.total_reach - prev_record.total_reach;
    END IF;
    
    -- Atualizar timestamp
    NEW.atualizado_em = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular variações automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_daily_variations ON meta_daily_summary;
CREATE TRIGGER trigger_calculate_daily_variations
    BEFORE INSERT OR UPDATE ON meta_daily_summary
    FOR EACH ROW
    EXECUTE FUNCTION calculate_daily_variations();

-- =====================================================
-- 4. VIEW PARA ANÁLISE DE TENDÊNCIAS
-- =====================================================

CREATE OR REPLACE VIEW meta_trends_analysis AS
SELECT 
    bar_id,
    data_referencia,
    total_followers,
    followers_change,
    total_engagement,
    engagement_change,
    total_reach,
    reach_change,
    campaigns_active,
    campaigns_total_spend,
    
    -- Métricas de tendência (7 dias)
    LAG(total_followers, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) AS followers_7d_ago,
    LAG(total_engagement, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) AS engagement_7d_ago,
    
    -- Crescimento semanal
    total_followers - LAG(total_followers, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) AS followers_growth_7d,
    total_engagement - LAG(total_engagement, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) AS engagement_growth_7d,
    
    -- Média móvel de 7 dias
    AVG(followers_change) OVER (PARTITION BY bar_id ORDER BY data_referencia ROWS 6 PRECEDING) AS avg_daily_followers_change,
    AVG(engagement_change) OVER (PARTITION BY bar_id ORDER BY data_referencia ROWS 6 PRECEDING) AS avg_daily_engagement_change,
    
    -- Taxa de crescimento
    CASE 
        WHEN LAG(total_followers, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) > 0 
        THEN ROUND(((total_followers::DECIMAL / LAG(total_followers, 7) OVER (PARTITION BY bar_id ORDER BY data_referencia) - 1) * 100), 2)
        ELSE 0 
    END AS growth_rate_7d_percent
    
FROM meta_daily_summary
ORDER BY bar_id, data_referencia DESC;

-- =====================================================
-- 5. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE meta_campaigns_history IS 'Histórico diário de campanhas Meta para tracking de performance';
COMMENT ON TABLE meta_daily_summary IS 'Resumo diário consolidado de todas as métricas Meta';
COMMENT ON VIEW meta_trends_analysis IS 'Análise de tendências com métricas calculadas de crescimento';

-- Exemplos de queries úteis:

-- 1. Últimas variações diárias:
-- SELECT * FROM meta_daily_summary WHERE bar_id = 3 ORDER BY data_referencia DESC LIMIT 30;

-- 2. Campanhas com melhor performance:
-- SELECT campaign_name, AVG(ctr), SUM(spend), SUM(conversions) 
-- FROM meta_campaigns_history 
-- WHERE bar_id = 3 AND data_coleta >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY campaign_id, campaign_name 
-- ORDER BY AVG(ctr) DESC;

-- 3. Tendências de crescimento:
-- SELECT * FROM meta_trends_analysis WHERE bar_id = 3 ORDER BY data_referencia DESC LIMIT 30; 