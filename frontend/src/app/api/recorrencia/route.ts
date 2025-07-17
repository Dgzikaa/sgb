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

// FunÃ¡Â§Ã¡Â£o para normalizar telefone
function normalizarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  let numeros = telefone.replace(/\D/g, '');
  
  // Remover cÃ¡Â³digo do paÃ¡Â­s (55)
  if (numeros.startsWith('55') && numeros.length > 11) {
    numeros = numeros.substring(2);
  }
  
  // Remover cÃ¡Â³digos de Ã¡Â¡rea duplicados (5511, 5561)
  if (numeros.startsWith('55') && numeros.length === 13) {
    numeros = numeros.substring(2);
  }
  
  return numeros;
}

// FunÃ¡Â§Ã¡Â£o para formatar telefone
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

// Tipos auxiliares para dados de periodo e reserva
interface PeriodoData {
  cli_nome: string;
  cli_telefone: string;
  dt_gerencial: string;
  vr_pagamentos: string | number;
  pessoas: number;
}

interface ReservaData {
  name: string;
  mobile: string;
  email: string;
  date: string;
  people: number;
  status: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = (page - 1) * limit;

    console.log(`Ã°Å¸â€œÅ  Recebendo requisiÃ¡Â§Ã¡Â£o - PÃ¡Â¡gina ${page}, Limite ${limit}, Offset ${offset}`);

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('ÂÅ’ Erro ao conectar com banco');
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    console.log(`Ã°Å¸â€œÅ  Buscando dados de recorrÃ¡Âªncia (APENAS COM TELEFONE) - PÃ¡Â¡gina ${page}, Limite ${limit}...`);
    
    // Processar dados para ranking
    const clientesMap = new Map();
    let totalContahub = 0, totalYuzer = 0, totalSympla = 0;
    let hasMoreContahub = false, hasMoreYuzer = false, hasMoreSympla = false;

    // 1. Buscar dados do ContaHub da tabela PERIODO (valores reais)
    let contahub_data = null;
    let contahub_count = 0;
    
    try {
      console.log(`Ã°Å¸â€Â Buscando ContaHub PERIODO (valores reais) - offset: ${offset}, limit: ${limit}`);
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
        console.error('ÂÅ’ Erro ContaHub:', contahubResult.error);
      } else {
        contahub_data = contahubResult.data;
        contahub_count = contahubResult.count || 0;
        totalContahub = contahub_data?.length || 0;
        hasMoreContahub = contahub_count > offset + limit;
        
        console.log(`Ã°Å¸â€œÅ  ContaHub PERIODO: ${totalContahub} registros, total: ${contahub_count}, hasMore: ${hasMoreContahub}`);

        // Processar dados do ContaHub PERIODO (valores reais)
        (contahub_data as PeriodoData[])?.forEach((periodo: PeriodoData) => {
          const telefone = periodo.cli_telefone;
          
          if (telefone) {
            const telefoneNormalizado = normalizarTelefone(telefone);
            
            // SÃ¡Â³ processar se o telefone normalizado for vÃ¡Â¡lido
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
              clienteData.valor_total_gasto += parseFloat(String(periodo.vr_pagamentos || 0));
            }
          }
        });
      }
    } catch (error) {
      console.error('ÂÅ’ Erro ao buscar ContaHub PERIODO:', error);
    }

    // 2. Buscar dados do Yuzer APENAS com telefone
    let yuzer_data = null;
    let yuzer_count = 0;
    
    try {
      console.log(`Ã°Å¸â€Â Buscando Yuzer (apenas com telefone) - offset: ${offset}, limit: ${limit}`);
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
        console.error('ÂÅ’ Erro Yuzer:', yuzerResult.error);
      } else {
        yuzer_data = yuzerResult.data;
        yuzer_count = yuzerResult.count || 0;
        totalYuzer = yuzer_data?.length || 0;
        hasMoreYuzer = yuzer_count > offset + limit;
        
        console.log(`Ã°Å¸â€œÅ  Yuzer: ${totalYuzer} registros, total: ${yuzer_count}, hasMore: ${hasMoreYuzer}`);

        // Processar dados do Yuzer (apenas com telefone)
        (yuzer_data as ReservaData[])?.forEach((reserva: ReservaData) => {
          const telefone = reserva.mobile;
          
          if (telefone) {
            const telefoneNormalizado = normalizarTelefone(telefone);
            
            // SÃ¡Â³ processar se o telefone normalizado for vÃ¡Â¡lido
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
              
              // Yuzer: NÃ¡Â£o temos dados de valor real, apenas contamos as visitas
              // O valor fica 0 para nÃ¡Â£o distorcer os cÃ¡Â¡lculos
            }
          }
        });
      }
    } catch (error) {
      console.error('ÂÅ’ Erro ao buscar Yuzer:', error);
    }

    // 3. Pular dados do Sympla pois nÃ¡Â£o tÃ¡Âªm telefone
    console.log(`Å¡Â Ã¯Â¸Â Pulando Sympla - eventos nÃ¡Â£o tÃ¡Âªm telefone dos clientes`);

    // Converter Map para Array e calcular ticket mÃ¡Â©dio (todos jÃ¡Â¡ tÃ¡Âªm telefone)
    const clientes: ClienteRanking[] = Array.from(clientesMap.values()).map((cliente) => ({
      ...cliente,
      ticket_medio: cliente.total_visitas > 0 ? cliente.valor_total_gasto / cliente.total_visitas : 0
    }));

    // Criar rankings (todos jÃ¡Â¡ tÃ¡Âªm telefone)
    const top_visitas: ClienteRanking[] = [...clientes]
      .sort((a, b) => b.total_visitas - a.total_visitas)
      .slice(0, 10);

    const top_ticket: ClienteRanking[] = [...clientes]
      .filter((c) => c.ticket_medio > 0)
      .sort((a, b) => b.ticket_medio - a.ticket_medio)
      .slice(0, 10);

    const top_faturamento: ClienteRanking[] = [...clientes]
      .sort((a, b) => b.valor_total_gasto - a.valor_total_gasto)
      .slice(0, 10);

    console.log(`Ã°Å¸â€œÅ  Dados processados (APENAS COM TELEFONE) - PÃ¡Â¡gina ${page}:`, {
      total_clientes: clientes.length,
      telefones_processados: clientes.length, // Todos tÃ¡Âªm telefone
      contahub: totalContahub,
      yuzer: totalYuzer,
      sympla: 0 // NÃ¡Â£o incluÃ¡Â­mos Sympla
    });

    return NextResponse.json({
      status: 'success',
      page,
      limit,
      total_clientes: clientes.length,
      telefones_processados: clientes.length, // Todos tÃ¡Âªm telefone
      top_visitas,
      top_ticket,
      top_faturamento,
      fontes: {
        contahub: totalContahub,
        yuzer: totalYuzer,
        sympla: 0 // NÃ¡Â£o incluÃ¡Â­mos Sympla
      },
      totais: {
        contahub_total: contahub_count,
        yuzer_total: yuzer_count,
        sympla_total: 0 // NÃ¡Â£o incluÃ¡Â­mos Sympla
      },
      has_more: {
        contahub: hasMoreContahub,
        yuzer: hasMoreYuzer,
        sympla: false // NÃ¡Â£o incluÃ¡Â­mos Sympla
      }
    });

  } catch (error) {
    console.error('ÂÅ’ Erro no endpoint de recorrÃ¡Âªncia:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 

