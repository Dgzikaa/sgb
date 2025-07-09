-- =====================================================
-- SISTEMA COMPLETO DE CHECKLISTS - DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USUARIOS E PERMISSOES
-- =====================================================

-- Enum para níveis de acesso
CREATE TYPE nivel_acesso_enum AS ENUM ('admin', 'gerente', 'supervisor', 'funcionario');

-- Enum para status de usuário
CREATE TYPE status_usuario_enum AS ENUM ('ativo', 'inativo', 'suspenso');

-- Tabela de usuários do sistema
CREATE TABLE usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    setor VARCHAR(50),
    nivel_acesso nivel_acesso_enum NOT NULL DEFAULT 'funcionario',
    password_hash TEXT NOT NULL,
    status status_usuario_enum NOT NULL DEFAULT 'ativo',
    foto_perfil TEXT,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES usuarios_sistema(id),
    bar_id INTEGER REFERENCES bars(id)
);

-- Tabela de permissões por módulo
CREATE TABLE permissoes_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
    modulo VARCHAR(50) NOT NULL, -- 'checklists', 'relatorios', 'admin', etc.
    permissoes JSONB NOT NULL DEFAULT '{}', -- {read: true, write: false, delete: false}
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CHECKLISTS E ESTRUTURA
-- =====================================================

-- Enum para tipos de checklist
CREATE TYPE tipo_checklist_enum AS ENUM ('abertura', 'fechamento', 'manutencao', 'qualidade', 'seguranca', 'limpeza', 'auditoria');

-- Enum para frequência
CREATE TYPE frequencia_enum AS ENUM ('diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'conforme_necessario');

-- Enum para prioridade
CREATE TYPE prioridade_enum AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Enum para status do checklist
CREATE TYPE status_checklist_enum AS ENUM ('ativo', 'inativo', 'rascunho', 'arquivado');

-- Tabela principal de checklists
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    setor VARCHAR(50) NOT NULL,
    tipo tipo_checklist_enum NOT NULL,
    frequencia frequencia_enum NOT NULL,
    prioridade prioridade_enum NOT NULL DEFAULT 'media',
    tempo_estimado INTEGER NOT NULL DEFAULT 30, -- em minutos
    responsavel_padrao VARCHAR(100),
    status status_checklist_enum NOT NULL DEFAULT 'rascunho',
    versao INTEGER NOT NULL DEFAULT 1,
    eh_template BOOLEAN NOT NULL DEFAULT false,
    template_origem UUID REFERENCES checklists(id),
    configuracoes JSONB DEFAULT '{}', -- configurações específicas
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    UNIQUE(bar_id, nome, versao)
);

-- Tabela de seções dos checklists
CREATE TABLE checklist_secoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20) NOT NULL DEFAULT 'bg-blue-500',
    ordem INTEGER NOT NULL,
    configuracoes JSONB DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum para tipos de campo
CREATE TYPE tipo_campo_enum AS ENUM ('texto', 'numero', 'sim_nao', 'data', 'assinatura', 'foto_camera', 'foto_upload', 'avaliacao', 'multipla_escolha', 'checkbox_list');

-- Tabela de itens dos checklists
CREATE TABLE checklist_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secao_id UUID NOT NULL REFERENCES checklist_secoes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo tipo_campo_enum NOT NULL,
    obrigatorio BOOLEAN NOT NULL DEFAULT false,
    ordem INTEGER NOT NULL,
    opcoes JSONB DEFAULT '{}', -- configurações específicas do campo
    condicional JSONB DEFAULT NULL, -- lógica condicional
    validacao JSONB DEFAULT '{}', -- regras de validação
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. AGENDAMENTO E ATRIBUIÇÕES
-- =====================================================

-- Enum para status de agendamento
CREATE TYPE status_agendamento_enum AS ENUM ('agendado', 'executando', 'concluido', 'atrasado', 'cancelado');

-- Tabela de agendamentos
CREATE TABLE checklist_agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id),
    responsavel_id UUID REFERENCES usuarios_sistema(id),
    data_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status status_agendamento_enum NOT NULL DEFAULT 'agendado',
    prioridade prioridade_enum NOT NULL DEFAULT 'media',
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- Tabela de recorrência para agendamentos automáticos
CREATE TABLE checklist_recorrencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id),
    frequencia frequencia_enum NOT NULL,
    hora_execucao TIME NOT NULL,
    dias_semana INTEGER[], -- array de dias da semana (0=domingo, 6=sábado)
    dia_mes INTEGER, -- para recorrência mensal
    ativo BOOLEAN NOT NULL DEFAULT true,
    proximo_agendamento TIMESTAMP WITH TIME ZONE,
    configuracoes JSONB DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- =====================================================
