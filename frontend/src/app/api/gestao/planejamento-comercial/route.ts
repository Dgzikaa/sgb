import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PlanejamentoData {
  evento_id: number;
  data_evento: string;
  dia_semana: string;
  evento_nome: string;
  bar_id: number;
  bar_nome: string;
  dia: number;
  mes: number;
  ano: number;
  dia_formatado: string;
  data_curta: string;
  real_receita: number;
  m1_receita: number;
  clientes_plan: number;
  clientes_real: number;
  res_total: number;
  res_presente: number;
  lot_max: number;
  te_plan: number;
  te_real: number;
  tb_plan: number;
  tb_real: number;
  t_medio: number;
  c_art: number;
  c_prod: number;
  percent_art_fat: number;
  percent_b: number;
  percent_d: number;
  percent_c: number;
  t_coz: number;
  t_bar: number;
  fat_19h: number;
  pagamentos_liquido: number;
  total_vendas: number;
  vendas_bebida: number;
  vendas_drink: number;
  vendas_comida: number;
  percentual_atingimento_receita: number;
  percentual_atingimento_clientes: number;
  performance_geral: number;
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }
    console.log('✅ Usuário autenticado:', user.nome);

    // Buscar bares do usuário
    const { data: userBars, error: userBarsError } = await supabase
      .from('usuarios_bar')
      .select('bar_id')
      .eq('id', user.id);

    if (userBarsError || !userBars || userBars.length === 0) {
      return NextResponse.json({ error: 'Usuário não tem bares associados' }, { status: 403 });
    }

    const barIds = userBars.map(ub => ub.bar_id);
    console.log('🏪 API: IDs dos bares encontrados:', barIds);

    // Parâmetros da URL
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    console.log(`📅 Buscando dados para ${mes}/${ano}`);

    // Buscar dados da VIEW
    const { data: dados, error: viewError } = await supabase
      .from('planejamento_comercial_view')
      .select('*')
      .in('bar_id', barIds)
      .eq('mes', mes)
      .eq('ano', ano)
      .order('data_evento', { ascending: true }); // CORRIGIDO: ascending: true

    console.log('🔍 Parâmetros da consulta:', { barIds, mes, ano });
    console.log('🔍 Dados brutos da VIEW:', dados);
    console.log('🔍 Erro da VIEW:', viewError);

    if (viewError) {
      console.error('❌ Erro ao buscar dados da VIEW:', viewError);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    console.log(`📊 Dados encontrados na VIEW: ${dados?.length || 0}`);

    // Transformar dados para o formato esperado pela página
    const resultado: PlanejamentoData[] = dados?.map(item => ({
      evento_id: item.evento_id,
      data_evento: item.data_evento,
      dia_semana: item.dia_semana,
      evento_nome: item.evento_nome,
      bar_id: item.bar_id,
      bar_nome: item.bar_nome,
      dia: item.dia,
      mes: item.mes,
      ano: item.ano,
      dia_formatado: item.dia_formatado,
      data_curta: item.data_curta,
      real_receita: item.real_receita,
      m1_receita: item.m1_receita,
      clientes_plan: item.clientes_plan,
      clientes_real: item.clientes_real,
      res_total: item.res_total,
      res_presente: item.res_presente,
      lot_max: item.lot_max,
      te_plan: item.te_plan,
      te_real: item.te_real,
      tb_plan: item.tb_plan,
      tb_real: item.tb_real,
      t_medio: item.t_medio,
      c_art: item.c_art,
      c_prod: item.c_prod,
      percent_art_fat: item.percent_art_fat,
      percent_b: item.percent_b,
      percent_d: item.percent_d,
      percent_c: item.percent_c,
      t_coz: item.t_coz,
      t_bar: item.t_bar,
      fat_19h: item.fat_19h,
      pagamentos_liquido: item.pagamentos_liquido,
      total_vendas: item.total_vendas,
      vendas_bebida: item.vendas_bebida,
      vendas_drink: item.vendas_drink,
      vendas_comida: item.vendas_comida,
      percentual_atingimento_receita: item.percentual_atingimento_receita,
      percentual_atingimento_clientes: item.percentual_atingimento_clientes,
      performance_geral: item.performance_geral
    })) || [];

    console.log(`✅ Dados processados: ${resultado.length} registros`);

    return NextResponse.json({ data: resultado });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Dados atualizados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });
  }
} 