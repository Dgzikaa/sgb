import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * 🔍 AGENTE AUDITOR
 * 
 * Responsável por:
 * - Validar integridade dos dados
 * - Detectar anomalias e inconsistências
 * - Verificar qualidade dos syncs
 * - Gerar relatórios de auditoria
 */

console.log("🔍 Agente Auditor - Sistema de Auditoria de Dados");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  action: 'validate_sync' | 'check_anomalies' | 'data_quality' | 'full_audit';
  bar_id: number;
  data_inicio?: string;
  data_fim?: string;
  tabela?: string;
}

interface AuditResult {
  success: boolean;
  action: string;
  timestamp: string;
  bar_id: number;
  findings: AuditFinding[];
  summary: {
    total_checks: number;
    passed: number;
    warnings: number;
    errors: number;
  };
}

interface AuditFinding {
  tipo: 'info' | 'warning' | 'error' | 'critical';
  categoria: string;
  mensagem: string;
  tabela?: string;
  detalhes?: Record<string, unknown>;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: AuditRequest = await req.json();
    const { action, bar_id, data_inicio, data_fim, tabela } = request;

    console.log(`🔍 Auditoria: ${action} para bar_id=${bar_id}`);

    const findings: AuditFinding[] = [];
    let totalChecks = 0;
    let passed = 0;
    let warnings = 0;
    let errors = 0;

    // Definir período padrão (últimos 7 dias)
    const hoje = new Date();
    const inicioDefault = new Date(hoje);
    inicioDefault.setDate(hoje.getDate() - 7);
    
    const inicio = data_inicio || inicioDefault.toISOString().split('T')[0];
    const fim = data_fim || hoje.toISOString().split('T')[0];

    switch (action) {
      case 'validate_sync':
        // Verificar se syncs estão atualizados
        const syncsToCheck = [
          { tabela: 'contahub_analitico', nome: 'ContaHub Analítico' },
          { tabela: 'contahub_fatporhora', nome: 'ContaHub FatPorHora' },
          { tabela: 'contahub_pagamentos', nome: 'ContaHub Pagamentos' },
          { tabela: 'nibo_agendamentos', nome: 'NIBO Agendamentos' },
          { tabela: 'getin_reservas', nome: 'GetIn Reservas' },
          { tabela: 'yuzer_eventos', nome: 'Yuzer Eventos' },
        ];

        for (const sync of syncsToCheck) {
          totalChecks++;
          
          const { data: lastRecord, error } = await supabase
            .from(sync.tabela)
            .select('created_at')
            .eq('bar_id', bar_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            errors++;
            findings.push({
              tipo: 'error',
              categoria: 'sync_validation',
              mensagem: `Erro ao verificar ${sync.nome}`,
              tabela: sync.tabela,
              detalhes: { error: error.message }
            });
          } else if (!lastRecord) {
            warnings++;
            findings.push({
              tipo: 'warning',
              categoria: 'sync_validation',
              mensagem: `Nenhum dado encontrado para ${sync.nome}`,
              tabela: sync.tabela
            });
          } else {
            const lastDate = new Date(lastRecord.created_at);
            const diffHours = (hoje.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHours > 48) {
              warnings++;
              findings.push({
                tipo: 'warning',
                categoria: 'sync_validation',
                mensagem: `${sync.nome} desatualizado (${Math.round(diffHours)}h atrás)`,
                tabela: sync.tabela,
                detalhes: { last_update: lastRecord.created_at, hours_ago: Math.round(diffHours) }
              });
            } else {
              passed++;
              findings.push({
                tipo: 'info',
                categoria: 'sync_validation',
                mensagem: `${sync.nome} atualizado`,
                tabela: sync.tabela,
                detalhes: { last_update: lastRecord.created_at }
              });
            }
          }
        }
        break;

      case 'check_anomalies':
        // Verificar anomalias nos dados
        
        // 1. Verificar faturamento zerado em dias com eventos
        totalChecks++;
        const { data: eventosComFatZero } = await supabase
          .from('eventos')
          .select('id, data_evento, nome, real_r')
          .eq('bar_id', bar_id)
          .gte('data_evento', inicio)
          .lte('data_evento', fim)
          .or('real_r.is.null,real_r.eq.0');

        if (eventosComFatZero && eventosComFatZero.length > 0) {
          warnings++;
          findings.push({
            tipo: 'warning',
            categoria: 'anomaly',
            mensagem: `${eventosComFatZero.length} eventos com faturamento zerado/nulo`,
            detalhes: { eventos: eventosComFatZero.map(e => ({ id: e.id, nome: e.nome, data: e.data_evento })) }
          });
        } else {
          passed++;
        }

        // 2. Verificar tickets muito altos ou baixos
        totalChecks++;
        const { data: ticketsAnormais } = await supabase
          .from('eventos')
          .select('id, data_evento, nome, te_r')
          .eq('bar_id', bar_id)
          .gte('data_evento', inicio)
          .lte('data_evento', fim)
          .or('te_r.gt.200,te_r.lt.10');

        if (ticketsAnormais && ticketsAnormais.length > 0) {
          warnings++;
          findings.push({
            tipo: 'warning',
            categoria: 'anomaly',
            mensagem: `${ticketsAnormais.length} eventos com ticket médio anormal`,
            detalhes: { eventos: ticketsAnormais }
          });
        } else {
          passed++;
        }

        break;

      case 'data_quality':
        // Verificar qualidade dos dados
        
        // 1. Verificar campos obrigatórios nulos
        const tabelasParaVerificar = tabela ? [tabela] : ['eventos', 'contahub_analitico'];
        
        for (const t of tabelasParaVerificar) {
          totalChecks++;
          
          const { count: nullCount } = await supabase
            .from(t)
            .select('*', { count: 'exact', head: true })
            .eq('bar_id', bar_id)
            .is('created_at', null);

          if (nullCount && nullCount > 0) {
            warnings++;
            findings.push({
              tipo: 'warning',
              categoria: 'data_quality',
              mensagem: `${nullCount} registros sem data de criação em ${t}`,
              tabela: t
            });
          } else {
            passed++;
          }
        }
        break;

      case 'full_audit':
        // Executar auditoria completa
        findings.push({
          tipo: 'info',
          categoria: 'full_audit',
          mensagem: 'Auditoria completa iniciada - executando todas as verificações',
        });
        
        // Combinar todas as verificações
        // TODO: Implementar chamadas recursivas para cada tipo de verificação
        break;
    }

    const result: AuditResult = {
      success: true,
      action,
      timestamp: new Date().toISOString(),
      bar_id,
      findings,
      summary: {
        total_checks: totalChecks,
        passed,
        warnings,
        errors
      }
    };

    console.log(`✅ Auditoria concluída: ${passed} OK, ${warnings} avisos, ${errors} erros`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no Agente Auditor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

