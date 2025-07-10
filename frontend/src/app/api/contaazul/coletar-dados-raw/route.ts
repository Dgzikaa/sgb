import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('⚡ Iniciando COLETA RÁPIDA RAW - Sem processamento detalhado...');
    
    const { bar_id, data_inicio, data_fim } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const dataInicio = data_inicio || '2024-01-01';
    const dataFim = data_fim || '2027-01-01';
    
    console.log(`📅 Período: ${dataInicio} até ${dataFim}`);

    // Obter token válido
    const accessToken = await getValidContaAzulToken(parseInt(bar_id));
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Token do ContaAzul não disponível' },
        { status: 400 }
      );
    }

    console.log('✅ Token válido obtido para bar_id:', bar_id);

    const inicioExecucao = Date.now();
    let resultado = {
      receitas: { total: 0, paginas: 0 },
      despesas: { total: 0, paginas: 0 },
      dados_auxiliares: { categorias: 0, centros_custo: 0, contas: 0 }
    };

    // FASE 1: Coletar dados auxiliares (rápido)
    console.log('📥 FASE 1: Coletando dados auxiliares...');
    await coletarDadosAuxiliares(accessToken, parseInt(bar_id), resultado);

    // FASE 2: Coletar RECEITAS RAW (rápido - sem detalhes)
    console.log('💰 FASE 2: Coletando RECEITAS RAW...');
    await coletarFinanceiroRaw(
      accessToken, 
      parseInt(bar_id), 
      'receitas',
      dataInicio, 
      dataFim, 
      resultado
    );

    // FASE 3: Coletar DESPESAS RAW (rápido - sem detalhes)
    console.log('💸 FASE 3: Coletando DESPESAS RAW...');
    await coletarFinanceiroRaw(
      accessToken, 
      parseInt(bar_id), 
      'despesas',
      dataInicio, 
      dataFim, 
      resultado
    );

    const tempoExecucao = Date.now() - inicioExecucao;

    console.log('🎯 COLETA RAW CONCLUÍDA!');

    return NextResponse.json({
      success: true,
      message: '⚡ Coleta rápida RAW concluída com sucesso!',
      periodo: { inicio: dataInicio, fim: dataFim },
      resultado,
      tempo_execucao_ms: tempoExecucao,
      proximos_passos: [
        '🔄 Executar processamento detalhado em background',
        '📊 Verificar dados na tabela contaazul_raw_parcelas',
        '⚙️ Configurar Edge Function para processar dados'
      ]
    });

  } catch (error) {
    console.error('❌ Erro na coleta RAW:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta RAW',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// FASE 1: Coletar dados auxiliares
async function coletarDadosAuxiliares(accessToken: string, barId: number, resultado: any) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Categorias
    console.log('🏷️ Coletando categorias...');
    const categoriasResponse = await fetch('https://api-v2.contaazul.com/v1/categorias?pagina=1&tamanho_pagina=100&permite_apenas_filhos=false', { headers });
    
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json();
      const categorias = categoriasData.itens || [];
      
      for (const categoria of categorias) {
        await supabase
          .from('contaazul_categorias')
          .upsert({
            id: categoria.id,
            bar_id: barId,
            nome: categoria.nome,
            tipo: categoria.tipo,
            codigo: categoria.codigo,
            permite_filhos: categoria.permite_filhos,
            categoria_pai_id: categoria.categoria_pai?.id,
            entrada_dre: categoria.entrada_dre,
            ativo: true
          });
      }
      
      resultado.dados_auxiliares.categorias = categorias.length;
      console.log(`✅ ${categorias.length} categorias coletadas`);
    }

    // Centros de custo
    console.log('🎯 Coletando centros de custo...');
    const centrosResponse = await fetch('https://api-v2.contaazul.com/v1/centro-de-custo?pagina=1&tamanho_pagina=100', { headers });
    
    if (centrosResponse.ok) {
      const centrosData = await centrosResponse.json();
      const centros = centrosData.itens || [];
      
      for (const centro of centros) {
        await supabase
          .from('contaazul_centros_custo')
          .upsert({
            id: centro.id,
            bar_id: barId,
            nome: centro.nome,
            codigo: centro.codigo,
            ativo: centro.ativo !== false
          });
      }
      
      resultado.dados_auxiliares.centros_custo = centros.length;
      console.log(`✅ ${centros.length} centros de custo coletados`);
    }

    // Contas financeiras
    console.log('🏦 Coletando contas financeiras...');
    const contasResponse = await fetch('https://api-v2.contaazul.com/v1/conta-financeira?pagina=1&tamanho_pagina=100', { headers });
    
    if (contasResponse.ok) {
      const contasData = await contasResponse.json();
      const contas = contasData.itens || [];
      
      for (const conta of contas) {
        await supabase
          .from('contaazul_contas_financeiras')
          .upsert({
            id: conta.id,
            bar_id: barId,
            nome: conta.nome,
            tipo: conta.tipo,
            banco_numero: conta.banco?.numero,
            agencia: conta.agencia,
            conta: conta.conta,
            saldo_inicial: conta.saldo_inicial || 0,
            ativo: conta.ativo !== false
          });
      }
      
      resultado.dados_auxiliares.contas = contas.length;
      console.log(`✅ ${contas.length} contas financeiras coletadas`);
    }

  } catch (error) {
    console.error('❌ Erro ao coletar dados auxiliares:', error);
  }
}

