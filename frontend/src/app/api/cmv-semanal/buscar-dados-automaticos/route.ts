import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { filtrarDiasAbertos } from '@/lib/helpers/calendario-helper';

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

    // 1. BUSCAR CONSUMO DOS SÓCIOS
    // Sócios: x-digao, x-diogo, x-rodrigo, x-cadu, x-corbal, x-augusto, x-gonza
    // Campos: vd_mesadesc, cli_nome, motivo (contém "sócio" ou "socio")
    // Valor: vr_desconto
    try {
      const sociosNomes = ['x-digao', 'x-diogo', 'x-rodrigo', 'x-cadu', 'x-corbal', 'x-augusto', 'x-gonza'];
      
      // Construir condições OR para todos os campos
      const conditions = [
        ...sociosNomes.map(s => `vd_mesadesc.ilike.%${s}%`),
        ...sociosNomes.map(s => `cli_nome.ilike.%${s}%`),
        'motivo.ilike.%sócio%',
        'motivo.ilike.%socio%'
      ];

      const { data: consumoSociosBruto, error: errorSocios } = await supabase
        .from('contahub_periodo')
        .select('vr_desconto, dt_gerencial')
        .eq('bar_id', bar_id)
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim)
        .or(conditions.join(','));

      if (!errorSocios && consumoSociosBruto) {
        // ⚡ FILTRAR DIAS FECHADOS
        const consumoSocios = await filtrarDiasAbertos(consumoSociosBruto, 'dt_gerencial', bar_id);
        
        resultado.total_consumo_socios = consumoSocios.reduce((sum, item: any) => 
          sum + (parseFloat(item.vr_desconto) || 0), 0
        );
        console.log(`✅ Consumo sócios: R$ ${resultado.total_consumo_socios.toFixed(2)} (${consumoSocios.length} registros)`);
      }
    } catch (err) {
      console.error('Erro ao buscar consumo dos sócios:', err);
    }

    // 2. BUSCAR CONTAS ESPECIAIS
    // Campo: motivo
    // Valor: vr_desconto
    try {
      const contasEspeciais = {
        'mesa_banda_dj': ['dj', 'benza', 'banda', 'roadie', 'roudier'],
        'mesa_beneficios_cliente': ['aniversario', 'aniversário', 'voucher', 'beneficio', 'benefício'],
        'mesa_adm_casa': ['funcionario', 'funcionário', 'chefe', 'consuma', 'mkt', 'consumação financeiro', 'financeiro', 'rh', 'thais', 'isaias'],
        'chegadeira': ['chegadeira', 'chegador'],
        'mesa_rh': [] // Definir padrões depois
      };

      for (const [campo, patterns] of Object.entries(contasEspeciais)) {
        if (patterns.length === 0) continue; // Pular se não houver padrões

        const conditions = patterns.map(p => `motivo.ilike.%${p}%`);

        const { data: dataBruto, error } = await supabase
          .from('contahub_periodo')
          .select('vr_desconto, dt_gerencial')
          .eq('bar_id', bar_id)
          .gte('dt_gerencial', data_inicio)
          .lte('dt_gerencial', data_fim)
          .or(conditions.join(','));

        if (!error && dataBruto) {
          // ⚡ FILTRAR DIAS FECHADOS
          const data = await filtrarDiasAbertos(dataBruto, 'dt_gerencial', bar_id);
          
          resultado[campo as keyof typeof resultado] = data.reduce((sum: number, item: any) => 
            sum + (parseFloat(item.vr_desconto) || 0), 0
          );
          console.log(`✅ ${campo}: R$ ${(resultado[campo as keyof typeof resultado] as number).toFixed(2)} (${data.length} registros)`);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar contas especiais:', err);
    }

    // 3. BUSCAR FATURAMENTO CMVível (Faturamento - Comissões)
    // Faturamento CMVível = soma de vr_repique
    try {
      const { data: faturamentoBruto, error: errorFaturamento } = await supabase
        .from('contahub_periodo')
        .select('vr_repique, vr_pagamentos, vr_couvert, dt_gerencial')
        .eq('bar_id', bar_id)
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim);

      if (!errorFaturamento && faturamentoBruto) {
        // ⚡ FILTRAR DIAS FECHADOS
        const faturamento = await filtrarDiasAbertos(faturamentoBruto, 'dt_gerencial', bar_id);
        
        resultado.faturamento_cmvivel = faturamento.reduce((sum, item: any) => 
          sum + (parseFloat(item.vr_repique) || 0), 0
        );

        resultado.vendas_brutas = faturamento.reduce((sum, item: any) => 
          sum + (parseFloat(item.vr_pagamentos) || 0), 0
        );

        resultado.vendas_liquidas = faturamento.reduce((sum, item: any) => 
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

      // Buscar todas as despesas no período (usa data_competencia)
      const { data: comprasNibo, error: errorCompras } = await supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor')
        .eq('bar_id', bar_id)
        .eq('tipo', 'Debit')
        .gte('data_competencia', data_inicio)
        .lte('data_competencia', data_fim);

      if (!errorCompras && comprasNibo) {
        for (const [campo, categorias] of Object.entries(categoriasCompras)) {
          const valorCategoria = comprasNibo
            .filter(item => 
              item.categoria_nome && 
              categorias.some(cat => 
                item.categoria_nome.toUpperCase().includes(cat.toUpperCase())
              )
            )
            .reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0);

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
    // Tabela: contagem_estoque_insumos
    try {
      // Buscar última contagem disponível até data_fim
      const { data: ultimaContagem, error: errorContagem } = await supabase
        .from('contagem_estoque_insumos')
        .select('data_contagem')
        .eq('bar_id', bar_id)
        .lte('data_contagem', data_fim)
        .order('data_contagem', { ascending: false })
        .limit(1)
        .single();

      if (!errorContagem && ultimaContagem) {
        const dataContagem = ultimaContagem.data_contagem;
        console.log(`📅 Usando contagem de estoque de: ${dataContagem}`);

        // Buscar todos os insumos com suas categorias
        const { data: insumos, error: errorInsumos } = await supabase
          .from('insumos')
          .select('id, tipo_local, categoria, custo_unitario')
          .eq('bar_id', bar_id);

        if (!errorInsumos && insumos) {
          // Buscar contagens dessa data
          const { data: contagens, error: errorContagens } = await supabase
            .from('contagem_estoque_insumos')
            .select('insumo_id, estoque_final')
            .eq('bar_id', bar_id)
            .eq('data_contagem', dataContagem);

          if (!errorContagens && contagens) {
            // Criar map de insumos para facilitar lookup
            const insumosMap = new Map(insumos.map(i => [i.id, i]));

            // Categorias de cada tipo
            const categoriasCozinha = ['ARMAZÉM (C)', 'HORTIFRUTI (C)', 'MERCADO (C)', 'PÃES', 'PEIXE', 'PROTEÍNA', 'Mercado (S)', 'tempero', 'hortifruti', 'líquido'];
            const categoriasDrinks = ['ARMAZÉM B', 'DESTILADOS', 'DESTILADOS LOG', 'HORTIFRUTI B', 'IMPÉRIO', 'MERCADO B', 'POLPAS', 'Não-alcóolicos', 'OUTROS', 'polpa', 'fruta'];
            // Excluir funcionários
            const categoriasExcluir = ['HORTIFRUTI (F)', 'MERCADO (F)', 'PROTEÍNA (F)'];

            contagens.forEach((contagem: any) => {
              const insumo = insumosMap.get(contagem.insumo_id);
              if (!insumo || categoriasExcluir.includes(insumo.categoria)) return;

              const valor = contagem.estoque_final * (insumo.custo_unitario || 0);

              // Cozinha
              if (insumo.tipo_local === 'cozinha' && categoriasCozinha.includes(insumo.categoria)) {
                resultado.estoque_final_cozinha += valor;
              }
              // Drinks
              else if (insumo.tipo_local === 'cozinha' && categoriasDrinks.includes(insumo.categoria)) {
                resultado.estoque_final_drinks += valor;
              }
              // Bebidas + Tabacaria (tudo do bar)
              else if (insumo.tipo_local === 'bar') {
                resultado.estoque_final_bebidas += valor;
              }
            });

            console.log(`✅ Estoque Cozinha: R$ ${resultado.estoque_final_cozinha.toFixed(2)}`);
            console.log(`✅ Estoque Drinks: R$ ${resultado.estoque_final_drinks.toFixed(2)}`);
            console.log(`✅ Estoque Bebidas + Tabacaria: R$ ${resultado.estoque_final_bebidas.toFixed(2)}`);
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

