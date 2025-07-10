import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos máximo

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando COLETA OTIMIZADA (LOTES DE 500) - API ContaAzul...');
    
    const { bar_id, data_inicio, data_fim } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('✅ Parâmetros recebidos:', { bar_id, data_inicio, data_fim });

    const dataInicio = data_inicio || '2024-01-01';
    const dataFim = data_fim || '2027-01-01';
    
    console.log(`📅 Período: ${dataInicio} até ${dataFim}`);

    const accessToken = await getValidContaAzulToken(parseInt(bar_id));
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Token do ContaAzul não disponível' },
        { status: 400 }
      );
    }

    console.log('✅ Token válido obtido para bar_id:', bar_id);

    const inicioExecucao = Date.now();
    let resultado = {
      receitas: { total: 0, processadas: 0, inseridas: 0, erros: 0 },
      despesas: { total: 0, processadas: 0, inseridas: 0, erros: 0 },
      dados_auxiliares: { categorias: 0, centros_custo: 0, contas: 0 },
      lotes_processados: 0,
      tempo_por_lote: [] as number[]
    };

    try {
      // FASE 1: Coletar dados auxiliares
      console.log('📥 FASE 1: Coletando dados auxiliares...');
      await coletarDadosAuxiliares(accessToken, parseInt(bar_id), resultado);

      // FASE 2: Coletar RECEITAS em lotes
      console.log('💰 FASE 2: Coletando RECEITAS em lotes...');
      await coletarFinanceiroEmLotes(
        accessToken, 
        parseInt(bar_id), 
        'receitas',
        dataInicio, 
        dataFim, 
        resultado
      );

      // FASE 3: Coletar DESPESAS em lotes
      console.log('💸 FASE 3: Coletando DESPESAS em lotes...');
      await coletarFinanceiroEmLotes(
        accessToken, 
        parseInt(bar_id), 
        'despesas',
        dataInicio, 
        dataFim, 
        resultado
      );

      const tempoExecucao = Date.now() - inicioExecucao;
      console.log('🎯 COLETA OTIMIZADA CONCLUÍDA!');

      return NextResponse.json({
        success: true,
        message: '✅ Coleta otimizada concluída!',
        periodo: { inicio: dataInicio, fim: dataFim },
        resultado,
        tempo_execucao_ms: tempoExecucao,
        performance: {
          tempo_medio_por_lote: resultado.tempo_por_lote.length > 0 
            ? Math.round(resultado.tempo_por_lote.reduce((a, b) => a + b, 0) / resultado.tempo_por_lote.length)
            : 0,
          lotes_processados: resultado.lotes_processados,
          total_inserido: resultado.receitas.inseridas + resultado.despesas.inseridas
        }
      });

    } catch (error) {
      console.error('❌ Erro na coleta otimizada:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta otimizada',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// FASE 1: Coletar dados auxiliares (igual ao anterior)
async function coletarDadosAuxiliares(accessToken: string, barId: number, resultado: any) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Coletar categorias
    console.log('🏷️ Coletando categorias...');
    const categoriasResponse = await fetch('https://api-v2.contaazul.com/v1/categorias?pagina=1&tamanho_pagina=100', { headers });
    
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json();
      const categorias = categoriasData.itens || [];
      
      if (categorias.length > 0) {
        const categoriasInsert = categorias.map((categoria: any) => ({
          id: categoria.id,
          bar_id: barId,
          nome: categoria.nome,
          tipo: categoria.tipo,
          codigo: categoria.codigo,
          permite_filhos: categoria.permite_filhos,
          categoria_pai_id: categoria.categoria_pai?.id,
          entrada_dre: categoria.entrada_dre,
          ativo: true
        }));

        await supabase
          .from('contaazul_categorias')
          .upsert(categoriasInsert);
      }
      
      resultado.dados_auxiliares.categorias = categorias.length;
      console.log(`✅ ${categorias.length} categorias coletadas`);
    }

    // Coletar centros de custo
    console.log('🎯 Coletando centros de custo...');
    const centrosResponse = await fetch('https://api-v2.contaazul.com/v1/centro-de-custo?pagina=1&tamanho_pagina=100', { headers });
    
    if (centrosResponse.ok) {
      const centrosData = await centrosResponse.json();
      const centros = centrosData.itens || [];
      
      if (centros.length > 0) {
        const centrosInsert = centros.map((centro: any) => ({
          id: centro.id,
          bar_id: barId,
          nome: centro.nome,
          codigo: centro.codigo,
          ativo: centro.ativo !== false
        }));

        await supabase
          .from('contaazul_centros_custo')
          .upsert(centrosInsert);
      }
      
      resultado.dados_auxiliares.centros_custo = centros.length;
      console.log(`✅ ${centros.length} centros de custo coletados`);
    }

    // Coletar contas financeiras
    console.log('🏦 Coletando contas financeiras...');
    const contasResponse = await fetch('https://api-v2.contaazul.com/v1/conta-financeira?pagina=1&tamanho_pagina=100', { headers });
    
    if (contasResponse.ok) {
      const contasData = await contasResponse.json();
      const contas = contasData.itens || [];
      
      if (contas.length > 0) {
        const contasInsert = contas.map((conta: any) => ({
          id: conta.id,
          bar_id: barId,
          nome: conta.nome,
          tipo: conta.tipo,
          banco_numero: conta.banco?.numero,
          agencia: conta.agencia,
          conta: conta.conta,
          saldo_inicial: conta.saldo_inicial || 0,
          ativo: conta.ativo !== false
        }));

        await supabase
          .from('contaazul_contas_financeiras')
          .upsert(contasInsert);
      }
      
      resultado.dados_auxiliares.contas = contas.length;
      console.log(`✅ ${contas.length} contas financeiras coletadas`);
    }

  } catch (error) {
    console.error('❌ Erro ao coletar dados auxiliares:', error);
  }
}

