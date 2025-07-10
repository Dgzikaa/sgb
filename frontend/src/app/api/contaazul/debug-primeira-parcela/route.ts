import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG AUTOMÁTICO: Buscando primeira parcela dos dados salvos...');
    
    const { bar_id, storage_path } = await request.json();
    
    if (!bar_id || !storage_path) {
      return NextResponse.json(
        { success: false, message: 'bar_id e storage_path são obrigatórios' },
        { status: 400 }
      );
    }

    const accessToken = await getValidContaAzulToken(parseInt(bar_id));
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Token do ContaAzul não disponível' },
        { status: 400 }
      );
    }

    // ETAPA 1: Buscar primeiro arquivo JSON do Storage
    console.log(`📁 Listando arquivos em: ${storage_path}`);
    const { data: files, error: listError } = await supabase.storage
      .from('contaazul-dados')
      .list(storage_path);

    if (listError) {
      throw new Error(`Erro ao listar arquivos: ${listError.message}`);
    }

    const jsonFile = files?.find(f => f.name.includes('receitas') || f.name.includes('despesas'));
    
    if (!jsonFile) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo JSON encontrado no storage_path' },
        { status: 404 }
      );
    }

    // ETAPA 2: Baixar o arquivo e pegar primeira parcela
    console.log(`📥 Baixando arquivo: ${jsonFile.name}`);
    const filePath = `${storage_path}${jsonFile.name}`;
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('contaazul-dados')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }

    const jsonText = await fileData.text();
    const jsonData = JSON.parse(jsonText);
    
    // Pegar primeira parcela com ID válido
    const primeiraParcela = jsonData.parcelas.find((p: any) => p.id);
    
    if (!primeiraParcela) {
      return NextResponse.json(
        { success: false, message: 'Nenhuma parcela com ID encontrada no arquivo' },
        { status: 404 }
      );
    }

    const parcelaId = primeiraParcela.id;
    console.log(`✅ Primeira parcela encontrada: ${parcelaId}`);
    console.log(`📊 Descrição: ${primeiraParcela.descricao || primeiraParcela.observacao || 'Sem descrição'}`);

    // ETAPA 3: Buscar detalhes COMPLETOS via API
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    console.log(`🔍 Buscando detalhes completos da parcela ${parcelaId}...`);
    const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcelaId}`;
    const response = await fetch(detalhesUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Erro ao buscar parcela: ${response.status}`,
          parcela_id: parcelaId,
          status: response.status
        },
        { status: response.status }
      );
    }

    const dadosAPI = await response.json();
    
    // ETAPA 4: Comparar estruturas
    const analise = {
      parcela_id: parcelaId,
      fonte_arquivo: jsonFile.name,
      
      // Análise dos dados salvos (do arquivo)
      dados_salvos: {
        campos: Object.keys(primeiraParcela).sort(),
        tem_detalhes_completos: 'detalhes_completos' in primeiraParcela,
        tem_rateio: 'rateio' in primeiraParcela,
        rateio_info: primeiraParcela.rateio ? {
          quantidade: primeiraParcela.rateio.length,
          primeiro_item: primeiraParcela.rateio[0]
        } : null
      },
      
      // Análise dos dados da API
      dados_api: {
        campos_nivel_1: Object.keys(dadosAPI).sort(),
        evento: null as any,
        campos_suspeitos: {} as any
      }
    };

    // Analisar evento da API
    if (dadosAPI.evento) {
      analise.dados_api.evento = {
        campos: Object.keys(dadosAPI.evento).sort(),
        tem_rateio: 'rateio' in dadosAPI.evento,
        rateio_detalhes: null as any
      };

      if (dadosAPI.evento.rateio) {
        analise.dados_api.evento.rateio_detalhes = {
          eh_array: Array.isArray(dadosAPI.evento.rateio),
          quantidade: Array.isArray(dadosAPI.evento.rateio) ? dadosAPI.evento.rateio.length : 0,
          estrutura_primeiro: dadosAPI.evento.rateio[0] || null
        };
      }
    }

    // Procurar campos relacionados
    const procurarCampos = (obj: any, path = '') => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (key.toLowerCase().includes('categ') || 
              key.toLowerCase().includes('rateio') || 
              key.toLowerCase().includes('centro') ||
              key.toLowerCase().includes('custo')) {
            const fullPath = path ? `${path}.${key}` : key;
            analise.dados_api.campos_suspeitos[fullPath] = {
              tipo: Array.isArray(obj[key]) ? 'array' : 'object',
              conteudo_resumido: Array.isArray(obj[key]) 
                ? `Array com ${obj[key].length} itens`
                : Object.keys(obj[key]).join(', ')
            };
          }
          
          // Recursão limitada
          if (path.split('.').length < 2) {
            procurarCampos(obj[key], path ? `${path}.${key}` : key);
          }
        }
      }
    };

    procurarCampos(dadosAPI);

    // Comparação final
    const comparacao = {
      rateio_nos_dados_salvos: analise.dados_salvos.tem_rateio || analise.dados_salvos.tem_detalhes_completos,
      rateio_na_api: analise.dados_api.evento?.tem_rateio || false,
      campos_categoria_encontrados: Object.keys(analise.dados_api.campos_suspeitos).length,
      
      diagnostico: ''
    };

    // Diagnóstico
    if (comparacao.rateio_na_api) {
      comparacao.diagnostico = '✅ RATEIO ENCONTRADO NA API! Campo: evento.rateio';
    } else if (comparacao.campos_categoria_encontrados > 0) {
      comparacao.diagnostico = '⚠️ Rateio não está em evento.rateio, mas encontramos campos suspeitos';
    } else {
      comparacao.diagnostico = '❌ Rateio não encontrado na estrutura padrão da API';
    }

    return NextResponse.json({
      success: true,
      message: 'Debug automático concluído',
      parcela_analisada: {
        id: parcelaId,
        descricao: primeiraParcela.descricao || primeiraParcela.observacao,
        valor: primeiraParcela.valor
      },
      analise,
      comparacao,
      estrutura_api_completa: dadosAPI,
      recomendacao: comparacao.rateio_na_api 
        ? 'O rateio EXISTE em evento.rateio! A documentação está desatualizada.'
        : 'Examine estrutura_api_completa para encontrar onde estão as categorias'
    });

  } catch (error) {
    console.error('❌ Erro no debug automático:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao fazer debug automático',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 