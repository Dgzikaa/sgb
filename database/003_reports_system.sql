-- =====================================================
-- SISTEMA DE RELATÓRIOS AVANÇADOS - SGB V2
-- Exportação PDF/Excel + Dashboards + Notificações
-- =====================================================

-- Tabela de templates de relatórios
CREATE TABLE IF NOT EXISTS relatorios_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50) NOT NULL, -- 'checklist', 'produtividade', 'compliance', 'custom'
  modulo VARCHAR(50) NOT NULL DEFAULT 'checklists', -- 'checklists', 'metas', 'financeiro', etc.
  
  -- Template do relatório
  tipo_relatorio VARCHAR(50) NOT NULL, -- 'tabular', 'dashboard', 'grafico', 'calendario'
  configuracao_sql TEXT NOT NULL, -- Query SQL do relatório
  configuracao_campos JSONB NOT NULL, -- Campos e formatação
  configuracao_filtros JSONB NOT NULL, -- Filtros disponíveis
  configuracao_visual JSONB, -- Cores, logos, layout
  
  -- Configurações de exportação
  formatos_suportados JSONB DEFAULT '["pdf", "excel", "csv"]',
  template_pdf TEXT, -- Template HTML para PDF
  configuracao_excel JSONB, -- Configurações específicas Excel
  
  -- Permissões
  publico BOOLEAN DEFAULT false,
  roles_permitidas JSONB DEFAULT '["admin", "financeiro"]',
  
  -- Metadata
  criado_por UUID REFERENCES usuarios_sistema(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  
  INDEX idx_relatorios_templates_categoria (categoria, ativo),
  INDEX idx_relatorios_templates_modulo (modulo, publico)
);

-- Tabela de relatórios personalizados por usuário
CREATE TABLE IF NOT EXISTS relatorios_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES usuarios_bar(bar_id),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  template_base_id UUID REFERENCES relatorios_templates(id),
  
  -- Proprietário
  criado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
  compartilhado_com JSONB, -- IDs de usuários ou roles que podem ver
  
  -- Configuração personalizada
  filtros_salvos JSONB NOT NULL, -- Filtros aplicados pelo usuário
  campos_selecionados JSONB NOT NULL, -- Quais campos incluir
  configuracao_visual JSONB, -- Personalizações visuais
  
  -- Agendamento automático
  agendamento_ativo BOOLEAN DEFAULT false,
  agendamento_frequencia VARCHAR(20), -- 'diario', 'semanal', 'mensal'
  agendamento_configuracao JSONB, -- Dias, horários, etc.
  proximo_agendamento TIMESTAMP WITH TIME ZONE,
  
  -- Notificações
  notificar_conclusao BOOLEAN DEFAULT true,
  notificar_usuarios JSONB, -- Quem recebe notificação quando pronto
  
  -- Metadata
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  
  INDEX idx_relatorios_personalizados_usuario (criado_por, ativo),
  INDEX idx_relatorios_personalizados_agendamento (agendamento_ativo, proximo_agendamento)
);

-- Tabela de execuções de relatórios
CREATE TABLE IF NOT EXISTS relatorios_execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES usuarios_bar(bar_id),
  
  -- Referência ao relatório
  relatorio_personalizado_id UUID REFERENCES relatorios_personalizados(id),
  template_id UUID REFERENCES relatorios_templates(id),
  
  -- Execução
  solicitado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
  tipo_execucao VARCHAR(20) NOT NULL, -- 'manual', 'agendada', 'api'
  
  -- Configuração da execução
  filtros_aplicados JSONB NOT NULL,
  campos_selecionados JSONB NOT NULL,
  formato_exportacao VARCHAR(10) NOT NULL, -- 'pdf', 'excel', 'csv'
  
  -- Status da execução
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluido', 'erro'
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concluido_em TIMESTAMP WITH TIME ZONE,
  
  -- Resultado
  total_registros INTEGER,
  tempo_execucao_ms INTEGER,
  tamanho_arquivo_kb INTEGER,
  arquivo_url TEXT, -- URL do arquivo gerado
  dados_cache JSONB, -- Cache dos dados para reexibição rápida
  
  -- Erro
  erro_detalhes TEXT,
  tentativas INTEGER DEFAULT 0,
  
  -- Notificação
  notificacao_enviada BOOLEAN DEFAULT false,
  notificacao_id UUID REFERENCES notificacoes(id),
  
  -- Metadata
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  INDEX idx_relatorios_execucoes_status (status, iniciado_em DESC),
  INDEX idx_relatorios_execucoes_usuario (solicitado_por, iniciado_em DESC),
  INDEX idx_relatorios_execucoes_expiracao (expires_at)
);