-- 4. EXECUÇÕES E RESPOSTAS
-- =====================================================

-- Enum para status de execução
CREATE TYPE status_execucao_enum AS ENUM ('iniciado', 'em_andamento', 'concluido', 'cancelado', 'com_problemas');

-- Tabela de execuções de checklists
CREATE TABLE checklist_execucoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id),
    agendamento_id UUID REFERENCES checklist_agendamentos(id),
    responsavel_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    status status_execucao_enum NOT NULL DEFAULT 'iniciado',
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concluido_em TIMESTAMP WITH TIME ZONE,
    tempo_execucao INTEGER, -- em minutos
    total_itens INTEGER NOT NULL DEFAULT 0,
    itens_ok INTEGER NOT NULL DEFAULT 0,
    itens_problema INTEGER NOT NULL DEFAULT 0,
    itens_na INTEGER NOT NULL DEFAULT 0,
    nota_geral DECIMAL(3,1), -- 0.0 a 10.0
    observacoes_gerais TEXT,
    localizacao JSONB, -- GPS coordinates se disponível
    dispositivo_info JSONB, -- informações do dispositivo
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- Tabela de respostas individuais
CREATE TABLE checklist_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execucao_id UUID NOT NULL REFERENCES checklist_execucoes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES checklist_itens(id),
    valor JSONB, -- valor da resposta (flexível para diferentes tipos)
    observacoes TEXT,
    arquivos TEXT[], -- URLs de fotos/assinaturas
    status VARCHAR(20) NOT NULL DEFAULT 'ok', -- 'ok', 'problema', 'na'
    respondido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    localização JSONB -- GPS se necessário
);

-- =====================================================
-- 5. ARQUIVOS E MÍDIA
-- =====================================================

-- Tabela de arquivos (fotos, assinaturas, etc.)
CREATE TABLE checklist_arquivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resposta_id UUID REFERENCES checklist_respostas(id) ON DELETE CASCADE,
    execucao_id UUID REFERENCES checklist_execucoes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'foto', 'assinatura', 'documento'
    nome_original VARCHAR(255),
    nome_arquivo VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tamanho INTEGER, -- em bytes
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- =====================================================
-- 6. NOTIFICAÇÕES E ALERTAS
-- =====================================================

-- Enum para tipos de notificação
CREATE TYPE tipo_notificacao_enum AS ENUM ('lembrete', 'atraso', 'problema', 'conclusao', 'sistema');

-- Enum para status de notificação
CREATE TYPE status_notificacao_enum AS ENUM ('pendente', 'enviada', 'lida', 'erro');

-- Tabela de notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    tipo tipo_notificacao_enum NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    dados JSONB DEFAULT '{}', -- dados específicos da notificação
    status status_notificacao_enum NOT NULL DEFAULT 'pendente',
    canais TEXT[] NOT NULL DEFAULT ARRAY['app'], -- 'app', 'email', 'whatsapp', 'sms'
    agendada_para TIMESTAMP WITH TIME ZONE,
    enviada_em TIMESTAMP WITH TIME ZONE,
    lida_em TIMESTAMP WITH TIME ZONE,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- =====================================================
-- 7. AUDITORIA E LOGS
-- =====================================================

-- Enum para tipos de ação
CREATE TYPE tipo_acao_enum AS ENUM ('criar', 'editar', 'excluir', 'executar', 'cancelar', 'aprovar', 'rejeitar');

-- Tabela de auditoria
CREATE TABLE auditoria_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    tipo_acao tipo_acao_enum NOT NULL,
    tabela_afetada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id)
);

-- =====================================================
-- 8. TEMPLATES E BIBLIOTECA
-- =====================================================

-- Tabela de categorias de templates
CREATE TABLE template_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    cor VARCHAR(20),
    ordem INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tags para templates
CREATE TABLE template_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(20) DEFAULT 'bg-gray-500',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionamento many-to-many entre checklists e tags
CREATE TABLE checklist_tags (
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES template_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (checklist_id, tag_id)
);

