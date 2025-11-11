import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função auxiliar para aplicar filtros base (locais e prefixos a ignorar)
const aplicarFiltrosBase = (query: any) => {
  // LOCAIS A IGNORAR PERMANENTEMENTE
  query = query
    .neq('loc_desc', 'Pegue e Pague')
    .neq('loc_desc', 'Shot e Dose')
    .neq('loc_desc', 'Venda Volante')
    .not('loc_desc', 'is', null); // Excluir "Sem local definido"
  
  // PRODUTOS COM PREFIXOS A IGNORAR
  query = query
    .not('prd_desc', 'ilike', '[HH]%')  // Happy Hour
    .not('prd_desc', 'ilike', '[PP]%')  // Pegue Pague
    .not('prd_desc', 'ilike', '[DD]%')  // Dose Dupla
    .not('prd_desc', 'ilike', '[IN]%'); // Insumos
  
  return query;
};

interface AnaliseStockoutHistorico {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  bar_id: number;
  resumo: {
    total_dias: number;
    media_stockout: string;
    media_disponibilidade: string;
  };
  analise_por_dia_semana: Array<{
    dia_semana: string;
    dia_numero: number;
    total_ocorrencias: number;
    media_stockout: string;
    media_disponibilidade: string;
    melhor_dia: boolean;
    pior_dia: boolean;
  }>;
  analise_semanal: Array<{
    semana_inicio: string;
    semana_fim: string;
    numero_semana: number;
    dias_com_dados: number;
    media_stockout: string;
    media_disponibilidade: string;
  }>;
  historico_diario: Array<{
    data_referencia: string;
    dia_semana: string;
    total_produtos_ativos: number;
    produtos_disponiveis: number;
    produtos_stockout: number;
    percentual_stockout: string;
    percentual_disponibilidade: string;
  }>;
}

function getDiaSemana(data: string): { nome: string; numero: number } {
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];
  const date = new Date(data + 'T00:00:00');
  const numero = date.getDay();
  return { nome: diasSemana[numero], numero };
}

