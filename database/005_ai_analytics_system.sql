-- ========================================
-- 🤖 AI ANALYTICS SYSTEM - INTELLIGENT AGENT
-- ========================================
-- Sistema completo de analytics com IA para análise automática
-- Agente inteligente em background para insights e predições
-- Versão: 1.0 | Data: 2024

-- ========================================
-- 🧠 INSIGHTS GERADOS PELA IA
-- ========================================
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação do insight
    tipo_insight VARCHAR(50) NOT NULL, -- performance, anomalia, tendencia, oportunidade
    categoria VARCHAR(50) NOT NULL, -- checklists, produtividade, whatsapp, financeiro
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    
    -- Dados da análise
    confianca DECIMAL(5,2) NOT NULL, -- 0-100% confiança da IA
    impacto VARCHAR(20) NOT NULL, -- baixo, medio, alto, critico
    urgencia VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
    
    -- Métricas e evidências
    metricas_base JSONB NOT NULL, -- dados que geraram o insight
    evidencias JSONB NOT NULL, -- provas do insight
    dados_comparativos JSONB, -- comparações históricas
    
    -- Contexto temporal
    periodo_analise_inicio DATE NOT NULL,
    periodo_analise_fim DATE NOT NULL,
    projecao_impacto_dias INTEGER, -- quantos dias no futuro impacta
    
    -- Status e ações
    status VARCHAR(20) DEFAULT 'novo', -- novo, lido, em_acao, resolvido, ignorado
    lido_por INTEGER REFERENCES usuarios_bar(id),
    lido_em TIMESTAMP WITH TIME ZONE,
    acoes_sugeridas JSONB, -- ações recomendadas pela IA
    acao_tomada TEXT, -- ação real tomada pelo usuário
    
    -- Feedback do usuário
    usuario_avaliacao INTEGER CHECK (usuario_avaliacao BETWEEN 1 AND 5),
    usuario_feedback TEXT,
    util BOOLEAN, -- se foi útil para o usuário
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- quando o insight perde validade
);

-- Índices para performance
CREATE INDEX idx_ai_insights_bar ON ai_insights(bar_id);
CREATE INDEX idx_ai_insights_tipo ON ai_insights(tipo_insight);
CREATE INDEX idx_ai_insights_categoria ON ai_insights(categoria);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);
CREATE INDEX idx_ai_insights_impacto ON ai_insights(impacto);
CREATE INDEX idx_ai_insights_urgencia ON ai_insights(urgencia);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at);
CREATE INDEX idx_ai_insights_expires ON ai_insights(expires_at);

-- ========================================
-- 📊 PREVISÕES DE MACHINE LEARNING
-- ========================================
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação da previsão
    modelo_id INTEGER NOT NULL,
    modelo_nome VARCHAR(100) NOT NULL,
    modelo_versao VARCHAR(20) NOT NULL,
    tipo_predicao VARCHAR(50) NOT NULL, -- vendas, produtividade, falhas, abandono
    
    -- Dados da previsão
    objeto_id INTEGER, -- ID do objeto sendo predito (checklist, usuario, etc)
    objeto_tipo VARCHAR(50), -- checklist, usuario, produto, etc
    
    -- Valores preditos
    valor_predito DECIMAL(15,2) NOT NULL,
    valor_minimo DECIMAL(15,2), -- intervalo de confiança
    valor_maximo DECIMAL(15,2), -- intervalo de confiança
    confianca DECIMAL(5,2) NOT NULL, -- 0-100%
    
    -- Contexto temporal
    data_predicao DATE NOT NULL, -- quando foi feita a previsão
    data_alvo DATE NOT NULL, -- para quando é a previsão
    horizonte_dias INTEGER NOT NULL, -- quantos dias no futuro
    
    -- Features utilizadas
    features_utilizadas JSONB NOT NULL, -- quais dados foram usados
    importancia_features JSONB, -- importância de cada feature
    
    -- Validação
    valor_real DECIMAL(15,2), -- valor real quando disponível
    erro_absoluto DECIMAL(15,2), -- |predito - real|
    erro_percentual DECIMAL(5,2), -- erro em %
    validado BOOLEAN DEFAULT false,
    validado_em TIMESTAMP WITH TIME ZONE,
    
    -- Alertas baseados na previsão
    gerar_alerta BOOLEAN DEFAULT false,
    alerta_threshold DECIMAL(15,2), -- limite para gerar alerta
    alerta_gerado BOOLEAN DEFAULT false,
    alerta_gerado_em TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_predictions_bar ON ai_predictions(bar_id);
