-- =====================================================
-- 📱 ESQUEMA DE BANCO DE DADOS PARA WHATSAPP
-- =====================================================
-- 
-- Execute este script no seu banco Supabase para criar
-- as tabelas necessárias para a integração WhatsApp
-- 
-- =====================================================

-- Tabela de configurações do WhatsApp por usuário
CREATE TABLE IF NOT EXISTS whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'evolution',
    enabled BOOLEAN DEFAULT false,
    phone_number VARCHAR(20) NOT NULL,
    
    -- Configurações específicas do provedor
    api_url TEXT,
    api_key TEXT,
    instance_id VARCHAR(100),
    session_name VARCHAR(100),
    webhook_url TEXT,
    
    -- Configurações de envio
    settings JSONB DEFAULT '{
        "send_reminders": true,
        "send_alerts": true,
        "send_completions": false,
        "reminder_hours_before": 2,
        "alert_repeat_minutes": 30
    }',
    
    -- Templates personalizados (opcional)
    custom_templates JSONB DEFAULT '{}',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id), -- Um usuário pode ter apenas uma configuração
    CHECK (provider IN ('evolution', 'twilio', 'whatsapp_business', 'baileys')),
    CHECK (phone_number ~ '^[0-9]{10,15}$') -- Validação básica de telefone
);

-- Tabela de log de mensagens enviadas
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados da mensagem
    to_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    
    -- Metadados do envio
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    provider_response JSONB,
    
    -- Contexto (opcional)
    checklist_id UUID,
    execution_id UUID,
    alert_id UUID,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CHECK (type IN ('text', 'template', 'reminder', 'alert', 'completion', 'share')),
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

-- Tabela de lembretes agendados
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados do lembrete
    checklist_id UUID NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    reminder_type VARCHAR(20) DEFAULT 'scheduled',
    
    -- Agendamento
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Dados do checklist (para mensagem)
    checklist_data JSONB NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (reminder_type IN ('scheduled', 'alert', 'overdue')),
    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    CHECK (attempts >= 0 AND attempts <= 5)
);

-- Tabela de alertas de atraso
CREATE TABLE IF NOT EXISTS whatsapp_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados do alerta
    checklist_id UUID NOT NULL,
    execution_id UUID,
    alert_level VARCHAR(20) DEFAULT 'medium',
    
    -- Dados do atraso
    expected_time TIMESTAMP WITH TIME ZONE NOT NULL,
    delay_minutes INTEGER NOT NULL,
    
    -- Notificações
    phone_numbers TEXT[] NOT NULL,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    repeat_interval_minutes INTEGER DEFAULT 30,
    max_repeats INTEGER DEFAULT 3,
    repeat_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
    CHECK (status IN ('active', 'resolved', 'cancelled')),
    CHECK (delay_minutes >= 0),
    CHECK (repeat_count >= 0 AND repeat_count <= max_repeats)
);

