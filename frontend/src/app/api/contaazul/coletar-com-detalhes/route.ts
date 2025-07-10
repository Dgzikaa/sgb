import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidContaAzulToken, makeContaAzulRequest } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando COLETA COM DETALHES - Fluxo Correto da API ContaAzul...');
    
    const { bar_id, data_inicio, data_fim } = await request.json();
    
    if (!bar_id) {
      console.error('❌ bar_id não fornecido. Body recebido:', { bar_id, data_inicio, data_fim });
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório', received_body: { bar_id, data_inicio, data_fim } },
        { status: 400 }
      );
    }

    console.log('✅ Parâmetros recebidos:', { bar_id, data_inicio, data_fim });

    // Definir período padrão se não fornecido
    const dataInicio = data_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const dataFim = data_fim || new Date().toISOString().split('T')[0];
    
    console.log(`📅 Período: ${dataInicio} até ${dataFim}`);

    // Obter token válido (com renovação automática se necessário)
    const accessToken = await getValidContaAzulToken(parseInt(bar_id));
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token do ContaAzul não disponível ou não foi possível renovar',
          debug: {
            bar_id: parseInt(bar_id),
            action: 'Verifique se as credenciais estão configuradas e se a autorização foi feita'
          }
        },
        { status: 400 }
      );
    }

    console.log('✅ Token válido obtido para bar_id:', bar_id);

    // Registrar início da sincronização
    const { data: logEntry } = await supabase
      .from('contaazul_sync_log')
      .insert({
        bar_id: parseInt(bar_id),
        tipo_operacao: 'COLETA_DETALHES',
        periodo_inicio: dataInicio,
        periodo_fim: dataFim
      })
      .select()
      .single();

    const logId = logEntry?.id;
    const inicioExecucao = Date.now();

    let resultado = {
      receitas: { total: 0, processadas: 0, erros: 0 },
      despesas: { total: 0, processadas: 0, erros: 0 },
      dados_auxiliares: { categorias: 0, centros_custo: 0, contas: 0 },
      detalhes: [] as any[]
    };

    try {
      // FASE 1: Coletar dados auxiliares primeiro (cache)
      console.log('📥 FASE 1: Coletando dados auxiliares...');
      await coletarDadosAuxiliares(accessToken, parseInt(bar_id), resultado);

      // FASE 2: Coletar RECEITAS com detalhes
      console.log('💰 FASE 2: Coletando RECEITAS com detalhes...');
      await coletarFinanceiroComDetalhes(
        accessToken, 
        parseInt(bar_id), 
        'receitas',
        dataInicio, 
        dataFim, 
        resultado
      );

      // FASE 3: Coletar DESPESAS com detalhes
      console.log('💸 FASE 3: Coletando DESPESAS com detalhes...');
      await coletarFinanceiroComDetalhes(
        accessToken, 
        parseInt(bar_id), 
        'despesas',
        dataInicio, 
        dataFim, 
        resultado
      );

      // Atualizar log de sucesso
      const tempoExecucao = Date.now() - inicioExecucao;
      await supabase
        .from('contaazul_sync_log')
        .update({
          total_processado: resultado.receitas.total + resultado.despesas.total,
          total_sucesso: resultado.receitas.processadas + resultado.despesas.processadas,
          total_erro: resultado.receitas.erros + resultado.despesas.erros,
          tempo_execucao_ms: tempoExecucao,
          finalizado_em: new Date().toISOString()
        })
        .eq('id', logId);

      console.log('🎯 COLETA COM DETALHES CONCLUÍDA!');

      return NextResponse.json({
        success: true,
        message: '✅ Coleta com detalhes concluída com sucesso!',
        periodo: { inicio: dataInicio, fim: dataFim },
        resultado,
        tempo_execucao_ms: tempoExecucao,
        log_id: logId,
        proximos_passos: [
          '📊 Verificar dados na tabela contaazul_visao_competencia',
          '🎨 Criar dashboard baseado na planilha modelo',
          '⏰ Configurar automação (4 em 4 horas)'
        ]
      });

    } catch (error) {
      // Registrar erro no log
      await supabase
        .from('contaazul_sync_log')
        .update({
          detalhes_erro: error instanceof Error ? error.message : 'Erro desconhecido',
          tempo_execucao_ms: Date.now() - inicioExecucao,
          finalizado_em: new Date().toISOString()
        })
        .eq('id', logId);

      throw error;
    }

  } catch (error) {
    console.error('❌ Erro na coleta com detalhes:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta com detalhes',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// FASE 1: Coletar dados auxiliares para cache
async function coletarDadosAuxiliares(accessToken: string, barId: number, resultado: any) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Coletar categorias
    console.log('🏷️ Coletando categorias...');
    const categoriasResponse = await fetch('https://api-v2.contaazul.com/v1/categorias?tamanho_pagina=100', { headers });
    
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json();
      const categorias = categoriasData.dados || [];
      
      for (const categoria of categorias) {
        await supabase
          .from('contaazul_categorias')
          .upsert({
            id: categoria.id,
            bar_id: barId,
            nome: categoria.nome,
            tipo: categoria.tipo,
            codigo: categoria.codigo,
            permite_filhos: categoria.permite_filhos,
            categoria_pai_id: categoria.categoria_pai?.id,
            entrada_dre: categoria.entrada_dre,
            ativo: true
          });
      }
      
      resultado.dados_auxiliares.categorias = categorias.length;
      console.log(`✅ ${categorias.length} categorias coletadas`);
    }

    // Coletar centros de custo
    console.log('🎯 Coletando centros de custo...');
    const centrosResponse = await fetch('https://api-v2.contaazul.com/v1/centro-de-custo?tamanho_pagina=100', { headers });
    
    if (centrosResponse.ok) {
      const centrosData = await centrosResponse.json();
      const centros = centrosData.dados || [];
      
      for (const centro of centros) {
        await supabase
          .from('contaazul_centros_custo')
          .upsert({
            id: centro.id,
            bar_id: barId,
            nome: centro.nome,
            codigo: centro.codigo,
            ativo: centro.ativo !== false
          });
      }
      
      resultado.dados_auxiliares.centros_custo = centros.length;
      console.log(`✅ ${centros.length} centros de custo coletados`);
    }

    // Coletar contas financeiras
    console.log('🏦 Coletando contas financeiras...');
    const contasResponse = await fetch('https://api-v2.contaazul.com/v1/conta-financeira?tamanho_pagina=100', { headers });
    
    if (contasResponse.ok) {
      const contasData = await contasResponse.json();
      const contas = contasData.dados || [];
      
      for (const conta of contas) {
        await supabase
          .from('contaazul_contas_financeiras')
          .upsert({
            id: conta.id,
            bar_id: barId,
            nome: conta.nome,
            tipo: conta.tipo,
            banco_numero: conta.banco?.numero,
            agencia: conta.agencia,
            conta: conta.conta,
            saldo_inicial: conta.saldo_inicial || 0,
            ativo: conta.ativo !== false
          });
      }
      
      resultado.dados_auxiliares.contas = contas.length;
      console.log(`✅ ${contas.length} contas financeiras coletadas`);
    }

  } catch (error) {
    console.error('❌ Erro ao coletar dados auxiliares:', error);
    resultado.detalhes.push(`⚠️ Erro dados auxiliares: ${error}`);
  }
}

