import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalysisResult {
  totalItens?: number;
  temItens?: boolean;
  temTotais?: boolean;
  estrutura?: string[];
  primeiroItem?: string[] | null;
}

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  params: any;
  official: boolean;
  description?: string;
  status: number;
  success: boolean;
  data: any;
  error: any;
  analysis: AnalysisResult;
  urlUsed: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId') || '3';
    
    console.log('🧪 Testando endpoints baseados na DOCUMENTAÇÃO OFICIAL...');
    
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

    // Datas conforme solicitado: 01.01.2024 até 01.01.2027
    const dataInicio = '2024-01-01';
    const dataFim = '2027-01-01';

    const endpointsToTest = [
      // Endpoints que já funcionam
      {
        name: 'Categorias',
        endpoint: '/categorias',
        method: 'GET',
        params: null,
        official: true
      },
      {
        name: 'Contas Financeiras',
        endpoint: '/conta-financeira',
        method: 'GET', 
        params: null,
        official: true
      },
      
      // ENDPOINT OFICIAL DE RECEITAS (baseado na documentação)
      {
        name: 'Buscar Receitas (Documentação Oficial)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber/buscar',
        method: 'GET',
        params: {
          // Parâmetros obrigatórios
          pagina: 1,
          tamanho_pagina: 10,
          data_vencimento_de: dataInicio,
          data_vencimento_ate: dataFim,
          
          // Parâmetros opcionais para teste mais completo
          campo_ordenado_descendente: 'valor',
          status: ['EM_ABERTO', 'RECEBIDO', 'ATRASADO']
        },
        official: true,
        description: 'Endpoint oficial baseado na documentação'
      },
      
      // TESTE SIMILAR PARA DESPESAS (assumindo estrutura similar)
      {
        name: 'Buscar Despesas (Tentativa baseada em receitas)', 
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar/buscar',
        method: 'GET',
        params: {
          pagina: 1,
          tamanho_pagina: 10,
          data_vencimento_de: dataInicio,
          data_vencimento_ate: dataFim,
          campo_ordenado_descendente: 'valor'
        },
        official: false,
        description: 'Tentativa baseada na estrutura das receitas'
      },

      // TESTES ALTERNATIVOS COM DIFERENTES FILTROS
      {
        name: 'Receitas por Competência',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber/buscar',
        method: 'GET',
        params: {
          pagina: 1,
          tamanho_pagina: 10,
          data_vencimento_de: dataInicio,
          data_vencimento_ate: dataFim,
          data_competencia_de: '2024-01-01',
          data_competencia_ate: '2024-12-31',
          campo_ordenado_descendente: 'data_vencimento'
        },
        official: true,
        description: 'Teste com filtro de competência (2024)'
      },
      
      {
        name: 'Receitas Recebidas',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber/buscar',
        method: 'GET',
        params: {
          pagina: 1,
          tamanho_pagina: 10,
          data_vencimento_de: dataInicio,
          data_vencimento_ate: dataFim,
          status: ['RECEBIDO'],
          data_pagamento_de: '2024-01-01',
          data_pagamento_ate: '2024-12-31'
        },
        official: true,
        description: 'Apenas receitas já recebidas em 2024'
      }
    ];

    const results: TestResult[] = [];

    for (const test of endpointsToTest) {
      try {
        console.log(`🔍 Testando: ${test.name} - ${test.method} ${test.endpoint}`);
        console.log(`📖 ${test.description || 'Teste baseado na documentação'}`);
        
        let url = `${baseURL}${test.endpoint}`;
        let requestOptions: any = {
          method: test.method,
          headers: headers
        };

        // Para GET, adicionar parâmetros na URL
        if (test.method === 'GET' && test.params) {
          const urlParams = new URLSearchParams();
          
          Object.entries(test.params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Para arrays, adicionar cada item separadamente 
              value.forEach(item => urlParams.append(key, String(item)));
            } else {
              urlParams.append(key, String(value));
            }
          });
          
          url += `?${urlParams.toString()}`;
        }

        console.log(`📡 URL completa: ${url}`);
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

        // Análise específica para endpoints financeiros
        let analysis: AnalysisResult = {};
        
        if (response.ok && typeof data === 'object' && data !== null) {
          analysis = {
            totalItens: data.itens_totais || data.total || (Array.isArray(data.itens) ? data.itens.length : 0),
            temItens: (data.itens && Array.isArray(data.itens) && data.itens.length > 0),
            temTotais: !!data.totais,
            estrutura: Object.keys(data),
            primeiroItem: data.itens && data.itens[0] ? Object.keys(data.itens[0]) : null
          };
        }
        
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          params: test.params,
          official: test.official,
          description: test.description,
          status: response.status,
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          analysis,
          urlUsed: url
        });

        const statusIcon = response.ok ? '✅' : '❌';
        const dataInfo = response.ok && analysis?.totalItens ? ` (${analysis.totalItens} itens)` : '';
        console.log(`${statusIcon} ${test.name}: ${response.status}${dataInfo}`);
        
        // Delay entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`❌ Erro ao testar ${test.name}:`, error);
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          params: test.params,
          official: test.official,
          description: test.description,
          status: 0,
          success: false,
          data: null,
          error: error.message,
          analysis: {},
          urlUsed: null
        });
      }
    }

    // Análise dos resultados
    const successful = results.filter(r => r.success);
    const withData = results.filter(r => r.success && (r.analysis?.totalItens || 0) > 0);
    const official = results.filter(r => r.official && r.success);
    
    const summary = {
      total: results.length,
      successful: successful.length,
      withData: withData.length,
      officialWorking: official.length,
      dataFound: withData.reduce((sum, r) => sum + (r.analysis?.totalItens || 0), 0)
    };

    console.log('📊 Resumo dos testes baseados na documentação:', summary);

    // Recomendações para implementação
    const implementation = {
      canImplementVisaoCompetencia: withData.length >= 1,
      workingEndpoints: successful.map(r => ({
        name: r.name,
        endpoint: r.endpoint,
        totalItens: r.analysis?.totalItens || 0,
        temDados: (r.analysis?.totalItens || 0) > 0,
        official: r.official
      })),
      dataStructure: withData.length > 0 ? withData[0].analysis : null
    };

    return NextResponse.json({
      success: true,
      testDescription: 'Testes baseados na documentação oficial do ContaAzul',
      dateRange: {
        dataInicio,
        dataFim,
        description: 'Janeiro 2024 até Janeiro 2027 (conforme solicitado)'
      },
      summary,
      results,
      implementation,
      nextStep: withData.length > 0 ? 
        'PRONTO! Podemos implementar a Visão de Competência com os dados encontrados' :
        'Necessário ajustar parâmetros ou verificar se há dados no período'
    });

  } catch (error: any) {
    console.error('❌ Erro ao testar endpoints oficiais:', error);
    return NextResponse.json({ 
      error: 'Erro ao testar endpoints baseados na documentação', 
      details: error.message 
    }, { status: 500 });
  }
} 