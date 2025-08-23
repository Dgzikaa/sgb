import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

// POST - Migrar dados do localStorage para a coluna metas da tabela bars
export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { bar_id, metas_config } = body;

    if (!bar_id || !metas_config) {
      return NextResponse.json(
        { success: false, error: 'bar_id e metas_config são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe configuração para este bar
    const { data: bar, error: checkError } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', parseInt(bar_id))
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar metas existentes:', checkError);
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar metas existentes' },
        { status: 500 }
      );
    }

    // Preparar dados para inserção/atualização
    const metasData = {
      faturamento_diario:
        metas_config.faturamento_diario ||
        metas_config.faturamentoDiario ||
        5000,
      clientes_diario:
        metas_config.clientes_diario || metas_config.clientesDiario || 80,
      ticket_entrada:
        metas_config.ticket_entrada || metas_config.ticketEntrada || 25,
      ticket_bar: metas_config.ticket_bar || metas_config.ticketBar || 35,
      ticket_couvert:
        metas_config.ticket_couvert || metas_config.ticketCouvert || 50,
      ticket_medio_target: metas_config.ticket_medio_target || 93,
      cmv_teorico: metas_config.cmv_teorico || metas_config.cmvTeorico || 30,
      cmo: metas_config.cmo || 15,
      meta_mensal_faturamento: metas_config.meta_mensal_faturamento || 150000,
      meta_mensal_clientes: metas_config.meta_mensal_clientes || 2400,
      tempo_saida_cozinha: metas_config.tempo_saida_cozinha || 12,
      tempo_saida_bar: metas_config.tempo_saida_bar || 4,
      reservas_diarias:
        metas_config.reservas_diarias || metas_config.reservasDiarias || 133,
      reservas_semanais: metas_config.reservas_semanais || 800,
      reservas_mensais: metas_config.reservas_mensais || 3200,
      metas_por_dia: metas_config.metas_por_dia ||
        metas_config.metasPorDia || {
          '0': { faturamento: 0, clientes: 0, ativo: false },
          '1': { faturamento: 0, clientes: 0, ativo: false },
          '2': { faturamento: 0, clientes: 0, ativo: false },
          '3': { faturamento: 40000, clientes: 400, ativo: true },
          '4': { faturamento: 50000, clientes: 500, ativo: true },
          '5': { faturamento: 60000, clientes: 600, ativo: true },
          '6': { faturamento: 70000, clientes: 700, ativo: true },
        },
    };

    let result;

    if (bar?.metas) {
      // Atualizar registro existente
      const { data, error } = await supabase
        .from('bars')
        .update({
          metas: metasData,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', parseInt(bar_id))
        .select('metas')
        .single();

      if (error) {
        console.error('Erro ao atualizar metas:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar metas no banco' },
          { status: 500 }
        );
      }

      result = data.metas;
    } else {
      // Inserir novo registro
      const { data, error } = await supabase
        .from('bars')
        .update({
          metas: metasData,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', parseInt(bar_id))
        .select('metas')
        .single();

      if (error) {
        console.error('Erro ao inserir metas:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao inserir metas no banco' },
          { status: 500 }
        );
      }

      result = data.metas;
    }

    return NextResponse.json({
      success: true,
      message: bar?.metas
        ? 'Metas atualizadas com sucesso'
        : 'Metas criadas com sucesso',
      data: result,
    });
  } catch (error) {
    console.error('Erro na migração de metas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar status da migração
export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const { data: bar, error } = await supabase
      .from('bars')
      .select('metas')
      .eq('id', parseInt(bar_id))
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar metas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar metas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      migrated: !!bar?.metas,
      data: bar?.metas || null,
    });
  } catch (error) {
    console.error('Erro ao verificar migração:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
