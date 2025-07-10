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
    console.log('🚀 Iniciando COLETA COMPLETA COM DETALHES - Estratégia 2 Etapas...');
    
    const { bar_id, data_inicio, data_fim } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    // Período padrão para teste
    const dataInicio = data_inicio || '2025-01-01';
    const dataFim = data_fim || '2025-01-31';
    
    console.log(`📅 Período: ${dataInicio} até ${dataFim}`);
    console.log('💡 Estratégia: Listas Básicas → Detalhes Individuais → Storage');

    const accessToken = await getValidContaAzulToken(parseInt(bar_id));
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Token do ContaAzul não disponível' },
        { status: 400 }
      );
    }

    console.log('✅ Token válido obtido para bar_id:', bar_id);

    const inicioExecucao = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    let resultado = {
      dados_auxiliares: { categorias: 0, centros_custo: 0, contas: 0 },
      receitas: { 
        parcelas_basicas: 0, 
        detalhes_coletados: 0,
        com_rateio: 0,
        arquivo_salvo: '' 
      },
      despesas: { 
        parcelas_basicas: 0, 
        detalhes_coletados: 0,
        com_rateio: 0,
        arquivo_salvo: '' 
      },
      performance: {
        tempo_listas: 0,
        tempo_detalhes: 0,
        total_requisicoes: 0
      },
      arquivos_gerados: [] as string[],
      storage_path: `contaazul-dados-completos/${bar_id}/${timestamp}/`
    };

    try {
      // FASE 1: Coletar dados auxiliares
      console.log('📥 FASE 1: Coletando dados auxiliares...');
      await coletarDadosAuxiliares(accessToken, parseInt(bar_id), resultado);

      // FASE 2: Coletar listas básicas + detalhes completos de receitas
      console.log('💰 FASE 2: Coletando RECEITAS com detalhes completos...');
      await coletarComDetalhesCompletos(
        accessToken, 
        parseInt(bar_id), 
        'receitas',
        dataInicio, 
        dataFim, 
        resultado
      );

      // FASE 3: Coletar listas básicas + detalhes completos de despesas  
      console.log('💸 FASE 3: Coletando DESPESAS com detalhes completos...');
      await coletarComDetalhesCompletos(
        accessToken, 
        parseInt(bar_id), 
        'despesas',
        dataInicio, 
        dataFim, 
        resultado
      );

      const tempoExecucao = Date.now() - inicioExecucao;
      console.log('🎯 COLETA COMPLETA COM DETALHES CONCLUÍDA!');

      return NextResponse.json({
        success: true,
        message: '✅ Coleta completa com detalhes concluída! Dados com categorias/centros salvos.',
        periodo: { inicio: dataInicio, fim: dataFim },
        resultado,
        tempo_execucao_ms: tempoExecucao,
        resumo_performance: {
          tempo_listas: `${resultado.performance.tempo_listas}ms`,
          tempo_detalhes: `${resultado.performance.tempo_detalhes}ms`,
          total_requisicoes: resultado.performance.total_requisicoes,
          eficiencia: `${(resultado.performance.tempo_detalhes / resultado.performance.total_requisicoes).toFixed(2)}ms por requisição`
        },
        proximos_passos: [
          '📁 Verificar arquivos JSON COMPLETOS no Supabase Storage',
          '⚙️ Executar processamento offline (dados já incluem rateio)',
          '💾 Inserir dados com categorias/centros na tabela final',
          '🚀 Interface pronta com dados completos'
        ]
      });

    } catch (error) {
      console.error('❌ Erro na coleta completa:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta completa com detalhes',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Garantir que o bucket existe
async function garantirBucketExiste() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'contaazul-dados');
    
    if (!bucketExists) {
      console.log('📦 Bucket não existe, criando...');
      const { error: createError } = await supabase.storage.createBucket('contaazul-dados', {
        public: false
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        throw createError;
      }
      
      console.log('✅ Bucket contaazul-dados criado!');
    } else {
      console.log('✅ Bucket contaazul-dados já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar bucket:', error);
    throw error;
  }
}

// FASE 1: Coletar dados auxiliares
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

// FASE 2/3: Estratégia completa - Listas + Detalhes individuais
async function coletarComDetalhesCompletos(
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
  
  const inicioFase = Date.now();

  // ETAPA 1: Coletar listas básicas (rápido)
  console.log(`📋 ETAPA 1: Coletando lista básica de ${tipo}...`);
  let todasParcelas: any[] = [];
  let pagina = 1;
  const tamanhoPagina = 500;

  while (true) {
    try {
      const url = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${endpoint}?` +
        `data_competencia_de=${dataInicio}&` +
        `data_competencia_ate=${dataFim}&` +
        `data_vencimento_de=${dataInicio}&` +
        `data_vencimento_ate=${dataFim}&` +
        `pagina=${pagina}&` +
        `tamanho_pagina=${tamanhoPagina}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.log('⏳ Rate limit na lista, aguardando...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const parcelas = data.itens || [];
      
      if (parcelas.length === 0) break;

      todasParcelas.push(...parcelas);
      console.log(`📄 Página ${pagina}: ${parcelas.length} ${tipo} (Total: ${todasParcelas.length})`);

      pagina++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre páginas
      
    } catch (error) {
      console.error(`❌ Erro na página ${pagina}:`, error);
      throw error;
    }
  }

  resultado.performance.tempo_listas += Date.now() - inicioFase;
  resultado[tipo].parcelas_basicas = todasParcelas.length;
  console.log(`✅ ${todasParcelas.length} ${tipo} básicas coletadas`);

  // ETAPA 2: Buscar detalhes individuais (com rate limiting cuidadoso)
  console.log(`🔍 ETAPA 2: Buscando detalhes individuais de ${todasParcelas.length} ${tipo}...`);
  const inicioDetalhes = Date.now();
  const parcelasCompletas: any[] = [];
  let comRateio = 0;
  let requisicoes = 0;

  for (let i = 0; i < todasParcelas.length; i++) {
    const parcela = todasParcelas[i];
    
    try {
      console.log(`🔍 [${i + 1}/${todasParcelas.length}] Buscando detalhes da parcela ${parcela.id}...`);
      
      const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`;
      const detalhesResponse = await fetch(detalhesUrl, { headers });
      requisicoes++;

      if (!detalhesResponse.ok) {
        if (detalhesResponse.status === 429) {
          console.log('⏳ Rate limit detectado, aguardando 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          i--; // Tentar novamente
          continue;
        }
        
        console.log(`⚠️ Erro ${detalhesResponse.status} na parcela ${parcela.id}, pulando...`);
        parcelasCompletas.push(parcela); // Adicionar sem detalhes
        continue;
      }

      const detalhes = await detalhesResponse.json();
      
      // Verificar se tem rateio (categorias/centros)
      const temRateio = detalhes.evento?.rateio && detalhes.evento.rateio.length > 0;
      if (temRateio) {
        comRateio++;
      }

      // Combinar dados básicos + detalhes
      const parcelaCompleta = {
        ...parcela,
        detalhes_completos: detalhes,
        tem_rateio: temRateio,
        rateio: detalhes.evento?.rateio || []
      };

      parcelasCompletas.push(parcelaCompleta);
      
      // Pausa entre requisições para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`❌ Erro na parcela ${parcela.id}:`, error);
      parcelasCompletas.push(parcela); // Adicionar sem detalhes
    }
  }

  resultado.performance.tempo_detalhes += Date.now() - inicioDetalhes;
  resultado.performance.total_requisicoes += requisicoes;
  resultado[tipo].detalhes_coletados = parcelasCompletas.length;
  resultado[tipo].com_rateio = comRateio;

  console.log(`✅ Detalhes coletados: ${parcelasCompletas.length}/${todasParcelas.length}`);
  console.log(`🎯 Com rateio (categorias): ${comRateio}/${parcelasCompletas.length}`);

  // ETAPA 3: Salvar dados completos no Storage
  console.log(`💾 ETAPA 3: Salvando ${parcelasCompletas.length} ${tipo} completas no Storage...`);
  
  await garantirBucketExiste();

  const jsonData = {
    metadata: {
      bar_id: barId,
      tipo,
      data_coleta: new Date().toISOString(),
      periodo: { inicio: dataInicio, fim: dataFim },
      total_parcelas: parcelasCompletas.length,
      parcelas_com_rateio: comRateio,
      parcelas_sem_rateio: parcelasCompletas.length - comRateio,
      estrategia: '2_etapas_completa'
    },
    parcelas: parcelasCompletas
  };

  const fileName = `${tipo}_completas_${dataInicio}_${dataFim}.json`;
  const filePath = `${resultado.storage_path}${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('contaazul-dados')
    .upload(filePath, JSON.stringify(jsonData, null, 2), {
      contentType: 'application/json',
      upsert: true
    });

  if (uploadError) {
    console.error(`❌ Erro ao salvar ${fileName}:`, uploadError);
    throw uploadError;
  }
  
  resultado[tipo].arquivo_salvo = filePath;
  resultado.arquivos_gerados.push(filePath);
  
  console.log(`✅ Arquivo ${fileName} salvo com dados completos!`);
} 