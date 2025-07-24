import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

interface ClienteRanking {
  nome: string;
  telefone: string;
  total_visitas: number;
  valor_total_gasto: number;
  fonte: string;
  ticket_medio: number;
}

// Função para normalizar telefone
function normalizarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  let numeros = telefone.replace(/\D/g, '');
  
  // Remover código do país (55)
  if (numeros.startsWith('55') && numeros.length > 11) {
    numeros = numeros.substring(2);
  }
  
  // Remover códigos de área duplicados (5511, 5561)
  if (numeros.startsWith('55') && numeros.length === 13) {
    numeros = numeros.substring(2);
  }
  
  return numeros;
}

// Função para formatar telefone
function formatarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  const numeros = telefone.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
  }
  
  return telefone;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = (page - 1) * limit;

    console.log(`📊 Recebendo requisição - Página ${page}, Limite ${limit}, Offset ${offset}`);

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    console.log(`📊 Buscando dados de recorrência (APENAS COM TELEFONE) - Página ${page}, Limite ${limit}...`);
    
    // Processar dados para ranking
    const clientesMap = new Map();
    let totalContahub = 0, totalYuzer = 0;
    
    let hasMoreContahub = false, hasMoreYuzer = false;

    // 1. Buscar dados do ContaHub da tabela PERIODO (valores reais)
    let contahub_data = null;
    let contahub_count = 0;
    
    try {
      console.log(`🔍 Buscando ContaHub PERIODO (valores reais) - offset: ${offset}, limit: ${limit}`);
      const contahubResult = await supabase
        .from('periodo')
        .select(`
          cli_nome,
          cli_telefone,
          dt_gerencial,
          vr_pagamentos,
          pessoas
        `, { count: 'exact' })
        .eq('bar_id', 1)
        .not('cli_telefone', 'is', null)
        .neq('cli_telefone', '')
        .gte('dt_gerencial', '2025-01-01')
        .lte('dt_gerencial', '2025-12-31')
        .range(offset, offset + limit - 1);

      if (contahubResult.error) {
        console.error('❌ Erro ContaHub:', contahubResult.error);
      } else {
        contahub_data = contahubResult.data;
        contahub_count = contahubResult.count || 0;
        totalContahub = contahub_data?.length || 0;
        hasMoreContahub = contahub_count > offset + limit;
        
        console.log(`📊 ContaHub PERIODO: ${totalContahub} registros, total: ${contahub_count}, hasMore: ${hasMoreContahub}`);

        // Processar dados do ContaHub PERIODO (valores reais)
        contahub_data?.forEach((periodo: unknown) => {
          const telefone = periodo.cli_telefone;
          
          if (telefone) {
            const telefoneNormalizado = normalizarTelefone(telefone);
            
            // Só processar se o telefone normalizado for válido
            if (telefoneNormalizado && telefoneNormalizado.length >= 10) {
              const key = telefoneNormalizado;
              
              if (!clientesMap.has(key)) {
                clientesMap.set(key, {
                  nome: periodo.cli_nome,
                  telefone: formatarTelefone(telefoneNormalizado),
                  total_visitas: 0,
                  valor_total_gasto: 0,
                  fonte: 'ContaHub'
                });
              }
              
              const clienteData = clientesMap.get(key);
              clienteData.total_visitas += 1;
              clienteData.valor_total_gasto += parseFloat(periodo.vr_pagamentos || 0);
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar ContaHub PERIODO:', error);
    }

    // 2. Buscar dados do Yuzer APENAS com telefone
    let yuzer_data = null;
    let yuzer_count = 0;
    
    try {
      console.log(`🔍 Buscando Yuzer (apenas com telefone) - offset: ${offset}, limit: ${limit}`);
      const yuzerResult = await supabase
        .from('getin_reservas')
        .select(`
          name,
          mobile,
          email,
          date,
          people,
          status
        `, { count: 'exact' })
        .not('mobile', 'is', null)
        .neq('mobile', '')
        .gte('date', '2025-01-01')
        .lte('date', '2025-12-31')
        .range(offset, offset + limit - 1);

      if (yuzerResult.error) {
        console.error('❌ Erro Yuzer:', yuzerResult.error);
      } else {
        yuzer_data = yuzerResult.data;
        yuzer_count = yuzerResult.count || 0;
        totalYuzer = yuzer_data?.length || 0;
        hasMoreYuzer = yuzer_count > offset + limit;
        
        console.log(`📊 Yuzer: ${totalYuzer} registros, total: ${yuzer_count}, hasMore: ${hasMoreYuzer}`);

        // Processar dados do Yuzer (apenas com telefone)
        yuzer_data?.forEach((reserva: unknown) => {
          const telefone = reserva.mobile;
          
          if (telefone) {
            const telefoneNormalizado = normalizarTelefone(telefone);
            
            // Só processar se o telefone normalizado for válido
            if (telefoneNormalizado && telefoneNormalizado.length >= 10) {
              const key = telefoneNormalizado;
              
              if (!clientesMap.has(key)) {
                clientesMap.set(key, {
                  nome: reserva.name,
                  telefone: formatarTelefone(telefoneNormalizado),
                  total_visitas: 0,
                  valor_total_gasto: 0,
                  fonte: 'Yuzer'
                });
              }
              
              const clienteData = clientesMap.get(key);
              clienteData.total_visitas += 1;
              
              // Yuzer: Não temos dados de valor real, apenas contamos as visitas
              // O valor fica 0 para não distorcer os cálculos
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar Yuzer:', error);
    }

    // 3. Pular dados do Sympla pois não têm telefone
    console.log(`⚠️ Pulando Sympla - eventos não têm telefone dos clientes`);

    // Converter Map para Array e calcular ticket médio (todos já têm telefone)
    const clientes: ClienteRanking[] = Array.from(clientesMap.values()).map(cliente => ({
      ...cliente,
      ticket_medio: cliente.total_visitas > 0 ? cliente.valor_total_gasto / cliente.total_visitas : 0
    }));

    // Criar rankings (todos já têm telefone)
    const top_visitas: ClienteRanking[] = [...clientes]
      .sort((a, b) => b.total_visitas - a.total_visitas)
      .slice(0, 10);

    const top_ticket: ClienteRanking[] = [...clientes]
      .filter(c => c.ticket_medio > 0)
      .sort((a, b) => b.ticket_medio - a.ticket_medio)
      .slice(0, 10);

    const top_faturamento: ClienteRanking[] = [...clientes]
      .sort((a, b) => b.valor_total_gasto - a.valor_total_gasto)
      .slice(0, 10);

    console.log(`📊 Dados processados (APENAS COM TELEFONE) - Página ${page}:`, {
      total_clientes: clientes.length,
      telefones_processados: clientes.length, // Todos têm telefone
      contahub: totalContahub,
      yuzer: totalYuzer,
      sympla: 0 // Não incluímos Sympla
    });

    return NextResponse.json({
      status: 'success',
      page,
      limit,
      total_clientes: clientes.length,
      telefones_processados: clientes.length, // Todos têm telefone
      top_visitas,
      top_ticket,
      top_faturamento,
      fontes: {
        contahub: totalContahub,
        yuzer: totalYuzer,
        sympla: 0 // Não incluímos Sympla
      },
      totais: {
        contahub_total: contahub_count,
        yuzer_total: yuzer_count,
        sympla_total: 0 // Não incluímos Sympla
      },
      has_more: {
        contahub: hasMoreContahub,
        yuzer: hasMoreYuzer,
        sympla: false // Não incluímos Sympla
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de recorrência:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 
