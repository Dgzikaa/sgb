import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando PROCESSAMENTO dos dados coletados...');
    
    const { bar_id, tipo_dados } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    let totalProcessados = 0;
    let totalErros = 0;

    try {
      if (!tipo_dados || tipo_dados === 'receitas') {
        console.log('💰 Processando receitas...');
        const receitasResult = await processarDadosTipo(parseInt(bar_id), 'receitas');
        totalProcessados += receitasResult.processados;
        totalErros += receitasResult.erros;
      }

      if (!tipo_dados || tipo_dados === 'despesas') {
        console.log('💸 Processando despesas...');
        const despesasResult = await processarDadosTipo(parseInt(bar_id), 'despesas');
        totalProcessados += despesasResult.processados;
        totalErros += despesasResult.erros;
      }

      if (!tipo_dados || tipo_dados === 'categorias') {
        console.log('📋 Processando categorias...');
        const categoriasResult = await processarDadosTipo(parseInt(bar_id), 'categorias');
        totalProcessados += categoriasResult.processados;
        totalErros += categoriasResult.erros;
      }

      if (!tipo_dados || tipo_dados === 'contas') {
        console.log('🏦 Processando contas financeiras...');
        const contasResult = await processarDadosTipo(parseInt(bar_id), 'contas');
        totalProcessados += contasResult.processados;
        totalErros += contasResult.erros;
      }

      console.log(`✅ Processamento concluído! ${totalProcessados} registros processados, ${totalErros} erros`);

      return NextResponse.json({
        success: true,
        message: 'Processamento dos dados concluído com sucesso',
        detalhes: {
          total_processados: totalProcessados,
          total_erros: totalErros
        }
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro no processamento de dados:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro no processamento de dados',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Função para processar dados por tipo
async function processarDadosTipo(barId: number, tipoDados: string) {
  let processados = 0;
  let erros = 0;

  console.log(`🔄 Processando ${tipoDados} para bar ${barId}...`);

  try {
    // Buscar dados brutos não processados
    const { data: dadosBrutos } = await supabase
      .from('contaazul_raw_data')
      .select('*')
      .eq('bar_id', barId)
      .eq('tipo_dados', tipoDados)
      .eq('processado', false)
      .order('pagina');

    if (!dadosBrutos || dadosBrutos.length === 0) {
      console.log(`⚠️ Nenhum dado bruto não processado encontrado para ${tipoDados}`);
      return { processados: 0, erros: 0 };
    }

    console.log(`📊 Encontrados ${dadosBrutos.length} lotes de ${tipoDados} para processar`);

    for (const lote of dadosBrutos) {
      try {
        let registrosProcessados = 0;

        if (tipoDados === 'receitas' || tipoDados === 'despesas') {
          // Processar receitas/despesas
          const itens = lote.dados_brutos.itens || [];
          const tipo = tipoDados === 'receitas' ? 'RECEITA' : 'DESPESA';
          
          if (itens.length > 0) {
            await processarRegistrosFinanceirosBatch(itens, tipo, barId);
            registrosProcessados = itens.length;
          }
        } 
        else if (tipoDados === 'categorias') {
          // Processar categorias
          const categorias = Array.isArray(lote.dados_brutos) 
            ? lote.dados_brutos 
            : (lote.dados_brutos.itens || [lote.dados_brutos]);
          
          if (categorias.length > 0) {
            await processarCategoriasBatch(categorias, barId);
            registrosProcessados = categorias.length;
          }
        }
        else if (tipoDados === 'contas') {
          // Processar contas financeiras
          const contas = Array.isArray(lote.dados_brutos) 
            ? lote.dados_brutos 
            : (lote.dados_brutos.itens || [lote.dados_brutos]);
          
          if (contas.length > 0) {
            await processarContasBatch(contas, barId);
            registrosProcessados = contas.length;
          }
        }

        // Marcar como processado
        await supabase
          .from('contaazul_raw_data')
          .update({
            processado: true,
            processado_em: new Date().toISOString()
          })
          .eq('id', lote.id);

        processados += registrosProcessados;
        console.log(`✅ Lote ${lote.pagina || 1} de ${tipoDados}: ${registrosProcessados} registros processados`);

      } catch (error) {
        erros++;
        console.error(`❌ Erro ao processar lote ${lote.id}:`, error);
        
        // Marcar erro no processamento
        await supabase
          .from('contaazul_raw_data')
          .update({
            erro_processamento: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', lote.id);
      }
    }

  } catch (error) {
    console.error(`❌ Erro geral no processamento de ${tipoDados}:`, error);
    erros++;
  }

  return { processados, erros };
}

// Função para processar registros financeiros em lote
async function processarRegistrosFinanceirosBatch(registros: any[], tipo: 'RECEITA' | 'DESPESA', barId: number) {
  const dadosFinanceiros = registros.map(registro => ({
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
  }));

  await supabase
    .from('contaazul_financeiro')
    .upsert(dadosFinanceiros, {
      onConflict: 'bar_id,conta_id'
    });
}

// Função para processar categorias em lote
async function processarCategoriasBatch(categorias: any[], barId: number) {
  const dadosCategorias = categorias.map(categoria => ({
    bar_id: barId,
    categoria_id: categoria.id,
    nome: categoria.name,
    tipo: categoria.nature || 'GERAL',
    ativa: categoria.status === 'ACTIVE',
    dados_originais: categoria,
    ultima_sincronizacao: new Date().toISOString()
  }));

  await supabase
    .from('contaazul_categorias')
    .upsert(dadosCategorias, {
      onConflict: 'bar_id,categoria_id'
    });
}

// Função para processar contas financeiras em lote
async function processarContasBatch(contas: any[], barId: number) {
  const dadosContas = contas.map(conta => ({
    bar_id: barId,
    conta_id: conta.id,
    nome: conta.name,
    tipo: conta.type || 'GERAL',
    ativa: conta.status === 'ACTIVE',
    saldo_atual: conta.balance || 0,
    dados_originais: conta,
    ultima_sincronizacao: new Date().toISOString()
  }));

  await supabase
    .from('contaazul_contas_financeiras')
    .upsert(dadosContas, {
      onConflict: 'bar_id,conta_id'
    });
} 