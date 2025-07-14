-- =============================================
-- SISTEMA DE ANALYTICS AVANÇADO - SGB_V2
-- =============================================
-- Criado em: Janeiro 2025
-- Objetivo: Monitoramento completo de métricas, performance e uso do sistema

-- 1. TABELA DE MÉTRICAS DE SISTEMA
CREATE TABLE IF NOT EXISTS sistema_metricas (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    tipo_metrica TEXT NOT NULL, -- 'performance', 'usage', 'business', 'technical'
    categoria TEXT NOT NULL, -- 'api_calls', 'page_views', 'user_actions', 'system_health'
    nome_metrica TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    valor_anterior NUMERIC,
    variacao_percentual NUMERIC,
    unidade TEXT DEFAULT 'count', -- 'count', 'ms', 'mb', 'percent', 'currency'
    metadados JSONB DEFAULT '{}',
    periodo_inicio TIMESTAMP WITH TIME ZONE,
    periodo_fim TIMESTAMP WITH TIME ZONE,
    coletado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processado_em TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'processado', 'arquivado')),
    
    UNIQUE(bar_id, tipo_metrica, categoria, nome_metrica, periodo_inicio)
);

-- 2. TABELA DE EVENTOS DE USUÁRIO
CREATE TABLE IF NOT EXISTS usuario_eventos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES usuarios_sistema(id),
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    sessao_id TEXT NOT NULL,
    evento_tipo TEXT NOT NULL, -- 'page_view', 'click', 'action', 'error', 'performance'
    evento_nome TEXT NOT NULL, -- 'checklist_created', 'report_generated', 'login_attempt'
    pagina_atual TEXT,
    elemento_alvo TEXT, -- CSS selector ou ID do elemento
    dados_evento JSONB DEFAULT '{}', -- dados específicos do evento
    tempo_gasto_segundos INTEGER, -- tempo na página/ação
    dispositivo_tipo TEXT, -- 'desktop', 'mobile', 'tablet'
    navegador TEXT,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    timestamp_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_usuario_eventos_user_bar (user_id, bar_id),
    INDEX idx_usuario_eventos_tipo (evento_tipo),
    INDEX idx_usuario_eventos_timestamp (timestamp_evento),
    INDEX idx_usuario_eventos_sessao (sessao_id)
);

-- 3. TABELA DE PERFORMANCE DO SISTEMA
CREATE TABLE IF NOT EXISTS sistema_performance (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    componente TEXT NOT NULL, -- 'api', 'database', 'frontend', 'edge_function'
    endpoint_ou_pagina TEXT NOT NULL,
    metodo_http TEXT, -- GET, POST, etc.
    tempo_resposta_ms INTEGER NOT NULL,
    status_code INTEGER,
    tamanho_response_bytes INTEGER,
    memoria_usada_mb NUMERIC,
    cpu_percent NUMERIC,
    database_queries_count INTEGER DEFAULT 0,
    database_time_ms INTEGER DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES usuarios_sistema(id),
    sessao_id TEXT,
    erro_detalhes TEXT,
    timestamp_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_performance_componente (componente),
    INDEX idx_performance_endpoint (endpoint_ou_pagina),
    INDEX idx_performance_timestamp (timestamp_request),
    INDEX idx_performance_tempo (tempo_resposta_ms)
);

-- 4. TABELA DE RELATÓRIOS DE ANALYTICS
CREATE TABLE IF NOT EXISTS analytics_relatorios (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    nome_relatorio TEXT NOT NULL,
    tipo_relatorio TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    periodo_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    periodo_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    dados_relatorio JSONB NOT NULL, -- dados processados do relatório
    metricas_calculadas JSONB DEFAULT '{}',
    insights_gerados TEXT[],
    anomalias_detectadas JSONB DEFAULT '{}',
    recomendacoes TEXT[],
    gerado_por UUID REFERENCES usuarios_sistema(id),
    gerado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'gerado' CHECK (status IN ('processando', 'gerado', 'erro')),
    
    INDEX idx_analytics_relatorios_bar (bar_id),
    INDEX idx_analytics_relatorios_tipo (tipo_relatorio),
    INDEX idx_analytics_relatorios_periodo (periodo_inicio, periodo_fim)
);

