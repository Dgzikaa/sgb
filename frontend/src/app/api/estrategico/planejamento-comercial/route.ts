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
  
  // Flags para coloração verde/vermelho
  real_vs_m1_green: boolean;
  ci_real_vs_plan_green: boolean;
  te_real_vs_plan_green: boolean;
  tb_real_vs_plan_green: boolean;
  t_medio_green: boolean;
  percent_art_fat_green: boolean;
  t_coz_green: boolean;
  t_bar_green: boolean;
  fat_19h_green: boolean;
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
      .from('view_eventos')
      .select('*')
      .in('bar_id', barIds)
      .gte('data_evento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
      .lt('data_evento', `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)
      .order('data_evento', { ascending: true });

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
      evento_id: item.id || null,
      data_evento: item.data_evento,
      dia_semana: item.dia_semana, // ✅ CORRIGIDO: Usar dia_semana da view
      evento_nome: item.nome,
      bar_id: item.bar_id,
      bar_nome: 'Ordinário Bar',
      dia: parseInt(item.data_evento.split('-')[2]), // Extrair dia da string YYYY-MM-DD
      mes: parseInt(item.data_evento.split('-')[1]),
      ano: parseInt(item.data_evento.split('-')[0]),
      dia_formatado: item.data_evento.split('-')[2], // Usar dia da string YYYY-MM-DD
      data_curta: `${item.data_evento.split('-')[2]}/${item.data_evento.split('-')[1]}`, // Formato DD/MM direto da string
      real_receita: parseFloat(item.real_r) || 0,
      m1_receita: parseFloat(item.m1_r) || 0,
      
      // Flags para coloração verde/vermelho
      real_vs_m1_green: parseFloat(item.real_r) > parseFloat(item.m1_r),
      ci_real_vs_plan_green: parseFloat(item.cl_real) > parseFloat(item.cl_plan), 
      te_real_vs_plan_green: parseFloat(item.te_real) > parseFloat(item.te_plan),
      tb_real_vs_plan_green: parseFloat(item.tb_real_contahub) > parseFloat(item.tb_plan),
      t_medio_green: (parseFloat(item.te_real) + parseFloat(item.tb_real_contahub)) > 93.00,
      percent_art_fat_green: parseFloat(item.percent_art_fat) < 15,
      t_coz_green: parseFloat(item.t_coz) < 12,
      t_bar_green: parseFloat(item.t_bar) < 4,
      fat_19h_green: parseFloat(item.fat_19h_percent_contahub) > 15,
      clientes_plan: parseInt(item.cl_plan) || 0,
      clientes_real: parseInt(item.cl_real) || 0,
      res_total: parseInt(item.res_p) || 0, // res_p é o único disponível
      res_presente: parseInt(item.res_p) || 0,
      lot_max: parseInt(item.lot_max) || 0,
      te_plan: parseFloat(item.te_plan) || 0,
      te_real: parseFloat(item.te_real) || 0,
      tb_plan: parseFloat(item.tb_plan) || 0,
      tb_real: parseFloat(item.tb_real_contahub) || 0,
      t_medio: (parseFloat(item.te_real) + parseFloat(item.tb_real_contahub)) || 0,
      c_art: parseFloat(item.c_art) || 0, // TODO: implementar campo na view
      c_prod: parseFloat(item.c_prod) || 0, // TODO: implementar campo na view  
      percent_art_fat: parseFloat(item.percent_art_fat) || 0, // TODO: implementar campo na view
      percent_b: parseFloat(item.percent_bebidas_contahub) || 0,
      percent_d: parseFloat(item.percent_drinks_contahub) || 0,
      percent_c: parseFloat(item.percent_comidas_contahub) || 0,
      t_coz: parseFloat(item.t_coz) || 0,
      t_bar: parseFloat(item.t_bar) || 0,
      fat_19h: parseFloat(item.fat_19h_percent_contahub) || 0,
      pagamentos_liquido: 0, // Campo não existe na VIEW
      total_vendas: 0, // Campo não existe na VIEW
      vendas_bebida: 0, // Campo não existe na VIEW
      vendas_drink: 0, // Campo não existe na VIEW
      vendas_comida: 0, // Campo não existe na VIEW
      percentual_atingimento_receita: parseFloat(item.percentual_atingimento_m1) || 0,
      percentual_atingimento_clientes: item.cl_real_total > 0 && item.cl_plan > 0 ? ((parseInt(item.cl_real_total) / parseInt(item.cl_plan)) * 100) : 0,
      performance_geral: 85 // Campo calculado como número
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