function getNumeroSemana(data: string): number {
  const date = new Date(data + 'T00:00:00');
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

function getInicioFimSemana(data: string): { inicio: string; fim: string } {
  const date = new Date(data + 'T00:00:00');
  const dayOfWeek = date.getDay();
  
  // Início da semana (domingo)
  const inicioSemana = new Date(date);
  inicioSemana.setDate(date.getDate() - dayOfWeek);
  
  // Fim da semana (sábado)
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  
  return {
    inicio: inicioSemana.toISOString().split('T')[0],
    fim: fimSemana.toISOString().split('T')[0]
  };
}

export async function POST(request: NextRequest) {
  try {
    const { data_inicio, data_fim, bar_id = 3, filtros = [] } = await request.json();

    if (!data_inicio || !data_fim) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando histórico de stockout: ${data_inicio} até ${data_fim}`);

    // Buscar dados históricos com NOVA LÓGICA: apenas produtos ativos='S'
    let query = supabase
      .from('contahub_stockout')
      .select('data_consulta, prd_ativo, prd_venda, loc_desc, prd_desc')
      .eq('prd_ativo', 'S') // Apenas produtos ativos
      .gte('data_consulta', data_inicio)
      .lte('data_consulta', data_fim)
      .eq('bar_id', bar_id);

    // Aplicar filtros base
    query = aplicarFiltrosBase(query);

    // Aplicar filtros adicionais do usuário se existirem
    if (filtros.length > 0) {
      filtros.forEach((filtro: string) => {
        if (filtro !== 'sem_local') {
          query = query.neq('loc_desc', filtro);
        }
      });
    }

    const { data: dadosHistoricos, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar dados históricos: ${error.message}`);
    }

    if (!dadosHistoricos || dadosHistoricos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado encontrado para o período especificado',
        data: null
      });
    }

    // Agrupar dados por data
    const dadosPorData = new Map();
    dadosHistoricos.forEach(item => {
      const data = item.data_consulta;
      if (!dadosPorData.has(data)) {
        dadosPorData.set(data, {
          total_ativos: 0,
          disponiveis: 0,
          stockout: 0
        });
      }
      const stats = dadosPorData.get(data);
      stats.total_ativos++;
      if (item.prd_venda === 'S') {
        stats.disponiveis++;
      } else if (item.prd_venda === 'N') {
        stats.stockout++;
      }
    });

    // Processar histórico diário
    const historicoDiario = Array.from(dadosPorData.entries()).map(([data, stats]) => {
      const diaSemana = getDiaSemana(data);
      const percentualStockout = stats.total_ativos > 0 ? 
        ((stats.stockout / stats.total_ativos) * 100).toFixed(2) : '0.00';
      
      return {
        data_referencia: data,
        dia_semana: diaSemana.nome,
        total_produtos_ativos: stats.total_ativos,
        produtos_disponiveis: stats.disponiveis,
        produtos_stockout: stats.stockout,
        percentual_stockout: `${percentualStockout}%`,
        percentual_disponibilidade: `${(100 - parseFloat(percentualStockout)).toFixed(2)}%`
      };
    }).sort((a, b) => a.data_referencia.localeCompare(b.data_referencia));

    // Análise por dia da semana
    const dadosPorDiaSemana = new Map();
    historicoDiario.forEach(dia => {
      const diaSemana = getDiaSemana(dia.data_referencia);
      if (!dadosPorDiaSemana.has(diaSemana.numero)) {
        dadosPorDiaSemana.set(diaSemana.numero, {
          nome: diaSemana.nome,
          ocorrencias: [],
          soma_stockout: 0
        });
      }
      const stats = dadosPorDiaSemana.get(diaSemana.numero);
      const percentual = parseFloat(dia.percentual_stockout.replace('%', ''));
      stats.ocorrencias.push(percentual);
      stats.soma_stockout += percentual;
    });

    const analisePorDiaSemana = Array.from(dadosPorDiaSemana.entries()).map(([numero, stats]) => {
      const mediaStockout = stats.ocorrencias.length > 0 ? 
        (stats.soma_stockout / stats.ocorrencias.length).toFixed(2) : '0.00';
      
      return {
        dia_semana: stats.nome,
        dia_numero: numero,
        total_ocorrencias: stats.ocorrencias.length,
        media_stockout: `${mediaStockout}%`,
        media_disponibilidade: `${(100 - parseFloat(mediaStockout)).toFixed(2)}%`,
        melhor_dia: false, // Será definido depois
        pior_dia: false    // Será definido depois
      };
    }).sort((a, b) => a.dia_numero - b.dia_numero);

    // Identificar melhor e pior dia
    if (analisePorDiaSemana.length > 0) {
      const melhorDia = analisePorDiaSemana.reduce((prev, curr) => 
        parseFloat(prev.media_stockout) < parseFloat(curr.media_stockout) ? prev : curr
      );
      const piorDia = analisePorDiaSemana.reduce((prev, curr) => 
        parseFloat(prev.media_stockout) > parseFloat(curr.media_stockout) ? prev : curr
      );
      
      melhorDia.melhor_dia = true;
      piorDia.pior_dia = true;
    }

    // Análise semanal
    const dadosPorSemana = new Map();
    historicoDiario.forEach(dia => {
      const numeroSemana = getNumeroSemana(dia.data_referencia);
      const { inicio, fim } = getInicioFimSemana(dia.data_referencia);
      
      if (!dadosPorSemana.has(numeroSemana)) {
        dadosPorSemana.set(numeroSemana, {
          inicio,
          fim,
          dias: [],
          soma_stockout: 0
        });
      }
      const stats = dadosPorSemana.get(numeroSemana);
      const percentual = parseFloat(dia.percentual_stockout.replace('%', ''));
      stats.dias.push(percentual);
      stats.soma_stockout += percentual;
    });

    const analiseSemanal = Array.from(dadosPorSemana.entries()).map(([numero, stats]) => {
      const mediaStockout = stats.dias.length > 0 ? 
        (stats.soma_stockout / stats.dias.length).toFixed(2) : '0.00';
      
      return {
        semana_inicio: stats.inicio,
        semana_fim: stats.fim,
        numero_semana: numero,
        dias_com_dados: stats.dias.length,
        media_stockout: `${mediaStockout}%`,
        media_disponibilidade: `${(100 - parseFloat(mediaStockout)).toFixed(2)}%`
      };
    }).sort((a, b) => a.numero_semana - b.numero_semana);

    // Resumo geral
    const totalDias = historicoDiario.length;
    const somaStockout = historicoDiario.reduce((sum, dia) => 
      sum + parseFloat(dia.percentual_stockout.replace('%', '')), 0
    );
    const mediaStockout = totalDias > 0 ? (somaStockout / totalDias).toFixed(2) : '0.00';

    const resultado: AnaliseStockoutHistorico = {
      periodo: {
        data_inicio,
        data_fim
      },
      bar_id,
      resumo: {
        total_dias: totalDias,
        media_stockout: `${mediaStockout}%`,
        media_disponibilidade: `${(100 - parseFloat(mediaStockout)).toFixed(2)}%`
      },
      analise_por_dia_semana: analisePorDiaSemana,
      analise_semanal: analiseSemanal,
      historico_diario: historicoDiario
    };

    console.log(`✅ Análise histórica concluída: ${totalDias} dias, média ${mediaStockout}% stockout`);

    return NextResponse.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Erro na análise histórica de stockout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