-- 5. TABELA DE METAS E KPIs
CREATE TABLE IF NOT EXISTS sistema_kpis (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    categoria_kpi TEXT NOT NULL, -- 'operacional', 'financeiro', 'qualidade', 'eficiencia'
    nome_kpi TEXT NOT NULL,
    valor_atual NUMERIC NOT NULL,
    valor_meta NUMERIC NOT NULL,
    valor_minimo NUMERIC,
    valor_maximo NUMERIC,
    percentual_atingido NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN valor_meta > 0 THEN (valor_atual / valor_meta) * 100
            ELSE 0
        END
    ) STORED,
    status_meta TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN valor_atual >= valor_meta THEN 'atingido'
            WHEN valor_atual >= (valor_meta * 0.8) THEN 'perto'
            WHEN valor_atual >= (valor_meta * 0.5) THEN 'distante'
            ELSE 'critico'
        END
    ) STORED,
    unidade TEXT DEFAULT 'numero',
    descricao TEXT,
    formula_calculo TEXT,
    periodo_tipo TEXT DEFAULT 'mensal', -- 'diario', 'semanal', 'mensal', 'anual'
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(bar_id, categoria_kpi, nome_kpi, data_referencia)
);

-- 6. TABELA DE ALERTAS E NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS sistema_alertas (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    tipo_alerta TEXT NOT NULL, -- 'performance', 'business', 'security', 'system'
    severidade TEXT NOT NULL CHECK (severidade IN ('info', 'warning', 'error', 'critical')),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    metrica_relacionada TEXT,
    valor_atual NUMERIC,
    valor_limite NUMERIC,
    dados_contexto JSONB DEFAULT '{}',
    acao_sugerida TEXT,
    status_alerta TEXT DEFAULT 'ativo' CHECK (status_alerta IN ('ativo', 'reconhecido', 'resolvido', 'ignorado')),
    reconhecido_por UUID REFERENCES usuarios_sistema(id),
    reconhecido_em TIMESTAMP WITH TIME ZONE,
    resolvido_em TIMESTAMP WITH TIME ZONE,
    enviado_discord BOOLEAN DEFAULT FALSE,
    enviado_email BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_alertas_bar_status (bar_id, status_alerta),
    INDEX idx_alertas_severidade (severidade),
    INDEX idx_alertas_criado (criado_em)
);

-- 7. VIEW PARA DASHBOARD EXECUTIVO
CREATE OR REPLACE VIEW dashboard_executivo AS
SELECT 
    sm.bar_id,
    b.nome as bar_nome,
    
    -- Métricas de Uso
    COUNT(DISTINCT ue.user_id) as usuarios_ativos_ultimos_7_dias,
    COUNT(DISTINCT ue.sessao_id) as sessoes_ultimas_24h,
    AVG(ue.tempo_gasto_segundos) as tempo_medio_sessao_segundos,
    
    -- Métricas de Performance
    AVG(sp.tempo_resposta_ms) as tempo_resposta_medio_ms,
    COUNT(CASE WHEN sp.status_code >= 400 THEN 1 END) as total_erros_ultimas_24h,
    COUNT(CASE WHEN sp.cache_hit = TRUE THEN 1 END) * 100.0 / COUNT(*) as taxa_cache_hit_percent,
    
    -- Métricas de Negócio
    COUNT(CASE WHEN ue.evento_nome = 'checklist_completed' THEN 1 END) as checklists_concluidos_hoje,
    COUNT(CASE WHEN ue.evento_nome = 'report_generated' THEN 1 END) as relatorios_gerados_hoje,
    
    -- Status KPIs
    COUNT(CASE WHEN sk.status_meta = 'atingido' THEN 1 END) as kpis_atingidos,
    COUNT(sk.*) as total_kpis,
    
    -- Alertas Ativos
    COUNT(CASE WHEN sa.status_alerta = 'ativo' AND sa.severidade IN ('error', 'critical') THEN 1 END) as alertas_criticos_ativos,
    
    CURRENT_TIMESTAMP as ultima_atualizacao
    
