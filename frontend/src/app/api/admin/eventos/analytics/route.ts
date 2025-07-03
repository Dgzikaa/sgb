import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const tipo_analise = searchParams.get('tipo') || 'artistas'; // artistas, generos, periodo

    if (!bar_id) {
      return NextResponse.json({
        success: false,
        error: 'bar_id é obrigatório'
      }, { status: 400 });
    }

    let dados = [];

    switch (tipo_analise) {
      case 'artistas':
        // Análise por artista/banda
        const { data: eventosPorArtista, error: errorArtistas } = await supabase
          .from('eventos')
          .select(`
            nome_artista,
            nome_banda,
            publico_real,
            receita_total,
            data_evento,
            nome_evento,
            genero_musical
          `)
          .eq('bar_id', bar_id)
          .not('publico_real', 'is', null)
          .not('faturamento_liquido', 'is', null)
          .order('data_evento', { ascending: false });

        if (errorArtistas) throw errorArtistas;

        // Agrupar por artista
        const artistasStats: Record<string, any> = {};
        eventosPorArtista?.forEach((evento: any) => {
          const artista = evento.nome_artista || evento.nome_banda || 'Não informado';
          
          if (!artistasStats[artista]) {
            artistasStats[artista] = {
              nome: artista,
              total_eventos: 0,
              publico_total: 0,
              faturamento_total: 0,
              ticket_medio_geral: 0,
              melhor_evento: null,
              ultimo_evento: null,
              generos: new Set(),
              eventos: []
            };
          }

          const stats = artistasStats[artista];
          stats.total_eventos++;
          stats.publico_total += evento.publico_real || 0;
          stats.faturamento_total += evento.receita_total || 0;
          stats.generos.add(evento.genero_musical);
          stats.eventos.push(evento);

          // Melhor evento por faturamento
          if (!stats.melhor_evento || (evento.receita_total > stats.melhor_evento.receita_total)) {
            stats.melhor_evento = evento;
          }

          // Último evento
          if (!stats.ultimo_evento || evento.data_evento > stats.ultimo_evento.data_evento) {
            stats.ultimo_evento = evento;
          }
        });

        // Calcular médias e converter Set para Array
        dados = Object.values(artistasStats).map((stats: any) => ({
          ...stats,
          publico_medio: stats.total_eventos > 0 ? stats.publico_total / stats.total_eventos : 0,
          faturamento_medio: stats.total_eventos > 0 ? stats.faturamento_total / stats.total_eventos : 0,
          ticket_medio_geral: stats.publico_total > 0 ? stats.faturamento_total / stats.publico_total : 0,
          generos: Array.from(stats.generos)
        })).sort((a, b) => b.faturamento_total - a.faturamento_total);

        break;

      case 'generos':
        // Análise por gênero musical
        const { data: eventosPorGenero, error: errorGeneros } = await supabase
          .from('eventos')
          .select(`
            genero_musical,
            publico_real,
            receita_total,
            data_evento,
            nome_evento,
            nome_artista,
            nome_banda
          `)
          .eq('bar_id', bar_id)
          .not('publico_real', 'is', null)
          .not('faturamento_liquido', 'is', null)
          .order('data_evento', { ascending: false });

        if (errorGeneros) throw errorGeneros;

        // Agrupar por gênero
        const generosStats: Record<string, any> = {};
        eventosPorGenero?.forEach((evento: any) => {
          const genero = evento.genero_musical || 'Não informado';
          
          if (!generosStats[genero]) {
            generosStats[genero] = {
              genero,
              total_eventos: 0,
              publico_total: 0,
              faturamento_total: 0,
              artistas_unicos: new Set(),
              melhor_evento: null,
              eventos: []
            };
          }

          const stats = generosStats[genero];
          stats.total_eventos++;
          stats.publico_total += evento.publico_real || 0;
          stats.faturamento_total += evento.receita_total || 0;
          const artista = evento.nome_artista || evento.nome_banda || 'Não informado';
          stats.artistas_unicos.add(artista);
          stats.eventos.push(evento);

          if (!stats.melhor_evento || (evento.receita_total > stats.melhor_evento.receita_total)) {
            stats.melhor_evento = evento;
          }
        });

        dados = Object.values(generosStats).map((stats: any) => ({
          ...stats,
          publico_medio: stats.total_eventos > 0 ? stats.publico_total / stats.total_eventos : 0,
          faturamento_medio: stats.total_eventos > 0 ? stats.faturamento_total / stats.total_eventos : 0,
          ticket_medio_geral: stats.publico_total > 0 ? stats.faturamento_total / stats.publico_total : 0,
          total_artistas: stats.artistas_unicos.size,
          artistas_unicos: Array.from(stats.artistas_unicos)
        })).sort((a, b) => b.faturamento_total - a.faturamento_total);

        break;

      case 'periodo':
        // Análise por período (mensal)
        const { data: eventosPorPeriodo, error: errorPeriodo } = await supabase
          .from('eventos')
          .select(`
            data_evento,
            publico_real,
            receita_total,
            nome_evento,
            genero_musical,
            nome_artista,
            nome_banda
          `)
          .eq('bar_id', bar_id)
          .not('publico_real', 'is', null)
          .not('faturamento_liquido', 'is', null)
          .order('data_evento', { ascending: false });

        if (errorPeriodo) throw errorPeriodo;

        // Agrupar por mês
        const periodosStats: Record<string, any> = {};
        eventosPorPeriodo?.forEach((evento: any) => {
          const data = new Date(evento.data_evento);
          const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          const mesLabel = data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
          
          if (!periodosStats[mesAno]) {
            periodosStats[mesAno] = {
              periodo: mesAno,
              periodo_label: mesLabel,
              total_eventos: 0,
              publico_total: 0,
              faturamento_total: 0,
              generos: new Set(),
              melhor_evento: null,
              eventos: []
            };
          }

          const stats = periodosStats[mesAno];
          stats.total_eventos++;
          stats.publico_total += evento.publico_real || 0;
          stats.faturamento_total += evento.receita_total || 0;
          stats.generos.add(evento.genero_musical);
          stats.eventos.push(evento);

          if (!stats.melhor_evento || (evento.receita_total > stats.melhor_evento.receita_total)) {
            stats.melhor_evento = evento;
          }
        });

        dados = Object.values(periodosStats).map((stats: any) => ({
          ...stats,
          publico_medio: stats.total_eventos > 0 ? stats.publico_total / stats.total_eventos : 0,
          faturamento_medio: stats.total_eventos > 0 ? stats.faturamento_total / stats.total_eventos : 0,
          ticket_medio_geral: stats.publico_total > 0 ? stats.faturamento_total / stats.publico_total : 0,
          generos: Array.from(stats.generos)
        })).sort((a, b) => b.periodo.localeCompare(a.periodo));

        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de análise inválido'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: dados,
      tipo_analise,
      total_registros: dados.length
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 
