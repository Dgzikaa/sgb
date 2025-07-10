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
    console.log('🚀 Iniciando COLETA JSON COMPLETA - Estratégia Offline...');
    
    const { bar_id, data_inicio, data_fim } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    // Período padrão: 3 anos completos
    const dataInicio = data_inicio || '2024-01-01';
    const dataFim = data_fim || '2027-01-01';
    
    console.log(`📅 Período COMPLETO: ${dataInicio} até ${dataFim}`);
    console.log('💡 Estratégia: Coletar JSONs → Salvar Storage → Processar Offline');

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
      receitas: { total_parcelas: 0, total_paginas: 0, arquivo_salvo: '' },
      despesas: { total_parcelas: 0, total_paginas: 0, arquivo_salvo: '' },
      arquivos_gerados: [] as string[],
      storage_path: `contaazul-dados/${bar_id}/${timestamp}/`
    };

    try {
      // FASE 1: Coletar dados auxiliares (pequenos - processar direto)
      console.log('📥 FASE 1: Coletando dados auxiliares (categorias, centros, contas)...');
      await coletarDadosAuxiliares(accessToken, parseInt(bar_id), resultado);

      // FASE 2: Coletar TODOS os JSONs de receitas e salvar
      console.log('💰 FASE 2: Coletando TODOS os JSONs de RECEITAS...');
      await coletarTodosOsJsons(
        accessToken, 
        parseInt(bar_id), 
        'receitas',
        dataInicio, 
        dataFim, 
        resultado
      );

      // FASE 3: Coletar TODOS os JSONs de despesas e salvar  
      console.log('💸 FASE 3: Coletando TODOS os JSONs de DESPESAS...');
      await coletarTodosOsJsons(
        accessToken, 
        parseInt(bar_id), 
        'despesas',
        dataInicio, 
        dataFim, 
        resultado
      );

      const tempoExecucao = Date.now() - inicioExecucao;
      console.log('🎯 COLETA JSON COMPLETA CONCLUÍDA!');

      return NextResponse.json({
        success: true,
        message: '✅ Coleta JSON completa concluída! Dados salvos para processamento offline.',
        periodo: { inicio: dataInicio, fim: dataFim },
        resultado,
        tempo_execucao_ms: tempoExecucao,
        proximos_passos: [
          '📁 Verificar arquivos JSON no Supabase Storage',
          '⚙️ Executar processamento offline com /processar-json-offline',
          '💾 Inserir dados processados na tabela final',
          '🚀 Interface pronta para uso'
        ]
      });

    } catch (error) {
      console.error('❌ Erro na coleta JSON completa:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta JSON completa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Garantir que o bucket existe no Storage
async function garantirBucketExiste() {
  try {
    // Tentar listar o bucket para ver se existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'contaazul-dados');
    
    if (!bucketExists) {
      console.log('📦 Bucket não existe, criando...');
      // Criação simples do bucket - sem configurações complexas que podem causar erro 413
      const { error: createError } = await supabase.storage.createBucket('contaazul-dados', {
        public: false
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        throw createError;
      }
      
      console.log('✅ Bucket contaazul-dados criado com sucesso!');
    } else {
      console.log('✅ Bucket contaazul-dados já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar bucket:', error);
    throw error;
  }
}

// FASE 1: Coletar dados auxiliares (pequenos - inserir direto)
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
      console.log(`✅ ${categorias.length} categorias coletadas e inseridas`);
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
      console.log(`✅ ${centros.length} centros de custo coletados e inseridos`);
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
      console.log(`✅ ${contas.length} contas financeiras coletadas e inseridas`);
    }

  } catch (error) {
    console.error('❌ Erro ao coletar dados auxiliares:', error);
  }
}

// FASE 2/3: Coletar TODOS os JSONs e salvar no Storage
async function coletarTodosOsJsons(
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
  
  let pagina = 1;
  const tamanhoPagina = 500; // Muito mais eficiente!
  let todasParcelas: any[] = [];
  let totalPaginas = 0;

  // ETAPA 1: Coletar TODAS as parcelas (sem processar)
  console.log(`📥 Coletando TODAS as ${tipo} do período ${dataInicio} a ${dataFim}...`);
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
        
        if (response.status === 429) {
          console.log('⏳ Rate limit detectado, aguardando 5 segundos...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue; // Tentar a mesma página novamente
        }
        
        throw new Error(`Erro na API ContaAzul: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const parcelas = data.itens || [];
      
      if (parcelas.length === 0) {
        continuarColetando = false;
        break;
      }

      todasParcelas.push(...parcelas);
      totalPaginas = pagina;
      console.log(`📋 ${parcelas.length} ${tipo} encontradas na página ${pagina} (Total acumulado: ${todasParcelas.length})`);

      pagina++;
      
      // Pausa maior para evitar rate limit (páginas maiores = mais cuidado)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error);
      throw error;
    }
  }

  console.log(`✅ Total de ${tipo} coletadas: ${todasParcelas.length} em ${totalPaginas} páginas`);

  // ETAPA 2: Salvar JSONs em CHUNKS (arquivos menores) no Supabase Storage
  console.log(`💾 Salvando ${todasParcelas.length} ${tipo} em chunks no Supabase Storage...`);
  
  // Garantir que o bucket existe ANTES de tentar salvar
  await garantirBucketExiste();

  const CHUNK_SIZE = 1000; // 1000 parcelas por arquivo para evitar limite de tamanho
  const totalChunks = Math.ceil(todasParcelas.length / CHUNK_SIZE);
  
  console.log(`📁 Dividindo em ${totalChunks} arquivos de até ${CHUNK_SIZE} ${tipo} cada...`);

  const arquivosSalvos: string[] = [];
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const inicio = chunkIndex * CHUNK_SIZE;
    const fim = Math.min(inicio + CHUNK_SIZE, todasParcelas.length);
    const chunk = todasParcelas.slice(inicio, fim);
    
    const jsonData = {
      metadata: {
        bar_id: barId,
        tipo,
        data_coleta: new Date().toISOString(),
        periodo: { inicio: dataInicio, fim: dataFim },
        chunk_info: {
          chunk_numero: chunkIndex + 1,
          total_chunks: totalChunks,
          parcelas_neste_chunk: chunk.length,
          parcelas_inicio: inicio,
          parcelas_fim: fim - 1
        },
        total_parcelas_completo: todasParcelas.length,
        total_paginas: totalPaginas
      },
      parcelas: chunk
    };

    const fileName = `${tipo}_${dataInicio}_${dataFim}_chunk_${(chunkIndex + 1).toString().padStart(3, '0')}.json`;
    const filePath = `${resultado.storage_path}${fileName}`;
    
    console.log(`💾 Salvando chunk ${chunkIndex + 1}/${totalChunks}: ${chunk.length} ${tipo} em ${fileName}...`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contaazul-dados')
      .upload(filePath, JSON.stringify(jsonData, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Erro ao salvar chunk ${chunkIndex + 1}: ${fileName}:`, uploadError);
      throw uploadError;
    }
    
    arquivosSalvos.push(filePath);
    resultado.arquivos_gerados.push(filePath);
    
    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} salvo: ${fileName} (${chunk.length} ${tipo})`);
  }

  resultado[tipo].total_parcelas = todasParcelas.length;
  resultado[tipo].total_paginas = totalPaginas;
  resultado[tipo].arquivo_salvo = `${totalChunks} chunks salvos`;

  console.log(`✅ Todos os chunks de ${tipo} salvos com sucesso!`);
  console.log(`📊 Resumo: ${todasParcelas.length} parcelas em ${totalPaginas} páginas, ${totalChunks} arquivos`);
} 