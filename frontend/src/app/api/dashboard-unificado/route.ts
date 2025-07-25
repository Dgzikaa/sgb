import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ========================================
// 📊 API PARA DASHBOARD UNIFICADO
// ========================================

interface DashboardData {
  resumoExecutivo: {
    receitas: number;
    despesas: number;
    margem: number;
    totalAgendamentos: number;
    tendencia: {
      receitas: number;
      despesas: number;
      agendamentos: number;
    };
  };
  operacoesCriticas: {
    checklist: {
      total: number;
      concluidos: number;
      pendentes: number;
      problemas: number;
    };
    alertas: Array<{
      tipo: 'critico' | 'importante' | 'info';
      mensagem: string;
      timestamp: string;
    }>;
  };
  metricasChave: {
    nibo: {
      status: 'ativo' | 'erro' | 'sync';
      ultima_sync: string;
      registros: number;
      categorias: number;
      stakeholders: number;
    };
    discord: {
      status: 'ativo' | 'erro';
      mensagens: number;
    };
  };
}

interface NiboAgendamento {
  valor: string;
  data_pagamento: string;
  criado_em: string;
  deletado?: boolean;
  status: string;
}

interface ChecklistAbertura {
  status: string;
  data_checklist: string;
}

interface ApiError {
  message: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// 📊 GET /api/dashboard-unificado
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json(
        { error: 'Bar ID é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados financeiros (resumo executivo)
    const resumoExecutivo = await buscarResumoExecutivo(barId);

    // Buscar dados de operações críticas
    const operacoesCriticas = await buscarOperacoesCriticas(barId);

    // Buscar métricas chave
    const metricasChave = await buscarMetricasChave(barId);

    const dashboardData: DashboardData = {
      resumoExecutivo,
      operacoesCriticas,
      metricasChave,
    };

    return NextResponse.json(dashboardData);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro na API dashboard-unificado:', apiError);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function buscarResumoExecutivo(barId: string) {
  try {
    // Buscar dados financeiros do NIBO
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Dados de hoje - Receitas (Receivable)
    const { data: receitasHoje } = await supabase
      .from('nibo_agendamentos')
      .select('valor')
      .eq('bar_id', barId)
      .eq('tipo', 'Receivable')
      .eq('status', 'Paid')
      .gte('data_pagamento', hoje)
      .lt('data_pagamento', hoje + 'T23:59:59');

    // Dados de hoje - Despesas (Payable)
    const { data: despesasHoje } = await supabase
      .from('nibo_agendamentos')
      .select('valor')
      .eq('bar_id', barId)
      .eq('tipo', 'Payable')
      .eq('status', 'Paid')
      .gte('data_pagamento', hoje)
      .lt('data_pagamento', hoje + 'T23:59:59');

    // Dados de ontem - Receitas
    const { data: receitasOntem } = await supabase
      .from('nibo_agendamentos')
      .select('valor')
      .eq('bar_id', barId)
      .eq('tipo', 'Receivable')
      .eq('status', 'Paid')
      .gte('data_pagamento', ontem)
      .lt('data_pagamento', ontem + 'T23:59:59');

    // Dados de ontem - Despesas
    const { data: despesasOntem } = await supabase
      .from('nibo_agendamentos')
      .select('valor')
      .eq('bar_id', barId)
      .eq('tipo', 'Payable')
      .eq('status', 'Paid')
      .gte('data_pagamento', ontem)
      .lt('data_pagamento', ontem + 'T23:59:59');

    // Calcular totais
    const receitas =
      receitasHoje?.reduce(
        (acc: number, curr: NiboAgendamento) => acc + Number(curr.valor),
        0
      ) || 0;
    const despesas =
      despesasHoje?.reduce(
        (acc: number, curr: NiboAgendamento) => acc + Number(curr.valor),
        0
      ) || 0;
    const receitasOntemTotal =
      receitasOntem?.reduce(
        (acc: number, curr: NiboAgendamento) => acc + Number(curr.valor),
        0
      ) || 0;
    const despesasOntemTotal =
      despesasOntem?.reduce(
        (acc: number, curr: NiboAgendamento) => acc + Number(curr.valor),
        0
      ) || 0;

    // Calcular margem
    const margem = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;

    // Calcular tendências
    const tendenciaReceitas =
      receitasOntemTotal > 0
        ? ((receitas - receitasOntemTotal) / receitasOntemTotal) * 100
        : 0;
    const tendenciaDespesas =
      despesasOntemTotal > 0
        ? ((despesas - despesasOntemTotal) / despesasOntemTotal) * 100
        : 0;

    // Buscar total de agendamentos
    const { count: totalAgendamentos } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .or('deletado.is.null,deletado.eq.false');

    // Buscar agendamentos de ontem para tendência
    const { count: agendamentosOntem } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .gte('criado_em', ontem)
      .lt('criado_em', hoje)
      .or('deletado.is.null,deletado.eq.false');

    const tendenciaAgendamentos =
      (agendamentosOntem || 0) > 0
        ? (((totalAgendamentos || 0) - (agendamentosOntem || 0)) /
            (agendamentosOntem || 0)) *
          100
        : 0;

    return {
      receitas: Number(receitas.toFixed(2)),
      despesas: Number(despesas.toFixed(2)),
      margem: Number(margem.toFixed(1)),
      totalAgendamentos: totalAgendamentos || 0,
      tendencia: {
        receitas: Number(tendenciaReceitas.toFixed(1)),
        despesas: Number(tendenciaDespesas.toFixed(1)),
        agendamentos: Number(tendenciaAgendamentos.toFixed(1)),
      },
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao buscar resumo executivo:', apiError);
    return {
      receitas: 0,
      despesas: 0,
      margem: 0,
      totalAgendamentos: 0,
      tendencia: { receitas: 0, despesas: 0, agendamentos: 0 },
    };
  }
}

async function buscarOperacoesCriticas(barId: string) {
  try {
    // Buscar dados de checklists
    const hoje = new Date().toISOString().split('T')[0];

    const { data: checklists } = await supabase
      .from('checklist_abertura')
      .select('status')
      .eq('bar_id', barId)
      .gte('data_checklist', hoje);

    const checklistStats = {
      total: checklists?.length || 0,
      concluidos:
        checklists?.filter((c: ChecklistAbertura) => c.status === 'completed')
          .length || 0,
      pendentes:
        checklists?.filter((c: ChecklistAbertura) => c.status === 'pending')
          .length || 0,
      problemas:
        checklists?.filter((c: ChecklistAbertura) => c.status === 'problem')
          .length || 0,
    };

    // Criar alertas baseados nos dados
    const alertas = [];

    if (checklistStats.problemas > 0) {
      alertas.push({
        tipo: 'critico' as const,
        mensagem: `${checklistStats.problemas} checklist(s) com problemas`,
        timestamp: new Date().toISOString(),
      });
    }

    if (checklistStats.pendentes > 2) {
      alertas.push({
        tipo: 'importante' as const,
        mensagem: `${checklistStats.pendentes} checklist(s) pendentes`,
        timestamp: new Date().toISOString(),
      });
    }

    // Verificar agendamentos vencidos
    const { data: agendamentosVencidos } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', barId)
      .eq('status', 'Overdue')
      .or('deletado.is.null,deletado.eq.false');

    if (agendamentosVencidos && agendamentosVencidos.length > 0) {
      alertas.push({
        tipo: 'critico' as const,
        mensagem: `${agendamentosVencidos.length} agendamento(s) vencido(s)`,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      checklist: checklistStats,
      alertas,
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao buscar operações críticas:', apiError);
    return {
      checklist: { total: 0, concluidos: 0, pendentes: 0, problemas: 0 },
      alertas: [],
    };
  }
}

async function buscarMetricasChave(barId: string) {
  try {
    // Buscar dados do NIBO
    const { count: registrosNibo } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .or('deletado.is.null,deletado.eq.false');

    const { count: categoriasNibo } = await supabase
      .from('nibo_categorias')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId);

    const { count: stakeholdersNibo } = await supabase
      .from('nibo_stakeholders')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId);

    // Buscar dados do Discord
    const { data: mensagensDiscord } = await supabase
      .from('discord_messages')
      .select('id')
      .eq('bar_id', barId)
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    return {
      nibo: {
        status: 'ativo' as const,
        ultima_sync: new Date().toISOString(),
        registros: registrosNibo || 0,
        categorias: categoriasNibo || 0,
        stakeholders: stakeholdersNibo || 0,
      },
      discord: {
        status: 'ativo' as const,
        mensagens: mensagensDiscord?.length || 0,
      },
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao buscar métricas chave:', apiError);
    return {
      nibo: {
        status: 'erro' as const,
        ultima_sync: new Date().toISOString(),
        registros: 0,
        categorias: 0,
        stakeholders: 0,
      },
      discord: {
        status: 'erro' as const,
        mensagens: 0,
      },
    };
  }
}
