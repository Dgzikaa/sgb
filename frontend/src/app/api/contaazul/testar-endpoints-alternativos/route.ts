import { NextRequest, NextResponse } from 'next/server';
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TESTANDO ENDPOINTS ALTERNATIVOS DA CONTA AZUL...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
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

    const resultados = {
      endpoints_testados: [] as any[],
      endpoints_funcionando: [] as any[],
      endpoints_com_erro: [] as any[]
    };

    // Lista de endpoints para testar (baseados na pesquisa do Grok)
    const endpointsParaTestar = [
      {
        nome: 'finance/statement',
        url: 'https://api-v2.contaazul.com/pub/finance/statement/',
        descricao: 'Transações com categoryId e costCenterId direto'
      },
      {
        nome: 'finance/category',
        url: 'https://api-v2.contaazul.com/pub/finance/category/',
        descricao: 'Detalhes de categorias'
      },
      {
        nome: 'finance/costcentre',
        url: 'https://api-v2.contaazul.com/pub/finance/costcentre/',
        descricao: 'Detalhes de centros de custo'
      },
      // Testar também variações da URL
      {
        nome: 'v1/finance/statement',
        url: 'https://api-v2.contaazul.com/v1/finance/statement/',
        descricao: 'Versão v1 do endpoint de transações'
      },
      {
        nome: 'financeiro/statement',
        url: 'https://api-v2.contaazul.com/v1/financeiro/statement/',
        descricao: 'Endpoint financeiro com statement'
      },
      // Testar endpoint de eventos com mais detalhes
      {
        nome: 'eventos-detalhados',
        url: 'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/?incluir_detalhes=true',
        descricao: 'Eventos financeiros com detalhes completos'
      }
    ];

    console.log(`🧪 Testando ${endpointsParaTestar.length} endpoints alternativos...`);

    for (const endpoint of endpointsParaTestar) {
      console.log(`\n📡 Testando: ${endpoint.nome}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Descrição: ${endpoint.descricao}`);

      try {
        const response = await fetch(endpoint.url, { 
          method: 'GET',
          headers 
        });

        const statusCode = response.status;
        const statusText = response.statusText;
        
        let responseData = null;
        let responseText = '';
        
        try {
          responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, manter como texto
          responseData = responseText;
        }

        const resultado = {
          endpoint: endpoint.nome,
          url: endpoint.url,
          descricao: endpoint.descricao,
          status_code: statusCode,
          status_text: statusText,
          funcionou: response.ok,
          response_data: responseData,
          response_size: responseText.length,
          response_preview: responseText.substring(0, 500)
        };

        resultados.endpoints_testados.push(resultado);

        if (response.ok) {
          console.log(`   ✅ Status: ${statusCode} - ${statusText}`);
          console.log(`   📊 Response size: ${responseText.length} chars`);
          console.log(`   🔍 Preview: ${responseText.substring(0, 100)}...`);
          resultados.endpoints_funcionando.push(resultado);
        } else {
          console.log(`   ❌ Status: ${statusCode} - ${statusText}`);
          console.log(`   📄 Response: ${responseText.substring(0, 200)}...`);
          resultados.endpoints_com_erro.push(resultado);
        }

      } catch (error) {
        console.log(`   💥 Erro de conexão: ${error}`);
        
        const resultado = {
          endpoint: endpoint.nome,
          url: endpoint.url,
          descricao: endpoint.descricao,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          funcionou: false
        };

        resultados.endpoints_testados.push(resultado);
        resultados.endpoints_com_erro.push(resultado);
      }

      // Pausa entre testes para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log(`✅ Endpoints funcionando: ${resultados.endpoints_funcionando.length}`);
    console.log(`❌ Endpoints com erro: ${resultados.endpoints_com_erro.length}`);
    console.log(`📊 Total testados: ${resultados.endpoints_testados.length}`);

    return NextResponse.json({
      success: true,
      message: 'Testes de endpoints alternativos concluídos',
      resultados,
      recomendacoes: resultados.endpoints_funcionando.length > 0 ? 
        'Encontrados endpoints funcionando! Verifique os detalhes.' :
        'Nenhum endpoint alternativo encontrado. Continuar com estratégia atual.'
    });

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao testar endpoints alternativos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 