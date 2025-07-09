-- ========================================
-- 📱 WHATSAPP BUSINESS INTEGRATION SYSTEM
-- ========================================
-- Sistema completo para integração com WhatsApp Business API
-- Integrado com sistema de notificações universal existente
-- Versão: 1.0 | Data: 2024

-- ========================================
-- 🔧 CONFIGURAÇÕES DO WHATSAPP BUSINESS
-- ========================================
CREATE TABLE whatsapp_configuracoes (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Configurações da API
    phone_number_id VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_verify_token VARCHAR(100) NOT NULL,
    webhook_url TEXT,
    
    -- Status e controles
    ativo BOOLEAN DEFAULT false,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    rate_limit_per_minute INTEGER DEFAULT 80,
    
    -- Configurações de templates
    template_prefix VARCHAR(20) DEFAULT 'sgb_',
    idioma VARCHAR(5) DEFAULT 'pt_BR',
    
    -- Configurações de retry
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    
    -- Índices únicos
    UNIQUE(bar_id)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_config_bar ON whatsapp_configuracoes(bar_id);
CREATE INDEX idx_whatsapp_config_ativo ON whatsapp_configuracoes(ativo);

-- ========================================
-- 📞 CONTATOS WHATSAPP DOS USUÁRIOS
-- ========================================
CREATE TABLE whatsapp_contatos (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios_bar(id) ON DELETE CASCADE,
    
    -- Dados do contato
    numero_whatsapp VARCHAR(20) NOT NULL,
    nome_contato VARCHAR(100),
    
    -- Verificação e status
    verificado BOOLEAN DEFAULT false,
    verificado_em TIMESTAMP WITH TIME ZONE,
    bloqueado BOOLEAN DEFAULT false,
    bloqueado_em TIMESTAMP WITH TIME ZONE,
    bloqueado_motivo TEXT,
    
    -- Preferências de notificação
    aceita_notificacoes BOOLEAN DEFAULT true,
    aceita_lembretes BOOLEAN DEFAULT true,
    aceita_relatorios BOOLEAN DEFAULT false,
    
    -- Horários permitidos
    horario_inicio TIME DEFAULT '08:00',
    horario_fim TIME DEFAULT '18:00',
    dias_semana INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Domingo
    
    -- Estatísticas
    total_mensagens_enviadas INTEGER DEFAULT 0,
    total_mensagens_entregues INTEGER DEFAULT 0,
    total_mensagens_lidas INTEGER DEFAULT 0,
    ultima_interacao TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, usuario_id),
    UNIQUE(bar_id, numero_whatsapp)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_contatos_bar_usuario ON whatsapp_contatos(bar_id, usuario_id);
CREATE INDEX idx_whatsapp_contatos_numero ON whatsapp_contatos(numero_whatsapp);
CREATE INDEX idx_whatsapp_contatos_verificado ON whatsapp_contatos(verificado);
CREATE INDEX idx_whatsapp_contatos_bloqueado ON whatsapp_contatos(bloqueado);

-- ========================================
-- 💬 LOG DE MENSAGENS WHATSAPP
-- ========================================
CREATE TABLE whatsapp_mensagens (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    contato_id INTEGER REFERENCES whatsapp_contatos(id) ON DELETE CASCADE,
    notificacao_id INTEGER REFERENCES notificacoes(id) ON DELETE SET NULL,
    
    -- Identificadores WhatsApp
    whatsapp_message_id VARCHAR(100),
    waba_id VARCHAR(50),
    
    -- Conteúdo da mensagem
    tipo_mensagem VARCHAR(20) NOT NULL, -- text, template, interactive
    template_name VARCHAR(100),
    template_language VARCHAR(10),
    conteudo TEXT NOT NULL,
    
    -- Dados estruturados
    template_parameters JSONB,
    interactive_data JSONB,
    media_data JSONB,
    
    -- Status de entrega
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    status_updated_at TIMESTAMP WITH TIME ZONE,
    error_code VARCHAR(10),
    error_message TEXT,
    
    -- Estatísticas
    tentativas INTEGER DEFAULT 0,
    enviado_em TIMESTAMP WITH TIME ZONE,
    entregue_em TIMESTAMP WITH TIME ZONE,
    lido_em TIMESTAMP WITH TIME ZONE,
    
    -- Contexto
    checklist_id INTEGER,
    checklist_execucao_id INTEGER,
    modulo VARCHAR(50), -- checklists, metas, contaazul, reports, etc
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_whatsapp_mensagens_bar ON whatsapp_mensagens(bar_id);
CREATE INDEX idx_whatsapp_mensagens_contato ON whatsapp_mensagens(contato_id);
CREATE INDEX idx_whatsapp_mensagens_notificacao ON whatsapp_mensagens(notificacao_id);
CREATE INDEX idx_whatsapp_mensagens_whatsapp_id ON whatsapp_mensagens(whatsapp_message_id);
CREATE INDEX idx_whatsapp_mensagens_status ON whatsapp_mensagens(status);
CREATE INDEX idx_whatsapp_mensagens_modulo ON whatsapp_mensagens(modulo);
CREATE INDEX idx_whatsapp_mensagens_created ON whatsapp_mensagens(created_at);

-- ========================================
-- 📝 TEMPLATES WHATSAPP PERSONALIZADOS
-- ========================================
CREATE TABLE whatsapp_templates (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Identificação do template
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    category VARCHAR(50) NOT NULL, -- UTILITY, MARKETING, AUTHENTICATION
    language VARCHAR(10) DEFAULT 'pt_BR',
    
    -- Status no WhatsApp
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DISABLED
    whatsapp_template_id VARCHAR(100),
    rejection_reason TEXT,
    
    -- Conteúdo do template
    header_type VARCHAR(20), -- TEXT, IMAGE, VIDEO, DOCUMENT
    header_text TEXT,
    header_media_url TEXT,
    
    body_text TEXT NOT NULL,
    footer_text TEXT,
    
    -- Parâmetros dinâmicos
    parameters JSONB DEFAULT '[]',
    variables_count INTEGER DEFAULT 0,
    
    -- Botões e interatividade
    buttons JSONB DEFAULT '[]',
    has_buttons BOOLEAN DEFAULT false,
    
    -- Configurações de uso
    modulo VARCHAR(50), -- checklists, metas, contaazul, reports
    trigger_event VARCHAR(100), -- lembrete_agendamento, checklist_atrasado, etc
    auto_send BOOLEAN DEFAULT false,
    
    -- Estatísticas
    total_enviado INTEGER DEFAULT 0,
    total_entregue INTEGER DEFAULT 0,
    total_lido INTEGER DEFAULT 0,
    taxa_entrega DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(bar_id, name, language)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_templates_bar ON whatsapp_templates(bar_id);
CREATE INDEX idx_whatsapp_templates_name ON whatsapp_templates(name);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_modulo ON whatsapp_templates(modulo);
CREATE INDEX idx_whatsapp_templates_trigger ON whatsapp_templates(trigger_event);

-- ========================================
-- 🔗 LOG DE WEBHOOKS WHATSAPP
-- ========================================
CREATE TABLE whatsapp_webhooks (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Dados do webhook
    whatsapp_message_id VARCHAR(100),
    webhook_type VARCHAR(50) NOT NULL, -- message_status, message_received, etc
    payload JSONB NOT NULL,
    
    -- Status de processamento
    processado BOOLEAN DEFAULT false,
    processado_em TIMESTAMP WITH TIME ZONE,
    erro_processamento TEXT,
    
    -- Metadados
    ip_origem INET,
    user_agent TEXT,
    signature_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_whatsapp_webhooks_bar ON whatsapp_webhooks(bar_id);
CREATE INDEX idx_whatsapp_webhooks_message_id ON whatsapp_webhooks(whatsapp_message_id);
CREATE INDEX idx_whatsapp_webhooks_type ON whatsapp_webhooks(webhook_type);
CREATE INDEX idx_whatsapp_webhooks_processado ON whatsapp_webhooks(processado);
CREATE INDEX idx_whatsapp_webhooks_received ON whatsapp_webhooks(received_at);

-- ========================================
-- 📊 ESTATÍSTICAS WHATSAPP AGREGADAS
-- ========================================
CREATE TABLE whatsapp_stats (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id) ON DELETE CASCADE,
    
    -- Período das estatísticas
    data_referencia DATE NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    
    -- Métricas de mensagens
    total_enviadas INTEGER DEFAULT 0,
    total_entregues INTEGER DEFAULT 0,
    total_lidas INTEGER DEFAULT 0,
    total_falharam INTEGER DEFAULT 0,
    
    -- Taxas de conversão
    taxa_entrega DECIMAL(5,2) DEFAULT 0,
    taxa_leitura DECIMAL(5,2) DEFAULT 0,
    taxa_falha DECIMAL(5,2) DEFAULT 0,
    
    -- Métricas por módulo
    checklists_enviados INTEGER DEFAULT 0,
    metas_enviadas INTEGER DEFAULT 0,
    relatorios_enviados INTEGER DEFAULT 0,
    sistema_enviados INTEGER DEFAULT 0,
    
    -- Métricas de templates
    templates_utilizados INTEGER DEFAULT 0,
    template_mais_usado VARCHAR(100),
    template_melhor_taxa VARCHAR(100),
    
    -- Métricas de usuários
    usuarios_ativos INTEGER DEFAULT 0,
    usuarios_bloqueados INTEGER DEFAULT 0,
    novos_contatos INTEGER DEFAULT 0,
    
    -- Métricas de tempo
    tempo_medio_entrega INTERVAL,
    tempo_medio_leitura INTERVAL,
    horario_pico_envio TIME,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bar_id, data_referencia, periodo)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_stats_bar ON whatsapp_stats(bar_id);
CREATE INDEX idx_whatsapp_stats_data ON whatsapp_stats(data_referencia);
CREATE INDEX idx_whatsapp_stats_periodo ON whatsapp_stats(periodo);
CREATE INDEX idx_whatsapp_stats_bar_data ON whatsapp_stats(bar_id, data_referencia);

-- ========================================
-- 🔄 TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
CREATE TRIGGER trigger_whatsapp_configuracoes_updated_at
    BEFORE UPDATE ON whatsapp_configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_contatos_updated_at
    BEFORE UPDATE ON whatsapp_contatos
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_mensagens_updated_at
    BEFORE UPDATE ON whatsapp_mensagens
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- ========================================
-- 📈 FUNÇÃO PARA CALCULAR ESTATÍSTICAS
-- ========================================
CREATE OR REPLACE FUNCTION calcular_whatsapp_stats(
    p_bar_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE
) RETURNS TABLE (
    total_enviadas BIGINT,
    total_entregues BIGINT,
    total_lidas BIGINT,
    total_falharam BIGINT,
    taxa_entrega DECIMAL,
    taxa_leitura DECIMAL,
    usuarios_ativos BIGINT,
    template_mais_usado TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as enviadas,
            COUNT(*) FILTER (WHERE status = 'delivered') as entregues,
            COUNT(*) FILTER (WHERE status = 'read') as lidas,
            COUNT(*) FILTER (WHERE status = 'failed') as falharam,
            COUNT(DISTINCT contato_id) as usuarios_unicos
        FROM whatsapp_mensagens wm
        WHERE wm.bar_id = p_bar_id
        AND DATE(wm.created_at) BETWEEN p_data_inicio AND p_data_fim
    ),
    template_popular AS (
        SELECT template_name
        FROM whatsapp_mensagens wm
        WHERE wm.bar_id = p_bar_id
        AND DATE(wm.created_at) BETWEEN p_data_inicio AND p_data_fim
        AND template_name IS NOT NULL
        GROUP BY template_name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.enviadas,
        s.entregues,
        s.lidas,
        s.falharam,
        CASE WHEN s.enviadas > 0 THEN ROUND((s.entregues::DECIMAL / s.enviadas * 100), 2) ELSE 0 END,
        CASE WHEN s.entregues > 0 THEN ROUND((s.lidas::DECIMAL / s.entregues * 100), 2) ELSE 0 END,
        s.usuarios_unicos,
        COALESCE(tp.template_name, 'N/A')
    FROM stats s
    CROSS JOIN template_popular tp;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🔐 RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE whatsapp_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_stats ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança por bar_id
CREATE POLICY whatsapp_configuracoes_bar_policy ON whatsapp_configuracoes
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY whatsapp_contatos_bar_policy ON whatsapp_contatos
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY whatsapp_mensagens_bar_policy ON whatsapp_mensagens
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY whatsapp_templates_bar_policy ON whatsapp_templates
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY whatsapp_webhooks_bar_policy ON whatsapp_webhooks
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

CREATE POLICY whatsapp_stats_bar_policy ON whatsapp_stats
    FOR ALL USING (bar_id = current_setting('app.current_bar_id')::INTEGER);

-- ========================================
-- 🌱 DADOS INICIAIS (SEEDS)
-- ========================================

-- Templates padrão para checklists
INSERT INTO whatsapp_templates (
    bar_id, name, display_name, category, body_text, 
    parameters, variables_count, modulo, trigger_event, auto_send
) VALUES 
-- Template para lembretes de checklist
(1, 'sgb_lembrete_checklist', 'Lembrete de Checklist', 'UTILITY',
'🔔 *{{1}}* precisa ser executado em {{2}} minutos!

📋 Checklist: *{{3}}*
⏰ Horário: {{4}}
🎯 Setor: {{5}}

Toque no link para executar:
{{6}}',
'[{"type": "text", "example": "João"}, {"type": "text", "example": "15"}, {"type": "text", "example": "Abertura da Loja"}, {"type": "text", "example": "08:00"}, {"type": "text", "example": "Cozinha"}, {"type": "text", "example": "https://sgb.com/checklist/123"}]',
6, 'checklists', 'lembrete_agendamento', true),

-- Template para checklist atrasado
(1, 'sgb_checklist_atrasado', 'Checklist Atrasado', 'UTILITY',
'⚠️ *Checklist em atraso!*

📋 {{1}} está atrasado há {{2}} horas
👤 Responsável: {{3}}
🎯 Setor: {{4}}

🚨 Execute agora para evitar impactos:
{{5}}',
'[{"type": "text", "example": "Limpeza Geral"}, {"type": "text", "example": "2"}, {"type": "text", "example": "Maria"}, {"type": "text", "example": "Limpeza"}, {"type": "text", "example": "https://sgb.com/checklist/456"}]',
5, 'checklists', 'checklist_atrasado', true),

-- Template para checklist concluído
(1, 'sgb_checklist_concluido', 'Checklist Concluído', 'UTILITY',
'✅ *Checklist concluído com sucesso!*

📋 {{1}}
👤 Executado por: {{2}}
📊 Pontuação: {{3}}%
⏱️ Concluído em: {{4}}

🎉 Parabéns pelo excelente trabalho!',
'[{"type": "text", "example": "Checklist de Abertura"}, {"type": "text", "example": "Carlos"}, {"type": "text", "example": "95"}, {"type": "text", "example": "08:45"}]',
4, 'checklists', 'checklist_concluido', false);

-- ========================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE whatsapp_configuracoes IS 'Configurações da integração WhatsApp Business por bar';
COMMENT ON TABLE whatsapp_contatos IS 'Contatos WhatsApp dos usuários com preferências';
COMMENT ON TABLE whatsapp_mensagens IS 'Log completo de todas as mensagens enviadas';
COMMENT ON TABLE whatsapp_templates IS 'Templates WhatsApp personalizados por módulo';
COMMENT ON TABLE whatsapp_webhooks IS 'Log de webhooks recebidos da API WhatsApp';
COMMENT ON TABLE whatsapp_stats IS 'Estatísticas agregadas de engajamento';

COMMENT ON FUNCTION calcular_whatsapp_stats IS 'Calcula estatísticas de WhatsApp para período específico';

-- ========================================
-- ✅ SISTEMA WHATSAPP BUSINESS CRIADO
-- ========================================
-- Total: 6 tabelas especializadas
-- Recursos: Templates, Webhooks, Estatísticas
-- Integração: Sistema de notificações universal
-- Segurança: RLS habilitado
-- Performance: Índices otimizados
-- Pronto para: Integração com APIs REST
-- ======================================== 