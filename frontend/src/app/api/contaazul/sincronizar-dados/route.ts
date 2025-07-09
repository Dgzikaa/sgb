import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização completa dos dados ContaAzul...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar credenciais do banco
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json(
        { success: false, message: 'Token de acesso não disponível. Reconecte a integração.' },
        { status: 400 }
      );
    }

    // Verificar se o token não expirou
    const tokenValid = credentials.expires_at ? new Date(credentials.expires_at) > new Date() : false;
    if (!tokenValid) {
      return NextResponse.json(
        { success: false, message: 'Token expirado. Renove o token ou reconecte a integração.' },
        { status: 400 }
      );
    }

    const access_token = credentials.access_token;

    // Registrar início da sincronização
    const inicioSincronizacao = new Date().toISOString();
    const { data: syncRecord } = await supabase
      .from('contaazul_sincronizacao')
      .insert({
        bar_id,
        tipo_sincronizacao: 'COMPLETA',
        status: 'EM_ANDAMENTO',
        data_inicio: inicioSincronizacao,
        periodo_inicio: '2024-01-01',
        periodo_fim: '2027-01-01'
      })
      .select()
      .single();

    const syncId = syncRecord?.id;
    let totalProcessados = 0;
    let totalErros = 0;

    try {
      // 1. Sincronizar RECEITAS
      console.log('📈 Sincronizando receitas...');
      const receitasResult = await sincronizarReceitas(access_token, bar_id);
      totalProcessados += receitasResult.processados;
      totalErros += receitasResult.erros;

      // 2. Sincronizar DESPESAS  
      console.log('📉 Sincronizando despesas...');
      const despesasResult = await sincronizarDespesas(access_token, bar_id);
      totalProcessados += despesasResult.processados;
      totalErros += despesasResult.erros;

      // 3. Sincronizar CATEGORIAS
      console.log('🏷️ Sincronizando categorias...');
      const categoriasResult = await sincronizarCategorias(access_token, bar_id);
      totalProcessados += categoriasResult.processados;
      totalErros += categoriasResult.erros;

      // 4. Sincronizar CONTAS FINANCEIRAS
      console.log('🏦 Sincronizando contas financeiras...');
      const contasResult = await sincronizarContasFinanceiras(access_token, bar_id);
      totalProcessados += contasResult.processados;
      totalErros += contasResult.erros;

      // Atualizar status da sincronização
      await supabase
        .from('contaazul_sincronizacao')
        .update({
          status: totalErros > 0 ? 'CONCLUIDA_COM_ERROS' : 'CONCLUIDA',
          data_fim: new Date().toISOString(),
          registros_processados: totalProcessados,
          registros_com_erro: totalErros,
          detalhes: {
            receitas: receitasResult,
            despesas: despesasResult,
            categorias: categoriasResult,
            contas: contasResult
          }
        })
        .eq('id', syncId);

      console.log(`✅ Sincronização concluída! ${totalProcessados} registros processados, ${totalErros} erros`);

      return NextResponse.json({
        success: true,
        message: 'Sincronização concluída com sucesso',
        detalhes: {
          total_processados: totalProcessados,
          total_erros: totalErros,
          receitas: receitasResult,
          despesas: despesasResult,
          categorias: categoriasResult,
          contas: contasResult
        }
      });

    } catch (error) {
      // Atualizar status para erro
      await supabase
        .from('contaazul_sincronizacao')
        .update({
          status: 'ERRO',
          data_fim: new Date().toISOString(),
          detalhes: { erro: error instanceof Error ? error.message : 'Erro desconhecido' }
        })
        .eq('id', syncId);

      throw error;
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na sincronização',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Função para sincronizar receitas (contas a receber)
async function sincronizarReceitas(accessToken: string, barId: number) {
  let processados = 0;
  let erros = 0;
  let pagina = 1;
  const itensPorPagina = 50;

  while (true) {
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        tamanho_pagina: itensPorPagina.toString(),
        data_vencimento_de: '2024-01-01',
        data_vencimento_ate: '2027-01-01'
      });

      const response = await fetch(
        `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error(`Erro ao buscar receitas página ${pagina}:`, response.status);
        break;
      }

      const data = await response.json();
      const receitas = data.itens || [];

      if (receitas.length === 0) break;

      // Processar cada receita
      for (const receita of receitas) {
        try {
          await upsertRegistroFinanceiro(receita, 'RECEITA', barId);
          processados++;
        } catch (error) {
          console.error('Erro ao processar receita:', receita.id, error);
          erros++;
        }
      }

      console.log(`📈 Receitas página ${pagina}: ${receitas.length} itens processados`);
      
      // Se retornou menos que o tamanho da página, chegamos ao fim
      if (receitas.length < itensPorPagina) break;
      
      pagina++;
    } catch (error) {
      console.error(`Erro na página ${pagina} de receitas:`, error);
      erros++;
      break;
    }
  }

  return { processados, erros };
}

// Função para sincronizar despesas (contas a pagar)
async function sincronizarDespesas(accessToken: string, barId: number) {
  let processados = 0;
  let erros = 0;
  let pagina = 1;
  const itensPorPagina = 50;

  while (true) {
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        tamanho_pagina: itensPorPagina.toString(),
        data_vencimento_de: '2024-01-01',
        data_vencimento_ate: '2027-01-01'
      });

      const response = await fetch(
        `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error(`Erro ao buscar despesas página ${pagina}:`, response.status);
        break;
      }

      const data = await response.json();
      const despesas = data.itens || [];

      if (despesas.length === 0) break;

      // Processar cada despesa
      for (const despesa of despesas) {
        try {
          await upsertRegistroFinanceiro(despesa, 'DESPESA', barId);
          processados++;
        } catch (error) {
          console.error('Erro ao processar despesa:', despesa.id, error);
          erros++;
        }
      }

      console.log(`📉 Despesas página ${pagina}: ${despesas.length} itens processados`);
      
      if (despesas.length < itensPorPagina) break;
      pagina++;
    } catch (error) {
      console.error(`Erro na página ${pagina} de despesas:`, error);
      erros++;
      break;
    }
  }

  return { processados, erros };
}