-- =====================================================
-- 9. ANALYTICS E MÉTRICAS
-- =====================================================

-- Tabela de métricas agregadas (para performance)
CREATE TABLE checklist_metricas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id),
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    total_execucoes INTEGER NOT NULL DEFAULT 0,
    execucoes_no_prazo INTEGER NOT NULL DEFAULT 0,
    execucoes_atrasadas INTEGER NOT NULL DEFAULT 0,
    tempo_medio_execucao INTEGER, -- em minutos
    nota_media DECIMAL(3,1),
    problemas_encontrados INTEGER NOT NULL DEFAULT 0,
    dados_detalhados JSONB DEFAULT '{}',
    calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    UNIQUE(checklist_id, periodo_inicio, periodo_fim)
);

-- =====================================================
-- 10. INTEGRAÇÕES EXTERNAS
-- =====================================================

-- Tabela de configurações de integrações
CREATE TABLE integracoes_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'webhook', 'api'
    ativo BOOLEAN NOT NULL DEFAULT false,
    configuracao JSONB NOT NULL DEFAULT '{}',
    credenciais JSONB NOT NULL DEFAULT '{}', -- criptografado
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bar_id INTEGER NOT NULL REFERENCES bars(id),
    UNIQUE(bar_id, nome, tipo)
);

-- Log de integrações
CREATE TABLE integracoes_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integracao_id UUID NOT NULL REFERENCES integracoes_config(id),
    tipo_evento VARCHAR(50) NOT NULL,
    dados_enviados JSONB,
    resposta JSONB,
    sucesso BOOLEAN NOT NULL,
    erro TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX idx_usuarios_sistema_email ON usuarios_sistema(email);
CREATE INDEX idx_usuarios_sistema_bar_id ON usuarios_sistema(bar_id);
CREATE INDEX idx_usuarios_sistema_setor ON usuarios_sistema(setor);

-- Checklists
CREATE INDEX idx_checklists_bar_id ON checklists(bar_id);
CREATE INDEX idx_checklists_setor ON checklists(setor);
CREATE INDEX idx_checklists_tipo ON checklists(tipo);
CREATE INDEX idx_checklists_status ON checklists(status);

-- Execuções
CREATE INDEX idx_checklist_execucoes_checklist_id ON checklist_execucoes(checklist_id);
CREATE INDEX idx_checklist_execucoes_responsavel_id ON checklist_execucoes(responsavel_id);
CREATE INDEX idx_checklist_execucoes_bar_id ON checklist_execucoes(bar_id);
CREATE INDEX idx_checklist_execucoes_iniciado_em ON checklist_execucoes(iniciado_em);
CREATE INDEX idx_checklist_execucoes_status ON checklist_execucoes(status);

-- Agendamentos
CREATE INDEX idx_checklist_agendamentos_data_agendada ON checklist_agendamentos(data_agendada);
CREATE INDEX idx_checklist_agendamentos_responsavel_id ON checklist_agendamentos(responsavel_id);
CREATE INDEX idx_checklist_agendamentos_status ON checklist_agendamentos(status);

-- Notificações
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_status ON notificacoes(status);
CREATE INDEX idx_notificacoes_agendada_para ON notificacoes(agendada_para);

-- Auditoria
CREATE INDEX idx_auditoria_checklists_usuario_id ON auditoria_checklists(usuario_id);
CREATE INDEX idx_auditoria_checklists_criado_em ON auditoria_checklists(criado_em);
CREATE INDEX idx_auditoria_checklists_tabela_registro ON auditoria_checklists(tabela_afetada, registro_id);

