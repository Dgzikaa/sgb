-- ========================================
-- 📱 META SOCIAL METRICS SYSTEM
-- Sistema completo para métricas do Facebook/Instagram
-- Integrado com ai_metrics e sistema de relatórios existente
-- ========================================

-- ========================================
-- 🔧 CONFIGURAÇÕES DA API META
-- ========================================
CREATE TABLE meta_configuracoes (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Configurações da API
    access_token TEXT NOT NULL,
    app_id VARCHAR(50) NOT NULL,
    app_secret VARCHAR(100) NOT NULL,
    
    -- IDs das contas conectadas
    facebook_page_id VARCHAR(50),
    instagram_account_id VARCHAR(50),
    
    -- Status e controles
    ativo BOOLEAN DEFAULT false,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    
    -- Configurações de coleta
    coleta_automatica BOOLEAN DEFAULT true,
    frequencia_coleta_horas INTEGER DEFAULT 6, -- A cada 6 horas
    horario_coleta_preferido TIME DEFAULT '09:00',
    
    -- Configurações de retenção
    dias_retencao_dados INTEGER DEFAULT 365,
    
    -- Controle de rate limiting
    rate_limit_per_hour INTEGER DEFAULT 200,
    ultima_coleta TIMESTAMP WITH TIME ZONE,
    proxima_coleta TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    
    -- Índices únicos
    UNIQUE(bar_id)
);

-- ========================================
-- 📊 MÉTRICAS DO FACEBOOK
-- ========================================
CREATE TABLE facebook_metrics (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Período das métricas
    data_referencia DATE NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    
    -- Métricas da página
    page_impressions INTEGER DEFAULT 0,
    page_reach INTEGER DEFAULT 0,
    page_engaged_users INTEGER DEFAULT 0,
    page_fans INTEGER DEFAULT 0,
    page_fan_adds INTEGER DEFAULT 0,
    page_fan_removes INTEGER DEFAULT 0,
    
    -- Métricas de posts
    post_impressions INTEGER DEFAULT 0,
    post_reach INTEGER DEFAULT 0,
    post_likes INTEGER DEFAULT 0,
    post_comments INTEGER DEFAULT 0,
    post_shares INTEGER DEFAULT 0,
    post_clicks INTEGER DEFAULT 0,
    
    -- Métricas de engajamento
    page_actions_post_reactions_total INTEGER DEFAULT 0,
    page_negative_feedback INTEGER DEFAULT 0,
    page_positive_feedback INTEGER DEFAULT 0,
    
    -- Métricas de vídeo
    page_video_views INTEGER DEFAULT 0,
    page_video_complete_views INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    engagement_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN page_reach > 0 
        THEN ((post_likes + post_comments + post_shares)::DECIMAL / page_reach * 100)
        ELSE 0 END
    ) STORED,
    
    reach_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN page_impressions > 0 
        THEN (page_reach::DECIMAL / page_impressions * 100)
        ELSE 0 END
    ) STORED,
    
    -- Dados brutos da API preservados
    raw_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, data_referencia, periodo)
);

-- ========================================
-- 📸 MÉTRICAS DO INSTAGRAM
-- ========================================
CREATE TABLE instagram_metrics (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Período das métricas
    data_referencia DATE NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    
    -- Métricas da conta
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    
    -- Métricas de posts
    posts_impressions INTEGER DEFAULT 0,
    posts_reach INTEGER DEFAULT 0,
    posts_likes INTEGER DEFAULT 0,
    posts_comments INTEGER DEFAULT 0,
    posts_saves INTEGER DEFAULT 0,
    posts_shares INTEGER DEFAULT 0,
    
    -- Métricas de stories
    stories_impressions INTEGER DEFAULT 0,
    stories_reach INTEGER DEFAULT 0,
    stories_replies INTEGER DEFAULT 0,
    stories_exits INTEGER DEFAULT 0,
    
    -- Métricas de reels
    reels_plays INTEGER DEFAULT 0,
    reels_reach INTEGER DEFAULT 0,
    reels_likes INTEGER DEFAULT 0,
    reels_comments INTEGER DEFAULT 0,
    reels_shares INTEGER DEFAULT 0,
    reels_saves INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    engagement_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN follower_count > 0 
        THEN ((posts_likes + posts_comments + posts_saves)::DECIMAL / follower_count * 100)
        ELSE 0 END
    ) STORED,
    
    stories_completion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN stories_impressions > 0 
        THEN (((stories_impressions - stories_exits)::DECIMAL / stories_impressions) * 100)
        ELSE 0 END
    ) STORED,
    
    -- Dados brutos da API preservados
    raw_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, data_referencia, periodo)
);

