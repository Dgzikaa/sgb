/**
 * Script para atualizar registros CMV Semanal com dados em tempo real
 * 
 * Preenche campos que estão zerados:
 * - Estoque Final detalhado (Cozinha, Bebidas, Drinks)
 * - Compras detalhadas (Custo Comida, Bebidas, Drinks, Outros)
 * - Contas Especiais (Mesa Benefícios, Banda/DJ, Chegadeira, ADM, RH)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../../frontend/.env.local');
config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Buscar dados automáticos (mesma lógica da API)
async function buscarDadosAutomaticos(barId, dataInicio, dataFim) {
  console.log(`🔍 Buscando dados automáticos para ${dataInicio} - ${dataFim}`);

  const resultado = {
    // Contas Especiais
    total_consumo_socios: 0,
    mesa_beneficios_cliente: 0,
    mesa_banda_dj: 0,
    chegadeira: 0,
    mesa_adm_casa: 0,
    mesa_rh: 0,

    // Compras
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

  // 1. CONSUMO DOS SÓCIOS
  // Sócios: x-digao, x-diogo, x-rodrigo, x-cadu, x-corbal, x-augusto, x-gonza
  // Campos: vd_mesadesc, cli_nome, motivo (contém "sócio" ou "socio")
  // Valor: vr_desconto
  try {
    const sociosNomes = ['x-digao', 'x-diogo', 'x-rodrigo', 'x-cadu', 'x-corbal', 'x-augusto', 'x-gonza'];
    
    const conditions = [
      ...sociosNomes.map(s => `vd_mesadesc.ilike.%${s}%`),
      ...sociosNomes.map(s => `cli_nome.ilike.%${s}%`),
      'motivo.ilike.%sócio%',
      'motivo.ilike.%socio%'
    ];

    const { data: consumoSocios } = await supabase
      .from('contahub_periodo')
      .select('vr_desconto')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim)
      .or(conditions.join(','));

    if (consumoSocios) {
      resultado.total_consumo_socios = consumoSocios.reduce((sum, item) => 
        sum + (parseFloat(item.vr_desconto) || 0), 0
      );
    }
  } catch (err) {
    console.error('  ⚠️ Erro ao buscar consumo sócios:', err.message);
  }

  // 2. CONTAS ESPECIAIS
  // Campo: motivo
  // Valor: vr_desconto
  try {
    const contasEspeciais = {
      'mesa_banda_dj': ['dj', 'benza', 'banda', 'roadie', 'roudier'],
      'mesa_beneficios_cliente': ['aniversario', 'aniversário', 'voucher', 'beneficio', 'benefício'],
      'mesa_adm_casa': ['funcionario', 'funcionário', 'chefe', 'consuma', 'mkt', 'consumação financeiro', 'financeiro', 'rh', 'thais', 'isaias'],
      'chegadeira': [], // Sempre zerado
      'mesa_rh': [] // Sempre zerado
    };

    for (const [campo, patterns] of Object.entries(contasEspeciais)) {
      if (patterns.length === 0) {
        resultado[campo] = 0;
        continue;
      }

      const conditions = patterns.map(p => `motivo.ilike.%${p}%`);

      const { data } = await supabase
        .from('contahub_periodo')
        .select('vr_desconto')
        .eq('bar_id', barId)
        .gte('dt_gerencial', dataInicio)
        .lte('dt_gerencial', dataFim)
        .or(conditions.join(','));

      if (data) {
        resultado[campo] = data.reduce((sum, item) => 
          sum + (parseFloat(item.vr_desconto) || 0), 0
        );
      }
    }
  } catch (err) {
    console.error('  ⚠️ Erro ao buscar contas especiais:', err.message);
  }

  // 3. FATURAMENTO
  try {
    const { data: faturamento } = await supabase
      .from('contahub_periodo')
      .select('vr_repique, vr_pagamentos, vr_couvert')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim);

    if (faturamento) {
      resultado.faturamento_cmvivel = faturamento.reduce((sum, item) => 
        sum + (parseFloat(item.vr_repique) || 0), 0
      );

      resultado.vendas_brutas = faturamento.reduce((sum, item) => 
        sum + (parseFloat(item.vr_pagamentos) || 0), 0
      );

      resultado.vendas_liquidas = faturamento.reduce((sum, item) => 
        sum + (parseFloat(item.vr_pagamentos) || 0) - (parseFloat(item.vr_couvert) || 0), 0
      );
    }
  } catch (err) {
    console.error('  ⚠️ Erro ao buscar faturamento:', err.message);
  }

  // 4. COMPRAS DO NIBO
  try {
    const categoriasCompras = {
      'CUSTO COMIDA': ['CUSTO COMIDA', 'COMIDA', 'ALIMENTOS', 'INSUMOS COZINHA'],
      'CUSTO BEBIDAS': ['CUSTO BEBIDAS', 'BEBIDAS', 'CERVEJA', 'REFRIGERANTE', 'ÁGUA'],
      'CUSTO OUTROS': ['CUSTO OUTROS', 'OUTROS CUSTOS', 'DESCARTÁVEIS', 'LIMPEZA'],
      'CUSTO DRINKS': ['CUSTO DRINKS', 'DRINKS', 'DESTILADOS', 'INSUMOS BAR']
    };

    const { data: comprasNibo } = await supabase
      .from('nibo_agendamentos')
      .select('categoria_nome, valor_pago')
      .eq('bar_id', barId)
      .eq('tipo', 'despesa')
      .eq('status', 'pago')
      .gte('data_pagamento', dataInicio)
      .lte('data_pagamento', dataFim);

    if (comprasNibo) {
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
      }
    }
  } catch (err) {
    console.error('  ⚠️ Erro ao buscar compras NIBO:', err.message);
  }

  // 5. ESTOQUES
  try {
    const { data: ultimaContagem } = await supabase
      .from('historico_estoque')
      .select('data_contagem')
      .eq('bar_id', barId)
      .lte('data_contagem', dataFim)
      .order('data_contagem', { ascending: false })
      .limit(1)
      .single();

    if (ultimaContagem) {
      const dataContagem = ultimaContagem.data_contagem;
      const tiposLocal = ['cozinha', 'salão', 'drinks'];
      
      for (const tipo of tiposLocal) {
        const { data: estoque } = await supabase
          .from('historico_estoque')
          .select(`
            insumos!inner(tipo_local, custo_unitario),
            quantidade_fechada,
            quantidade_flutuante
          `)
          .eq('bar_id', barId)
          .eq('data_contagem', dataContagem)
          .eq('insumos.tipo_local', tipo);

        if (estoque) {
          const valorTotal = estoque.reduce((sum, item) => {
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
        }
      }
    }
  } catch (err) {
    console.error('  ⚠️ Erro ao buscar estoques:', err.message);
  }

  return resultado;
}

// Atualizar registro
async function atualizarRegistro(id, dados) {
  const { error } = await supabase
    .from('cmv_semanal')
    .update(dados)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// Executar atualização
async function executar() {
  console.log('🚀 Iniciando atualização de dados CMV Semanal...\n');

  try {
    // Buscar todos os registros de 2025
    const { data: registros, error } = await supabase
      .from('cmv_semanal')
      .select('*')
      .eq('ano', 2025)
      .order('semana', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar registros: ${error.message}`);
    }

    if (!registros || registros.length === 0) {
      console.log('⚠️ Nenhum registro encontrado');
      return;
    }

    console.log(`📊 Total de registros: ${registros.length}\n`);

    let atualizados = 0;
    let erros = 0;

    for (const registro of registros) {
      try {
        console.log(`\n📅 Semana ${registro.semana} (${registro.data_inicio} - ${registro.data_fim})`);

        // Buscar dados em tempo real
        const dadosAtualizados = await buscarDadosAutomaticos(
          registro.bar_id,
          registro.data_inicio,
          registro.data_fim
        );

        // Atualizar registro
        await atualizarRegistro(registro.id, dadosAtualizados);

        console.log(`  ✅ Atualizado com sucesso`);
        console.log(`     - Estoque Cozinha: R$ ${dadosAtualizados.estoque_final_cozinha.toFixed(2)}`);
        console.log(`     - Compras Comida: R$ ${dadosAtualizados.compras_custo_comida.toFixed(2)}`);
        console.log(`     - Consumo Sócios: R$ ${dadosAtualizados.total_consumo_socios.toFixed(2)}`);

        atualizados++;

      } catch (err) {
        console.error(`  ❌ Erro: ${err.message}`);
        erros++;
      }
    }

    console.log(`\n\n📊 RESUMO:`);
    console.log(`✅ Atualizados: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📝 Total: ${registros.length}`);

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar
executar();

