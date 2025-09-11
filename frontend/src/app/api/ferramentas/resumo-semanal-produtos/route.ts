import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data_inicio, data_fim, periodo_semanas, bar_id = 3 } = await request.json();

    let dataInicialStr: string;
    let dataFinalStr: string;

    // Se recebeu data_inicio e data_fim (novo formato), usa elas
    if (data_inicio && data_fim) {
      dataInicialStr = data_inicio;
      dataFinalStr = data_fim;
      console.log(`🔍 Buscando resumo semanal de produtos - Semana específica`);
    } else {
      // Fallback para o formato antigo (periodo_semanas)
      const periodoSemanas = periodo_semanas || 4;
      console.log(`🔍 Buscando resumo semanal de produtos - ${periodoSemanas} semanas`);
      
      const dataFinal = new Date();
      const dataInicial = new Date();
      dataInicial.setDate(dataFinal.getDate() - (periodoSemanas * 7));

      dataInicialStr = dataInicial.toISOString().split('T')[0];
      dataFinalStr = dataFinal.toISOString().split('T')[0];
    }

    console.log(`📅 Período: ${dataInicialStr} até ${dataFinalStr}`);

    // Query complexa para obter resumo por dia da semana
    const { data: resumoSemanal, error } = await supabase.rpc('get_resumo_semanal_produtos', {
      p_data_inicial: dataInicialStr,
      p_data_final: dataFinalStr,
      p_bar_id: bar_id
    });

    if (error) {
      console.error('Erro ao buscar resumo semanal:', error);
      
      // Fallback: buscar dados manualmente com paginação (limite do Supabase: 1000)
      console.log('🔄 Função não encontrada, usando fallback com paginação...');
      
      let dadosBrutos: any[] = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`📄 Buscando página ${Math.floor(offset / limit) + 1} (offset: ${offset})`);
        
        const { data: pagina, error: errorPagina } = await supabase
          .from('contahub_prodporhora')
          .select('*')
          .eq('bar_id', bar_id)
          .gte('data_gerencial', dataInicialStr)
          .lte('data_gerencial', dataFinalStr)
          .order('data_gerencial', { ascending: true })
          .range(offset, offset + limit - 1);

        if (errorPagina) {
          console.error(`❌ Erro na página ${Math.floor(offset / limit) + 1}:`, errorPagina);
          return NextResponse.json(
            { error: 'Erro ao buscar dados do banco', details: errorPagina.message },
            { status: 500 }
          );
        }

        if (pagina && pagina.length > 0) {
          dadosBrutos.push(...pagina);
          console.log(`✅ Página ${Math.floor(offset / limit) + 1}: ${pagina.length} registros`);
          
          // Se retornou menos que o limite, chegamos ao fim
          hasMore = pagina.length === limit;
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`🎯 Total de registros coletados: ${dadosBrutos.length}`);

      if (dadosBrutos.length === 0) {
        console.log('⚠️ Nenhum dado encontrado para o período');
        return NextResponse.json({
          success: true,
          periodo_semanas,
          periodo: `${dataInicialStr} a ${dataFinalStr}`,
          dados: [],
          metodo: 'fallback-paginado',
          total_registros: 0
        });
      }

      // Processar dados manualmente
      const resumoProcessado = processarResumoSemanal(dadosBrutos);
      
      return NextResponse.json({
        success: true,
        periodo_semanas,
        periodo: `${dataInicialStr} a ${dataFinalStr}`,
        dados: resumoProcessado,
        metodo: 'fallback-paginado',
        total_registros: dadosBrutos.length
      });
    }

    console.log(`✅ Resumo semanal obtido: ${resumoSemanal?.length || 0} dias`);

    return NextResponse.json({
      success: true,
      periodo_semanas,
      periodo: `${dataInicialStr} a ${dataFinalStr}`,
      dados: resumoSemanal || [],
      metodo: 'function',
      total_registros: 'calculado_pela_funcao'
    });

  } catch (error) {
    console.error('Erro na API resumo-semanal-produtos:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Função para processar dados manualmente (fallback)
function processarResumoSemanal(dados: any[]) {
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const resumoPorDia: Record<string, any> = {};

  // Inicializar estrutura
  diasSemana.forEach(dia => {
    resumoPorDia[dia] = {
      dia_semana: dia,
      data_exemplo: null,
      horario_pico: 0,
      produto_mais_vendido: '',
      grupo_produto: '',
      quantidade_pico: 0,
      faturamento_total: 0,
      total_produtos_vendidos: 0,
      produtos_unicos: new Set(),
      dados_por_data: {}
    };
  });

  // Processar cada registro
  dados.forEach(item => {
    const data = new Date(item.data_gerencial + 'T12:00:00'); // Força meio-dia para evitar timezone
    const diaSemanaIndex = data.getDay();
    const diaSemana = diasSemana[diaSemanaIndex];
    const dataStr = item.data_gerencial;

    if (!resumoPorDia[diaSemana].dados_por_data[dataStr]) {
      resumoPorDia[diaSemana].dados_por_data[dataStr] = {
        faturamento: 0,
        produtos_vendidos: 0,
        produtos_por_hora: {},
        produtos_unicos: new Set()
      };
    }

    const dadosData = resumoPorDia[diaSemana].dados_por_data[dataStr];
    
    // Acumular dados
    dadosData.faturamento += item.valor_total;
    dadosData.produtos_vendidos += item.quantidade;
    dadosData.produtos_unicos.add(item.produto_id);
    
    // Produtos por hora
    if (!dadosData.produtos_por_hora[item.hora]) {
      dadosData.produtos_por_hora[item.hora] = {};
    }
    
    if (!dadosData.produtos_por_hora[item.hora][item.produto_descricao]) {
      dadosData.produtos_por_hora[item.hora][item.produto_descricao] = {
        quantidade: 0,
        grupo: item.grupo_descricao,
        valor: 0
      };
    }
    
    dadosData.produtos_por_hora[item.hora][item.produto_descricao].quantidade += item.quantidade;
    dadosData.produtos_por_hora[item.hora][item.produto_descricao].valor += item.valor_total;
  });

  // Calcular resumos finais
  const resultado = diasSemana.map(dia => {
    const dadosDia = resumoPorDia[dia];
    const datas = Object.keys(dadosDia.dados_por_data);
    
    if (datas.length === 0) {
      return null; // Sem dados para este dia
    }

    // Calcular médias e totais
    let faturamentoTotal = 0;
    let produtosVendidosTotal = 0;
    let produtosUnicos = new Set();
    let melhorProduto = { nome: '', grupo: '', quantidade: 0, hora: 0 };
    let melhorHora = { hora: 0, quantidade: 0 };

    datas.forEach(dataStr => {
      const dadosData = dadosDia.dados_por_data[dataStr];
      faturamentoTotal += dadosData.faturamento;
      produtosVendidosTotal += dadosData.produtos_vendidos;
      
      dadosData.produtos_unicos.forEach(p => produtosUnicos.add(p));
      
      // Encontrar melhor produto e hora
      Object.entries(dadosData.produtos_por_hora).forEach(([hora, produtos]: [string, any]) => {
        let quantidadeHora = 0;
        
        Object.entries(produtos).forEach(([nomeProduto, dadosProduto]: [string, any]) => {
          quantidadeHora += dadosProduto.quantidade;
          
          if (dadosProduto.quantidade > melhorProduto.quantidade) {
            melhorProduto = {
              nome: nomeProduto,
              grupo: dadosProduto.grupo,
              quantidade: dadosProduto.quantidade,
              hora: parseInt(hora)
            };
          }
        });
        
        if (quantidadeHora > melhorHora.quantidade) {
          melhorHora = {
            hora: parseInt(hora),
            quantidade: quantidadeHora
          };
        }
      });
    });

    // Calcular médias
    const numDatas = datas.length;
    
    return {
      dia_semana: dia,
      data_exemplo: datas[datas.length - 1], // Data mais recente
      horario_pico: melhorHora.hora,
      produto_mais_vendido: melhorProduto.nome || 'N/A',
      grupo_produto: melhorProduto.grupo || 'N/A',
      quantidade_pico: Math.round(melhorProduto.quantidade / numDatas),
      faturamento_total: Math.round(faturamentoTotal / numDatas * 100) / 100,
      total_produtos_vendidos: Math.round(produtosVendidosTotal / numDatas),
      produtos_unicos: produtosUnicos.size
    };
  }).filter(Boolean); // Remove dias sem dados

  return resultado;
}