// Função para sincronizar categorias
async function sincronizarCategorias(accessToken: string, barId: number) {
  let processados = 0;
  let erros = 0;

  try {
    const response = await fetch('https://api-v2.contaazul.com/v1/categorias', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar categorias: ${response.status}`);
    }

    const categoriasData = await response.json();
    const categorias = Array.isArray(categoriasData) ? categoriasData : (categoriasData.itens || [categoriasData]);

    for (const categoria of categorias) {
      try {
        await supabase
          .from('contaazul_categorias')
          .upsert({
            bar_id: barId,
            categoria_id: categoria.id,
            nome: categoria.name,
            tipo: categoria.nature || 'GERAL',
            ativa: categoria.status === 'ACTIVE',
            dados_originais: categoria,
            ultima_sincronizacao: new Date().toISOString()
          }, {
            onConflict: 'bar_id,categoria_id'
          });
        
        processados++;
      } catch (error) {
        console.error('Erro ao processar categoria:', categoria.id, error);
        erros++;
      }
    }

  } catch (error) {
    console.error('Erro ao sincronizar categorias:', error);
    erros++;
  }

  return { processados, erros };
}

// Função para sincronizar contas financeiras
async function sincronizarContasFinanceiras(accessToken: string, barId: number) {
  let processados = 0;
  let erros = 0;

  try {
    const response = await fetch('https://api-v2.contaazul.com/v1/conta-financeira', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar contas financeiras: ${response.status}`);
    }

    const contasData = await response.json();
    const contas = Array.isArray(contasData) ? contasData : (contasData.itens || [contasData]);

    for (const conta of contas) {
      try {
        await supabase
          .from('contaazul_contas_financeiras')
          .upsert({
            bar_id: barId,
            conta_id: conta.id,
            nome: conta.name,
            tipo: conta.type || 'GERAL',
            ativa: conta.status === 'ACTIVE',
            saldo_atual: conta.balance || 0,
            dados_originais: conta,
            ultima_sincronizacao: new Date().toISOString()
          }, {
            onConflict: 'bar_id,conta_id'
          });
        
        processados++;
      } catch (error) {
        console.error('Erro ao processar conta financeira:', conta.id, error);
        erros++;
      }
    }

  } catch (error) {
    console.error('Erro ao sincronizar contas financeiras:', error);
    erros++;
  }

  return { processados, erros };
}

// Função para fazer UPSERT de registro financeiro
async function upsertRegistroFinanceiro(registro: any, tipo: 'RECEITA' | 'DESPESA', barId: number) {
  const dadosFinanceiro = {
    bar_id: barId,
    conta_id: registro.id,
    tipo,
    status: registro.status || 'UNKNOWN',
    descricao: registro.description || registro.name || 'Sem descrição',
    valor: parseFloat(registro.value || registro.totalValue || '0'),
    data_vencimento: registro.dueDate || registro.date,
    data_competencia: registro.competenceDate || registro.dueDate || registro.date,
    data_pagamento: registro.paymentDate || null,
    categoria_id: registro.category?.id || null,
    categoria_nome: registro.category?.name || null,
    conta_financeira_id: registro.financialAccount?.id || null,
    conta_financeira_nome: registro.financialAccount?.name || null,
    centro_custo_id: registro.costCenter?.id || null,
    dados_originais: registro,
    ultima_sincronizacao: new Date().toISOString()
  };

  await supabase
    .from('contaazul_financeiro')
    .upsert(dadosFinanceiro, {
      onConflict: 'bar_id,conta_id'
    });
} 