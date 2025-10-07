import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barId = parseInt(searchParams.get('barId') || '3');

  console.log(`🔍 DEBUG: Verificando dados para bar_id=${barId}`);

  try {
    // 1. Verificar dados na tabela contahub_periodo
    const { data: periodoData, error: periodoError } = await supabase
      .from('contahub_periodo')
      .select('dt_gerencial, vr_pagamentos')
      .eq('bar_id', barId)
      .gt('vr_pagamentos', 0)
      .order('dt_gerencial', { ascending: false })
      .limit(10);

    console.log('📊 Dados contahub_periodo:', {
      count: periodoData?.length || 0,
      error: periodoError?.message,
      sample: periodoData?.slice(0, 3)
    });

    // 2. Verificar dados na tabela contahub_fatporhora
    const { data: fatHoraData, error: fatHoraError } = await supabase
      .from('contahub_fatporhora')
      .select('vd_dtgerencial, hora, valor')
      .eq('bar_id', barId)
      .gt('valor', 0)
      .order('vd_dtgerencial', { ascending: false })
      .limit(10);

    console.log('📊 Dados contahub_fatporhora:', {
      count: fatHoraData?.length || 0,
      error: fatHoraError?.message,
      sample: fatHoraData?.slice(0, 3)
    });

    // 3. Verificar dados na tabela eventos_base
    const { data: eventosData, error: eventosError } = await supabase
      .from('eventos_base')
      .select('data, nome_evento')
      .eq('bar_id', barId)
      .order('data', { ascending: false })
      .limit(10);

    console.log('📊 Dados eventos_base:', {
      count: eventosData?.length || 0,
      error: eventosError?.message,
      sample: eventosData?.slice(0, 3)
    });

    // 4. Verificar dados na tabela contahub_analitico
    const { data: analiticoData, error: analiticoError } = await supabase
      .from('contahub_analitico')
      .select('trn_dtgerencial, prd_desc, qtd, valorfinal')
      .eq('bar_id', barId)
      .gt('valorfinal', 0)
      .order('trn_dtgerencial', { ascending: false })
      .limit(10);

    console.log('📊 Dados contahub_analitico:', {
      count: analiticoData?.length || 0,
      error: analiticoError?.message,
      sample: analiticoData?.slice(0, 3)
    });

    // 5. Verificar range de datas disponíveis
    const { data: rangeData } = await supabase
      .from('contahub_periodo')
      .select('dt_gerencial')
      .eq('bar_id', barId)
      .gt('vr_pagamentos', 0)
      .order('dt_gerencial', { ascending: true });

    const datasDisponiveis = rangeData?.map(r => r.dt_gerencial) || [];
    const primeiraData = datasDisponiveis[0];
    const ultimaData = datasDisponiveis[datasDisponiveis.length - 1];

    console.log('📅 Range de datas:', {
      primeira: primeiraData,
      ultima: ultimaData,
      total: datasDisponiveis.length
    });

    return NextResponse.json({
      success: true,
      data: {
        barId,
        tabelas: {
          contahub_periodo: {
            count: periodoData?.length || 0,
            error: periodoError?.message,
            sample: periodoData?.slice(0, 3)
          },
          contahub_fatporhora: {
            count: fatHoraData?.length || 0,
            error: fatHoraError?.message,
            sample: fatHoraData?.slice(0, 3)
          },
          eventos_base: {
            count: eventosData?.length || 0,
            error: eventosError?.message,
            sample: eventosData?.slice(0, 3)
          },
          contahub_analitico: {
            count: analiticoData?.length || 0,
            error: analiticoError?.message,
            sample: analiticoData?.slice(0, 3)
          }
        },
        range_datas: {
          primeira: primeiraData,
          ultima: ultimaData,
          total: datasDisponiveis.length,
          amostra: datasDisponiveis.slice(0, 10)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