// FASE 2/3: Coletar financeiro EM LOTES OTIMIZADOS
async function coletarFinanceiroEmLotes(
  accessToken: string, 
  barId: number, 
  tipo: 'receitas' | 'despesas',
  dataInicio: string,
  dataFim: string,
  resultado: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const endpoint = tipo === 'receitas' 
    ? 'contas-a-receber/buscar'
    : 'contas-a-pagar/buscar';

  const tipoMaiusculo = tipo === 'receitas' ? 'RECEITA' : 'DESPESA';
  
  let pagina = 1;
  const tamanhoPagina = 50;
  let todasParcelas: any[] = [];

  // ETAPA 1: Coletar TODAS as parcelas primeiro
  console.log(`📥 Coletando todas as ${tipo}...`);
  let continuarColetando = true;

  while (continuarColetando) {
    try {
      console.log(`📄 ${tipo} - Página ${pagina}...`);
      
      const url = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${endpoint}?` +
        `data_competencia_de=${dataInicio}&` +
        `data_competencia_ate=${dataFim}&` +
        `data_vencimento_de=${dataInicio}&` +
        `data_vencimento_ate=${dataFim}&` +
        `pagina=${pagina}&` +
        `tamanho_pagina=${tamanhoPagina}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ContaAzul API Error [${response.status}]:`, errorText);
        throw new Error(`Erro na API ContaAzul: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const parcelas = data.itens || [];
      
      if (parcelas.length === 0) {
        continuarColetando = false;
        break;
      }

      todasParcelas.push(...parcelas);
      resultado[tipo].total += parcelas.length;
      console.log(`📋 ${parcelas.length} ${tipo} encontradas na página ${pagina} (Total: ${todasParcelas.length})`);

      pagina++;
      
    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error);
      throw error;
    }
  }

  console.log(`✅ Total de ${tipo} coletadas: ${todasParcelas.length}`);

  // ETAPA 2: Processar em LOTES DE 500
  const TAMANHO_LOTE = 500;
  const totalLotes = Math.ceil(todasParcelas.length / TAMANHO_LOTE);
  
  console.log(`🔄 Processando ${todasParcelas.length} ${tipo} em ${totalLotes} lotes de ${TAMANHO_LOTE}...`);

  for (let i = 0; i < totalLotes; i++) {
    const inicioLote = Date.now();
    const inicio = i * TAMANHO_LOTE;
    const fim = Math.min(inicio + TAMANHO_LOTE, todasParcelas.length);
    const loteParcelas = todasParcelas.slice(inicio, fim);
    
    console.log(`⚡ LOTE ${i + 1}/${totalLotes}: processando ${tipo} ${inicio + 1}-${fim}...`);
    
    try {
      await processarLoteOtimizado(accessToken, barId, loteParcelas, tipoMaiusculo, resultado);
      
      const tempoLote = Date.now() - inicioLote;
      resultado.tempo_por_lote.push(tempoLote);
      resultado.lotes_processados++;
      
      console.log(`✅ LOTE ${i + 1} concluído em ${tempoLote}ms`);
      
      // Pausa entre lotes para evitar sobrecarga
      if (i < totalLotes - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Erro no lote ${i + 1}:`, error);
      resultado[tipo].erros += loteParcelas.length;
    }
  }
}

// Processar lote de parcelas DE FORMA OTIMIZADA
async function processarLoteOtimizado(
  accessToken: string,
  barId: number,
  parcelas: any[],
  tipo: string,
  resultado: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  console.log(`📋 Iniciando processamento de ${parcelas.length} parcelas do tipo ${tipo}...`);
  const inicioProcessamento = Date.now();

  // PASSO 1: Buscar detalhes de TODAS as parcelas em paralelo (máx 10 simultâneas)
  const BATCH_SIZE = 10;
  const parcelasDetalhadas: any[] = [];
  const totalBatches = Math.ceil(parcelas.length / BATCH_SIZE);
  
  console.log(`🔄 Buscando detalhes em ${totalBatches} batches de ${BATCH_SIZE} parcelas...`);
  
  for (let i = 0; i < parcelas.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = parcelas.slice(i, i + BATCH_SIZE);
    
    console.log(`📥 Batch ${batchNum}/${totalBatches}: buscando detalhes de ${batch.length} parcelas (${i + 1}-${i + batch.length})...`);
    const inicioBatch = Date.now();
    
    const promisesDetalhes = batch.map(async (parcela, index) => {
      try {
        const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`;
        const inicioReq = Date.now();
        const response = await fetch(detalhesUrl, { headers });
        const tempoReq = Date.now() - inicioReq;
        
        if (response.ok) {
          const detalhes = await response.json();
          console.log(`✅ Parcela ${parcela.id} (${index + 1}/${batch.length}): detalhes obtidos em ${tempoReq}ms`);
          return { ...parcela, detalhes };
        } else {
          console.warn(`⚠️ Parcela ${parcela.id} (${index + 1}/${batch.length}): erro ${response.status} em ${tempoReq}ms`);
          return { ...parcela, detalhes: null };
        }
      } catch (error) {
        console.error(`❌ Parcela ${parcela.id} (${index + 1}/${batch.length}): exceção`, error);
        return { ...parcela, detalhes: null };
      }
    });

    const batchResultados = await Promise.all(promisesDetalhes);
    parcelasDetalhadas.push(...batchResultados);
    
    const tempoBatch = Date.now() - inicioBatch;
    const sucessos = batchResultados.filter(r => r.detalhes !== null).length;
    const erros = batchResultados.length - sucessos;
    
    console.log(`📊 Batch ${batchNum} concluído em ${tempoBatch}ms: ${sucessos} sucessos, ${erros} erros`);
    
    // Pequena pausa entre batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const tempoDetalhes = Date.now() - inicioProcessamento;
  const totalSucessos = parcelasDetalhadas.filter(p => p.detalhes !== null).length;
  const totalErros = parcelasDetalhadas.length - totalSucessos;
  
  console.log(`📈 Resumo busca de detalhes: ${totalSucessos} sucessos, ${totalErros} erros em ${tempoDetalhes}ms`);
  console.log(`⏱️ Tempo médio por parcela: ${Math.round(tempoDetalhes / parcelas.length)}ms`);

  // PASSO 2: Buscar nomes das categorias e centros de custo uma vez só
  console.log(`🏷️ Carregando cache de categorias e centros de custo...`);
  const inicioCache = Date.now();
  
  const categoriasCache = new Map();
  const centrosCustoCache = new Map();
  
  const { data: categorias } = await supabase
    .from('contaazul_categorias')
    .select('id, nome')
    .eq('bar_id', barId);
    
  const { data: centrosCusto } = await supabase
    .from('contaazul_centros_custo')
    .select('id, nome')
    .eq('bar_id', barId);

  categorias?.forEach(cat => categoriasCache.set(cat.id, cat.nome));
  centrosCusto?.forEach(centro => centrosCustoCache.set(centro.id, centro.nome));

  const tempoCache = Date.now() - inicioCache;
  console.log(`✅ Cache carregado em ${tempoCache}ms: ${categorias?.length || 0} categorias, ${centrosCusto?.length || 0} centros de custo`);

  // PASSO 3: Gerar registros para inserção EM LOTE
  console.log(`🔄 Processando ${parcelasDetalhadas.length} parcelas para gerar registros...`);
  const inicioProcessamentoRateio = Date.now();
  
  const registrosParaInserir: any[] = [];
  let parcelasComRateio = 0;
  let parcelasSemRateio = 0;
  let totalItensRateio = 0;

  for (const parcelaDetalhada of parcelasDetalhadas) {
    try {
      const parcela = parcelaDetalhada;
      const evento = parcelaDetalhada.detalhes?.evento;

      if (!evento || !evento.rateio || evento.rateio.length === 0) {
        // Inserir sem categoria/centro custo
        registrosParaInserir.push(criarRegistroVisaoCompetencia(
          barId, parcela, null, null, tipo, categoriasCache, centrosCustoCache
        ));
        parcelasSemRateio++;
      } else {
        // Processar cada item do rateio
        parcelasComRateio++;
        totalItensRateio += evento.rateio.length;
        
        for (const itemRateio of evento.rateio) {
          const centrosCustoItem = itemRateio.rateio_centro_custo || [];
          
          if (centrosCustoItem.length === 0) {
            // Sem centro de custo
            registrosParaInserir.push(criarRegistroVisaoCompetencia(
              barId, parcela, itemRateio, null, tipo, categoriasCache, centrosCustoCache
            ));
          } else {
            // Com centros de custo
            for (const centroCusto of centrosCustoItem) {
              registrosParaInserir.push(criarRegistroVisaoCompetencia(
                barId, parcela, itemRateio, centroCusto, tipo, categoriasCache, centrosCustoCache
              ));
            }
          }
        }
      }
      
      resultado[tipo === 'RECEITA' ? 'receitas' : 'despesas'].processadas++;
      
    } catch (error) {
      console.error(`❌ Erro ao processar parcela ${parcelaDetalhada.id}:`, error);
      resultado[tipo === 'RECEITA' ? 'receitas' : 'despesas'].erros++;
    }
  }

  const tempoProcessamentoRateio = Date.now() - inicioProcessamentoRateio;
  console.log(`📊 Processamento de rateio concluído em ${tempoProcessamentoRateio}ms:`);
  console.log(`   • ${parcelasComRateio} parcelas com rateio (${totalItensRateio} itens)`);
  console.log(`   • ${parcelasSemRateio} parcelas sem rateio`);
  console.log(`   • ${registrosParaInserir.length} registros gerados para inserção`);

  // PASSO 4: Inserir TODOS os registros de uma vez
  if (registrosParaInserir.length > 0) {
    console.log(`💾 Inserindo ${registrosParaInserir.length} registros em lote no banco...`);
    const inicioInsercao = Date.now();
    
    const { error } = await supabase
      .from('contaazul_visao_competencia')
      .upsert(registrosParaInserir, {
        onConflict: 'bar_id,parcela_id,categoria_id,centro_custo_id'
      });

    const tempoInsercao = Date.now() - inicioInsercao;

    if (error) {
      console.error('❌ Erro na inserção em lote:', error);
      resultado[tipo === 'RECEITA' ? 'receitas' : 'despesas'].erros += registrosParaInserir.length;
    } else {
      resultado[tipo === 'RECEITA' ? 'receitas' : 'despesas'].inseridas += registrosParaInserir.length;
      console.log(`✅ ${registrosParaInserir.length} registros inseridos com sucesso em ${tempoInsercao}ms!`);
      console.log(`⚡ Taxa de inserção: ${Math.round(registrosParaInserir.length / (tempoInsercao / 1000))} registros/segundo`);
    }
  } else {
    console.log(`⚠️ Nenhum registro gerado para inserção`);
  }

  const tempoTotalLote = Date.now() - inicioProcessamento;
  console.log(`🏁 Lote completo processado em ${tempoTotalLote}ms (${Math.round(tempoTotalLote / parcelas.length)}ms por parcela)`);
}