CREATE INDEX idx_ai_predictions_modelo ON ai_predictions(modelo_id);
CREATE INDEX idx_ai_predictions_tipo ON ai_predictions(tipo_predicao);
CREATE INDEX idx_ai_predictions_data_alvo ON ai_predictions(data_alvo);
CREATE INDEX idx_ai_predictions_objeto ON ai_predictions(objeto_id, objeto_tipo);
CREATE INDEX idx_ai_predictions_validado ON ai_predictions(validado);

-- ========================================
-- 💡 RECOMENDAÇÕES INTELIGENTES
-- ========================================
CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação da recomendação
    tipo_recomendacao VARCHAR(50) NOT NULL, -- otimizacao, prevencao, melhoria, economia
    categoria VARCHAR(50) NOT NULL, -- checklist, usuario, processo, recurso
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    
    -- Análise de impacto
    impacto_estimado DECIMAL(15,2), -- valor estimado do impacto
    impacto_unidade VARCHAR(20), -- %, R$, pontos, horas, etc
    roi_estimado DECIMAL(15,2), -- ROI estimado
    esforco_implementacao VARCHAR(20) NOT NULL, -- baixo, medio, alto
    tempo_implementacao_dias INTEGER,
    
    -- Dados de suporte
    justificativa TEXT NOT NULL, -- por que a IA recomenda isso
    evidencias JSONB NOT NULL, -- dados que suportam a recomendação
    exemplos JSONB, -- exemplos práticos
    riscos JSONB, -- possíveis riscos
    
    -- Contexto e priorização
    prioridade INTEGER DEFAULT 5 CHECK (prioridade BETWEEN 1 AND 10),
    urgencia VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
    complexidade VARCHAR(20) NOT NULL, -- simples, media, complexa
    
    -- Passos de implementação
    passos_implementacao JSONB, -- lista de passos sugeridos
    recursos_necessarios JSONB, -- recursos humanos/materiais
    prerequisitos JSONB, -- o que deve ser feito antes
    
    -- Status e tracking
    status VARCHAR(20) DEFAULT 'nova', -- nova, analisando, aprovada, implementando, concluida, rejeitada
    responsavel_id INTEGER REFERENCES usuarios_bar(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    data_implementacao TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    -- Resultados reais
    resultado_real DECIMAL(15,2), -- resultado real obtido
    resultado_unidade VARCHAR(20),
    roi_real DECIMAL(15,2), -- ROI real
    feedback_implementacao TEXT,
    
    -- Avaliação do usuário
    avaliacao_utilidade INTEGER CHECK (avaliacao_utilidade BETWEEN 1 AND 5),
    avaliacao_precisao INTEGER CHECK (avaliacao_precisao BETWEEN 1 AND 5),
    comentarios TEXT,
    recomendaria BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- quando a recomendação expira
);

-- Índices para performance
CREATE INDEX idx_ai_recommendations_bar ON ai_recommendations(bar_id);
CREATE INDEX idx_ai_recommendations_tipo ON ai_recommendations(tipo_recomendacao);
CREATE INDEX idx_ai_recommendations_categoria ON ai_recommendations(categoria);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_prioridade ON ai_recommendations(prioridade);
CREATE INDEX idx_ai_recommendations_responsavel ON ai_recommendations(responsavel_id);

