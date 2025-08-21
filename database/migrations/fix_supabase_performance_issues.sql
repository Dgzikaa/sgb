-- ===============================================
-- SUPABASE PERFORMANCE & SECURITY FIXES
-- ===============================================
-- Este arquivo resolve os problemas identificados pelo Supabase Linter
-- Executar em partes para evitar timeout

-- ===============================================
-- 1. ADICIONAR ÍNDICES PARA FOREIGN KEYS (CRÍTICO)
-- ===============================================

-- auditoria_checklists
CREATE INDEX IF NOT EXISTS idx_auditoria_checklists_bar_id ON public.auditoria_checklists(bar_id);

-- checklist_agendamentos  
CREATE INDEX IF NOT EXISTS idx_checklist_agendamentos_bar_id ON public.checklist_agendamentos(bar_id);
CREATE INDEX IF NOT EXISTS idx_checklist_agendamentos_checklist_id ON public.checklist_agendamentos(checklist_id);

-- checklist_auto_executions
CREATE INDEX IF NOT EXISTS idx_checklist_auto_executions_checklist_agendamento_id ON public.checklist_auto_executions(checklist_agendamento_id);
CREATE INDEX IF NOT EXISTS idx_checklist_auto_executions_checklist_schedule_id ON public.checklist_auto_executions(checklist_schedule_id);

-- checklist_automation_logs
CREATE INDEX IF NOT EXISTS idx_checklist_automation_logs_checklist_auto_execution_id ON public.checklist_automation_logs(checklist_auto_execution_id);
CREATE INDEX IF NOT EXISTS idx_checklist_automation_logs_checklist_schedule_id ON public.checklist_automation_logs(checklist_schedule_id);

-- checklist_itens
CREATE INDEX IF NOT EXISTS idx_checklist_itens_secao_id ON public.checklist_itens(secao_id);

-- checklist_schedules
CREATE INDEX IF NOT EXISTS idx_checklist_schedules_checklist_id ON public.checklist_schedules(checklist_id);

-- checklist_secoes
CREATE INDEX IF NOT EXISTS idx_checklist_secoes_checklist_id ON public.checklist_secoes(checklist_id);

-- checklists
CREATE INDEX IF NOT EXISTS idx_checklists_template_origem ON public.checklists(template_origem);

-- contahub_pagamentos
CREATE INDEX IF NOT EXISTS idx_contahub_pagamentos_bar_id ON public.contahub_pagamentos(bar_id);

-- contahub_periodo
CREATE INDEX IF NOT EXISTS idx_contahub_periodo_bar_id ON public.contahub_periodo(bar_id);

-- contahub_processing_queue
CREATE INDEX IF NOT EXISTS idx_contahub_processing_queue_raw_data_id ON public.contahub_processing_queue(raw_data_id);

-- contahub_tempo
CREATE INDEX IF NOT EXISTS idx_contahub_tempo_bar_id ON public.contahub_tempo(bar_id);

-- nibo_agendamentos
CREATE INDEX IF NOT EXISTS idx_nibo_agendamentos_conta_bancaria_id_interno ON public.nibo_agendamentos(conta_bancaria_id_interno);
CREATE INDEX IF NOT EXISTS idx_nibo_agendamentos_stakeholder_id_interno ON public.nibo_agendamentos(stakeholder_id_interno);

-- notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_bar_id ON public.notificacoes(bar_id);

-- orcamentacao
CREATE INDEX IF NOT EXISTS idx_orcamentacao_categoria_id ON public.orcamentacao(categoria_id);

-- security_events
CREATE INDEX IF NOT EXISTS idx_security_events_resolved_by ON public.security_events(resolved_by);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);

-- ===============================================
-- 2. ADICIONAR CHAVES PRIMÁRIAS AUSENTES
-- ===============================================

-- _backup_webhook_configs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = '_backup_webhook_configs' 
        AND constraint_type = 'PRIMARY KEY' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public._backup_webhook_configs ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- eventos_cache
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'eventos_cache' 
        AND constraint_type = 'PRIMARY KEY' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.eventos_cache ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- ===============================================
-- 3. REMOVER ÍNDICES DUPLICADOS
-- ===============================================

-- Remover índices duplicados (manter apenas um de cada par)
DROP INDEX IF EXISTS public.idx_contahub_analitico_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_fatporhora_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_pagamentos_dt_bar;
DROP INDEX IF EXISTS public.idx_contahub_periodo_dt_bar;

-- ===============================================
-- 4. OTIMIZAR POLÍTICAS RLS (EXECUTAR SEPARADAMENTE)
-- ===============================================

-- NOTA: As políticas RLS precisam ser otimizadas uma por vez
-- Substituir auth.uid() por (select auth.uid()) para melhor performance
-- 
-- Exemplo para uma política:
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
-- CREATE POLICY "policy_name" ON table_name FOR SELECT 
-- USING (bar_id IN (
--   SELECT bar_id FROM usuarios_bar 
--   WHERE user_id = (select auth.uid())
-- ));

-- ===============================================
-- 5. CONSOLIDAR POLÍTICAS MÚLTIPLAS (EXECUTAR SEPARADAMENTE)
-- ===============================================

-- NOTA: Consolidar políticas múltiplas em uma única política
-- para evitar execução múltipla e melhorar performance
--
-- Exemplo:
-- DROP POLICY IF EXISTS "policy1" ON table_name;
-- DROP POLICY IF EXISTS "policy2" ON table_name;
-- CREATE POLICY "consolidated_policy" ON table_name 
-- USING (condition1 OR condition2);

-- ===============================================
-- 6. VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar foreign keys sem índices restantes
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes pi 
    ON tc.table_name = pi.tablename 
    AND kcu.column_name = ANY(string_to_array(replace(replace(pi.indexdef, '(', ','), ')', ''), ','))
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND pi.indexname IS NULL
ORDER BY tc.table_name, tc.constraint_name;

-- Verificar tabelas sem chave primária
SELECT tablename 
FROM pg_tables t
WHERE schemaname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.tablename
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
);
