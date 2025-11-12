import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para buscar dados automáticos para CMV Semanal
 * 
 * Busca:
 * 1. Consumo dos sócios (x-corbal, etc)
 * 2. Compras do NIBO por categoria
 * 3. Faturamento CMVível do ContaHub (vr_repique)
 * 4. Estoques por tipo_local (cozinha, salão, drinks)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, data_inicio, data_fim } = body;

    if (!bar_id || !data_inicio || !data_fim) {
      return NextResponse.json(
        { error: 'Dados inválidos: bar_id, data_inicio e data_fim são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando dados automáticos para CMV Semanal - Bar ${bar_id} de ${data_inicio} até ${data_fim}`);

    const resultado = {
      // Contas Especiais para consumos
      total_consumo_socios: 0,
      mesa_beneficios_cliente: 0,
      mesa_banda_dj: 0,
      chegadeira: 0,
      mesa_adm_casa: 0,
      mesa_rh: 0,

      // Compras do NIBO
      compras_custo_comida: 0,
      compras_custo_bebidas: 0,
      compras_custo_outros: 0,
      compras_custo_drinks: 0,

      // Faturamento
      faturamento_cmvivel: 0,
      vendas_brutas: 0,
      vendas_liquidas: 0,

      // Estoques
      estoque_final_cozinha: 0,
      estoque_final_bebidas: 0,
      estoque_final_drinks: 0,
    };

    // 1. BUSCAR CONSUMO DOS SÓCIOS (x-corbal, x-bruno, x-matheus, x-leonardo, x-thiago)
    try {
      const sociosPatterns = ['x-corbal', 'x-bruno', 'x-matheus', 'x-leonardo', 'x-thiago'];
      
      const { data: consumoSocios, error: errorSocios } = await supabase
        .from('contahub_periodo')
        .select('vr_consumo')
        .eq('bar_id', bar_id)
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim)
        .or(sociosPatterns.map(s => `cli_nome.ilike.%${s}%`).join(','));

      if (!errorSocios && consumoSocios) {
        resultado.total_consumo_socios = consumoSocios.reduce((sum, item) => 
          sum + (parseFloat(item.vr_consumo) || 0), 0
        );
        console.log(`✅ Consumo sócios: R$ ${resultado.total_consumo_socios.toFixed(2)}`);
      }
    } catch (err) {
      console.error('Erro ao buscar consumo dos sócios:', err);
    }

    // 2. BUSCAR CONTAS ESPECIAIS (Mesa Benefícios, Banda/DJ, Chegadeira, ADM, RH)
    try {
      const contasEspeciais = {
        'mesa_beneficios_cliente': ['benefício', 'beneficio'],
        'mesa_banda_dj': ['banda', 'dj', 'artista'],
        'chegadeira': ['chegadeira', 'chegador'],
        'mesa_adm_casa': ['adm', 'administrativo', 'casa'],
        'mesa_rh': ['rh', 'recursos humanos']
      };

      for (const [campo, patterns] of Object.entries(contasEspeciais)) {
        const { data, error } = await supabase
          .from('contahub_periodo')
          .select('vr_consumo')
          .eq('bar_id', bar_id)
          .gte('dt_gerencial', data_inicio)
          .lte('dt_gerencial', data_fim)
          .or(patterns.map(p => `cli_nome.ilike.%${p}%`).join(','));

        if (!error && data) {
          resultado[campo as keyof typeof resultado] = data.reduce((sum: number, item: any) => 
            sum + (parseFloat(item.vr_consumo) || 0), 0
          );
          console.log(`✅ ${campo}: R$ ${(resultado[campo as keyof typeof resultado] as number).toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar contas especiais:', err);
    }

    // 3. BUSCAR FATURAMENTO CMVível (Faturamento - Comissões)
    // Faturamento CMVível = soma de vr_repique
    try {
      const { data: faturamento, error: errorFaturamento } = await supabase
        .from('contahub_periodo')
        .select('vr_repique, vr_pagamentos, vr_couvert')
        .eq('bar_id', bar_id)
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim);

      if (!errorFaturamento && faturamento) {
        resultado.faturamento_cmvivel = faturamento.reduce((sum, item) => 
          sum + (parseFloat(item.vr_repique) || 0), 0
        );

        resultado.vendas_brutas = faturamento.reduce((sum, item) => 
          sum + (parseFloat(item.vr_pagamentos) || 0), 0
        );

        resultado.vendas_liquidas = faturamento.reduce((sum, item) => 
          sum + (parseFloat(item.vr_pagamentos) || 0) - (parseFloat(item.vr_couvert) || 0), 0
        );

        console.log(`✅ Faturamento CMVível: R$ ${resultado.faturamento_cmvivel.toFixed(2)}`);
        console.log(`✅ Vendas Brutas: R$ ${resultado.vendas_brutas.toFixed(2)}`);
        console.log(`✅ Vendas Líquidas: R$ ${resultado.vendas_liquidas.toFixed(2)}`);
      }
    } catch (err) {
      console.error('Erro ao buscar faturamento:', err);
    }

    // 4. BUSCAR COMPRAS DO NIBO (por categoria) - Do nosso banco nibo_agendamentos
    try {
      const categoriasCompras = {
        'CUSTO COMIDA': ['CUSTO COMIDA', 'COMIDA', 'ALIMENTOS', 'INSUMOS COZINHA'],
        'CUSTO BEBIDAS': ['CUSTO BEBIDAS', 'BEBIDAS', 'CERVEJA', 'REFRIGERANTE', 'ÁGUA'],
        'CUSTO OUTROS': ['CUSTO OUTROS', 'OUTROS CUSTOS', 'DESCARTÁVEIS', 'LIMPEZA'],
        'CUSTO DRINKS': ['CUSTO DRINKS', 'DRINKS', 'DESTILADOS', 'INSUMOS BAR']
      };

      // Buscar todas as despesas pagas no período
      const { data: comprasNibo, error: errorCompras } = await supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor_pago')
        .eq('bar_id', bar_id)
        .eq('tipo', 'despesa')
        .eq('status', 'pago')
        .gte('data_pagamento', data_inicio)
        .lte('data_pagamento', data_fim);

      if (!errorCompras && comprasNibo) {
        for (const [campo, categorias] of Object.entries(categoriasCompras)) {
          const valorCategoria = comprasNibo
            .filter(item => 
              item.categoria_nome && 
              categorias.some(cat => 
                item.categoria_nome.toUpperCase().includes(cat.toUpperCase())
              )
            )
            .reduce((sum, item) => sum + Math.abs(parseFloat(item.valor_pago) || 0), 0);

          if (campo === 'CUSTO COMIDA') resultado.compras_custo_comida = valorCategoria;
          else if (campo === 'CUSTO BEBIDAS') resultado.compras_custo_bebidas = valorCategoria;
          else if (campo === 'CUSTO OUTROS') resultado.compras_custo_outros = valorCategoria;
          else if (campo === 'CUSTO DRINKS') resultado.compras_custo_drinks = valorCategoria;

          console.log(`✅ Compras ${campo}: R$ ${valorCategoria.toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar compras do NIBO:', err);
    }

    // 5. BUSCAR ESTOQUES (última contagem antes da data_fim)
    try {
      // Buscar última contagem disponível até data_fim
      const { data: ultimaContagem, error: errorContagem } = await supabase
        .from('historico_estoque')
        .select('data_contagem')
        .eq('bar_id', bar_id)
        .lte('data_contagem', data_fim)
        .order('data_contagem', { ascending: false })
        .limit(1)
        .single();

      if (!errorContagem && ultimaContagem) {
        const dataContagem = ultimaContagem.data_contagem;
        console.log(`📅 Usando contagem de estoque de: ${dataContagem}`);

        // Buscar estoque por tipo_local
        const tiposLocal = ['cozinha', 'salão', 'drinks'];
        
        for (const tipo of tiposLocal) {
          const { data: estoque, error: errorEstoque } = await supabase
            .from('historico_estoque')
            .select(`
              insumos!inner(tipo_local, custo_unitario),
              quantidade_fechada,
              quantidade_flutuante
            `)
            .eq('bar_id', bar_id)
            .eq('data_contagem', dataContagem)
            .eq('insumos.tipo_local', tipo);

          if (!errorEstoque && estoque) {
            const valorTotal = estoque.reduce((sum, item: any) => {
              const qtdTotal = (item.quantidade_fechada || 0) + (item.quantidade_flutuante || 0);
              const custo = item.insumos?.custo_unitario || 0;
              return sum + (qtdTotal * custo);
            }, 0);

            if (tipo === 'cozinha') {
              resultado.estoque_final_cozinha = valorTotal;
            } else if (tipo === 'salão') {
              resultado.estoque_final_bebidas = valorTotal;
            } else if (tipo === 'drinks') {
              resultado.estoque_final_drinks = valorTotal;
            }

            console.log(`✅ Estoque ${tipo}: R$ ${valorTotal.toFixed(2)}`);
          }
        }
      } else {
        console.log('⚠️ Nenhuma contagem de estoque encontrada para o período');
      }
    } catch (err) {
      console.error('Erro ao buscar estoques:', err);
    }

    console.log('✅ Dados automáticos buscados com sucesso');

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Dados automáticos carregados com sucesso'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: (error as Error).message },
      { status: 500 }
    );
  }
}

