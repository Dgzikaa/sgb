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
    
    console.log('🔍 Buscando DADOS REAIS do ContaAzul para ver estrutura...');
    
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

    // Datas para buscar dados recentes (últimos 2 meses)
    const dataFim = new Date().toISOString().split('T')[0]; // Hoje
    const dataInicio = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 dias atrás

    const dadosEstruturados: any = {
      periodo_pesquisado: {
        inicio: dataInicio,
        fim: dataFim,
        descricao: 'Últimos 2 meses para ver estrutura dos dados'
      },
      dados_encontrados: {},
      estruturas_mapeadas: {}
    };

    // 1. BUSCAR RECEITAS (primeiros 3 registros)
    console.log('💰 Buscando estrutura das RECEITAS...');
    try {
      const receitasUrl = `${baseURL}/financeiro/eventos-financeiros/contas-a-receber/buscar`;
      const receitasParams = new URLSearchParams({
        pagina: '1',
        tamanho_pagina: '3',
        data_vencimento_de: dataInicio,
        data_vencimento_ate: dataFim
      });

      const receitasResponse = await fetch(`${receitasUrl}?${receitasParams}`, {
        method: 'GET',
        headers
      });

      if (receitasResponse.ok) {
        const receitasData = await receitasResponse.json();
        dadosEstruturados.dados_encontrados.receitas = {
          total_encontrado: receitasData.itens_totais || 0,
          primeiros_3_registros: receitasData.itens || [],
          estrutura_resposta: Object.keys(receitasData),
          totais: receitasData.totais || null
        };

        // Mapear estrutura do primeiro item
        if (receitasData.itens && receitasData.itens[0]) {
          dadosEstruturados.estruturas_mapeadas.receita = {
            campos_disponíveis: Object.keys(receitasData.itens[0]),
            exemplo_valores: receitasData.itens[0]
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar receitas:', error);
    }

    // 2. BUSCAR DESPESAS (primeiros 3 registros)
    console.log('💸 Buscando estrutura das DESPESAS...');
    try {
      const despesasUrl = `${baseURL}/financeiro/eventos-financeiros/contas-a-pagar/buscar`;
      const despesasParams = new URLSearchParams({
        pagina: '1',
        tamanho_pagina: '3',
        data_vencimento_de: dataInicio,
        data_vencimento_ate: dataFim
      });

      const despesasResponse = await fetch(`${despesasUrl}?${despesasParams}`, {
        method: 'GET',
        headers
      });

      if (despesasResponse.ok) {
        const despesasData = await despesasResponse.json();
        dadosEstruturados.dados_encontrados.despesas = {
          total_encontrado: despesasData.itens_totais || 0,
          primeiros_3_registros: despesasData.itens || [],
          estrutura_resposta: Object.keys(despesasData),
          totais: despesasData.totais || null
        };

        // Mapear estrutura do primeiro item
        if (despesasData.itens && despesasData.itens[0]) {
          dadosEstruturados.estruturas_mapeadas.despesa = {
            campos_disponíveis: Object.keys(despesasData.itens[0]),
            exemplo_valores: despesasData.itens[0]
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
    }

    // 3. BUSCAR CATEGORIAS (primeiras 5)
    console.log('📋 Buscando estrutura das CATEGORIAS...');
    try {
      const categoriasResponse = await fetch(`${baseURL}/categorias`, {
        method: 'GET',
        headers
      });

      if (categoriasResponse.ok) {
        const categoriasData = await categoriasResponse.json();
        
        // Verificar se é array ou objeto
        const isArray = Array.isArray(categoriasData);
        const categoriasList = isArray ? categoriasData : (categoriasData.itens || [categoriasData]);
        
        dadosEstruturados.dados_encontrados.categorias = {
          total_encontrado: isArray ? categoriasData.length : (categoriasData.itens_totais || Object.keys(categoriasData).length),
          primeiras_5_categorias: Array.isArray(categoriasList) ? categoriasList.slice(0, 5) : [categoriasData],
          estrutura_resposta: isArray ? 'array' : Object.keys(categoriasData),
          dados_brutos: categoriasData // Para debug
        };

        // Mapear estrutura do primeiro item
        const primeiroItem = Array.isArray(categoriasList) ? categoriasList[0] : categoriasData;
        if (primeiroItem && typeof primeiroItem === 'object') {
          dadosEstruturados.estruturas_mapeadas.categoria = {
            campos_disponíveis: Object.keys(primeiroItem),
            exemplo_valores: primeiroItem
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
    }

    // 4. BUSCAR CONTAS FINANCEIRAS
    console.log('🏦 Buscando estrutura das CONTAS FINANCEIRAS...');
    try {
      const contasResponse = await fetch(`${baseURL}/conta-financeira`, {
        method: 'GET',
        headers
      });

      if (contasResponse.ok) {
        const contasData = await contasResponse.json();
        
        // Verificar se é array ou objeto
        const isArray = Array.isArray(contasData);
        const contasList = isArray ? contasData : (contasData.itens || [contasData]);
        
        dadosEstruturados.dados_encontrados.contas_financeiras = {
          total_encontrado: isArray ? contasData.length : (contasData.itens_totais || Object.keys(contasData).length),
          todas_as_contas: Array.isArray(contasList) ? contasList : [contasData],
          estrutura_resposta: isArray ? 'array' : Object.keys(contasData),
          dados_brutos: contasData // Para debug
        };

        // Mapear estrutura do primeiro item
        const primeiroItem = Array.isArray(contasList) ? contasList[0] : contasData;
        if (primeiroItem && typeof primeiroItem === 'object') {
          dadosEstruturados.estruturas_mapeadas.conta_financeira = {
            campos_disponíveis: Object.keys(primeiroItem),
            exemplo_valores: primeiroItem
          };
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar contas financeiras:', error);
    }

    // 5. ANÁLISE PARA IMPLEMENTAÇÃO
    const analise_implementacao = {
      pronto_para_sincronizar: true,
      campos_essenciais_mapeados: {
        receitas: dadosEstruturados.estruturas_mapeadas.receita?.campos_disponíveis || [],
        despesas: dadosEstruturados.estruturas_mapeadas.despesa?.campos_disponíveis || [],
        categorias: dadosEstruturados.estruturas_mapeadas.categoria?.campos_disponíveis || [],
        contas: dadosEstruturados.estruturas_mapeadas.conta_financeira?.campos_disponíveis || []
      },
      endpoints_funcionais: {
        receitas: '/financeiro/eventos-financeiros/contas-a-receber/buscar',
        despesas: '/financeiro/eventos-financeiros/contas-a-pagar/buscar',
        categorias: '/categorias',
        contas_financeiras: '/conta-financeira'
      },
      proximo_passo: 'Implementar API de sincronização com base nesta estrutura'
    };

    console.log('✅ Estrutura dos dados mapeada com sucesso!');
    console.log('📊 Total de dados encontrados:', {
      receitas: dadosEstruturados.dados_encontrados.receitas?.total_encontrado || 0,
      despesas: dadosEstruturados.dados_encontrados.despesas?.total_encontrado || 0,
      categorias: dadosEstruturados.dados_encontrados.categorias?.total_encontrado || 0,
      contas: dadosEstruturados.dados_encontrados.contas_financeiras?.total_encontrado || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Estrutura de dados do ContaAzul mapeada com sucesso!',
      ...dadosEstruturados,
      analise_implementacao
    });

  } catch (error: any) {
    console.error('❌ Erro ao mapear estrutura dos dados:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar estrutura dos dados', 
      details: error.message 
    }, { status: 500 });
  }
} 