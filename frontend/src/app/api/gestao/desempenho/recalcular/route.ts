import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Função para fetch de todos os dados (paginação)
async function fetchAllData(supabase: any, tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(from, from + limit - 1);
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes('gte_')) query = query.gte(key.replace('gte_', ''), value);
      else if (key.includes('lte_')) query = query.lte(key.replace('lte_', ''), value);
      else if (key.includes('eq_')) query = query.eq(key.replace('eq_', ''), value);
      else if (key.includes('in_')) query = query.in(key.replace('in_', ''), value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ Erro ao buscar ${tableName}:`, error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allData.push(...data);
    if (data.length < limit) break;
    
    from += limit;
  }
  
  console.log(`📊 ${tableName}: ${allData.length} registros total`);
  return allData;
}

// Obter semana do ano de uma data
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

// POST - Recalcular dados automáticos da tabela de desempenho
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { semana_id, recalcular_todas = false } = body;
    
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }

    // Usar service_role para dados administrativos (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('🔄 Iniciando recálculo automático...');
    console.log('Bar ID:', barId);
    console.log('Semana específica:', semana_id);
    console.log('Recalcular todas:', recalcular_todas);

    // Buscar semanas para recalcular
    let semanasQuery = supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', barId);

    if (!recalcular_todas && semana_id) {
      semanasQuery = semanasQuery.eq('id', semana_id);
    }

    const { data: semanas, error: semanaError } = await semanasQuery;

    if (semanaError || !semanas || semanas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma semana encontrada para recalcular' },
        { status: 404 }
      );
    }

    console.log(`📊 Recalculando ${semanas.length} semana(s)`);

    const semanasAtualizadas = [];

    for (const semana of semanas) {
      console.log(`\n📅 Processando Semana ${semana.numero_semana} (${semana.data_inicio} - ${semana.data_fim})`);
      
      const startDate = semana.data_inicio;
      const endDate = semana.data_fim;

      // =============================================
      // 1. FATURAMENTO TOTAL (ContaHub + Yuzer + Sympla)
      // =============================================
      
      console.log('💰 Calculando Faturamento Total...');
      
      const [contahubData, yuzerData, symplaData] = await Promise.all([
        fetchAllData(supabase, 'contahub_pagamentos', 'liquido', {
          'gte_dt_gerencial': startDate,
          'lte_dt_gerencial': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'yuzer_pagamento', 'valor_liquido', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'sympla_pedidos', 'valor_liquido', {
          'gte_data_pedido': startDate,
          'lte_data_pedido': endDate
        })
      ]);

      const faturamentoContahub = contahubData?.reduce((sum, item) => sum + (parseFloat(item.liquido) || 0), 0) || 0;
      const faturamentoYuzer = yuzerData?.reduce((sum, item) => sum + (parseFloat(item.valor_liquido) || 0), 0) || 0;
      const faturamenteSympla = symplaData?.reduce((sum, item) => sum + (parseFloat(item.valor_liquido) || 0), 0) || 0;
      
      const faturamentoTotal = faturamentoContahub + faturamentoYuzer + faturamenteSympla;

      console.log(`💰 Faturamento Calculado:`);
      console.log(`  - ContaHub: R$ ${faturamentoContahub.toFixed(2)}`);
      console.log(`  - Yuzer: R$ ${faturamentoYuzer.toFixed(2)}`);
      console.log(`  - Sympla: R$ ${faturamenteSympla.toFixed(2)}`);
      console.log(`  - TOTAL: R$ ${faturamentoTotal.toFixed(2)}`);

      // =============================================
      // 2. FATURAMENTO COUVERT 
      // =============================================
      
      console.log('🎫 Calculando Faturamento Couvert...');
      
      const [contahubCouvert, yuzerIngressos, symplaCheckins] = await Promise.all([
        fetchAllData(supabase, 'contahub_periodo', 'vr_couvert', {
          'gte_data': startDate,
          'lte_data': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'yuzer_produtos', 'quantidade, valor_unitario', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'sympla_participantes', '*', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_fez_checkin': true
        })
      ]);

      const couvertContahub = contahubCouvert?.reduce((sum, item) => sum + (parseFloat(item.vr_couvert) || 0), 0) || 0;
      
      // Yuzer: produtos que contêm 'ingresso' ou 'entrada'
      const couvertYuzer = yuzerIngressos?.filter(item => 
        item.produto_nome && (
          item.produto_nome.toLowerCase().includes('ingresso') || 
          item.produto_nome.toLowerCase().includes('entrada')
        )
      ).reduce((sum, item) => sum + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)), 0) || 0;
      
      // Sympla: count de checkins * valor médio (assumindo valor médio de entrada)
      const checkinsSympla = symplaCheckins?.length || 0;
      const couvertSympla = checkinsSympla * 20; // Valor médio estimado - pode ser refinado
      
      const faturamentoCouvert = couvertContahub + couvertYuzer + couvertSympla;

      console.log(`🎫 Couvert Calculado:`);
      console.log(`  - ContaHub: R$ ${couvertContahub.toFixed(2)}`);
      console.log(`  - Yuzer: R$ ${couvertYuzer.toFixed(2)}`);
      console.log(`  - Sympla: R$ ${couvertSympla.toFixed(2)} (${checkinsSympla} checkins)`);
      console.log(`  - TOTAL: R$ ${faturamentoCouvert.toFixed(2)}`);

      // =============================================
      // 3. FATURAMENTO BAR
      // =============================================
      
      const faturamentoBar = faturamentoTotal - faturamentoCouvert;
      console.log(`🍺 Faturamento Bar: R$ ${faturamentoBar.toFixed(2)}`);

      // =============================================
      // 4. FATURAMENTO CMOVÍVEL (Bar - Comissões)
      // =============================================
      
      console.log('💼 Calculando Comissões...');
      
      const comissoesData = await fetchAllData(supabase, 'nibo_agendamentos', 'valor', {
        'gte_data_competencia': startDate,
        'lte_data_competencia': endDate
      });

      const comissoes = comissoesData?.filter(item => 
        item.categoria_nome && item.categoria_nome.toLowerCase().includes('comissão')
      ).reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0) || 0;

      const faturamentoCMovivel = faturamentoBar - comissoes;

      console.log(`💼 Comissões: R$ ${comissoes.toFixed(2)}`);
      console.log(`📊 Faturamento CMvível: R$ ${faturamentoCMovivel.toFixed(2)}`);

      // =============================================
      // 5. CLIENTES ATENDIDOS
      // =============================================
      
      console.log('👥 Calculando Clientes Atendidos...');
      
      const [contahubPessoas, yuzerProdutos, symplaParticipantes] = await Promise.all([
        fetchAllData(supabase, 'contahub_periodo', 'pessoas', {
          'gte_data': startDate,
          'lte_data': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'yuzer_produtos', 'quantidade', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_bar_id': barId
        }),
        fetchAllData(supabase, 'sympla_participantes', '*', {
          'gte_data_evento': startDate,
          'lte_data_evento': endDate,
          'eq_fez_checkin': true
        })
      ]);

      const pessoasContahub = contahubPessoas?.reduce((sum, item) => sum + (parseInt(item.pessoas) || 0), 0) || 0;
      
      const pessoasYuzer = yuzerProdutos?.filter(item => 
        item.produto_nome && (
          item.produto_nome.toLowerCase().includes('ingresso') || 
          item.produto_nome.toLowerCase().includes('entrada')
        )
      ).reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0) || 0;
      
      const pessoasSympla = symplaParticipantes?.length || 0;
      
      const clientesAtendidos = pessoasContahub + pessoasYuzer + pessoasSympla;

      console.log(`👥 Clientes Atendidos:`);
      console.log(`  - ContaHub: ${pessoasContahub}`);
      console.log(`  - Yuzer: ${pessoasYuzer}`);
      console.log(`  - Sympla: ${pessoasSympla}`);
      console.log(`  - TOTAL: ${clientesAtendidos}`);

      // =============================================
      // 6. TICKET MÉDIO
      // =============================================
      
      const ticketMedio = clientesAtendidos > 0 ? faturamentoTotal / clientesAtendidos : 0;
      console.log(`🎯 Ticket Médio: R$ ${ticketMedio.toFixed(2)}`);

      // =============================================
      // 7. CMO % (Custo Mão de Obra)
      // =============================================
      
      console.log('👷 Calculando CMO...');
      
      const categoriasCMO = [
        'Alimentação',
        'Provisão Trabalhista', 
        'Vale Transporte',
        'Adicionais',
        'Freela Atendimento',
        'Freela Bar',
        'Freela Cozinha', 
        'Freela Limpeza',
        'Freela Segurança',
        'CUSTO-EMPRESA FUNCIONÁRIOS'
      ];

      const cmoData = await fetchAllData(supabase, 'nibo_agendamentos', 'valor, categoria_nome', {
        'gte_data_competencia': startDate,
        'lte_data_competencia': endDate
      });

      const custoCMO = cmoData?.filter(item => 
        item.categoria_nome && categoriasCMO.some(cat => 
          item.categoria_nome.toLowerCase().includes(cat.toLowerCase())
        )
      ).reduce((sum, item) => sum + Math.abs(parseFloat(item.valor) || 0), 0) || 0;

      const cmoPercent = faturamentoTotal > 0 ? (custoCMO / faturamentoTotal) * 100 : 0;

      console.log(`👷 CMO: R$ ${custoCMO.toFixed(2)} (${cmoPercent.toFixed(1)}%)`);

      // =============================================
      // 8. ATUALIZAR REGISTRO NO BANCO
      // =============================================
      
      console.log('💾 Atualizando registro no banco...');

      const dadosAtualizados = {
        faturamento_total: faturamentoTotal,
        faturamento_entrada: faturamentoCouvert,
        faturamento_bar: faturamentoBar,
        faturamento_cmovivel: faturamentoCMovivel,
        clientes_atendidos: clientesAtendidos,
        ticket_medio: ticketMedio,
        cmo: cmoPercent,
        atualizado_em: new Date().toISOString(),
        // Manter valores manuais existentes
        cmv_rs: semana.cmv_rs,
        reservas_totais: semana.reservas_totais,
        reservas_presentes: semana.reservas_presentes,
        meta_semanal: semana.meta_semanal,
        observacoes: `Recalculado automaticamente em ${new Date().toLocaleString('pt-BR')}`
      };

      const { data: atualizada, error: updateError } = await supabase
        .from('desempenho_semanal')
        .update(dadosAtualizados)
        .eq('id', semana.id)
        .eq('bar_id', barId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar semana:', updateError);
        continue;
      }

      semanasAtualizadas.push(atualizada);
      console.log(`✅ Semana ${semana.numero_semana} atualizada com sucesso!`);
    }

    console.log(`\n🎉 Recálculo concluído! ${semanasAtualizadas.length} semana(s) atualizada(s).`);

    return NextResponse.json({
      success: true,
      message: `${semanasAtualizadas.length} semana(s) recalculada(s) com sucesso`,
      data: semanasAtualizadas
    });

  } catch (error) {
    console.error('❌ Erro no recálculo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