FROM bars b
LEFT JOIN sistema_metricas sm ON b.id = sm.bar_id
LEFT JOIN usuario_eventos ue ON b.id = ue.bar_id 
    AND ue.timestamp_evento >= NOW() - INTERVAL '7 days'
LEFT JOIN sistema_performance sp ON b.id = sp.bar_id 
    AND sp.timestamp_request >= NOW() - INTERVAL '24 hours'
LEFT JOIN sistema_kpis sk ON b.id = sk.bar_id 
    AND sk.data_referencia = CURRENT_DATE
LEFT JOIN sistema_alertas sa ON b.id = sa.bar_id 
    AND sa.criado_em >= NOW() - INTERVAL '24 hours'
WHERE b.ativo = TRUE
GROUP BY sm.bar_id, b.nome;

-- 8. FUNÇÃO PARA CALCULAR MÉTRICAS AUTOMÁTICAS
CREATE OR REPLACE FUNCTION calcular_metricas_automaticas(target_bar_id INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
    bar_record RECORD;
BEGIN
    -- Loop através dos bares (todos ou específico)
    FOR bar_record IN 
        SELECT id, nome FROM bars 
        WHERE (target_bar_id IS NULL OR id = target_bar_id) AND ativo = TRUE
    LOOP
        -- Inserir métricas calculadas para o bar
        INSERT INTO sistema_metricas (
            bar_id, tipo_metrica, categoria, nome_metrica, valor, 
            periodo_inicio, periodo_fim, metadados
        ) VALUES 
        -- Usuários Ativos
        (bar_record.id, 'usage', 'user_engagement', 'usuarios_ativos_diarios',
         (SELECT COUNT(DISTINCT user_id) FROM usuario_eventos 
          WHERE bar_id = bar_record.id AND timestamp_evento >= CURRENT_DATE),
         CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
         '{"descricao": "Usuários únicos que fizeram login hoje"}'::jsonb),
         
        -- Performance Média
        (bar_record.id, 'performance', 'api_response', 'tempo_resposta_medio_ms',
         (SELECT COALESCE(AVG(tempo_resposta_ms), 0) FROM sistema_performance 
          WHERE bar_id = bar_record.id AND timestamp_request >= CURRENT_DATE),
         CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
         '{"descricao": "Tempo médio de resposta das APIs em ms"}'::jsonb),
         
        -- Checklists Concluídos
        (bar_record.id, 'business', 'operations', 'checklists_concluidos',
         (SELECT COUNT(*) FROM usuario_eventos 
          WHERE bar_id = bar_record.id 
          AND evento_nome = 'checklist_completed' 
          AND timestamp_evento >= CURRENT_DATE),
         CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day',
         '{"descricao": "Total de checklists concluídos hoje"}'::jsonb)
         
        ON CONFLICT (bar_id, tipo_metrica, categoria, nome_metrica, periodo_inicio) 
        DO UPDATE SET 
            valor = EXCLUDED.valor,
            metadados = EXCLUDED.metadados,
            coletado_em = NOW();
    END LOOP;
    
    -- Retornar resumo
    SELECT json_build_object(
        'status', 'sucesso',
        'bars_processados', COUNT(*),
        'metricas_atualizadas', 3,
        'timestamp', NOW()
    ) INTO resultado
    FROM bars WHERE (target_bar_id IS NULL OR id = target_bar_id) AND ativo = TRUE;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER PARA ALERTAS AUTOMÁTICOS
CREATE OR REPLACE FUNCTION verificar_alertas_automaticos()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta de performance degradada
    IF NEW.tempo_resposta_ms > 5000 THEN
        INSERT INTO sistema_alertas (
            bar_id, tipo_alerta, severidade, titulo, descricao,
            metrica_relacionada, valor_atual, valor_limite,
            acao_sugerida
        ) VALUES (
            NEW.bar_id, 'performance', 'warning',
            'Performance Degradada Detectada',
            format('Endpoint %s respondeu em %s ms (limite: 5000ms)', 
                   NEW.endpoint_ou_pagina, NEW.tempo_resposta_ms),
            'tempo_resposta_ms', NEW.tempo_resposta_ms, 5000,
            'Verificar logs do sistema e otimizar queries'
        );
    END IF;
    
    -- Alerta de erro crítico
    IF NEW.status_code >= 500 THEN
        INSERT INTO sistema_alertas (
            bar_id, tipo_alerta, severidade, titulo, descricao,
            metrica_relacionada, valor_atual, valor_limite,
            acao_sugerida
        ) VALUES (
            NEW.bar_id, 'system', 'error',
            'Erro Crítico no Sistema',
            format('Erro %s em %s: %s', NEW.status_code, NEW.endpoint_ou_pagina, NEW.erro_detalhes),
            'status_code', NEW.status_code, 500,
            'Investigar logs de erro e corrigir problema'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alertas_performance
    AFTER INSERT ON sistema_performance
    FOR EACH ROW
    EXECUTE FUNCTION verificar_alertas_automaticos();

-- 10. INDEXES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sistema_metricas_bar_tipo ON sistema_metricas(bar_id, tipo_metrica);
CREATE INDEX IF NOT EXISTS idx_sistema_metricas_periodo ON sistema_metricas(periodo_inicio, periodo_fim);
CREATE INDEX IF NOT EXISTS idx_usuario_eventos_compound ON usuario_eventos(bar_id, evento_tipo, timestamp_evento);
CREATE INDEX IF NOT EXISTS idx_performance_endpoint_time ON sistema_performance(endpoint_ou_pagina, timestamp_request);
CREATE INDEX IF NOT EXISTS idx_kpis_bar_data ON sistema_kpis(bar_id, data_referencia);

-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE sistema_metricas IS 'Métricas agregadas do sistema - performance, uso, negócio';
COMMENT ON TABLE usuario_eventos IS 'Eventos de usuário para analytics e tracking';
COMMENT ON TABLE sistema_performance IS 'Métricas de performance de APIs e páginas';
COMMENT ON TABLE analytics_relatorios IS 'Relatórios processados de analytics';
COMMENT ON TABLE sistema_kpis IS 'KPIs e metas do sistema por bar';
COMMENT ON TABLE sistema_alertas IS 'Sistema de alertas automáticos';
COMMENT ON VIEW dashboard_executivo IS 'View agregada para dashboard executivo';

-- 12. DADOS INICIAIS PARA TESTES
INSERT INTO sistema_kpis (bar_id, categoria_kpi, nome_kpi, valor_atual, valor_meta, unidade, descricao) VALUES
(3, 'operacional', 'Checklists Concluídos por Dia', 0, 10, 'count', 'Meta de checklists concluídos diariamente'),
(3, 'performance', 'Tempo Resposta Médio', 0, 1000, 'ms', 'Tempo médio de resposta das APIs (máximo 1 segundo)'),
(3, 'qualidade', 'Taxa de Sucesso das APIs', 0, 99, 'percent', 'Percentual de chamadas de API sem erro'),
(3, 'eficiencia', 'Usuários Ativos por Dia', 0, 5, 'count', 'Meta de usuários únicos ativos por dia'),
(3, 'financeiro', 'Sync ContaAzul Success Rate', 0, 100, 'percent', 'Taxa de sucesso do sync automático ContaAzul')
ON CONFLICT (bar_id, categoria_kpi, nome_kpi, data_referencia) DO NOTHING;

-- Executar cálculo inicial de métricas
SELECT calcular_metricas_automaticas(3); 