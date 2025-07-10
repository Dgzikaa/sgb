import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');
    
    console.log('🔍 INVESTIGANDO CATEGORIAS ESPECÍFICAS...');
    console.log('Bar ID recebido:', barId);

    // Usar a mesma API que o ContaAzulOAuth usa para buscar o token
    let contaAzulData: any = null;
    
    if (barId) {
      // Tentar usar a API auth para buscar o status (igual ao ContaAzulOAuth)
      try {
        const authResponse = await fetch(`${request.nextUrl.origin}/api/contaazul/auth?action=status&barId=${barId}`);
        const authData = await authResponse.json();
        
        if (authResponse.ok && authData.connected) {
          // Se conectado, buscar os dados completos do banco
          const supabase = await createClient();
          const { data } = await supabase
            .from('api_credentials')
            .select('*')
            .eq('bar_id', parseInt(barId))
            .eq('sistema', 'contaazul')
            .single();
          
          contaAzulData = data;
          console.log('Token encontrado via API auth:', !!contaAzulData?.access_token);
        }
      } catch (error) {
        console.log('Erro ao usar API auth, tentando busca direta:', error);
      }
    }

    // Fallback: buscar diretamente no banco se não funcionou via API auth
    if (!contaAzulData) {
      const supabase = await createClient();
      const { data } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('sistema', 'contaazul')
        .not('access_token', 'is', null)
        .order('last_token_refresh', { ascending: false })
        .limit(1)
        .single();
      
      contaAzulData = data;
      console.log('Token encontrado via busca direta:', !!contaAzulData?.access_token);
    }

    if (!contaAzulData?.access_token) {
      return NextResponse.json({ error: 'Token ContaAzul não encontrado' }, { status: 400 });
    }

    // Buscar categorias cadastradas
    const supabase = await createClient();
    const { data: categorias } = await supabase
      .from('contaazul_categorias')
      .select('*')
      .limit(5);

    if (!categorias || categorias.length === 0) {
      return NextResponse.json({ error: 'Nenhuma categoria encontrada' }, { status: 404 });
    }

    const resultados = [];

    for (const categoria of categorias) {
      console.log(`🔍 Investigando categoria: ${categoria.nome}`);
      
      const investigacaoCategoria: any = {
        categoria_id: categoria.id,
        categoria_nome: categoria.nome,
        categoria_tipo: categoria.tipo,
        testes: {}
      };

      // Lista de endpoints específicos para categorias
      const endpointsCategoria = [
        {
          nome: 'categoria_detalhada',
          url: `https://api-v2.contaazul.com/v1/categoria/${categoria.id}`,
          metodo: 'GET'
        },
        {
          nome: 'transacoes_por_categoria',
          url: `https://api-v2.contaazul.com/v1/financeiro/contas-a-receber/buscar?categoria_id=${categoria.id}`,
          metodo: 'GET'
        },
        {
          nome: 'despesas_por_categoria',
          url: `https://api-v2.contaazul.com/v1/financeiro/contas-a-pagar/buscar?categoria_id=${categoria.id}`,
          metodo: 'GET'
        },
        {
          nome: 'rateio_por_categoria',
          url: `https://api-v2.contaazul.com/v1/financeiro/rateio?categoria_id=${categoria.id}`,
          metodo: 'GET'
        },
        {
          nome: 'eventos_por_categoria',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/buscar?categoria_id=${categoria.id}`,
          metodo: 'GET'
        },
        {
          nome: 'categoria_lancamentos',
          url: `https://api-v2.contaazul.com/v1/financeiro/lancamentos/categoria/${categoria.id}`,
          metodo: 'GET'
        }
      ];

      // Testar cada endpoint
      for (const endpoint of endpointsCategoria) {
        try {
          console.log(`   📋 Testando: ${endpoint.nome}`);
          
          const response = await fetch(endpoint.url, {
            method: endpoint.metodo,
            headers: {
              'Authorization': `Bearer ${contaAzulData.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
          });

          const resultado: any = {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
          };

          if (response.ok) {
            const data = await response.json();
            resultado.sucesso = true;
            resultado.dados = data;
            resultado.tem_dados = !!(data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0));
            resultado.total_registros = Array.isArray(data) ? data.length : (data.total || 0);
            resultado.campos_primeiro_nivel = data ? Object.keys(data) : [];
            
            // Análise específica de rateio
            if (data && (data.rateio || data.rateios)) {
              resultado.tem_rateio = true;
              resultado.detalhes_rateio = data.rateio || data.rateios;
            }
            
            console.log(`   ✅ ${endpoint.nome}: SUCESSO (${response.status}) - ${resultado.total_registros} registros`);
          } else {
            const errorText = await response.text();
            resultado.sucesso = false;
            resultado.erro = errorText;
            console.log(`   ❌ ${endpoint.nome}: ERRO (${response.status})`);
          }

          investigacaoCategoria.testes[endpoint.nome] = resultado;
          
          // Aguardar um pouco entre requisições
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          investigacaoCategoria.testes[endpoint.nome] = {
            sucesso: false,
            erro: error instanceof Error ? error.message : String(error)
          };
          console.log(`   💥 ${endpoint.nome}: ERRO DE CONEXÃO`);
        }
      }

      resultados.push(investigacaoCategoria);
    }

    // Analisar resultados
    const analise: any = {
      total_categorias_testadas: resultados.length,
      endpoints_com_sucesso: {},
      categorias_com_dados: 0,
      total_registros_encontrados: 0,
      descobertas: []
    };

    // Contar sucessos e dados
    for (const resultado of resultados) {
      let categoriaTem_dados = false;
      
      for (const [nomeEndpoint, teste] of Object.entries(resultado.testes)) {
        if (!analise.endpoints_com_sucesso[nomeEndpoint]) {
          analise.endpoints_com_sucesso[nomeEndpoint] = 0;
        }
        
        const t = teste as any;
        if (t.sucesso) {
          analise.endpoints_com_sucesso[nomeEndpoint]++;
          
          if (t.tem_dados) {
            categoriaTem_dados = true;
            analise.total_registros_encontrados += t.total_registros || 0;
          }
          
          if (t.tem_rateio) {
            analise.descobertas.push(`🎯 RATEIO encontrado em ${nomeEndpoint} da categoria ${resultado.categoria_nome}`);
          }
        }
      }
      
      if (categoriaTem_dados) {
        analise.categorias_com_dados++;
      }
    }

    return NextResponse.json({
      investigacao: 'Teste de endpoints específicos por categoria',
      debug_info: {
        bar_id_recebido: barId,
        token_encontrado: !!contaAzulData?.access_token,
        token_expira_em: contaAzulData?.expires_at,
        metodo_busca: contaAzulData ? 'sucesso' : 'falhou'
      },
      analise,
      resultados_detalhados: resultados,
      recomendacoes: analise.descobertas.length > 0 ? 
        ['Encontramos dados relacionados a categorias! Investigar mais a fundo.'] :
        [
          'Nenhum dado específico encontrado por categoria.',
          'Possíveis causas:',
          '1. Parâmetros de busca incorretos',
          '2. Endpoints não documentados corretamente',
          '3. Dados de categorização não disponíveis via API',
          '4. Necessário filtros adicionais (datas, etc.)'
        ]
    });

  } catch (error) {
    console.error('❌ Erro na investigação de categorias:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 