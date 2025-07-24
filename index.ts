import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Inicializar cliente Supabase
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
  }
  try {
    console.log('🚀 API Planejamento - teste com variáveis fixas');
    
    // Parâmetros fixos para teste
    const startDate = '2025-06-01'
    const endDate = '2025-06-30'
    const capacidadeMaxima = 300
    const metaOcupacao = 75
    const metaTicketMedio = 85
    
    console.log('📅 Período:', { startDate, endDate });
    console.log('🎯 Metas:', { capacidadeMaxima, metaOcupacao, metaTicketMedio });
    
    // Teste de conexão
    console.log('🧪 Testando conexão...');
    const { count, error: testError } = await supabase
      .from('getin_reservas')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Erro teste conexão:', testError);
      return NextResponse.json({ 
        error: 'Erro conexão banco',
        details: testError 
      }, { status: 500 });
    }

    console.log(`✅ Conexão OK - ${count} reservas na tabela`);

    // 1. Buscar reservas no período
    console.log('📊 Buscando reservas...');
    const { data: reservas, error: reservasError } = await supabase
      .from('getin_reservas')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (reservasError) {
      console.error('❌ Erro reservas:', reservasError);
      return NextResponse.json({ 
        error: 'Erro ao buscar reservas',
        details: reservasError 
      }, { status: 500 });
    }

    console.log(`📊 ${reservas?.length || 0} reservas encontradas`);

    // 2. Buscar eventos no período
    console.log('🎵 Buscando eventos...');
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('*')
      .gte('data_evento', startDate)
      .lte('data_evento', endDate)
      .eq('bar_id', 1)
      .order('data_evento', { ascending: true });

    if (eventosError) {
      console.error('❌ Erro eventos:', eventosError);
      return NextResponse.json({ 
        error: 'Erro ao buscar eventos',
        details: eventosError 
      }, { status: 500 });
    }

    console.log(`🎵 ${eventos?.length || 0} eventos encontrados`);

    // 3. Processar dados por dia
    console.log('⚙️ Processando análise...');
    const analise = processarAnalise(reservas || [], eventos || [], capacidadeMaxima, metaOcupacao, metaTicketMedio);

    // Converter análise para o formato esperado pelo frontend
    const dadosPorData: Record<string, any> = {};
    const totais = {
      reservas: 0,
      pessoas: 0,
      confirmadas: 0,
      pessoasConfirmadas: 0,
      canceladas: 0,
      pessoasCanceladas: 0
    };

    analise.forEach((dia: any) => {
      dadosPorData[dia.data] = {
        reservas: dia.reservas,
        pessoas: dia.pessoas,
        confirmadas: dia.confirmadas || 0,
        pessoasConfirmadas: dia.pessoasConfirmadas || 0,
        canceladas: dia.canceladas || 0,
        pessoasCanceladas: dia.pessoasCanceladas || 0,
        evento: dia.eventos.length > 0 ? {
          nome: dia.eventos[0].nome,
          artista: dia.eventos[0].artista,
          genero: dia.eventos[0].genero
        } : null
      };

      totais.reservas += dia.reservas;
      totais.pessoas += dia.pessoas;
      totais.confirmadas += dia.confirmadas || 0;
      totais.pessoasConfirmadas += dia.pessoasConfirmadas || 0;
      totais.canceladas += dia.canceladas || 0;
      totais.pessoasCanceladas += dia.pessoasCanceladas || 0;
    });

    return NextResponse.json({
      success: true,
      data: dadosPorData,
      totais,
      debug: {
        periodo: { startDate, endDate },
        metas: { capacidadeMaxima, metaOcupacao, metaTicketMedio },
        estatisticas: {
          total_reservas: reservas?.length || 0,
          total_eventos: eventos?.length || 0,
          total_pessoas: reservas?.reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0
        },
        count_tabela: count,
        amostra_reservas: reservas?.slice(0, 3),
        amostra_eventos: eventos?.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Função para processar análise dia por dia
function processarAnalise(reservas: any[], eventos: any[], capacidadeMaxima: number, metaOcupacao: number, metaTicketMedio: number) {
  const diasMap = new Map();

  // Processar reservas por dia
  reservas.forEach((reserva: any) => {
    const data = reserva.date;
    if (!diasMap.has(data)) {
      diasMap.set(data, {
        data,
        reservas: 0,
        pessoas: 0,
        confirmadas: 0,
        pessoasConfirmadas: 0,
        canceladas: 0,
        pessoasCanceladas: 0,
        eventos: [],
        receita_estimada: 0,
        taxa_ocupacao: 0,
        status: 'planejado'
      });
    }
    
    const dia = diasMap.get(data);
    dia.reservas++;
    dia.pessoas += reserva.people || 0;
    
    // Classificar por status - CORRIGIDO
    const statusCancelados = ['canceled-agent', 'canceled-user', 'no-show'];
    const statusConfirmados = ['confirmed', 'seated'];
    
    if (statusCancelados.includes(reserva.status)) {
      dia.canceladas++;
      dia.pessoasCanceladas += reserva.people || 0;
    } else if (statusConfirmados.includes(reserva.status)) {
      dia.confirmadas++;
      dia.pessoasConfirmadas += reserva.people || 0;
    } else {
      // Pendentes, etc. - contar como confirmadas por enquanto
      dia.confirmadas++;
      dia.pessoasConfirmadas += reserva.people || 0;
    }
    
    // Receita apenas das confirmadas (não canceladas)
    if (!statusCancelados.includes(reserva.status)) {
      dia.receita_estimada += (reserva.people || 0) * metaTicketMedio;
    }
    
    // Taxa de ocupação baseada apenas nas confirmadas
    dia.taxa_ocupacao = Math.round((dia.pessoasConfirmadas / capacidadeMaxima) * 100);
  });

  // Adicionar eventos aos dias
  eventos.forEach((evento: any) => {
    const data = evento.data_evento;
    if (!diasMap.has(data)) {
      diasMap.set(data, {
        data,
        reservas: 0,
        pessoas: 0,
        eventos: [],
        receita_estimada: 0,
        taxa_ocupacao: 0,
        status: 'planejado'
      });
    }
    
    const dia = diasMap.get(data);
    dia.eventos.push({
      nome: evento.nome_evento,
      artista: evento.nome_artista,
      genero: evento.genero_musical,
      horario: evento.horario_inicio
    });
  });

  // Processar análise por evento
  eventos.forEach((evento: any) => {
    const data = evento.data_evento;
    if (diasMap.has(data)) {
      const dia = diasMap.get(data);
      
      // Classificar performance
      if (dia.taxa_ocupacao >= metaOcupacao) {
        dia.performance = 'excelente';
      } else if (dia.taxa_ocupacao >= metaOcupacao * 0.8) {
        dia.performance = 'boa';
      } else if (dia.taxa_ocupacao >= metaOcupacao * 0.6) {
        dia.performance = 'regular';
      } else {
        dia.performance = 'ruim';
      }
      
      // Sugestões
      if (dia.taxa_ocupacao < metaOcupacao * 0.7) {
        dia.sugestoes = [
          'Intensificar divulgação',
          'Revisar precificação',
          'Considerar promoções'
        ];
      }
    }
  });

  return Array.from(diasMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}
