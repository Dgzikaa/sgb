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
    console.log('🧪 TESTE ULTRA-RÁPIDO - Apenas 2 páginas para validar batch insert...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    const dataInicio = '2024-01-01';
    const dataFim = '2027-01-01';
    
    console.log(`📅 Período: ${dataInicio} até ${dataFim} (APENAS 2 PÁGINAS TESTE)`);

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
      teste: 'APENAS 2 PÁGINAS POR TIPO'
    };

    // TESTE: Apenas receitas, apenas 2 páginas
    console.log('💰 TESTE: Coletando apenas 2 páginas de RECEITAS...');
    await coletarTesteRapido(
      accessToken, 
      parseInt(bar_id), 
      'receitas',
      dataInicio, 
      dataFim, 
      resultado
    );

    // TESTE: Apenas despesas, apenas 2 páginas  
    console.log('💸 TESTE: Coletando apenas 2 páginas de DESPESAS...');
    await coletarTesteRapido(
      accessToken, 
      parseInt(bar_id), 
      'despesas',
      dataInicio, 
      dataFim, 
      resultado
    );

    const tempoExecucao = Date.now() - inicioExecucao;

    console.log('🎯 TESTE ULTRA-RÁPIDO CONCLUÍDO!');

    return NextResponse.json({
      success: true,
      message: '🧪 Teste ultra-rápido concluído com batch insert!',
      periodo: { inicio: dataInicio, fim: dataFim },
      resultado,
      tempo_execucao_ms: tempoExecucao,
      proximos_passos: [
        '✅ Se funcionou sem timeout, o batch insert resolveu!',
        '🔄 Agora pode usar a coleta RAW completa',
        '📊 Verificar dados na tabela contaazul_raw_parcelas'
      ]
    });

  } catch (error) {
    console.error('❌ Erro no teste ultra-rápido:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro no teste ultra-rápido',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// TESTE: Coletar apenas 2 páginas por tipo  
async function coletarTesteRapido(
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
  
  const tamanhoPagina = 200;
  const maxPaginas = 2; // APENAS 2 PÁGINAS PARA TESTE

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    try {
      console.log(`📄 ${tipo} TESTE - Página ${pagina}/${maxPaginas} (${tamanhoPagina} por página)...`);
      
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
        console.log(`📭 Página ${pagina} vazia, parando teste`);
        break;
      }

      resultado[tipo].total += parcelas.length;
      resultado[tipo].paginas = pagina;
      console.log(`📋 ${parcelas.length} ${tipo} coletadas na página ${pagina}`);

      // BATCH INSERT OTIMIZADO
      const parcelasParaInserir = parcelas.map((parcela: any) => ({
        bar_id: barId,
        parcela_id: parcela.id,
        tipo: tipoMaiusculo,
        raw_data: parcela,
        processado: false,
        coletado_em: new Date().toISOString()
      }));

      console.log(`💾 Inserindo lote de ${parcelasParaInserir.length} ${tipo}...`);

      const { error: insertError } = await supabase
        .from('contaazul_raw_parcelas')
        .upsert(parcelasParaInserir, {
          onConflict: 'bar_id,parcela_id'
        });

      if (insertError) {
        console.error(`❌ Erro ao inserir lote de ${tipo}:`, insertError);
      } else {
        console.log(`✅ Lote de ${parcelas.length} ${tipo} inserido com sucesso`);
      }

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipo}:`, error);
      break;
    }
  }
} 