// FASE 2/3: Coletar financeiro (receitas/despesas) com detalhes
async function coletarFinanceiroComDetalhes(
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
  let continuarColetando = true;

  while (continuarColetando) {
    try {
      console.log(`📄 ${tipo} - Página ${pagina}...`);
      
      // PASSO 1: Buscar parcelas por competência (API básica)
      const url = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${endpoint}?` +
        `data_competencia_de=${dataInicio}&` +
        `data_competencia_ate=${dataFim}&` +
        `pagina=${pagina}&` +
        `tamanho_pagina=${tamanhoPagina}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        // Capturar detalhes do erro da API ContaAzul
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.text();
          console.error(`❌ ContaAzul API Error [${response.status}]:`, errorBody);
          errorDetails += ` - ${errorBody}`;
        } catch (e) {
          console.error(`❌ ContaAzul API Error [${response.status}] - Não foi possível ler response`);
        }
        throw new Error(`Erro na API ContaAzul: ${errorDetails}`);
      }

      const data = await response.json();
      const parcelas = data.dados || [];
      
      if (parcelas.length === 0) {
        continuarColetando = false;
        break;
      }

      resultado[tipo].total += parcelas.length;
      console.log(`📋 ${parcelas.length} ${tipo} encontradas na página ${pagina}`);

      // PASSO 2: Para cada parcela, buscar evento completo
      for (const parcela of parcelas) {
        try {
          await processarParcelaComDetalhes(accessToken, barId, parcela, tipoMaiusculo, resultado);
          resultado[tipo].processadas++;
        } catch (error) {
          console.error(`❌ Erro ao processar parcela ${parcela.id}:`, error);
          resultado[tipo].erros++;
          resultado.detalhes.push(`❌ Parcela ${parcela.id}: ${error}`);
        }
      }

      pagina++;
      
      // Pequena pausa para evitar rate limit
      if (pagina % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error);
      resultado[tipo].erros += tamanhoPagina;
      continuarColetando = false;
    }
  }
}

