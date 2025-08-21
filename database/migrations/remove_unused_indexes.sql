-- ===============================================
-- REMOVER ÍNDICES NÃO UTILIZADOS
-- ===============================================
-- Este script remove 157 índices identificados como não utilizados
-- IMPORTANTE: Fazer backup antes de executar!

-- ===============================================
-- ÍNDICES DE AUDITORIA E LOGS (Geralmente seguros para remover)
-- ===============================================

-- api_credentials
DROP INDEX IF EXISTS public.idx_api_credentials_ativo;

-- audit_trail (múltiplos índices não utilizados)
DROP INDEX IF EXISTS public.idx_audit_trail_bar_id;
DROP INDEX IF EXISTS public.idx_audit_trail_bar_timestamp;
DROP INDEX IF EXISTS public.idx_audit_trail_category;
DROP INDEX IF EXISTS public.idx_audit_trail_ip_address;
DROP INDEX IF EXISTS public.idx_audit_trail_operation;
DROP INDEX IF EXISTS public.idx_audit_trail_record_id;
DROP INDEX IF EXISTS public.idx_audit_trail_severity;
DROP INDEX IF EXISTS public.idx_audit_trail_table_name;
DROP INDEX IF EXISTS public.idx_audit_trail_table_record;
DROP INDEX IF EXISTS public.idx_audit_trail_timestamp;
DROP INDEX IF EXISTS public.idx_audit_trail_user_id;
DROP INDEX IF EXISTS public.idx_audit_trail_user_timestamp;

-- auditoria_checklists
DROP INDEX IF EXISTS public.idx_auditoria_checklists_criado_em;
DROP INDEX IF EXISTS public.idx_auditoria_checklists_tabela_registro;
DROP INDEX IF EXISTS public.idx_auditoria_checklists_usuario_id;

-- automation_logs
DROP INDEX IF EXISTS public.idx_automation_logs_bar_id;
DROP INDEX IF EXISTS public.idx_automation_logs_criado_em;
DROP INDEX IF EXISTS public.idx_automation_logs_sistema_status;

-- ===============================================
-- ÍNDICES DE CHECKLIST (Revisar com cuidado)
-- ===============================================

-- checklist_agendamentos
DROP INDEX IF EXISTS public.idx_checklist_agendamentos_data_agendada;
DROP INDEX IF EXISTS public.idx_checklist_agendamentos_responsavel_id;
DROP INDEX IF EXISTS public.idx_checklist_agendamentos_status;

-- checklist_auto_executions
DROP INDEX IF EXISTS public.idx_checklist_auto_executions_data_limite;
DROP INDEX IF EXISTS public.idx_checklist_auto_executions_status;

-- checklist_automation_logs
DROP INDEX IF EXISTS public.idx_checklist_automation_logs_criado_em;
DROP INDEX IF EXISTS public.idx_checklist_automation_logs_tipo;

-- checklist_schedules
DROP INDEX IF EXISTS public.idx_checklist_schedules_ativo;
DROP INDEX IF EXISTS public.idx_checklist_schedules_bar_id;
DROP INDEX IF EXISTS public.idx_checklist_schedules_proxima_execucao;

-- checklists
DROP INDEX IF EXISTS public.idx_checklists_bar_id;
DROP INDEX IF EXISTS public.idx_checklists_setor;
DROP INDEX IF EXISTS public.idx_checklists_status;
DROP INDEX IF EXISTS public.idx_checklists_tipo;

-- ===============================================
-- ÍNDICES CONTAHUB (MANTER ALGUNS CRÍTICOS)
-- ===============================================

-- contahub_analitico - CUIDADO: Manter índices de data/bar essenciais
DROP INDEX IF EXISTS public.idx_contahub_analitico_date;
DROP INDEX IF EXISTS public.idx_contahub_analitico_unique;
DROP INDEX IF EXISTS public.idx_contahub_analitico_valorfinal;

-- contahub_fatporhora
DROP INDEX IF EXISTS public.idx_contahub_fatporhora_valor;

-- contahub_raw_data
DROP INDEX IF EXISTS public.idx_contahub_raw_data_bar_id;
DROP INDEX IF EXISTS public.idx_contahub_raw_data_date;
DROP INDEX IF EXISTS public.idx_contahub_raw_data_processed;
DROP INDEX IF EXISTS public.idx_contahub_raw_data_processing;
DROP INDEX IF EXISTS public.idx_contahub_raw_data_type;

