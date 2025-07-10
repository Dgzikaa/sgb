import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const tipoAnalise = searchParams.get('tipo') || 'diario'; // diario, mensal, evento

    if (!barId) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 });
    }

    // Inicializar cliente Supabase com secrets
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco de dados' }, { status: 500 });
    }

    const hoje = new Date().toISOString().split('T')[0];
    const inicio = dataInicio || hoje;
    const fim = dataFim || hoje;

    // 1. Análise geral de recorrência
    const { data: resumoGeral, error: errorResumo } = await supabase
      .from('cliente_visitas')
      .select(`
        *,
        clientes!inner(total_visitas, tipo_cliente, data_primeiro_visit),
        eventos(nome_evento, genero_musical, nome_artista)
      `)
      .eq('bar_id', parseInt(barId))
      .gte('data_visita', inicio)
      .lte('data_visita', fim);

    if (errorResumo) {
      console.error('Erro ao buscar dados de recorrência:', errorResumo);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    // 2. Calcular métricas
    const visitasNovas = resumoGeral?.filter((v: any) => v.clientes.total_visitas === 1) || [];
    const visitasRecorrentes = resumoGeral?.filter((v: any) => v.clientes.total_visitas > 1) || [];
    
    const totalVisitas = resumoGeral?.length || 0;
    const clientesNovos = visitasNovas.length;
    const clientesRecorrentes = visitasRecorrentes.length;
    
    const percentualNovos = totalVisitas > 0 ? (clientesNovos / totalVisitas) * 100 : 0;
    const percentualRecorrentes = totalVisitas > 0 ? (clientesRecorrentes / totalVisitas) * 100 : 0;

    // 3. Análise por evento
    const eventoStats: { [key: string]: any } = {};
    resumoGeral?.forEach((visita: any) => {
      if (visita.evento_id && visita.eventos) {
        const eventoKey = `${visita.evento_id}_${visita.eventos.nome_evento}`;
        if (!eventoStats[eventoKey]) {
          eventoStats[eventoKey] = {
            evento_id: visita.evento_id,
            nome_evento: visita.eventos.nome_evento,
            genero_musical: visita.eventos.genero_musical,
            nome_artista: visita.eventos.nome_artista,
            total_visitas: 0,
            clientes_novos: 0,
            clientes_recorrentes: 0,
            valor_total: 0
          };
        }
        
        eventoStats[eventoKey].total_visitas++;
        eventoStats[eventoKey].valor_total += parseFloat(visita.valor_gasto) || 0;
        
        if (visita.clientes.total_visitas === 1) {
          eventoStats[eventoKey].clientes_novos++;
        } else {
          eventoStats[eventoKey].clientes_recorrentes++;
        }
      }
    });

    // 4. Análise temporal (por dia)
    const { data: analiseTemporalRaw, error: errorTemporal } = await supabase
      .from('cliente_visitas')
      .select(`
        data_visita,
        clientes!inner(total_visitas, tipo_cliente)
      `)
      .eq('bar_id', parseInt(barId))
      .gte('data_visita', inicio)
      .lte('data_visita', fim)
      .order('data_visita');

    const analiseTemporal: { [key: string]: any } = {};
    analiseTemporalRaw?.forEach((visita: any) => {
      const data = visita.data_visita;
      if (!analiseTemporal[data]) {
        analiseTemporal[data] = {
          data,
          total_visitas: 0,
          clientes_novos: 0,
          clientes_recorrentes: 0
        };
      }
      
      analiseTemporal[data].total_visitas++;
      if (visita.clientes.total_visitas === 1) {
        analiseTemporal[data].clientes_novos++;
      } else {
        analiseTemporal[data].clientes_recorrentes++;
      }
    });

    // 5. Top clientes recorrentes
    const { data: topClientes, error: errorTop } = await supabase
      .from('clientes')
      .select('nome, cpf, total_visitas, valor_total_gasto, valor_medio_ticket, data_primeiro_visit, data_ultimo_visit')
      .eq('bar_id', parseInt(barId))
      .gte('total_visitas', 2)
      .order('total_visitas', { ascending: false })
      .limit(10);

    // 6. Estatísticas de fidelização
    const { data: estatisticasFidelizacao, error: errorFid } = await supabase
      .from('clientes')
      .select('total_visitas')
      .eq('bar_id', parseInt(barId));

    const distribuicaoVisitas: { [key: number]: number } = {};
    estatisticasFidelizacao?.forEach((cliente: any) => {
      const visitas = cliente.total_visitas;
      distribuicaoVisitas[visitas] = (distribuicaoVisitas[visitas] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      periodo: { inicio, fim },
      resumo: {
        total_visitas: totalVisitas,
        clientes_novos: clientesNovos,
        clientes_recorrentes: clientesRecorrentes,
        percentual_novos: Math.round(percentualNovos * 100) / 100,
        percentual_recorrentes: Math.round(percentualRecorrentes * 100) / 100
      },
      eventos: Object.values(eventoStats).map(evento => ({
        ...evento,
        percentual_novos: evento.total_visitas > 0 ? Math.round((evento.clientes_novos / evento.total_visitas) * 10000) / 100 : 0,
        percentual_recorrentes: evento.total_visitas > 0 ? Math.round((evento.clientes_recorrentes / evento.total_visitas) * 10000) / 100 : 0,
        valor_medio_por_cliente: evento.total_visitas > 0 ? Math.round((evento.valor_total / evento.total_visitas) * 100) / 100 : 0
      })),
      analise_temporal: Object.values(analiseTemporal),
      top_clientes_recorrentes: topClientes || [],
      distribuicao_visitas: distribuicaoVisitas,
      total_clientes_cadastrados: estatisticasFidelizacao?.length || 0
    });

  } catch (error) {
    console.error('Erro na análise de recorrência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}