-- =====================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Função para trigger de auditoria
CREATE OR REPLACE FUNCTION trigger_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_checklists (
        usuario_id,
        tipo_acao,
        tabela_afetada,
        registro_id,
        dados_anteriores,
        dados_novos,
        bar_id
    ) VALUES (
        COALESCE(current_setting('app.current_user_id', true)::UUID, 
                (SELECT id FROM usuarios_sistema WHERE nivel_acesso = 'admin' LIMIT 1)),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'criar'::tipo_acao_enum
            WHEN TG_OP = 'UPDATE' THEN 'editar'::tipo_acao_enum
            WHEN TG_OP = 'DELETE' THEN 'excluir'::tipo_acao_enum
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        COALESCE(NEW.bar_id, OLD.bar_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoria nas tabelas principais
CREATE TRIGGER auditoria_checklists_trigger
    AFTER INSERT OR UPDATE OR DELETE ON checklists
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

CREATE TRIGGER auditoria_execucoes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON checklist_execucoes
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para calcular nota geral de uma execução
CREATE OR REPLACE FUNCTION calcular_nota_execucao(execucao_uuid UUID)
RETURNS DECIMAL(3,1) AS $$
DECLARE
    total_obrigatorios INTEGER;
    total_ok INTEGER;
    total_problemas INTEGER;
    nota DECIMAL(3,1);
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE ci.obrigatorio = true),
        COUNT(*) FILTER (WHERE cr.status = 'ok' AND ci.obrigatorio = true),
        COUNT(*) FILTER (WHERE cr.status = 'problema')
    INTO total_obrigatorios, total_ok, total_problemas
    FROM checklist_respostas cr
    JOIN checklist_itens ci ON cr.item_id = ci.id
    WHERE cr.execucao_id = execucao_uuid;
    
    -- Fórmula: (itens_ok / total_obrigatorios) * 10 - (problemas * 0.5)
    IF total_obrigatorios > 0 THEN
        nota := ((total_ok::DECIMAL / total_obrigatorios) * 10) - (total_problemas * 0.5);
        nota := GREATEST(0, LEAST(10, nota)); -- Entre 0 e 10
    ELSE
        nota := 10.0;
    END IF;
    
    RETURN nota;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar próximos agendamentos automáticos
CREATE OR REPLACE FUNCTION gerar_proximo_agendamento(recorrencia_uuid UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    rec RECORD;
    proximo TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT * INTO rec FROM checklist_recorrencia WHERE id = recorrencia_uuid;
    
    CASE rec.frequencia
        WHEN 'diaria' THEN
            proximo := (CURRENT_DATE + INTERVAL '1 day') + rec.hora_execucao;
        WHEN 'semanal' THEN
            proximo := (CURRENT_DATE + INTERVAL '7 days') + rec.hora_execucao;
        WHEN 'mensal' THEN
            proximo := (CURRENT_DATE + INTERVAL '1 month') + rec.hora_execucao;
        ELSE
            proximo := NULL;
    END CASE;
    
    RETURN proximo;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir categorias padrão de templates
INSERT INTO template_categorias (nome, descricao, icone, cor, ordem) VALUES
('Abertura', 'Templates para procedimentos de abertura', 'sunrise', 'bg-green-500', 1),
('Fechamento', 'Templates para procedimentos de fechamento', 'sunset', 'bg-orange-500', 2),
('Limpeza', 'Templates para procedimentos de limpeza', 'cleaning', 'bg-blue-500', 3),
('Segurança', 'Templates para verificações de segurança', 'shield', 'bg-red-500', 4),
('Manutenção', 'Templates para manutenção preventiva', 'wrench', 'bg-purple-500', 5),
('Qualidade', 'Templates para controle de qualidade', 'star', 'bg-yellow-500', 6);

-- Inserir tags padrão
INSERT INTO template_tags (nome, cor) VALUES
('Cozinha', 'bg-orange-500'),
('Bar', 'bg-blue-500'),
('Salão', 'bg-green-500'),
('Recebimento', 'bg-purple-500'),
('Segurança', 'bg-red-500'),
('Administrativo', 'bg-gray-500'),
('Diário', 'bg-indigo-500'),
('Semanal', 'bg-pink-500'),
('Mensal', 'bg-teal-500'),
('Crítico', 'bg-red-600'),
('Opcional', 'bg-gray-400');

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE checklists IS 'Tabela principal dos checklists - define estrutura e configurações';
COMMENT ON TABLE checklist_execucoes IS 'Registra cada execução/preenchimento de um checklist';
COMMENT ON TABLE checklist_respostas IS 'Armazena as respostas individuais de cada item do checklist';
COMMENT ON TABLE notificacoes IS 'Sistema de notificações multi-canal (app, email, WhatsApp)';
COMMENT ON TABLE auditoria_checklists IS 'Log completo de todas as ações realizadas no sistema';

-- =====================================================
-- SCHEMA COMPLETO CRIADO COM SUCESSO!
-- ===================================================== 