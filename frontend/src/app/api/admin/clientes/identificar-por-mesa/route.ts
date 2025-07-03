import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

interface MesaPattern {
  vd: string;
  mesa: string;
  data: string;
  pessoas: number;
  valor_gasto: number;
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { bar_id = 1, data_inicio, data_fim } = await request.json();

    console.log('🔍 IDENTIFICANDO CLIENTES POR MESA');
    console.log(`📅 Período: ${data_inicio} → ${data_fim}`);

    // 1. Buscar dados de período agrupados por mesa
    const { data: periodoData, error: periodoError } = await supabase
      .from('periodo')
      .select('vd, vd_mesadesc, dt_gerencial, pessoas, vr_pagamentos, vr_couvert')
      .eq('bar_id', bar_id)
      .gte('dt_gerencial', data_inicio)
      .lte('dt_gerencial', data_fim)
      .gt('vr_pagamentos', 0) // Excluir cortesias
      .order('dt_gerencial, vd');

    if (periodoError) {
      throw new Error(`Erro ao buscar período: ${periodoError.message}`);
    }

    if (!periodoData || periodoData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado encontrado para o período',
        clientes_identificados: 0,
        visitas_processadas: 0
      });
    }

    console.log(`📊 ${periodoData.length} registros encontrados`);

    // 2. Agrupar por padrão de mesa para identificar clientes únicos
    const mesaPatterns = new Map<string, {
      primeiro_uso: string;
      ultimo_uso: string;
      total_visitas: number;
      total_pessoas: number;
      valor_total: number;
      vendas: string[];
    }>();

    periodoData.forEach((registro: any) => {
      const mesaKey = registro.vd_mesadesc || `Mesa-${registro.vd}`;
      const valor_total = parseFloat(registro.vr_pagamentos || '0') + parseFloat(registro.vr_couvert || '0');
      
      if (!mesaPatterns.has(mesaKey)) {
        mesaPatterns.set(mesaKey, {
          primeiro_uso: registro.dt_gerencial,
          ultimo_uso: registro.dt_gerencial,
          total_visitas: 0,
          total_pessoas: 0,
          valor_total: 0,
          vendas: []
        });
      }

      const pattern = mesaPatterns.get(mesaKey)!;
      pattern.ultimo_uso = registro.dt_gerencial;
      pattern.total_visitas++;
      pattern.total_pessoas += parseInt(registro.pessoas || '0');
      pattern.valor_total += valor_total;
      pattern.vendas.push(registro.vd);
    });

    console.log(`🎯 ${mesaPatterns.size} padrões de mesa identificados`);

    // 3. Registrar clientes baseado nos padrões de mesa
    let clientesRegistrados = 0;
    let visitasRegistradas = 0;

    for (const [mesaPattern, dados] of mesaPatterns) {
      // Gerar ID único do cliente baseado no padrão da mesa
      const clienteId = `MESA_${mesaPattern.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      
      // Verificar se cliente já existe
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('bar_id', bar_id)
        .eq('cpf', clienteId)
        .single();

      let clienteIdFinal: number;

      if (!clienteExistente) {
        // Criar novo cliente
        const { data: novoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            bar_id: bar_id,
            cpf: clienteId,
            nome: `Cliente ${mesaPattern}`,
            data_primeiro_visit: dados.primeiro_uso,
            data_ultimo_visit: dados.ultimo_uso,
            total_visitas: dados.total_visitas,
            valor_total_gasto: dados.valor_total,
            valor_medio_ticket: dados.valor_total / dados.total_visitas,
            tipo_cliente: dados.total_visitas > 1 ? 'recorrente' : 'novo',
            origem_cadastro: 'identificacao_mesa'
          })
          .select('id')
          .single();

        if (clienteError) {
          console.error(`❌ Erro ao criar cliente ${clienteId}:`, clienteError);
          continue;
        }

        clienteIdFinal = novoCliente.id;
        clientesRegistrados++;
      } else {
        // Atualizar cliente existente
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            data_ultimo_visit: dados.ultimo_uso,
            total_visitas: dados.total_visitas,
            valor_total_gasto: dados.valor_total,
            valor_medio_ticket: dados.valor_total / dados.total_visitas,
            tipo_cliente: dados.total_visitas > 1 ? 'recorrente' : 'novo'
          })
          .eq('id', clienteExistente.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar cliente ${clienteId}:`, updateError);
          continue;
        }

        clienteIdFinal = clienteExistente.id;
      }

      // Registrar visitas individuais
      for (const vd of dados.vendas) {
        const registroVisita = periodoData.find((p: any) => p.vd === vd);
        if (!registroVisita) continue;

        const { error: visitaError } = await supabase
          .from('cliente_visitas')
          .upsert({
            cliente_id: clienteIdFinal,
            bar_id: bar_id,
            data_visita: registroVisita.dt_gerencial,
            vd: parseInt(vd),
            valor_gasto: parseFloat(registroVisita.vr_pagamentos || '0') + parseFloat(registroVisita.vr_couvert || '0'),
            pessoas_na_mesa: parseInt(registroVisita.pessoas || '0'),
            tipo_visita: 'regular'
          }, {
            onConflict: 'cliente_id,data_visita,vd'
          });

        if (!visitaError) {
          visitasRegistradas++;
        }
      }
    }

    console.log(`✅ Processamento concluído:`);
    console.log(`   👥 ${clientesRegistrados} clientes registrados`);
    console.log(`   📊 ${visitasRegistradas} visitas registradas`);

    return NextResponse.json({
      success: true,
      message: 'Identificação por mesa concluída',
      clientes_identificados: clientesRegistrados,
      visitas_processadas: visitasRegistradas,
      periodo_processado: `${data_inicio} → ${data_fim}`,
      padroes_mesa_encontrados: mesaPatterns.size,
      detalhes: Array.from(mesaPatterns.entries()).map(([mesa, dados]) => ({
        mesa,
        total_visitas: dados.total_visitas,
        valor_total: dados.valor_total,
        periodo: `${dados.primeiro_uso} → ${dados.ultimo_uso}`
      }))
    });

  } catch (error: any) {
    console.error('💥 Erro na identificação por mesa:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
