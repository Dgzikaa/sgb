import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    console.log('🔍 INVESTIGAÇÃO COMPLETA - TESTANDO TUDO POSSÍVEL...');
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

    // Verificar se token não expirou
    if (contaAzulData.expires_at && new Date(contaAzulData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token ContaAzul expirado' }, { status: 400 });
    }

    // Buscar alguns eventos recentes para investigar
    const supabase = await createClient();
    const { data: eventosRecentes } = await supabase
      .from('contaazul_visao_competencia')
      .select('evento_id, parcela_id, tipo, descricao')
      .not('evento_id', 'is', null)
      .order('coletado_em', { ascending: false })
      .limit(3);

    if (!eventosRecentes || eventosRecentes.length === 0) {
      return NextResponse.json({ error: 'Nenhum evento encontrado para investigar' }, { status: 404 });
    }

    const resultados = [];

    for (const evento of eventosRecentes) {
      console.log(`🔍 Investigando evento: ${evento.evento_id}`);
      
      const investigacaoEvento: any = {
        evento_id: evento.evento_id,
        parcela_id: evento.parcela_id,
        tipo: evento.tipo,
        descricao: evento.descricao,
        testes: {}
      };

      // Lista de endpoints para testar
      const endpointsParaTestar = [
        {
          nome: 'evento_completo',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${evento.evento_id}`,
          metodo: 'GET'
        },
        {
          nome: 'parcelas_do_evento',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${evento.evento_id}/parcelas`,
          metodo: 'GET'
        },
        {
          nome: 'parcela_individual',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${evento.parcela_id}`,
          metodo: 'GET'
        },
        {
          nome: 'rateio_especifico',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${evento.evento_id}/rateio`,
          metodo: 'GET'
        },
        {
          nome: 'rateio_parcela',
          url: `https://api-v2.contaazul.com/v1/financeiro/parcelas/${evento.parcela_id}/rateio`,
          metodo: 'GET'
        },
        {
          nome: 'categorias_evento',
          url: `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${evento.evento_id}/categorias`,
          metodo: 'GET'
        }
      ];

      // Testar cada endpoint
      for (const endpoint of endpointsParaTestar) {
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
            resultado.tem_rateio = !!(data.rateio || data.evento?.rateio);
            resultado.tem_categorias = !!(data.categorias || data.categoria || data.categoria_id);
            resultado.tem_centros_custo = !!(data.centros_custo || data.centro_custo || data.centro_custo_id);
            resultado.campos_primeiro_nivel = Object.keys(data);
            
            // Análise específica para diferentes tipos de resposta
            if (endpoint.nome === 'evento_completo' && data.rateio) {
              resultado.detalhes_rateio = {
                total_itens: data.rateio.length,
                categorias_encontradas: data.rateio.map((r: any) => r.categoria_id || r.id_categoria).filter(Boolean),
                centros_custo_encontrados: data.rateio.flatMap((r: any) => 
                  (r.rateio_centro_custo || r.centros_custo || []).map((c: any) => c.centro_custo_id || c.id_centro_custo)
                ).filter(Boolean)
              };
            }
            
            console.log(`   ✅ ${endpoint.nome}: SUCESSO (${response.status})`);
          } else {
            const errorText = await response.text();
            resultado.sucesso = false;
            resultado.erro = errorText;
            console.log(`   ❌ ${endpoint.nome}: ERRO (${response.status})`);
          }

          investigacaoEvento.testes[endpoint.nome] = resultado;
          
          // Aguardar um pouco entre requisições para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          investigacaoEvento.testes[endpoint.nome] = {
            sucesso: false,
            erro: error instanceof Error ? error.message : String(error)
          };
          console.log(`   💥 ${endpoint.nome}: ERRO DE CONEXÃO`);
        }
      }

      resultados.push(investigacaoEvento);
    }

    // Analisar resultados gerais
    const analise: any = {
      total_eventos_testados: resultados.length,
      endpoints_com_sucesso: {},
      descobertas: []
    };

    // Contar sucessos por endpoint
    for (const resultado of resultados) {
      for (const [nomeEndpoint, teste] of Object.entries(resultado.testes)) {
        if (!analise.endpoints_com_sucesso[nomeEndpoint]) {
          analise.endpoints_com_sucesso[nomeEndpoint] = 0;
        }
        if ((teste as any).sucesso) {
          analise.endpoints_com_sucesso[nomeEndpoint]++;
        }
      }
    }

    // Identificar descobertas importantes
    for (const resultado of resultados) {
      for (const [nomeEndpoint, teste] of Object.entries(resultado.testes)) {
        const t = teste as any;
        if (t.sucesso) {
          if (t.tem_rateio) {
            analise.descobertas.push(`🎯 RATEIO ENCONTRADO em ${nomeEndpoint} do evento ${resultado.evento_id}`);
          }
          if (t.tem_categorias) {
            analise.descobertas.push(`📊 CATEGORIAS ENCONTRADAS em ${nomeEndpoint} do evento ${resultado.evento_id}`);
          }
          if (t.tem_centros_custo) {
            analise.descobertas.push(`🏢 CENTROS DE CUSTO ENCONTRADOS em ${nomeEndpoint} do evento ${resultado.evento_id}`);
          }
        }
      }
    }

    return NextResponse.json({
      investigacao: 'Teste de todos os endpoints possíveis',
      debug_info: {
        bar_id_recebido: barId,
        token_encontrado: !!contaAzulData?.access_token,
        token_expira_em: contaAzulData?.expires_at,
        metodo_busca: contaAzulData ? 'sucesso' : 'falhou'
      },
      analise,
      resultados_detalhados: resultados,
      recomendacoes: analise.descobertas.length > 0 ? 
        ['Encontramos dados de categorização! Investigar endpoints específicos.'] :
        [
          'Tentar outras abordagens:',
          '1. Verificar se rateio está configurado no ContaAzul',
          '2. Testar outros períodos/tipos de transação',
          '3. Consultar documentação atualizada da API',
          '4. Contatar suporte ContaAzul sobre endpoints de categorização'
        ]
    });

  } catch (error) {
    console.error('❌ Erro na investigação completa:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 