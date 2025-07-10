import { NextRequest, NextResponse } from 'next/server';
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Examinando estrutura REAL da API ContaAzul...');
    
    const { bar_id, parcela_id } = await request.json();
    
    if (!bar_id || !parcela_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id e parcela_id são obrigatórios' },
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

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Buscar detalhes completos da parcela
    console.log(`📋 Buscando parcela ${parcela_id}...`);
    const detalhesUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela_id}`;
    const response = await fetch(detalhesUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Erro ao buscar parcela: ${response.status}`,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const dadosCompletos = await response.json();
    
    // Analisar TODOS os campos retornados
    const analise = {
      parcela_id,
      campos_nivel_1: Object.keys(dadosCompletos).sort(),
      
      // Analisar o evento (se existir)
      evento_analise: null as any,
      
      // Procurar por campos relacionados a categoria/rateio
      campos_suspeitos: {} as any,
      
      // Estrutura completa para debug
      estrutura_completa: dadosCompletos
    };

    // Analisar evento em detalhes
    if (dadosCompletos.evento) {
      analise.evento_analise = {
        campos_evento: Object.keys(dadosCompletos.evento).sort(),
        tem_rateio: 'rateio' in dadosCompletos.evento,
        tem_categoria: 'categoria' in dadosCompletos.evento,
        tem_centro_custo: 'centro_custo' in dadosCompletos.evento
      };

      // Se tiver rateio no evento, analisar
      if (dadosCompletos.evento.rateio) {
        analise.evento_analise.rateio_estrutura = {
          eh_array: Array.isArray(dadosCompletos.evento.rateio),
          quantidade: dadosCompletos.evento.rateio.length,
          primeiro_item: dadosCompletos.evento.rateio[0] || null
        };
      }
    }

    // Procurar campos suspeitos em TODOS os níveis
    const procurarCamposSuspeitos = (obj: any, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        // Procurar por palavras-chave
        if (key.toLowerCase().includes('categ') || 
            key.toLowerCase().includes('rateio') || 
            key.toLowerCase().includes('centro') ||
            key.toLowerCase().includes('custo') ||
            key.toLowerCase().includes('classif')) {
          
          analise.campos_suspeitos[fullKey] = {
            tipo: typeof obj[key],
            valor: obj[key],
            eh_array: Array.isArray(obj[key]),
            tamanho_se_array: Array.isArray(obj[key]) ? obj[key].length : null
          };
        }
        
        // Recursão para objetos (mas não muito profundo)
        if (typeof obj[key] === 'object' && obj[key] !== null && prefix.split('.').length < 3) {
          procurarCamposSuspeitos(obj[key], fullKey);
        }
      }
    };

    procurarCamposSuspeitos(dadosCompletos);

    // Verificar se há algum ID de evento para buscar mais detalhes
    const eventoId = dadosCompletos.evento?.id || dadosCompletos.id_evento;
    
    let dadosEvento = null;
    if (eventoId) {
      console.log(`🔍 Tentando buscar evento ${eventoId} separadamente...`);
      
      // Tentar endpoint de eventos (pode não existir, mas vamos testar)
      const eventoUrl = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${eventoId}`;
      const eventoResponse = await fetch(eventoUrl, { headers });
      
      if (eventoResponse.ok) {
        dadosEvento = await eventoResponse.json();
        console.log('✅ Dados do evento encontrados!');
      } else {
        console.log(`❌ Endpoint de evento retornou ${eventoResponse.status}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Análise estrutural completa',
      analise,
      dados_evento_separado: dadosEvento,
      conclusoes: {
        tem_rateio_documentado: analise.evento_analise?.tem_rateio || false,
        campos_categoria_encontrados: Object.keys(analise.campos_suspeitos).length,
        possivel_localizacao_rateio: Object.keys(analise.campos_suspeitos).filter(k => k.includes('rateio')),
        recomendacao: 'Examine campos_suspeitos e estrutura_completa para encontrar onde estão as categorias'
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao fazer debug da estrutura',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 