// Criar registro para visão de competência
function criarRegistroVisaoCompetencia(
  barId: number,
  parcela: any,
  itemRateio: any,
  centroCusto: any,
  tipo: string,
  categoriasCache: Map<string, string>,
  centrosCustoCache: Map<string, string>
) {
  const clienteFornecedor = tipo === 'RECEITA' ? parcela.cliente : parcela.fornecedor;
  
  const categoriaId = itemRateio?.id_categoria || null;
  const centroCustoId = centroCusto?.id_centro_custo || null;

  return {
    bar_id: barId,
    parcela_id: parcela.id,
    evento_id: parcela.evento_id,
    tipo,
    descricao: parcela.descricao,
    valor: parseFloat(parcela.total || parcela.valor || 0),
    data_vencimento: parcela.data_vencimento,
    data_competencia: parcela.data_competencia,
    data_pagamento: parcela.data_pagamento,
    categoria_id: categoriaId,
    categoria_nome: categoriaId ? categoriasCache.get(categoriaId) : null,
    categoria_valor: itemRateio?.valor ? parseFloat(itemRateio.valor) : null,
    centro_custo_id: centroCustoId,
    centro_custo_nome: centroCustoId ? centrosCustoCache.get(centroCustoId) : null,
    centro_custo_valor: centroCusto?.valor ? parseFloat(centroCusto.valor) : null,
    cliente_fornecedor_id: clienteFornecedor?.id,
    cliente_fornecedor_nome: clienteFornecedor?.nome,
    status: parcela.status,
    conta_financeira_id: parcela.conta_financeira?.id,
    conta_financeira_nome: parcela.conta_financeira?.nome
  };
} 