-- ========================================
-- 📝 POSTS DO FACEBOOK
-- ========================================
CREATE TABLE facebook_posts (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Identificadores Meta
    post_id VARCHAR(100) NOT NULL,
    post_type VARCHAR(50) NOT NULL, -- photo, video, link, status, etc
    
    -- Conteúdo
    message TEXT,
    story TEXT,
    link_url TEXT,
    created_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Métricas do post
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    
    -- Métricas de engajamento
    angry_reactions INTEGER DEFAULT 0,
    haha_reactions INTEGER DEFAULT 0,
    love_reactions INTEGER DEFAULT 0,
    sad_reactions INTEGER DEFAULT 0,
    wow_reactions INTEGER DEFAULT 0,
    
    -- Dados brutos preservados
    raw_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, post_id)
);

-- ========================================
-- 📱 POSTS DO INSTAGRAM
-- ========================================
CREATE TABLE instagram_posts (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Identificadores Meta
    media_id VARCHAR(100) NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
    
    -- Conteúdo
    caption TEXT,
    media_url TEXT,
    permalink TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Métricas do post
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    
    -- Métricas específicas de reels
    plays INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    
    -- Dados brutos preservados
    raw_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, media_id)
);

-- ========================================
-- 📈 MÉTRICAS AGREGADAS CONSOLIDADAS
-- ========================================
CREATE TABLE social_metrics_consolidated (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Período
    data_referencia DATE NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    
    -- Métricas combinadas
    total_reach INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    
    -- Breakdown por plataforma
    facebook_reach INTEGER DEFAULT 0,
    facebook_impressions INTEGER DEFAULT 0,
    facebook_engagement INTEGER DEFAULT 0,
    facebook_followers INTEGER DEFAULT 0,
    
    instagram_reach INTEGER DEFAULT 0,
    instagram_impressions INTEGER DEFAULT 0,
    instagram_engagement INTEGER DEFAULT 0,
    instagram_followers INTEGER DEFAULT 0,
    
    -- Métricas calculadas
    engagement_rate_geral DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_followers > 0 
        THEN (total_engagement::DECIMAL / total_followers * 100)
        ELSE 0 END
    ) STORED,
    
    crescimento_followers DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, data_referencia, periodo)
);