-- Tabela de dashboards personalizados
CREATE TABLE IF NOT EXISTS dashboards_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES usuarios_bar(bar_id),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Proprietário
  criado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
  compartilhado_com JSONB, -- IDs de usuários ou roles
  
  -- Layout do dashboard
  layout_configuracao JSONB NOT NULL, -- Grid layout, posições dos widgets
  widgets JSONB NOT NULL, -- Lista de widgets e suas configurações
  
  -- Configurações globais
  auto_refresh_segundos INTEGER DEFAULT 300, -- Refresh automático (5min padrão)
  tema VARCHAR(20) DEFAULT 'claro', -- 'claro', 'escuro', 'auto'
  
  -- Permissões
  publico BOOLEAN DEFAULT false,
  roles_permitidas JSONB DEFAULT '["admin", "financeiro"]',
  
  -- Metadata
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  
  INDEX idx_dashboards_usuario (criado_por, ativo),
  INDEX idx_dashboards_publico (publico, ativo)
);

-- Tabela de widgets de dashboard
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50) NOT NULL, -- 'kpi', 'grafico', 'tabela', 'mapa', 'gauge'
  
  -- Template do widget
  tipo_widget VARCHAR(50) NOT NULL, -- 'number', 'chart_line', 'chart_bar', 'table', 'progress'
  configuracao_sql TEXT NOT NULL, -- Query para buscar dados
  configuracao_visual JSONB NOT NULL, -- Configurações visuais específicas
  
  -- Configurações de cache
  cache_duracao_segundos INTEGER DEFAULT 300,
  requer_filtro BOOLEAN DEFAULT false,
  
  -- Permissões
  publico BOOLEAN DEFAULT true,
  roles_permitidas JSONB DEFAULT '["admin", "financeiro", "funcionario"]',
  
  -- Metadata
  criado_por UUID REFERENCES usuarios_sistema(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  
  INDEX idx_dashboard_widgets_categoria (categoria, ativo),
  INDEX idx_dashboard_widgets_publico (publico, ativo)
);

-- Tabela de cache de dados de widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES usuarios_bar(bar_id),
  
  -- Parâmetros da query
  parametros_hash VARCHAR(64) NOT NULL, -- Hash dos parâmetros para identificar cache único
  filtros_aplicados JSONB,
  
  -- Dados cacheados
  dados JSONB NOT NULL,
  metadata JSONB, -- Info adicional (total registros, tempo execução, etc.)
  
  -- Controle de cache
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  acessos INTEGER DEFAULT 0,
  ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_widgets_cache_widget (widget_id, parametros_hash),
  INDEX idx_widgets_cache_expiracao (expires_at),
  UNIQUE(widget_id, bar_id, parametros_hash)
);

-- Tabela de estatísticas de uso de relatórios
CREATE TABLE IF NOT EXISTS relatorios_estatisticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES usuarios_bar(bar_id),
  
  -- Período
  data_referencia DATE NOT NULL,
  
  -- Estatísticas de relatórios
  total_execucoes INTEGER DEFAULT 0,
  execucoes_sucesso INTEGER DEFAULT 0,
  execucoes_erro INTEGER DEFAULT 0,
  tempo_medio_execucao_ms INTEGER DEFAULT 0,
  
  -- Estatísticas por formato
  execucoes_pdf INTEGER DEFAULT 0,
  execucoes_excel INTEGER DEFAULT 0,
  execucoes_csv INTEGER DEFAULT 0,
  
  -- Estatísticas de dashboards
  visualizacoes_dashboard INTEGER DEFAULT 0,
  widgets_mais_acessados JSONB,
  
  -- Usuários ativos
  usuarios_unicos_relatorios INTEGER DEFAULT 0,
  usuarios_unicos_dashboards INTEGER DEFAULT 0,
  
  -- Metadata
  calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(bar_id, data_referencia)
);

-- =====================================================
-- INSERIR TEMPLATES PADRÃO DE RELATÓRIOS
-- =====================================================

INSERT INTO relatorios_templates (nome, descricao, categoria, tipo_relatorio, configuracao_sql, configuracao_campos, configuracao_filtros, formatos_suportados) VALUES

