import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    
    // Obter parâmetros
    const { searchParams } = new URL(request.url);
    const semana = parseInt(searchParams.get('semana') || '1');
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());
    
    // Obter bar_id do header
    const userDataHeader = request.headers.get('x-user-data');
    let barId = 3; // Default
    
    if (userDataHeader) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataHeader));
        if (userData.bar_id) barId = userData.bar_id;
      } catch (e) {
        console.warn('Erro ao parsear user data:', e);
      }
    }

    // Buscar dados da semana atual
    const { data: dadosSemana, error: erroSemana } = await supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', barId)
      .eq('numero_semana', semana)
      .eq('ano', ano)
      .single();

    if (erroSemana && erroSemana.code !== 'PGRST116') {
      console.error('Erro ao buscar semana:', erroSemana);
    }

    // Calcular semana anterior
    let semanaAnterior = semana - 1;
    let anoAnterior = ano;
    if (semanaAnterior < 1) {
      semanaAnterior = 53;
      anoAnterior = ano - 1;
    }

    // Buscar dados da semana anterior
    const { data: dadosSemanaAnterior, error: erroAnterior } = await supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', barId)
      .eq('numero_semana', semanaAnterior)
      .eq('ano', anoAnterior)
      .single();

    if (erroAnterior && erroAnterior.code !== 'PGRST116') {
      console.error('Erro ao buscar semana anterior:', erroAnterior);
    }

    // Contar total de semanas com dados
    const { count } = await supabase
      .from('desempenho_semanal')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .eq('ano', ano);

    return NextResponse.json({
      success: true,
      semana: dadosSemana || null,
      semanaAnterior: dadosSemanaAnterior || null,
      totalSemanas: count || 53,
      parametros: {
        semana,
        ano,
        barId
      }
    });

  } catch (error) {
    console.error('Erro na API de desempenho semanal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