// FASE 2/3: Coletar financeiro RAW (RÁPIDO - sem detalhes)
async function coletarFinanceiroRaw(
  accessToken: string, 
  barId: number, 
  tipo: 'receitas' | 'despesas',
  dataInicio: string,
  dataFim: string,
  resultado: any
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const endpoint = tipo === 'receitas' 
    ? 'contas-a-receber/buscar'
    : 'contas-a-pagar/buscar';

  const tipoMaiusculo = tipo === 'receitas' ? 'RECEITA' : 'DESPESA';
  
  let pagina = 1;
  const tamanhoPagina = 200; // REDUZIR para 200 (vs 500) para ser mais rápido
  let continuarColetando = true;

  while (continuarColetando) {
    try {
      console.log(`📄 ${tipo} RAW - Página ${pagina} (${tamanhoPagina} por página)...`);
      
      const url = `https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/${endpoint}?` +
        `data_competencia_de=${dataInicio}&` +
        `data_competencia_ate=${dataFim}&` +
        `data_vencimento_de=${dataInicio}&` +
        `data_vencimento_ate=${dataFim}&` +
        `pagina=${pagina}&` +
        `tamanho_pagina=${tamanhoPagina}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.error(`❌ Erro API ${tipo}:`, response.status);
        break;
      }

      const data = await response.json();
      const parcelas = data.itens || data.dados || [];
      
      if (parcelas.length === 0) {
        continuarColetando = false;
        break;
      }

      resultado[tipo].total += parcelas.length;
      resultado[tipo].paginas = pagina;
      console.log(`📋 ${parcelas.length} ${tipo} coletadas na página ${pagina}`);

      // OTIMIZAÇÃO: BATCH INSERT em vez de inserts individuais
      const parcelasParaInserir = parcelas.map((item: any) => {
        // Extrair parcelas do item (cada item pode ter múltiplas parcelas)
        const parcelas_item = item.parcelas || [{ numero: 1, data_vencimento: item.data_vencimento, valor: item.valor, status: item.status }];
        
        return parcelas_item.map((parcela: any) => ({
          bar_id: barId,
          conta_receber_id: item.id.toString(),
          parcela_numero: parcela.numero || 1,
          data_vencimento: parcela.data_vencimento || item.data_vencimento || null,
          valor: parseFloat(parcela.valor || item.valor || '0'),
          status: parcela.status || item.status || '',
          dados_completos: {
            item_original: item,
            parcela_original: parcela,
            tipo: tipoMaiusculo
          },
          processado: false
        }));
      }).flat();

      console.log(`💾 Preparando ${parcelasParaInserir.length} parcelas para inserção...`);

      // BATCH INSERT: inserir todas de uma vez
      const { error: insertError } = await supabase
        .from('contaazul_raw_parcelas')
        .upsert(parcelasParaInserir, {
          onConflict: 'bar_id,conta_receber_id,parcela_numero'
        });

      if (insertError) {
        console.error(`❌ Erro ao inserir lote de ${tipo}:`, insertError);
        // Continuar mesmo com erro
      } else {
        console.log(`✅ Lote de ${parcelasParaInserir.length} ${tipo} inserido com sucesso`);
      }

      pagina++;
      
      // Pequena pausa para não sobrecarregar
      if (pagina % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error);
      continuarColetando = false;
    }
  }
} 