-- Template: Relatório de Execuções de Checklists
('Relatório de Execuções de Checklists', 
 'Relatório detalhado de todas as execuções de checklists com scores e tempos',
 'checklist',
 'tabular',
 'SELECT 
    ce.id, 
    c.nome as checklist_nome,
    u.nome as funcionario_nome,
    ce.score_final,
    ce.iniciado_em,
    ce.concluido_em,
    EXTRACT(EPOCH FROM (ce.concluido_em - ce.iniciado_em))/60 as duracao_minutos,
    ce.status,
    ce.total_itens,
    ce.itens_obrigatorios_ok,
    CASE WHEN ce.concluido_em IS NOT NULL THEN ''Concluído'' ELSE ''Em Andamento'' END as situacao
  FROM checklist_execucoes ce
  LEFT JOIN checklists c ON ce.checklist_id = c.id
  LEFT JOIN usuarios_sistema u ON ce.executado_por = u.id
  WHERE ce.bar_id = $bar_id
    AND ($data_inicio IS NULL OR ce.iniciado_em >= $data_inicio)
    AND ($data_fim IS NULL OR ce.iniciado_em <= $data_fim)
    AND ($checklist_id IS NULL OR ce.checklist_id = $checklist_id)
    AND ($funcionario_id IS NULL OR ce.executado_por = $funcionario_id)
  ORDER BY ce.iniciado_em DESC',
 '{
   "id": {"label": "ID", "tipo": "texto", "visivel": false},
   "checklist_nome": {"label": "Checklist", "tipo": "texto", "largura": "25%"},
   "funcionario_nome": {"label": "Funcionário", "tipo": "texto", "largura": "20%"},
   "score_final": {"label": "Score", "tipo": "percentual", "largura": "10%"},
   "iniciado_em": {"label": "Início", "tipo": "data_hora", "largura": "15%"},
   "concluido_em": {"label": "Conclusão", "tipo": "data_hora", "largura": "15%"},
   "duracao_minutos": {"label": "Duração (min)", "tipo": "numero", "decimais": 1, "largura": "10%"},
   "situacao": {"label": "Situação", "tipo": "status", "largura": "5%"}
 }',
 '{
   "data_inicio": {"label": "Data Início", "tipo": "data", "obrigatorio": false},
   "data_fim": {"label": "Data Fim", "tipo": "data", "obrigatorio": false},
   "checklist_id": {"label": "Checklist", "tipo": "select_checklist", "obrigatorio": false},
   "funcionario_id": {"label": "Funcionário", "tipo": "select_funcionario", "obrigatorio": false}
 }',
 '["pdf", "excel", "csv"]'),

-- Template: Dashboard de Produtividade
('Dashboard de Produtividade', 
 'Visão geral da produtividade da equipe com métricas principais',
 'produtividade',
 'dashboard',
 'SELECT 
    u.nome as funcionario,
    COUNT(ce.id) as total_execucoes,
    AVG(ce.score_final) as score_medio,
    COUNT(CASE WHEN ce.score_final >= 90 THEN 1 END) as execucoes_excelentes,
    COUNT(CASE WHEN ce.score_final < 70 THEN 1 END) as execucoes_baixas
  FROM checklist_execucoes ce
  LEFT JOIN usuarios_sistema u ON ce.executado_por = u.id
  WHERE ce.bar_id = $bar_id
    AND ce.concluido_em IS NOT NULL
    AND ce.concluido_em >= NOW() - INTERVAL ''30 days''
  GROUP BY u.id, u.nome
  ORDER BY score_medio DESC',
 '{
   "funcionario": {"label": "Funcionário", "tipo": "texto"},
   "total_execucoes": {"label": "Total Execuções", "tipo": "numero"},
   "score_medio": {"label": "Score Médio", "tipo": "percentual", "decimais": 1},
   "execucoes_excelentes": {"label": "Execuções Excelentes", "tipo": "numero"},
   "execucoes_baixas": {"label": "Execuções Baixas", "tipo": "numero"}
 }',
 '{
   "periodo_dias": {"label": "Período (dias)", "tipo": "numero", "valor_padrao": 30}
 }',
 '["pdf", "excel"]'),

