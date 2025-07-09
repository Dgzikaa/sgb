import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId') || '3';
    
    console.log('🧪 Testando endpoints da API ContaAzul v2 com parâmetros...');
    
    // Buscar credenciais do ContaAzul
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json({ 
        error: 'ContaAzul não conectado ou token inválido' 
      }, { status: 400 });
    }

    const baseURL = 'https://api-v2.contaazul.com/v1';
    const headers = {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Datas para testes (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const dataFim = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dataInicio = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    const endpointsToTest = [
      // Endpoints simples (sem parâmetros)
      {
        name: 'Categorias',
        endpoint: '/categorias',
        method: 'GET',
        params: null
      },
      {
        name: 'Contas Financeiras',
        endpoint: '/conta-financeira',
        method: 'GET',
        params: null
      },
      {
        name: 'Serviços',
        endpoint: '/servicos',
        method: 'GET',
        params: null
      },
      
      // Endpoints financeiros com parâmetros de data
      {
        name: 'Contas a Receber (com datas)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber',
        method: 'GET',
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          pagina: 1,
          tamanho_pagina: 10
        }
      },
      {
        name: 'Contas a Pagar (com datas)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar',
        method: 'GET',
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          pagina: 1,
          tamanho_pagina: 10
        }
      },
      
      // Endpoints de busca como POST
      {
        name: 'Buscar Contas a Receber (POST)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber/buscar',
        method: 'POST',
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          paginacao: {
            pagina: 1,
            tamanho_pagina: 10
          }
        }
      },
      {
        name: 'Buscar Contas a Pagar (POST)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar/buscar',
        method: 'POST',
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          paginacao: {
            pagina: 1,
            tamanho_pagina: 10
          }
        }
      },
      
      // Testes alternativos
      {
        name: 'Contas a Receber (só paginação)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber',
        method: 'GET',
        params: {
          pagina: 1,
          tamanho_pagina: 10
        }
      },
      {
        name: 'Contas a Pagar (só paginação)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar',
        method: 'GET',
        params: {
          pagina: 1,
          tamanho_pagina: 10
        }
      }
    ];

    const results = [];

    for (const test of endpointsToTest) {
      try {
        console.log(`🔍 Testando: ${test.name} - ${test.method} ${test.endpoint}`);
        
        let url = `${baseURL}${test.endpoint}`;
        let requestOptions: any = {
          method: test.method,
          headers: headers
        };

        // Adicionar parâmetros conforme o método
        if (test.method === 'GET' && test.params) {
          // Para GET, adicionar parâmetros na URL
          const urlParams = new URLSearchParams();
          Object.entries(test.params).forEach(([key, value]) => {
            if (typeof value === 'object') {
              urlParams.append(key, JSON.stringify(value));
            } else {
              urlParams.append(key, String(value));
            }
          });
          url += `?${urlParams.toString()}`;
        } else if (test.method === 'POST' && test.params) {
          // Para POST, adicionar no body
          requestOptions.body = JSON.stringify(test.params);
        }

        console.log(`📡 URL: ${url}`);
        if (test.params) {
          console.log(`📋 Parâmetros:`, test.params);
        }

        const response = await fetch(url, requestOptions);
        let data;
        
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
        
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          params: test.params,
          status: response.status,
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          dataType: response.ok ? typeof data : null,
          hasData: response.ok ? (Array.isArray(data) ? data.length > 0 : Object.keys(data || {}).length > 0) : false,
          urlUsed: url
        });

        console.log(`✅ ${test.name}: ${response.status} ${response.ok ? 'OK' : 'ERRO'}`);
        
        // Pequeno delay entre requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error: any) {
        console.error(`❌ Erro ao testar ${test.name}:`, error);
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          params: test.params,
          status: 0,
          success: false,
          data: null,
          error: error.message,
          dataType: null,
          hasData: false,
          urlUsed: null
        });
      }
    }

    // Análise dos resultados
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const withData = results.filter(r => r.hasData);
    
    const summary = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      withData: withData.length,
      successfulEndpoints: successful.map(r => r.name),
      failedEndpoints: failed.map(r => ({name: r.name, status: r.status, error: r.error}))
    };

    console.log('📊 Resumo dos testes avançados:', summary);

    // Recomendações baseadas nos resultados
    const recommendations = {
      workingEndpoints: successful.map(r => ({
        name: r.name,
        endpoint: r.endpoint,
        method: r.method,
        params: r.params,
        dataStructure: r.hasData ? 'Com dados' : 'Sem dados'
      })),
      forEntradas: successful.filter(r => r.name.toLowerCase().includes('receber')),
      forSaidas: successful.filter(r => r.name.toLowerCase().includes('pagar')),
      forCategorias: successful.filter(r => r.name.toLowerCase().includes('categoria')),
      forContas: successful.filter(r => r.name.toLowerCase().includes('conta') && !r.name.toLowerCase().includes('receber') && !r.name.toLowerCase().includes('pagar'))
    };

    return NextResponse.json({
      success: true,
      dateRange: {
        dataInicio,
        dataFim,
        description: 'Últimos 30 dias'
      },
      summary,
      results,
      recommendations,
      nextSteps: {
        implementVisaoCompetencia: successful.length >= 2,
        needsMoreTesting: failed.length > successful.length,
        readyForProduction: withData.length >= 3
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao testar endpoints avançados:', error);
    return NextResponse.json({ 
      error: 'Erro ao testar endpoints avançados', 
      details: error.message 
    }, { status: 500 });
  }
} 