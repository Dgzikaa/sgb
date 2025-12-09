import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data_inicio, data_fim, periodo_semanas, bar_id } = await request.json();

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

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

    // Buscar dados diretamente das tabelas contahub_vendas
    console.log('🔄 Buscando dados das vendas ContaHub...');
    
    const { data: dadosBrutos, error } = await supabase
      .from('contahub_prodporhora')
      .select('*')
      .eq('bar_id', bar_id)
      .gte('data_gerencial', dataInicialStr)
      .lte('data_gerencial', dataFinalStr)
      .gt('quantidade', 0)
      .order('data_gerencial', { ascending: true });

    if (error) {
      console.error('Erro ao buscar dados das vendas:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar dados das vendas',
        details: error.message
      }, { status: 500 });
    }

    console.log(`🎯 Total de registros coletados: ${dadosBrutos?.length || 0}`);

    if (!dadosBrutos || dadosBrutos.length === 0) {
      console.log('⚠️ Nenhum dado encontrado para o período');
      return NextResponse.json({
        success: true,
        periodo: `${dataInicialStr} a ${dataFinalStr}`,
        dados: [],
        metodo: 'contahub_vendas',
        total_registros: 0
      });
    }

    // Processar dados manualmente
    const resumoProcessado = processarResumoSemanal(dadosBrutos);
    
    return NextResponse.json({
      success: true,
      periodo: `${dataInicialStr} a ${dataFinalStr}`,
      dados: resumoProcessado,
      metodo: 'contahub_vendas',
      total_registros: dadosBrutos.length
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

    // Obter descrições dos produtos (dados já vêm na tabela contahub_prodporhora)
    const produtoDescricao = item.produto_descricao || `Produto ${item.produto_id}`;
    const grupoDescricao = item.grupo_descricao || 'Sem grupo';

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
    dadosData.faturamento += item.valor_total || 0;
    dadosData.produtos_vendidos += item.quantidade || 0;
    dadosData.produtos_unicos.add(item.produto_id);
    
    // Produtos por hora
    if (!dadosData.produtos_por_hora[item.hora]) {
      dadosData.produtos_por_hora[item.hora] = {};
    }
    
    if (!dadosData.produtos_por_hora[item.hora][produtoDescricao]) {
      dadosData.produtos_por_hora[item.hora][produtoDescricao] = {
        quantidade: 0,
        grupo: grupoDescricao,
        valor: 0
      };
    }
    
    dadosData.produtos_por_hora[item.hora][produtoDescricao].quantidade += item.quantidade || 0;
    dadosData.produtos_por_hora[item.hora][produtoDescricao].valor += item.valor_total || 0;
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
      data_exemplo: datas[0], // Primeira data encontrada
      horario_pico: melhorHora.hora,
      produto_mais_vendido: melhorProduto.nome || 'Sem dados',
      grupo_produto: melhorProduto.grupo || 'Sem dados',
      quantidade_pico: melhorProduto.quantidade,
      faturamento_total: Math.round(faturamentoTotal * 100) / 100,
      total_produtos_vendidos: produtosVendidosTotal,
      produtos_unicos: produtosUnicos.size
    };
  }).filter(item => item !== null); // Remove dias sem dados

  return resultado;
}