-- ========================================
-- 🔍 LOG DE COLETAS
-- ========================================
CREATE TABLE meta_coletas_log (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bars(id) ON DELETE CASCADE,
    
    -- Dados da coleta
    tipo_coleta VARCHAR(50) NOT NULL, -- facebook_page, instagram_account, posts, etc
    iniciada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizada_em TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'iniciada', -- iniciada, sucesso, erro, parcial
    registros_processados INTEGER DEFAULT 0,
    registros_novos INTEGER DEFAULT 0,
    registros_atualizados INTEGER DEFAULT 0,
    
    -- Erro
    erro_detalhes TEXT,
    erro_codigo VARCHAR(50),
    
    -- Metadados
    parametros_coleta JSONB DEFAULT '{}',
    tempo_execucao_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 📊 ÍNDICES PARA PERFORMANCE
-- ========================================

-- Meta configurações
CREATE INDEX idx_meta_config_bar ON meta_configuracoes(bar_id);
CREATE INDEX idx_meta_config_ativo ON meta_configuracoes(ativo);
CREATE INDEX idx_meta_config_proxima_coleta ON meta_configuracoes(proxima_coleta);

-- Facebook metrics
CREATE INDEX idx_facebook_metrics_bar ON facebook_metrics(bar_id);
CREATE INDEX idx_facebook_metrics_data ON facebook_metrics(data_referencia);
CREATE INDEX idx_facebook_metrics_periodo ON facebook_metrics(periodo);
CREATE INDEX idx_facebook_metrics_bar_data ON facebook_metrics(bar_id, data_referencia);

-- Instagram metrics
CREATE INDEX idx_instagram_metrics_bar ON instagram_metrics(bar_id);
CREATE INDEX idx_instagram_metrics_data ON instagram_metrics(data_referencia);
CREATE INDEX idx_instagram_metrics_periodo ON instagram_metrics(periodo);
CREATE INDEX idx_instagram_metrics_bar_data ON instagram_metrics(bar_id, data_referencia);

-- Posts
CREATE INDEX idx_facebook_posts_bar ON facebook_posts(bar_id);
CREATE INDEX idx_facebook_posts_created ON facebook_posts(created_time);
CREATE INDEX idx_facebook_posts_type ON facebook_posts(post_type);

CREATE INDEX idx_instagram_posts_bar ON instagram_posts(bar_id);
CREATE INDEX idx_instagram_posts_created ON instagram_posts(timestamp);
CREATE INDEX idx_instagram_posts_type ON instagram_posts(media_type);

-- Métricas consolidadas
CREATE INDEX idx_social_consolidated_bar ON social_metrics_consolidated(bar_id);
CREATE INDEX idx_social_consolidated_data ON social_metrics_consolidated(data_referencia);
CREATE INDEX idx_social_consolidated_periodo ON social_metrics_consolidated(periodo);

-- Log de coletas
CREATE INDEX idx_meta_coletas_bar ON meta_coletas_log(bar_id);
CREATE INDEX idx_meta_coletas_status ON meta_coletas_log(status);
CREATE INDEX idx_meta_coletas_tipo ON meta_coletas_log(tipo_coleta);
CREATE INDEX idx_meta_coletas_data ON meta_coletas_log(iniciada_em);

-- ========================================
-- 🔄 TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_meta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_meta_configuracoes_updated_at
    BEFORE UPDATE ON meta_configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_facebook_metrics_updated_at
    BEFORE UPDATE ON facebook_metrics
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_instagram_metrics_updated_at
    BEFORE UPDATE ON instagram_metrics
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_facebook_posts_updated_at
    BEFORE UPDATE ON facebook_posts
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_instagram_posts_updated_at
    BEFORE UPDATE ON instagram_posts
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_social_consolidated_updated_at
    BEFORE UPDATE ON social_metrics_consolidated
    FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

-- ========================================
-- 🔄 FUNÇÃO PARA CONSOLIDAR MÉTRICAS
-- ========================================
CREATE OR REPLACE FUNCTION consolidar_metricas_sociais(
    p_bar_id INTEGER,
    p_data_referencia DATE,
    p_periodo VARCHAR(20)
) RETURNS VOID AS $$
DECLARE
    v_facebook_metrics RECORD;
    v_instagram_metrics RECORD;
BEGIN
    -- Buscar métricas do Facebook
    SELECT 
        COALESCE(page_reach, 0) as reach,
        COALESCE(page_impressions, 0) as impressions,
        COALESCE(post_likes + post_comments + post_shares, 0) as engagement,
        COALESCE(page_fans, 0) as followers
    INTO v_facebook_metrics
    FROM facebook_metrics
    WHERE bar_id = p_bar_id 
    AND data_referencia = p_data_referencia 
    AND periodo = p_periodo;

    -- Buscar métricas do Instagram
    SELECT 
        COALESCE(reach, 0) as reach,
        COALESCE(impressions, 0) as impressions,
        COALESCE(posts_likes + posts_comments + posts_saves, 0) as engagement,
        COALESCE(follower_count, 0) as followers
    INTO v_instagram_metrics
    FROM instagram_metrics
    WHERE bar_id = p_bar_id 
    AND data_referencia = p_data_referencia 
    AND periodo = p_periodo;

    -- Inserir ou atualizar métricas consolidadas
    INSERT INTO social_metrics_consolidated (
        bar_id, data_referencia, periodo,
        total_reach, total_impressions, total_engagement, total_followers,
        facebook_reach, facebook_impressions, facebook_engagement, facebook_followers,
        instagram_reach, instagram_impressions, instagram_engagement, instagram_followers
    ) VALUES (
        p_bar_id, p_data_referencia, p_periodo,
        COALESCE(v_facebook_metrics.reach, 0) + COALESCE(v_instagram_metrics.reach, 0),
        COALESCE(v_facebook_metrics.impressions, 0) + COALESCE(v_instagram_metrics.impressions, 0),
        COALESCE(v_facebook_metrics.engagement, 0) + COALESCE(v_instagram_metrics.engagement, 0),
        COALESCE(v_facebook_metrics.followers, 0) + COALESCE(v_instagram_metrics.followers, 0),
        COALESCE(v_facebook_metrics.reach, 0),
        COALESCE(v_facebook_metrics.impressions, 0),
        COALESCE(v_facebook_metrics.engagement, 0),
        COALESCE(v_facebook_metrics.followers, 0),
        COALESCE(v_instagram_metrics.reach, 0),
        COALESCE(v_instagram_metrics.impressions, 0),
        COALESCE(v_instagram_metrics.engagement, 0),
        COALESCE(v_instagram_metrics.followers, 0)
    )
    ON CONFLICT (bar_id, data_referencia, periodo) 
    DO UPDATE SET
        total_reach = EXCLUDED.total_reach,
        total_impressions = EXCLUDED.total_impressions,
        total_engagement = EXCLUDED.total_engagement,
        total_followers = EXCLUDED.total_followers,
        facebook_reach = EXCLUDED.facebook_reach,
        facebook_impressions = EXCLUDED.facebook_impressions,
        facebook_engagement = EXCLUDED.facebook_engagement,
        facebook_followers = EXCLUDED.facebook_followers,
        instagram_reach = EXCLUDED.instagram_reach,
        instagram_impressions = EXCLUDED.instagram_impressions,
        instagram_engagement = EXCLUDED.instagram_engagement,
        instagram_followers = EXCLUDED.instagram_followers,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔐 RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS
ALTER TABLE meta_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics_consolidated ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_coletas_log ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY meta_configuracoes_bar_policy ON meta_configuracoes
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY facebook_metrics_bar_policy ON facebook_metrics
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY instagram_metrics_bar_policy ON instagram_metrics
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY facebook_posts_bar_policy ON facebook_posts
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY instagram_posts_bar_policy ON instagram_posts
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY social_consolidated_bar_policy ON social_metrics_consolidated
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY meta_coletas_log_bar_policy ON meta_coletas_log
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

-- ========================================
-- 🌱 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE meta_configuracoes IS 'Configurações das APIs Meta (Facebook/Instagram) por bar';
COMMENT ON TABLE facebook_metrics IS 'Métricas agregadas do Facebook por período';
COMMENT ON TABLE instagram_metrics IS 'Métricas agregadas do Instagram por período';
COMMENT ON TABLE facebook_posts IS 'Posts individuais do Facebook com métricas';
COMMENT ON TABLE instagram_posts IS 'Posts individuais do Instagram com métricas';
COMMENT ON TABLE social_metrics_consolidated IS 'Métricas consolidadas de todas as redes sociais';
COMMENT ON TABLE meta_coletas_log IS 'Log de execuções de coleta de dados da Meta';

COMMENT ON FUNCTION consolidar_metricas_sociais IS 'Consolida métricas do Facebook e Instagram em uma tabela unificada';

-- ========================================
-- ✅ SISTEMA META SOCIAL METRICS CRIADO
-- ========================================
-- Total: 7 tabelas especializadas
-- Recursos: Métricas FB/IG, Posts, Consolidação
-- Integração: Sistema ai_metrics existente
-- Segurança: RLS habilitado
-- Performance: Índices otimizados
-- Pronto para: Integração com Graph API
-- ======================================== 