-- contahub_processing_queue
DROP INDEX IF EXISTS public.idx_processing_queue_created;
DROP INDEX IF EXISTS public.idx_processing_queue_data_type;
DROP INDEX IF EXISTS public.idx_processing_queue_status;

-- contahub_tempo
DROP INDEX IF EXISTS public.idx_contahub_tempo_dia_bar_id;

-- ===============================================
-- ÍNDICES NIBO (MANTER CRÍTICOS PARA CONSULTAS)
-- ===============================================

-- nibo_agendamentos - Remover alguns, manter essenciais
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_categoria;
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_data;
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_data_vencimento;
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_stakeholder_id;
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_status;
DROP INDEX IF EXISTS public.idx_nibo_agendamentos_tipo;

-- nibo_categorias
DROP INDEX IF EXISTS public.idx_nibo_categorias_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_categorias_tipo;

-- nibo_centros_custo
DROP INDEX IF EXISTS public.idx_nibo_centros_custo_ativo;
DROP INDEX IF EXISTS public.idx_nibo_centros_custo_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_centros_custo_nibo_id;

-- nibo_contas_bancarias
DROP INDEX IF EXISTS public.idx_nibo_contas_bancarias_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_contas_bancarias_nome;

-- nibo_logs_sincronizacao
DROP INDEX IF EXISTS public.idx_nibo_logs_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_logs_data_inicio;

-- nibo_stakeholders
DROP INDEX IF EXISTS public.idx_nibo_stakeholders_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_stakeholders_documento;
DROP INDEX IF EXISTS public.idx_nibo_stakeholders_nome;
DROP INDEX IF EXISTS public.idx_nibo_stakeholders_pix_chave;
DROP INDEX IF EXISTS public.idx_nibo_stakeholders_tipo;

-- nibo_temp_agendamentos
DROP INDEX IF EXISTS public.idx_nibo_temp_batch;
DROP INDEX IF EXISTS public.idx_nibo_temp_created;
DROP INDEX IF EXISTS public.idx_nibo_temp_processed;

-- nibo_usuarios
DROP INDEX IF EXISTS public.idx_nibo_usuarios_bar_id;
DROP INDEX IF EXISTS public.idx_nibo_usuarios_email;

-- ===============================================
-- ÍNDICES DE NOTIFICAÇÕES E COMUNICAÇÃO
-- ===============================================

-- notificacoes
DROP INDEX IF EXISTS public.idx_notificacoes_agendada_para;
DROP INDEX IF EXISTS public.idx_notificacoes_status;
DROP INDEX IF EXISTS public.idx_notificacoes_usuario_id;

-- whatsapp_messages
DROP INDEX IF EXISTS public.idx_whatsapp_messages_checklist_id;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_sent_at;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_status;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_user_id;

-- ===============================================
-- ÍNDICES DE INTEGRAÇÕES EXTERNAS
-- ===============================================

-- getin_reservas
DROP INDEX IF EXISTS public.idx_getin_reservas_bar_id;
DROP INDEX IF EXISTS public.idx_getin_reservas_cliente_telefone;
DROP INDEX IF EXISTS public.idx_getin_reservas_data_reserva;
DROP INDEX IF EXISTS public.idx_getin_reservas_external_id;
DROP INDEX IF EXISTS public.idx_getin_reservas_getin_id;
DROP INDEX IF EXISTS public.idx_getin_reservas_id_externo;
DROP INDEX IF EXISTS public.idx_getin_reservas_origem;
DROP INDEX IF EXISTS public.idx_getin_reservas_sincronizado_em;
DROP INDEX IF EXISTS public.idx_getin_reservas_status;
DROP INDEX IF EXISTS public.idx_getin_reservas_sync_timestamp;
DROP INDEX IF EXISTS public.idx_getin_reservas_unit_id;

-- getin_sync_logs
DROP INDEX IF EXISTS public.idx_getin_sync_logs_status;
DROP INDEX IF EXISTS public.idx_getin_sync_logs_timestamp;

-- sympla
DROP INDEX IF EXISTS public.idx_sympla_eventos_data;
DROP INDEX IF EXISTS public.idx_sympla_participantes_bar_id;
DROP INDEX IF EXISTS public.idx_sympla_participantes_checkin;
DROP INDEX IF EXISTS public.idx_sympla_participantes_email;
DROP INDEX IF EXISTS public.idx_sympla_participantes_evento;
DROP INDEX IF EXISTS public.idx_sympla_pedidos_evento;
DROP INDEX IF EXISTS public.idx_sympla_pedidos_status;

