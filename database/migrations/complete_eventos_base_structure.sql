-- COMPLETAR ESTRUTURA DA TABELA EVENTOS_BASE
-- =====================================================
-- Adicionar todas as colunas calculadas necessárias
-- Para eliminar dependência de views complexas
-- =====================================================

-- Adicionar colunas calculadas (dados que vêm de outras tabelas)
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS cl_real INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS res_tot INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS te_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tb_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS t_medio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lot_max NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS c_prod NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_art_fat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_b NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_d NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_c NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS t_coz NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS t_bar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat_19h NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat_19h_percent NUMERIC DEFAULT 0;

-- Adicionar colunas de integração (dados externos)
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS sympla_liquido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sympla_checkins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sympla_participantes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yuzer_liquido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS yuzer_ingressos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS yuzer_qtd_ingressos INTEGER DEFAULT 0;

-- Adicionar colunas de controle
ALTER TABLE public.eventos_base 
ADD COLUMN IF NOT EXISTS calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS precisa_recalculo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS versao_calculo INTEGER DEFAULT 1;

-- Comentários nas colunas
COMMENT ON COLUMN eventos_base.cl_real IS 'Clientes reais calculados (regras específicas por dia da semana)';
COMMENT ON COLUMN eventos_base.real_r IS 'Receita real calculada (ContaHub + Yuzer conforme regras)';
COMMENT ON COLUMN eventos_base.te_real IS 'Ticket entrada real calculado';
COMMENT ON COLUMN eventos_base.tb_real IS 'Ticket bar real calculado';
COMMENT ON COLUMN eventos_base.t_medio IS 'Ticket médio total (te_real + tb_real)';
COMMENT ON COLUMN eventos_base.lot_max IS 'Lotação máxima calculada (cl_plan / 1.3)';
COMMENT ON COLUMN eventos_base.percent_art_fat IS 'Percentual artístico sobre faturamento';
COMMENT ON COLUMN eventos_base.percent_b IS 'Percentual bebidas';
COMMENT ON COLUMN eventos_base.percent_d IS 'Percentual drinks';
COMMENT ON COLUMN eventos_base.percent_c IS 'Percentual comidas';
COMMENT ON COLUMN eventos_base.t_coz IS 'Tempo médio cozinha (minutos)';
COMMENT ON COLUMN eventos_base.t_bar IS 'Tempo médio bar (minutos)';
COMMENT ON COLUMN eventos_base.fat_19h_percent IS 'Percentual faturamento até 19h';
COMMENT ON COLUMN eventos_base.calculado_em IS 'Timestamp da última atualização dos cálculos';
COMMENT ON COLUMN eventos_base.precisa_recalculo IS 'Flag indicando se precisa recalcular métricas';
COMMENT ON COLUMN eventos_base.versao_calculo IS 'Versão do algoritmo de cálculo usado';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_eventos_base_data_evento ON eventos_base(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_base_bar_id ON eventos_base(bar_id);
CREATE INDEX IF NOT EXISTS idx_eventos_base_precisa_recalculo ON eventos_base(precisa_recalculo) WHERE precisa_recalculo = TRUE;
CREATE INDEX IF NOT EXISTS idx_eventos_base_calculado_em ON eventos_base(calculado_em);

-- Comentário na tabela
COMMENT ON TABLE eventos_base IS 'Tabela principal de eventos com dados editáveis e calculados automaticamente por triggers';
