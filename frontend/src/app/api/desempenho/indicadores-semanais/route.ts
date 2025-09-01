import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const semana = searchParams.get('semana');
    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    
    if (!semana) {
      return NextResponse.json(
        { error: 'Parâmetro semana é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados da semana de referência
    const { data: semanaRef, error: semanaError } = await supabase
      .from('semanas_referencia')
      .select('data_inicio, data_fim, periodo_formatado')
      .eq('semana', parseInt(semana))
      .single();

    if (semanaError || !semanaRef) {
      return NextResponse.json(
        { error: 'Semana não encontrada' },
        { status: 404 }
      );
    }

    // Buscar indicadores de forma otimizada usando queries separadas
    const resultado = {
      semana: parseInt(semana),
      ano: parseInt(ano),
      periodo: semanaRef.periodo_formatado,
      data_inicio: semanaRef.data_inicio,
      data_fim: semanaRef.data_fim,
      indicadores: {}
    };

    // 1. Faturamento Total (ContaHub Pagamentos)
    const { data: faturamentoData } = await supabase
      .from('contahub_pagamentos')
      .select('liquido')
      .gte('dt_gerencial', semanaRef.data_inicio)
      .lte('dt_gerencial', semanaRef.data_fim)
      .eq('bar_id', 3);

    const faturamentoTotal = faturamentoData?.reduce((sum, item) => sum + (parseFloat(item.liquido) || 0), 0) || 0;

    // 2. Faturamento Couvert (ContaHub Período)
    const { data: couvertData } = await supabase
      .from('contahub_periodo')
      .select('vr_couvert')
      .gte('dt_gerencial', semanaRef.data_inicio)
      .lte('dt_gerencial', semanaRef.data_fim)
      .eq('bar_id', 3);

    const faturamentoCouvert = couvertData?.reduce((sum, item) => sum + (parseFloat(item.vr_couvert) || 0), 0) || 0;

    // 3. CMO (Nibo Agendamentos)
    const categoriasCMO = [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÇÃO', 'ADICIONAIS',
      'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA',
      'FREELA SEGURANÇA', 'PRO LABORE', 'PROVISÃO TRABALHISTA'
    ];

    const { data: cmoData } = await supabase
      .from('nibo_agendamentos')
      .select('valor')
      .gte('data_competencia', semanaRef.data_inicio)
      .lte('data_competencia', semanaRef.data_fim)
      .eq('bar_id', 3)
      .in('categoria_nome', categoriasCMO);

    const cmo = cmoData?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0;

    // 4. Dados dos Eventos Base
    const { data: eventosData } = await supabase
      .from('eventos_base')
      .select('c_art, c_prod, cl_real, res_tot, res_p')
      .gte('data_evento', semanaRef.data_inicio)
      .lte('data_evento', semanaRef.data_fim)
      .eq('bar_id', 3)
      .eq('ativo', true);

    const atracaoFaturamento = eventosData?.reduce((sum, item) => 
      sum + (parseFloat(item.c_art) || 0) + (parseFloat(item.c_prod) || 0), 0) || 0;
    
    const clientesAtendidos = eventosData?.reduce((sum, item) => 
      sum + (parseInt(item.cl_real) || 0), 0) || 0;
    
    const reservasTotais = eventosData?.reduce((sum, item) => 
      sum + (parseInt(item.res_tot) || 0), 0) || 0;
    
    const reservasPresentes = eventosData?.reduce((sum, item) => 
      sum + (parseInt(item.res_p) || 0), 0) || 0;

    // Calcular indicadores derivados
    const faturamentoBar = faturamentoTotal - faturamentoCouvert;
    const cmoPercentual = faturamentoTotal > 0 ? (cmo / faturamentoTotal) * 100 : 0;
    const atracaoPercentual = faturamentoTotal > 0 ? (atracaoFaturamento / faturamentoTotal) * 100 : 0;

    // Montar objeto de indicadores
    resultado.indicadores = {
      faturamento_total: faturamentoTotal,
      faturamento_couvert: faturamentoCouvert,
      faturamento_bar: faturamentoBar,
      cmo_valor: cmo,
      cmo_percentual: cmoPercentual,
      atracao_faturamento: atracaoFaturamento,
      atracao_percentual: atracaoPercentual,
      clientes_atendidos: clientesAtendidos,
      reservas_totais: reservasTotais,
      reservas_presentes: reservasPresentes,
      cmv_rs: 0 // Manual - será preenchido posteriormente
    };

    return NextResponse.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Erro na API de indicadores semanais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { semana, ano, indicadores } = body;

    if (!semana || !indicadores) {
      return NextResponse.json(
        { error: 'Semana e indicadores são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados da semana
    const { data: semanaRef, error: semanaError } = await supabase
      .from('semanas_referencia')
      .select('data_inicio, data_fim')
      .eq('semana', parseInt(semana))
      .single();

    if (semanaError || !semanaRef) {
      return NextResponse.json(
        { error: 'Semana não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe registro para esta semana
    const { data: existingRecord } = await supabase
      .from('desempenho_semanal')
      .select('id')
      .eq('numero_semana', parseInt(semana))
      .eq('ano', parseInt(ano || new Date().getFullYear()))
      .eq('bar_id', 3)
      .single();

    const dadosDesempenho = {
      bar_id: 3,
      ano: parseInt(ano || new Date().getFullYear()),
      numero_semana: parseInt(semana),
      data_inicio: semanaRef.data_inicio,
      data_fim: semanaRef.data_fim,
      faturamento_total: indicadores.faturamento_total || 0,
      faturamento_entrada: indicadores.faturamento_couvert || 0,
      faturamento_bar: indicadores.faturamento_bar || 0,
      clientes_atendidos: indicadores.clientes_atendidos || 0,
      reservas_totais: indicadores.reservas_totais || 0,
      reservas_presentes: indicadores.reservas_presentes || 0,
      cmo: indicadores.cmo || 0,
      custo_atracao_faturamento: indicadores.atracao_faturamento || 0,
      cmv_rs: indicadores.cmv_rs || 0,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingRecord) {
      // Atualizar registro existente
      result = await supabase
        .from('desempenho_semanal')
        .update(dadosDesempenho)
        .eq('id', existingRecord.id);
    } else {
      // Criar novo registro
      result = await supabase
        .from('desempenho_semanal')
        .insert(dadosDesempenho);
    }

    if (result.error) {
      console.error('Erro ao salvar desempenho:', result.error);
      return NextResponse.json(
        { error: 'Erro ao salvar dados de desempenho' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: existingRecord ? 'Dados atualizados com sucesso' : 'Dados salvos com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar indicadores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