-- =====================================================
-- 🔧 ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_user_id ON whatsapp_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_enabled ON whatsapp_configs(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_checklist_id ON whatsapp_messages(checklist_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_user_id ON whatsapp_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_scheduled_for ON whatsapp_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_status ON whatsapp_reminders(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_checklist_id ON whatsapp_reminders(checklist_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_user_id ON whatsapp_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_status ON whatsapp_alerts(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_checklist_id ON whatsapp_alerts(checklist_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_expected_time ON whatsapp_alerts(expected_time);

-- =====================================================
-- 🔄 TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas relevantes
CREATE TRIGGER update_whatsapp_configs_updated_at 
    BEFORE UPDATE ON whatsapp_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔒 POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_configs
CREATE POLICY "Users can view their own WhatsApp config" ON whatsapp_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp config" ON whatsapp_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp config" ON whatsapp_configs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp config" ON whatsapp_configs
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para whatsapp_messages
CREATE POLICY "Users can view their own WhatsApp messages" ON whatsapp_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para whatsapp_reminders
CREATE POLICY "Users can view their own WhatsApp reminders" ON whatsapp_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp reminders" ON whatsapp_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp reminders" ON whatsapp_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp reminders" ON whatsapp_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para whatsapp_alerts
CREATE POLICY "Users can view their own WhatsApp alerts" ON whatsapp_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp alerts" ON whatsapp_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp alerts" ON whatsapp_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp alerts" ON whatsapp_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 📊 VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de mensagens
CREATE OR REPLACE VIEW whatsapp_message_stats AS
SELECT 
    user_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_messages,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_messages,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_messages,
    COUNT(*) FILTER (WHERE type = 'reminder') as reminder_messages,
    COUNT(*) FILTER (WHERE type = 'alert') as alert_messages,
    COUNT(*) FILTER (WHERE type = 'completion') as completion_messages,
    COUNT(*) FILTER (WHERE type = 'share') as share_messages,
    MAX(sent_at) as last_sent_at,
    DATE_TRUNC('day', sent_at) as day
FROM whatsapp_messages
GROUP BY user_id, DATE_TRUNC('day', sent_at);

-- View para lembretes pendentes
CREATE OR REPLACE VIEW whatsapp_pending_reminders AS
SELECT 
    r.*,
    c.titulo as checklist_title,
    c.categoria as checklist_category
FROM whatsapp_reminders r
LEFT JOIN checklists c ON r.checklist_id = c.id
WHERE r.status = 'pending' 
    AND r.scheduled_for <= NOW()
    AND r.attempts < 5;

-- View para alertas ativos
CREATE OR REPLACE VIEW whatsapp_active_alerts AS
SELECT 
    a.*,
    c.titulo as checklist_title,
    c.categoria as checklist_category,
    EXTRACT(EPOCH FROM (NOW() - a.expected_time))/60 as current_delay_minutes
FROM whatsapp_alerts a
LEFT JOIN checklists c ON a.checklist_id = c.id
WHERE a.status = 'active'
    AND (a.last_sent_at IS NULL OR 
         a.last_sent_at + INTERVAL '1 minute' * a.repeat_interval_minutes <= NOW())
    AND a.repeat_count < a.max_repeats;

-- =====================================================
-- 🔧 FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar lembrete automático
CREATE OR REPLACE FUNCTION create_whatsapp_reminder(
    p_user_id UUID,
    p_checklist_id UUID,
    p_phone_number VARCHAR(20),
    p_scheduled_for TIMESTAMP WITH TIME ZONE,
    p_checklist_data JSONB
) RETURNS UUID AS $$
DECLARE
    reminder_id UUID;
BEGIN
    INSERT INTO whatsapp_reminders (
        user_id, checklist_id, phone_number, 
        scheduled_for, checklist_data
    ) VALUES (
        p_user_id, p_checklist_id, p_phone_number, 
        p_scheduled_for, p_checklist_data
    ) RETURNING id INTO reminder_id;
    
    RETURN reminder_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar alerta de atraso
CREATE OR REPLACE FUNCTION create_whatsapp_alert(
    p_user_id UUID,
    p_checklist_id UUID,
    p_expected_time TIMESTAMP WITH TIME ZONE,
    p_delay_minutes INTEGER,
    p_phone_numbers TEXT[],
    p_alert_level VARCHAR(20) DEFAULT 'medium'
) RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO whatsapp_alerts (
        user_id, checklist_id, expected_time, 
        delay_minutes, phone_numbers, alert_level
    ) VALUES (
        p_user_id, p_checklist_id, p_expected_time, 
        p_delay_minutes, p_phone_numbers, p_alert_level
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar lembrete como executado
CREATE OR REPLACE FUNCTION mark_reminder_executed(
    p_reminder_id UUID,
    p_success BOOLEAN DEFAULT true
) RETURNS VOID AS $$
BEGIN
    UPDATE whatsapp_reminders 
    SET 
        executed_at = NOW(),
        status = CASE WHEN p_success THEN 'sent' ELSE 'failed' END,
        attempts = attempts + 1,
        last_attempt_at = NOW()
    WHERE id = p_reminder_id;
END;
$$ LANGUAGE plpgsql;

-- Função para resolver alerta
CREATE OR REPLACE FUNCTION resolve_whatsapp_alert(
    p_alert_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE whatsapp_alerts 
    SET 
        status = 'resolved',
        resolved_at = NOW()
    WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 📝 COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE whatsapp_configs IS 'Configurações do WhatsApp por usuário';
COMMENT ON TABLE whatsapp_messages IS 'Log de todas as mensagens enviadas via WhatsApp';
COMMENT ON TABLE whatsapp_reminders IS 'Lembretes agendados para envio via WhatsApp';
COMMENT ON TABLE whatsapp_alerts IS 'Alertas de atraso para checklists';

COMMENT ON COLUMN whatsapp_configs.provider IS 'Provedor WhatsApp: evolution, twilio, whatsapp_business, baileys';
COMMENT ON COLUMN whatsapp_configs.settings IS 'Configurações JSON: send_reminders, send_alerts, etc.';
COMMENT ON COLUMN whatsapp_messages.type IS 'Tipo da mensagem: text, reminder, alert, completion, share';
COMMENT ON COLUMN whatsapp_reminders.reminder_type IS 'Tipo do lembrete: scheduled, alert, overdue';
COMMENT ON COLUMN whatsapp_alerts.alert_level IS 'Nível do alerta: low, medium, high, critical';

-- =====================================================
-- 🧪 DADOS DE TESTE (OPCIONAL)
-- =====================================================

-- Descomentar para inserir dados de teste
/*
INSERT INTO whatsapp_configs (user_id, provider, enabled, phone_number, api_url, api_key, instance_id) VALUES
(
    (SELECT id FROM auth.users LIMIT 1),
    'evolution',
    true,
    '5511999999999',
    'https://api.evolution.com',
    'test-api-key',
    'sgb-instance'
);
*/

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================

-- Para aplicar este schema:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole este script
-- 4. Execute
-- 5. Verifique se as tabelas foram criadas corretamente 