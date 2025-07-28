import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const bar_id = searchParams.get('bar_id') || '1';
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log(`📊 Relatório solicitado: ${tipo} para bar ${bar_id}`);

    let query;
    let result;

    switch (tipo) {
      case 'analitico':
        query = supabase
          .from('contahub_analitico')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .limit(limit);

        if (data_inicio) {
          query = query.gte('trn_dtgerencial', data_inicio);
        }
        if (data_fim) {
          query = query.lte('trn_dtgerencial', data_fim);
        }

        result = await query;
        break;

      case 'pagamentos':
        query = supabase
          .from('contahub_pagamentos')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .limit(limit);

        if (data_inicio) {
          query = query.gte('dt_gerencial', data_inicio);
        }
        if (data_fim) {
          query = query.lte('dt_gerencial', data_fim);
        }

        result = await query;
        break;

      case 'periodo':
        query = supabase
          .from('contahub_periodo')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .limit(limit);

        if (data_inicio) {
          query = query.gte('dt_gerencial', data_inicio);
        }
        if (data_fim) {
          query = query.lte('dt_gerencial', data_fim);
        }

        result = await query;
        break;

      case 'tempo':
        query = supabase
          .from('contahub_tempo')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .limit(limit);

        if (data_inicio) {
          query = query.gte('dia', data_inicio);
        }
        if (data_fim) {
          query = query.lte('dia', data_fim);
        }

        result = await query;
        break;

      case 'fatporhora':
        query = supabase
          .from('contahub_fatporhora')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .limit(limit);

        if (data_inicio) {
          query = query.gte('vd_dtgerencial', data_inicio);
        }
        if (data_fim) {
          query = query.lte('vd_dtgerencial', data_fim);
        }

        result = await query;
        break;

      case 'resumo':
        // Resumo geral de todas as tabelas
        const [analitico, pagamentos, periodo, tempo, fatporhora] = await Promise.all([
          supabase
            .from('contahub_analitico')
            .select('*')
            .eq('bar_id', parseInt(bar_id))
            .limit(1000),
          supabase
            .from('contahub_pagamentos')
            .select('*')
            .eq('bar_id', parseInt(bar_id))
            .limit(1000),
          supabase
            .from('contahub_periodo')
            .select('*')
            .eq('bar_id', parseInt(bar_id))
            .limit(1000),
          supabase
            .from('contahub_tempo')
            .select('*')
            .eq('bar_id', parseInt(bar_id))
            .limit(1000),
          supabase
            .from('contahub_fatporhora')
            .select('*')
            .eq('bar_id', parseInt(bar_id))
            .limit(1000)
        ]);

        result = {
          data: {
            analitico: {
              total_registros: analitico.data?.length || 0,
              amostra: analitico.data?.slice(0, 5) || []
            },
            pagamentos: {
              total_registros: pagamentos.data?.length || 0,
              amostra: pagamentos.data?.slice(0, 5) || []
            },
            periodo: {
              total_registros: periodo.data?.length || 0,
              amostra: periodo.data?.slice(0, 5) || []
            },
            tempo: {
              total_registros: tempo.data?.length || 0,
              amostra: tempo.data?.slice(0, 5) || []
            },
            fatporhora: {
              total_registros: fatporhora.data?.length || 0,
              amostra: fatporhora.data?.slice(0, 5) || []
            }
          },
          error: null
        };
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Tipo de relatório inválido',
            tipos_disponiveis: ['analitico', 'pagamentos', 'periodo', 'tempo', 'fatporhora', 'resumo']
          },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error(`❌ Erro ao buscar dados ${tipo}:`, result.error);
      return NextResponse.json(
        { error: `Erro ao buscar dados: ${result.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tipo,
      bar_id: parseInt(bar_id),
      total_registros: Array.isArray(result.data) ? result.data.length : 'N/A',
      dados: result.data,
      filtros: {
        data_inicio,
        data_fim,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 