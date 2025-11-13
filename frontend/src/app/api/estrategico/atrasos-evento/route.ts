import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Limites de tempo para considerar atraso (em segundos)
const LIMITE_ATRASO_COZINHA = 1200; // 20 minutos
const LIMITE_ATRASO_BAR = 600;      // 10 minutos

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API Atrasos Evento');

    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parâmetros da URL
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json({ 
        error: 'Data é obrigatória' 
      }, { status: 400 });
    }

    console.log(`📅 Buscando atrasos para data: ${data} - Bar ID: ${user.bar_id}`);

    // Buscar dados de tempo do ContaHub
    const { data: tempoDados, error: tempoError } = await supabase
      .from('contahub_tempo')
      .select('categoria, t1_t3')
      .eq('dia', data)
      .eq('bar_id', user.bar_id)
      .not('t1_t3', 'is', null);

    if (tempoError) {
      console.error('❌ Erro ao buscar dados de tempo:', tempoError);
      return NextResponse.json({ 
        error: 'Erro ao buscar dados de tempo',
        details: tempoError.message 
      }, { status: 500 });
    }

    // Calcular atrasos
    const atrasosCozinha = tempoDados?.filter(
      item => item.categoria === 'comida' && parseFloat(item.t1_t3) > LIMITE_ATRASO_COZINHA
    ).length || 0;

    const atrasosBar = tempoDados?.filter(
      item => item.categoria === 'drink' && parseFloat(item.t1_t3) > LIMITE_ATRASO_BAR
    ).length || 0;

    console.log(`🍳 Atrasos Cozinha (>20min): ${atrasosCozinha}`);
    console.log(`🍺 Atrasos Bar (>10min): ${atrasosBar}`);

    return NextResponse.json({
      success: true,
      data: {
        atrasos_cozinha: atrasosCozinha,
        atrasos_bar: atrasosBar,
        data_evento: data,
        total_itens: tempoDados?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