// Processar parcela individual com busca de detalhes
async function processarParcelaComDetalhes(
  accessToken: string, 
  barId: number, 
  parcela: any, 
  tipo: string,
  resultado: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  // PASSO 2: Buscar detalhes completos da parcela
  const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`;
  
  const detalhesResponse = await fetch(detalhesUrl, { headers });
  
  if (!detalhesResponse.ok) {
    throw new Error(`Erro ao buscar detalhes da parcela: ${detalhesResponse.status}`);
  }

  const detalhesData = await detalhesResponse.json();
  const evento = detalhesData.evento;
  
  if (!evento || !evento.rateio) {
    // Inserir sem categoria/centro custo se não tiver rateio
    await inserirVisaoCompetencia(barId, parcela, null, null, tipo);
    return;
  }

  // PASSO 3: Processar cada item do rateio (categoria + centro custo)
  for (const itemRateio of evento.rateio) {
    const categoriaId = itemRateio.id_categoria;
    let categoriaNome = null;
    
    // Buscar nome da categoria no cache
    if (categoriaId) {
      const { data: categoria } = await supabase
        .from('contaazul_categorias')
        .select('nome')
        .eq('id', categoriaId)
        .single();
      
      categoriaNome = categoria?.nome;
    }

    // Processar centros de custo do rateio
    const centrosCusto = itemRateio.rateio_centro_custo || [];
    
    if (centrosCusto.length === 0) {
      // Inserir sem centro de custo
      await inserirVisaoCompetencia(barId, parcela, {
        id: categoriaId,
        nome: categoriaNome,
        valor: itemRateio.valor
      }, null, tipo);
    } else {
      // Inserir para cada centro de custo
      for (const centroCusto of centrosCusto) {
        let centroCustoNome = null;
        
        if (centroCusto.id_centro_custo) {
          const { data: centro } = await supabase
            .from('contaazul_centros_custo')
            .select('nome')
            .eq('id', centroCusto.id_centro_custo)
            .single();
          
          centroCustoNome = centro?.nome;
        }

        await inserirVisaoCompetencia(barId, parcela, {
          id: categoriaId,
          nome: categoriaNome,
          valor: itemRateio.valor
        }, {
          id: centroCusto.id_centro_custo,
          nome: centroCustoNome,
          valor: centroCusto.valor
        }, tipo);
      }
    }
  }
}

// Inserir na tabela de visão de competência
async function inserirVisaoCompetencia(
  barId: number, 
  parcela: any, 
  categoria: any, 
  centroCusto: any, 
  tipo: string
) {
  const clienteFornecedor = tipo === 'RECEITA' 
    ? parcela.cliente 
    : parcela.fornecedor;

  await supabase
    .from('contaazul_visao_competencia')
    .upsert({
      bar_id: barId,
      parcela_id: parcela.id,
      evento_id: parcela.evento_id,
      tipo,
      descricao: parcela.descricao,
      valor: parseFloat(parcela.total || parcela.valor || 0),
      data_vencimento: parcela.data_vencimento,
      data_competencia: parcela.data_competencia,
      data_pagamento: parcela.data_pagamento,
      categoria_id: categoria?.id,
      categoria_nome: categoria?.nome,
      categoria_valor: categoria?.valor ? parseFloat(categoria.valor) : null,
      centro_custo_id: centroCusto?.id,
      centro_custo_nome: centroCusto?.nome,
      centro_custo_valor: centroCusto?.valor ? parseFloat(centroCusto.valor) : null,
      cliente_fornecedor_id: clienteFornecedor?.id,
      cliente_fornecedor_nome: clienteFornecedor?.nome,
      status: parcela.status,
      conta_financeira_id: parcela.conta_financeira?.id,
      conta_financeira_nome: parcela.conta_financeira?.nome
    }, {
      onConflict: 'bar_id,parcela_id'
    });
} 