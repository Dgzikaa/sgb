import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('💰 Iniciando sincronização APENAS de receitas...');
    
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
        bar_id: parseInt(bar_id),
        tipo_sincronizacao: 'RECEITAS_APENAS',
        status: 'EM_ANDAMENTO',
        data_inicio: inicioSincronizacao,
        periodo_inicio: '2024-01-01',
        periodo_fim: '2027-01-01'
      })
      .select()
      .single();

    const syncId = syncRecord?.id;

    try {
      // Sincronizar RECEITAS com maior capacidade
      console.log('📈 Sincronizando receitas (modo dedicado)...');
      const receitasResult = await sincronizarReceitas(access_token, parseInt(bar_id));

      // Atualizar status da sincronização
      await supabase
        .from('contaazul_sincronizacao')
        .update({
          status: receitasResult.erros > 0 ? 'CONCLUIDA_COM_ERROS' : 'CONCLUIDA',
          data_fim: new Date().toISOString(),
          registros_processados: receitasResult.processados,
          registros_com_erro: receitasResult.erros,
          detalhes: { receitas: receitasResult }
        })
        .eq('id', syncId);

      console.log(`✅ Sincronização de receitas concluída! ${receitasResult.processados} registros processados, ${receitasResult.erros} erros`);

      return NextResponse.json({
        success: true,
        message: 'Sincronização de receitas concluída com sucesso',
        detalhes: {
          total_processados: receitasResult.processados,
          total_erros: receitasResult.erros,
          receitas: receitasResult
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
    console.error('❌ Erro na sincronização de receitas:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na sincronização de receitas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Função para sincronizar receitas com maior capacidade
async function sincronizarReceitas(accessToken: string, barId: number) {
  let processados = 0;
  let erros = 0;
  let pagina = 1;
  const itensPorPagina = 500; // MUITO MAIOR - 500 itens por página
  const maxPaginas = 50; // Permite até 25.000 registros

  while (pagina <= maxPaginas) {
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        tamanho_pagina: itensPorPagina.toString(),
        data_vencimento_de: '2024-01-01',
        data_vencimento_ate: '2027-01-01'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const response = await fetch(
        `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

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

      console.log(`📈 Receitas página ${pagina}: ${receitas.length} itens processados (total: ${processados})`);
      
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