-- Template: Relatório de Compliance
('Relatório de Compliance', 
 'Relatório de conformidade com foco em itens obrigatórios',
 'compliance',
 'tabular',
 'SELECT 
    c.nome as checklist_nome,
    COUNT(ce.id) as total_execucoes,
    COUNT(CASE WHEN ce.itens_obrigatorios_ok = ce.total_itens_obrigatorios THEN 1 END) as execucoes_conformes,
    ROUND(COUNT(CASE WHEN ce.itens_obrigatorios_ok = ce.total_itens_obrigatorios THEN 1 END) * 100.0 / COUNT(ce.id), 2) as taxa_compliance
  FROM checklists c
  LEFT JOIN checklist_execucoes ce ON c.id = ce.checklist_id AND ce.bar_id = $bar_id AND ce.concluido_em IS NOT NULL
  WHERE c.bar_id = $bar_id
  GROUP BY c.id, c.nome
  HAVING COUNT(ce.id) > 0
  ORDER BY taxa_compliance DESC',
 '{
   "checklist_nome": {"label": "Checklist", "tipo": "texto", "largura": "40%"},
   "total_execucoes": {"label": "Total Execuções", "tipo": "numero", "largura": "20%"},
   "execucoes_conformes": {"label": "Execuções Conformes", "tipo": "numero", "largura": "20%"},
   "taxa_compliance": {"label": "Taxa Compliance", "tipo": "percentual", "largura": "20%"}
 }',
 '{
   "data_inicio": {"label": "Data Início", "tipo": "data", "obrigatorio": false},
   "data_fim": {"label": "Data Fim", "tipo": "data", "obrigatorio": false}
 }',
 '["pdf", "excel", "csv"]');

-- =====================================================
-- INSERIR WIDGETS PADRÃO PARA DASHBOARDS
-- =====================================================

INSERT INTO dashboard_widgets (nome, descricao, categoria, tipo_widget, configuracao_sql, configuracao_visual) VALUES

-- Widget: Total de Execuções Hoje
('Execuções Hoje',
 'Total de checklists executados hoje',
 'kpi',
 'number',
 'SELECT COUNT(*) as valor FROM checklist_execucoes WHERE bar_id = $bar_id AND DATE(concluido_em) = CURRENT_DATE',
 '{
   "cor": "blue",
   "icone": "CheckCircle",
   "sufixo": "execuções",
   "comparacao_periodo": "ontem"
 }'),

-- Widget: Score Médio da Semana
('Score Médio Semanal',
 'Score médio dos checklists desta semana',
 'kpi',
 'number',
 'SELECT ROUND(AVG(score_final), 1) as valor FROM checklist_execucoes WHERE bar_id = $bar_id AND concluido_em >= DATE_TRUNC(''week'', NOW())',
 '{
   "cor": "green",
   "icone": "TrendingUp",
   "sufixo": "%",
   "formato": "percentual"
 }'),

-- Widget: Checklists Atrasados
('Checklists Atrasados',
 'Número de checklists atrasados no momento',
 'kpi',
 'number',
 'SELECT COUNT(*) as valor FROM checklist_agendamentos WHERE bar_id = $bar_id AND status = ''agendado'' AND agendado_para < NOW()',
 '{
   "cor": "red",
   "icone": "AlertTriangle",
   "sufixo": "atrasados",
   "alert_threshold": 0
 }'),

-- Widget: Evolução de Scores (Gráfico)
('Evolução de Scores',
 'Gráfico da evolução dos scores nos últimos 7 dias',
 'grafico',
 'chart_line',
 'SELECT 
    DATE(concluido_em) as data,
    ROUND(AVG(score_final), 1) as score_medio
  FROM checklist_execucoes 
  WHERE bar_id = $bar_id 
    AND concluido_em >= NOW() - INTERVAL ''7 days''
    AND concluido_em IS NOT NULL
  GROUP BY DATE(concluido_em)
  ORDER BY data',
 '{
   "cor_linha": "blue",
   "area_preenchida": true,
   "mostrar_pontos": true,
   "eixo_y_min": 0,
   "eixo_y_max": 100
 }'),