-- yuzer
DROP INDEX IF EXISTS public.idx_yuzer_eventos_bar_id;
DROP INDEX IF EXISTS public.idx_yuzer_eventos_data_inicio;
DROP INDEX IF EXISTS public.idx_yuzer_eventos_evento_id;
DROP INDEX IF EXISTS public.idx_yuzer_fatporhora_bar_evento;
DROP INDEX IF EXISTS public.idx_yuzer_fatporhora_data;
DROP INDEX IF EXISTS public.idx_yuzer_fatporhora_hora;
DROP INDEX IF EXISTS public.idx_yuzer_pagamento_bar_evento;
DROP INDEX IF EXISTS public.idx_yuzer_pagamento_data;
DROP INDEX IF EXISTS public.idx_yuzer_produtos_bar_evento;
DROP INDEX IF EXISTS public.idx_yuzer_produtos_categoria;
DROP INDEX IF EXISTS public.idx_yuzer_produtos_data;
DROP INDEX IF EXISTS public.idx_yuzer_produtos_eh_ingresso;
DROP INDEX IF EXISTS public.idx_yuzer_sync_logs_bar_tipo;
DROP INDEX IF EXISTS public.idx_yuzer_sync_logs_created;
DROP INDEX IF EXISTS public.idx_yuzer_sync_logs_status;

-- ===============================================
-- ÍNDICES DE SEGURANÇA E MONITORAMENTO
-- ===============================================

-- security_events
DROP INDEX IF EXISTS public.idx_security_events_bar_id;
DROP INDEX IF EXISTS public.idx_security_events_bar_level_timestamp;
DROP INDEX IF EXISTS public.idx_security_events_category;
DROP INDEX IF EXISTS public.idx_security_events_event_type;
DROP INDEX IF EXISTS public.idx_security_events_ip_address;
DROP INDEX IF EXISTS public.idx_security_events_level;
DROP INDEX IF EXISTS public.idx_security_events_resolved;
DROP INDEX IF EXISTS public.idx_security_events_risk_score;
DROP INDEX IF EXISTS public.idx_security_events_timestamp;

-- security_metrics
DROP INDEX IF EXISTS public.idx_security_metrics_bar_date;
DROP INDEX IF EXISTS public.idx_security_metrics_date;

-- ===============================================
-- ÍNDICES DIVERSOS
-- ===============================================

-- desempenho_semanal
DROP INDEX IF EXISTS public.idx_desempenho_semanal_bar_ano;
DROP INDEX IF EXISTS public.idx_desempenho_semanal_periodo;

-- eventos_cache
DROP INDEX IF EXISTS public.idx_eventos_cache_bar;
DROP INDEX IF EXISTS public.idx_eventos_cache_data;
DROP INDEX IF EXISTS public.idx_eventos_cache_mes_ano;

-- orcamentacao
DROP INDEX IF EXISTS public.idx_orcamentacao_bar_id;
DROP INDEX IF EXISTS public.idx_orcamentacao_categoria;
DROP INDEX IF EXISTS public.idx_orcamentacao_periodo;
DROP INDEX IF EXISTS public.idx_orcamentacao_tipo;

-- pix_enviados
DROP INDEX IF EXISTS public.idx_pix_enviados_bar_id;
DROP INDEX IF EXISTS public.idx_pix_enviados_txid;

-- sistema_kpis
DROP INDEX IF EXISTS public.idx_kpis_bar_data;

-- sync_logs_contahub
DROP INDEX IF EXISTS public.idx_sync_logs_contahub_bar_id;
DROP INDEX IF EXISTS public.idx_sync_logs_contahub_created_at;
DROP INDEX IF EXISTS public.idx_sync_logs_contahub_data_sync;
DROP INDEX IF EXISTS public.idx_sync_logs_contahub_status;

-- usuarios_bar
DROP INDEX IF EXISTS public.idx_usuarios_bar_ativo;
DROP INDEX IF EXISTS public.idx_usuarios_bar_celular;
DROP INDEX IF EXISTS public.idx_usuarios_bar_cidade;
DROP INDEX IF EXISTS public.idx_usuarios_bar_cpf;
DROP INDEX IF EXISTS public.idx_usuarios_bar_has_biometric;
DROP INDEX IF EXISTS public.idx_usuarios_bar_ultima_atividade;
DROP INDEX IF EXISTS public.idx_usuarios_bar_user_id;

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar quantos índices restaram
SELECT 
    schemaname,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY index_count DESC;

-- Verificar se algum índice crítico foi removido por engano
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND (indexname LIKE '%_pkey' OR indexname LIKE '%_unique%')
ORDER BY tablename;