-- ========================================
-- 🚨 DETECÇÃO DE ANOMALIAS
-- ========================================
CREATE TABLE ai_anomalies (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação da anomalia
    tipo_anomalia VARCHAR(50) NOT NULL, -- performance, comportamento, sistema, dados
    subtipo VARCHAR(50), -- queda_produtividade, pico_falhas, etc
    severidade VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
    
    -- Objeto afetado
    objeto_id INTEGER,
    objeto_tipo VARCHAR(50), -- checklist, usuario, sistema, etc
    objeto_nome VARCHAR(200),
    
    -- Detalhes da anomalia
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    valor_esperado DECIMAL(15,2),
    valor_observado DECIMAL(15,2),
    desvio_percentual DECIMAL(5,2),
    
    -- Contexto temporal
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    duracao_minutos INTEGER,
    ainda_ativa BOOLEAN DEFAULT true,
    
    -- Análise automatizada
    possivel_causa TEXT, -- análise da IA sobre a causa
    impacto_estimado TEXT, -- impacto previsto
    acoes_sugeridas JSONB, -- ações sugeridas pela IA
    confianca_deteccao DECIMAL(5,2) NOT NULL, -- confiança na detecção
    
    -- Dados de suporte
    metricas_anomala JSONB NOT NULL, -- métricas que caracterizam a anomalia
    contexto_historico JSONB, -- dados históricos para comparação
    fatores_correlacionados JSONB, -- outros fatores relacionados
    
    -- Status e resolução
    status VARCHAR(20) DEFAULT 'detectada', -- detectada, investigando, resolvendo, resolvida, falso_positivo
    investigada_por INTEGER REFERENCES usuarios_bar(id),
    investigada_em TIMESTAMP WITH TIME ZONE,
    causa_real TEXT, -- causa real identificada pelo usuário
    acao_tomada TEXT, -- ação real tomada
    resolvida_em TIMESTAMP WITH TIME ZONE,
    
    -- Feedback e aprendizado
    falso_positivo BOOLEAN DEFAULT false,
    feedback_deteccao TEXT, -- feedback sobre a qualidade da detecção
    melhorar_modelo BOOLEAN DEFAULT false, -- se deve melhorar o modelo de detecção
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_anomalies_bar ON ai_anomalies(bar_id);
CREATE INDEX idx_ai_anomalies_tipo ON ai_anomalies(tipo_anomalia);
CREATE INDEX idx_ai_anomalies_severidade ON ai_anomalies(severidade);
CREATE INDEX idx_ai_anomalies_status ON ai_anomalies(status);
CREATE INDEX idx_ai_anomalies_ativa ON ai_anomalies(ainda_ativa);
CREATE INDEX idx_ai_anomalies_objeto ON ai_anomalies(objeto_id, objeto_tipo);
CREATE INDEX idx_ai_anomalies_data_inicio ON ai_anomalies(data_inicio);

-- ========================================
-- 🤖 MODELOS DE MACHINE LEARNING
-- ========================================
CREATE TABLE ai_models (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação do modelo
    nome VARCHAR(100) NOT NULL,
    tipo_modelo VARCHAR(50) NOT NULL, -- regression, classification, clustering, forecasting
    objetivo VARCHAR(200) NOT NULL, -- o que o modelo prediz/classifica
    versao VARCHAR(20) NOT NULL,
    
    -- Configuração do modelo
    algoritmo VARCHAR(50) NOT NULL, -- random_forest, linear_regression, etc
    hyperparameters JSONB, -- parâmetros do modelo
    features JSONB NOT NULL, -- features utilizadas
    target_variable VARCHAR(100), -- variável alvo
    
    -- Dados de treinamento
    data_inicio_treino DATE NOT NULL,
    data_fim_treino DATE NOT NULL,
    total_registros_treino INTEGER NOT NULL,
    total_features INTEGER NOT NULL,
    
    -- Métricas de performance
    accuracy DECIMAL(5,2), -- acurácia para classificação
    precision_macro DECIMAL(5,2), -- precisão macro
    recall_macro DECIMAL(5,2), -- recall macro
    f1_score DECIMAL(5,2), -- F1 score
    r2_score DECIMAL(5,2), -- R² para regressão
    mae DECIMAL(15,6), -- Mean Absolute Error
    rmse DECIMAL(15,6), -- Root Mean Square Error
    mape DECIMAL(5,2), -- Mean Absolute Percentage Error
    
    -- Validação cruzada
    cv_folds INTEGER DEFAULT 5,
    cv_accuracy_mean DECIMAL(5,2),
    cv_accuracy_std DECIMAL(5,2),
    
    -- Status e deployment
    status VARCHAR(20) DEFAULT 'treinando', -- treinando, validando, ativo, deprecado
    em_producao BOOLEAN DEFAULT false,
    data_deploy TIMESTAMP WITH TIME ZONE,
    data_ultimo_retreino TIMESTAMP WITH TIME ZONE,
    
    -- Monitoramento
    total_predicoes INTEGER DEFAULT 0,
    accuracy_producao DECIMAL(5,2), -- accuracy real em produção
    drift_detectado BOOLEAN DEFAULT false, -- se há drift nos dados
    necessita_retreino BOOLEAN DEFAULT false,
    proximo_retreino TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    arquivo_modelo TEXT, -- caminho do arquivo do modelo
    feature_importance JSONB, -- importância das features
    notas TEXT, -- notas sobre o modelo
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_models_bar ON ai_models(bar_id);
CREATE INDEX idx_ai_models_nome ON ai_models(nome);
CREATE INDEX idx_ai_models_tipo ON ai_models(tipo_modelo);
CREATE INDEX idx_ai_models_status ON ai_models(status);
CREATE INDEX idx_ai_models_producao ON ai_models(em_producao);
CREATE INDEX idx_ai_models_versao ON ai_models(nome, versao);

-- ========================================
-- 📈 MÉTRICAS CALCULADAS AUTOMATICAMENTE
-- ========================================
CREATE TABLE ai_metrics (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação da métrica
    nome_metrica VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- produtividade, qualidade, eficiencia, engagement
    tipo_calculo VARCHAR(50) NOT NULL, -- media, soma, contagem, percentual, ratio
    
    -- Configuração do cálculo
    query_sql TEXT, -- SQL para calcular a métrica
    parametros JSONB, -- parâmetros da query
    frequencia_calculo VARCHAR(20) NOT NULL, -- horaria, diaria, semanal, mensal
    ativa BOOLEAN DEFAULT true,
    
    -- Contexto temporal
    data_referencia DATE NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    
    -- Valores calculados
    valor DECIMAL(15,6) NOT NULL,
    valor_anterior DECIMAL(15,6), -- valor do período anterior
    variacao_absoluta DECIMAL(15,6), -- diferença absoluta
    variacao_percentual DECIMAL(5,2), -- variação em %
    
    -- Benchmarks e metas
    meta_valor DECIMAL(15,6), -- meta definida
    benchmark_interno DECIMAL(15,6), -- benchmark histórico interno
    benchmark_mercado DECIMAL(15,6), -- benchmark de mercado
    
    -- Classificação automática
    performance VARCHAR(20), -- excelente, bom, regular, ruim, critico
    tendencia VARCHAR(20), -- crescente, estavel, decrescente
    alerta_ativado BOOLEAN DEFAULT false,
    
    -- Dados contextuais
    fatores_influencia JSONB, -- fatores que influenciaram o valor
    detalhamento JSONB, -- breakdown da métrica
    comparativo_historico JSONB, -- série histórica
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proximo_calculo TIMESTAMP WITH TIME ZONE -- quando calcular novamente
);

-- Índices para performance
CREATE INDEX idx_ai_metrics_bar ON ai_metrics(bar_id);
CREATE INDEX idx_ai_metrics_nome ON ai_metrics(nome_metrica);
CREATE INDEX idx_ai_metrics_categoria ON ai_metrics(categoria);
CREATE INDEX idx_ai_metrics_data ON ai_metrics(data_referencia);
CREATE INDEX idx_ai_metrics_ativa ON ai_metrics(ativa);
CREATE INDEX idx_ai_metrics_performance ON ai_metrics(performance);

-- ========================================
-- 🔄 LOG DE PROCESSAMENTO DO AGENTE IA
-- ========================================
CREATE TABLE ai_agent_logs (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação do processamento
    tipo_processamento VARCHAR(50) NOT NULL, -- analise_insights, treino_modelo, deteccao_anomalias
    nome_processo VARCHAR(100) NOT NULL,
    versao_agente VARCHAR(20) DEFAULT '1.0',
    
    -- Status e timing
    status VARCHAR(20) DEFAULT 'iniciado', -- iniciado, processando, concluido, erro
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    duracao_segundos INTEGER,
    
    -- Dados processados
    total_registros_analisados INTEGER DEFAULT 0,
    total_insights_gerados INTEGER DEFAULT 0,
    total_anomalias_detectadas INTEGER DEFAULT 0,
    total_predicoes_feitas INTEGER DEFAULT 0,
    total_recomendacoes_criadas INTEGER DEFAULT 0,
    
    -- Recursos utilizados
    memoria_utilizada_mb INTEGER,
    cpu_percentual_medio DECIMAL(5,2),
    queries_executadas INTEGER DEFAULT 0,
    
    -- Resultados e erros
    resultado_resumo TEXT,
    erro_detalhes TEXT,
    warning_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Métricas de qualidade
    confianca_media DECIMAL(5,2), -- confiança média dos resultados
    accuracy_validacao DECIMAL(5,2), -- accuracy quando aplicável
    
    -- Dados de contexto
    parametros_execucao JSONB,
    dados_entrada JSONB,
    resultado_detalhado JSONB,
    
    -- Scheduling
    executado_por VARCHAR(50) DEFAULT 'agente_automatico', -- agente_automatico, usuario_manual, cron_job
    proximo_processamento TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_agent_logs_bar ON ai_agent_logs(bar_id);
CREATE INDEX idx_ai_agent_logs_tipo ON ai_agent_logs(tipo_processamento);
CREATE INDEX idx_ai_agent_logs_status ON ai_agent_logs(status);
CREATE INDEX idx_ai_agent_logs_data_inicio ON ai_agent_logs(data_inicio);
CREATE INDEX idx_ai_agent_logs_executado_por ON ai_agent_logs(executado_por);

-- ========================================
-- 🧮 CONFIGURAÇÕES DO AGENTE IA
-- ========================================
CREATE TABLE ai_agent_config (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Configurações gerais
    agente_ativo BOOLEAN DEFAULT true,
    frequencia_analise_minutos INTEGER DEFAULT 60, -- a cada hora
    horario_analise_inicio TIME DEFAULT '06:00',
    horario_analise_fim TIME DEFAULT '23:00',
    
    -- Configurações de insights
    gerar_insights BOOLEAN DEFAULT true,
    confianca_minima_insights DECIMAL(5,2) DEFAULT 70.0,
    dias_historico_insights INTEGER DEFAULT 30,
    max_insights_por_execucao INTEGER DEFAULT 20,
    
    -- Configurações de anomalias
    detectar_anomalias BOOLEAN DEFAULT true,
    sensibilidade_anomalias DECIMAL(5,2) DEFAULT 2.0, -- desvios padrão
    window_anomalias_horas INTEGER DEFAULT 24,
    
    -- Configurações de previsões
    gerar_predicoes BOOLEAN DEFAULT true,
    horizonte_predicao_dias INTEGER DEFAULT 7,
    confianca_minima_predicoes DECIMAL(5,2) DEFAULT 75.0,
    
    -- Configurações de recomendações
    gerar_recomendacoes BOOLEAN DEFAULT true,
    roi_minimo_recomendacoes DECIMAL(5,2) DEFAULT 10.0, -- 10% ROI mínimo
    max_recomendacoes_ativas INTEGER DEFAULT 10,
    
    -- Configurações de notificações
    notificar_insights BOOLEAN DEFAULT true,
    notificar_anomalias BOOLEAN DEFAULT true,
    notificar_predicoes_criticas BOOLEAN DEFAULT true,
    canais_notificacao JSONB DEFAULT '{"browser": true, "whatsapp": false}',
    
    -- Configurações de modelos
    retreinar_modelos_automaticamente BOOLEAN DEFAULT true,
    frequencia_retreino_dias INTEGER DEFAULT 30,
    accuracy_minima_producao DECIMAL(5,2) DEFAULT 70.0,
    
    -- Configurações de performance
    timeout_processamento_minutos INTEGER DEFAULT 30,
    max_memoria_mb INTEGER DEFAULT 2048,
    log_debug BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única por bar
    UNIQUE(bar_id)
);

-- Índices para performance
CREATE INDEX idx_ai_agent_config_bar ON ai_agent_config(bar_id);
CREATE INDEX idx_ai_agent_config_ativo ON ai_agent_config(agente_ativo);

-- ========================================
-- 🔄 TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
CREATE TRIGGER trigger_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_anomalies_updated_at
    BEFORE UPDATE ON ai_anomalies
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_metrics_updated_at
    BEFORE UPDATE ON ai_metrics
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_agent_logs_updated_at
    BEFORE UPDATE ON ai_agent_logs
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_agent_config_updated_at
    BEFORE UPDATE ON ai_agent_config
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- ========================================
-- 📊 FUNÇÕES ANALÍTICAS AUXILIARES
-- ========================================

-- Função para calcular desvio padrão móvel
CREATE OR REPLACE FUNCTION calculate_rolling_stddev(
    p_bar_id INTEGER,
    p_metric_name VARCHAR,
    p_window_days INTEGER DEFAULT 30
) RETURNS DECIMAL AS $$
DECLARE
    result DECIMAL;
BEGIN
    SELECT STDDEV(valor) INTO result
    FROM ai_metrics
    WHERE bar_id = p_bar_id
    AND nome_metrica = p_metric_name
    AND data_referencia >= CURRENT_DATE - p_window_days;
    
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para detectar tendência
CREATE OR REPLACE FUNCTION detect_trend(
    p_bar_id INTEGER,
    p_metric_name VARCHAR,
    p_days INTEGER DEFAULT 7
) RETURNS VARCHAR AS $$
DECLARE
    first_value DECIMAL;
    last_value DECIMAL;
    variation DECIMAL;
BEGIN
    -- Pegar primeiro valor do período
    SELECT valor INTO first_value
    FROM ai_metrics
    WHERE bar_id = p_bar_id
    AND nome_metrica = p_metric_name
    AND data_referencia >= CURRENT_DATE - p_days
    ORDER BY data_referencia ASC
    LIMIT 1;
    
    -- Pegar último valor do período
    SELECT valor INTO last_value
    FROM ai_metrics
    WHERE bar_id = p_bar_id
    AND nome_metrica = p_metric_name
    AND data_referencia >= CURRENT_DATE - p_days
    ORDER BY data_referencia DESC
    LIMIT 1;
    
    IF first_value IS NULL OR last_value IS NULL THEN
        RETURN 'estavel';
    END IF;
    
    variation := ((last_value - first_value) / first_value) * 100;
    
    IF variation > 5 THEN
        RETURN 'crescente';
    ELSIF variation < -5 THEN
        RETURN 'decrescente';
    ELSE
        RETURN 'estavel';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔐 RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_config ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança por bar_id
CREATE POLICY ai_insights_bar_policy ON ai_insights
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_predictions_bar_policy ON ai_predictions
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_recommendations_bar_policy ON ai_recommendations
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_anomalies_bar_policy ON ai_anomalies
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_models_bar_policy ON ai_models
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_metrics_bar_policy ON ai_metrics
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_agent_logs_bar_policy ON ai_agent_logs
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY ai_agent_config_bar_policy ON ai_agent_config
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

-- ========================================
-- 🌱 DADOS INICIAIS (SEEDS)
-- ========================================

-- Configuração padrão do agente IA
INSERT INTO ai_agent_config (
    bar_id, agente_ativo, frequencia_analise_minutos,
    gerar_insights, gerar_predicoes, detectar_anomalias, gerar_recomendacoes,
    notificar_insights, notificar_anomalias, notificar_predicoes_criticas
) VALUES 
(1, true, 60, true, true, true, true, true, true, true);

-- ========================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE ai_insights IS 'Insights gerados automaticamente pela IA';
COMMENT ON TABLE ai_predictions IS 'Previsões de Machine Learning';
COMMENT ON TABLE ai_recommendations IS 'Recomendações inteligentes de otimização';
COMMENT ON TABLE ai_anomalies IS 'Anomalias detectadas automaticamente';
COMMENT ON TABLE ai_models IS 'Modelos de Machine Learning versionados';
COMMENT ON TABLE ai_metrics IS 'Métricas calculadas automaticamente';
COMMENT ON TABLE ai_agent_logs IS 'Log de execução do agente IA';
COMMENT ON TABLE ai_agent_config IS 'Configurações do agente IA por bar';

COMMENT ON FUNCTION calculate_rolling_stddev IS 'Calcula desvio padrão móvel para detecção de anomalias';
COMMENT ON FUNCTION detect_trend IS 'Detecta tendência de uma métrica em período específico';

-- ========================================
-- ✅ SISTEMA AI ANALYTICS CRIADO
-- ========================================
-- Total: 8 tabelas especializadas para IA
-- Recursos: Insights, Previsões, Recomendações, Anomalias
-- Agente: Background processing automático
-- Segurança: RLS habilitado
-- Performance: Índices otimizados
-- Pronto para: Implementação do agente IA
-- ======================================== 