-- Widget: Top Funcionários (Tabela)
('Top Funcionários',
 'Ranking dos funcionários por performance',
 'tabela',
 'table',
 'SELECT 
    u.nome,
    COUNT(ce.id) as execucoes,
    ROUND(AVG(ce.score_final), 1) as score_medio
  FROM checklist_execucoes ce
  LEFT JOIN usuarios_sistema u ON ce.executado_por = u.id
  WHERE ce.bar_id = $bar_id 
    AND ce.concluido_em >= NOW() - INTERVAL ''30 days''
    AND ce.concluido_em IS NOT NULL
  GROUP BY u.id, u.nome
  HAVING COUNT(ce.id) >= 3
  ORDER BY score_medio DESC
  LIMIT 5',
 '{
   "colunas": {
     "nome": {"label": "Funcionário", "largura": "50%"},
     "execucoes": {"label": "Execuções", "largura": "25%"},
     "score_medio": {"label": "Score Médio", "largura": "25%", "tipo": "percentual"}
   },
   "highlight_first": true
 }');

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para executar relatório
CREATE OR REPLACE FUNCTION executar_relatorio(
  p_bar_id UUID,
  p_template_id UUID,
  p_filtros JSONB,
  p_solicitado_por UUID
) RETURNS UUID AS $$
DECLARE
  v_execucao_id UUID;
  v_sql_query TEXT;
  v_template RECORD;
BEGIN
  -- Buscar template
  SELECT * INTO v_template FROM relatorios_templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template de relatório não encontrado';
  END IF;
  
  -- Criar execução
  INSERT INTO relatorios_execucoes (
    bar_id, template_id, solicitado_por, tipo_execucao, 
    filtros_aplicados, formato_exportacao, status
  ) VALUES (
    p_bar_id, p_template_id, p_solicitado_por, 'manual',
    p_filtros, 'pdf', 'pendente'
  ) RETURNING id INTO v_execucao_id;
  
  -- Aqui seria chamado o processamento em background
  -- Por enquanto, vamos simular sucesso
  UPDATE relatorios_execucoes 
  SET status = 'processando', iniciado_em = NOW()
  WHERE id = v_execucao_id;
  
  RETURN v_execucao_id;
END;
$$ LANGUAGE plpgsql;

-- Função para agendar relatório
CREATE OR REPLACE FUNCTION agendar_relatorio_automatico(
  p_relatorio_personalizado_id UUID
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_relatorio RECORD;
  v_proximo_agendamento TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_relatorio FROM relatorios_personalizados WHERE id = p_relatorio_personalizado_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relatório personalizado não encontrado';
  END IF;
  
  -- Calcular próximo agendamento baseado na frequência
  CASE v_relatorio.agendamento_frequencia
    WHEN 'diario' THEN
      v_proximo_agendamento := DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + 
        (v_relatorio.agendamento_configuracao->>'hora')::TIME;
    WHEN 'semanal' THEN
      v_proximo_agendamento := DATE_TRUNC('week', NOW()) + INTERVAL '7 days' +
        (v_relatorio.agendamento_configuracao->>'dia_semana')::INTEGER * INTERVAL '1 day' +
        (v_relatorio.agendamento_configuracao->>'hora')::TIME;
    WHEN 'mensal' THEN
      v_proximo_agendamento := DATE_TRUNC('month', NOW()) + INTERVAL '1 month' +
        (v_relatorio.agendamento_configuracao->>'dia_mes')::INTEGER * INTERVAL '1 day' +
        (v_relatorio.agendamento_configuracao->>'hora')::TIME;
  END CASE;
  
  -- Atualizar relatório
  UPDATE relatorios_personalizados
  SET proximo_agendamento = v_proximo_agendamento
  WHERE id = p_relatorio_personalizado_id;
  
  RETURN v_proximo_agendamento;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpar cache expirado
CREATE OR REPLACE FUNCTION limpar_cache_expirado() RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_widgets_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE relatorios_templates IS 'Templates reutilizáveis de relatórios com configurações de SQL e visualização';
COMMENT ON TABLE relatorios_personalizados IS 'Relatórios salvos pelos usuários com filtros e agendamento';
COMMENT ON TABLE relatorios_execucoes IS 'Histórico de execuções de relatórios com status e arquivos gerados';
COMMENT ON TABLE dashboards_personalizados IS 'Dashboards customizáveis pelos usuários';
COMMENT ON TABLE dashboard_widgets IS 'Widgets disponíveis para montagem de dashboards';
COMMENT ON TABLE dashboard_widgets_cache IS 'Cache de dados dos widgets para performance';

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checklist_execucoes_relatorios 
ON checklist_execucoes (bar_id, concluido_em DESC) 
WHERE concluido_em IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checklist_execucoes_score 
ON checklist_execucoes (bar_id, score_final) 
WHERE concluido_em IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checklist_agendamentos_atrasados
ON checklist_agendamentos (bar_id, status, agendado_para)
WHERE status = 'agendado'; 