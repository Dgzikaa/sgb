import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ClienteAgregado {
  telefone: string;
  nome: string;
  total_visitas: number;
  ultima_visita: string;
  total_gasto: number;
  total_entrada: number;
  total_consumo: number;
  tempo_medio_minutos: number;
  total_visitas_com_tempo: number;
  tempos_detalhados: number[];
}

// Lista de DDDs válidos para normalização
const DDDS_VALIDOS = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

function normalizarTelefone(rawFone: string): string | null {
  const fone = (rawFone || '').toString().replace(/\D/g, '');
  if (!fone) return null;
  
  // Se tem 10 dígitos e DDD válido, adiciona 9
  if (fone.length === 10 && DDDS_VALIDOS.includes(fone.substring(0, 2))) {
    return fone.substring(0, 2) + '9' + fone.substring(2);
  }
  
  return fone.length >= 10 ? fone : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pegar bar_id do body ou processar todos
    let barIds: number[] = [];
    try {
      const body = await req.json();
      if (body.bar_id) {
        barIds = [body.bar_id];
      }
    } catch {
      // Se não tem body, processa todos os bars
    }

    // Se não especificou bar_id, busca todos os bars
    if (barIds.length === 0) {
      const { data: bars } = await supabase
        .from('bars')
        .select('id')
        .eq('ativo', true);
      barIds = bars?.map(b => b.id) || [];
    }

    console.log(`🚀 Iniciando sync para ${barIds.length} bar(s): ${barIds.join(', ')}`);

    const resultados: { bar_id: number; clientes: number; tempo_ms: number }[] = [];

    for (const barId of barIds) {
      const startTime = Date.now();
      console.log(`\n📊 Processando bar_id: ${barId}`);

      // Mapa para agregar dados por telefone
      const clientesMap = new Map<string, ClienteAgregado>();

      // ========== FASE 1: Buscar dados de contahub_periodo (visitas e financeiro) ==========
      console.log('📥 Fase 1: Buscando dados de visitas...');
      
      const PAGE_SIZE = 1000;
      let offset = 0;
      let totalRegistrosPeriodo = 0;

      while (true) {
        const { data: periodo, error: errPeriodo } = await supabase
          .from('contahub_periodo')
          .select('cli_fone, cli_nome, dt_gerencial, vr_couvert, vr_pagamentos')
          .eq('bar_id', barId)
          .not('cli_fone', 'is', null)
          .neq('cli_fone', '')
          .range(offset, offset + PAGE_SIZE - 1);

        if (errPeriodo) {
          console.error('Erro ao buscar período:', errPeriodo);
          break;
        }

        if (!periodo || periodo.length === 0) break;

        for (const r of periodo) {
          const telefone = normalizarTelefone(r.cli_fone);
          if (!telefone) continue;

          const vrCouvert = parseFloat(r.vr_couvert || '0') || 0;
          const vrPagamentos = parseFloat(r.vr_pagamentos || '0') || 0;
          const vrConsumo = vrPagamentos - vrCouvert;

          const existing = clientesMap.get(telefone);
          if (!existing) {
            clientesMap.set(telefone, {
              telefone,
              nome: r.cli_nome || 'Sem nome',
              total_visitas: 1,
              ultima_visita: r.dt_gerencial,
              total_gasto: vrPagamentos,
              total_entrada: vrCouvert,
              total_consumo: vrConsumo,
              tempo_medio_minutos: 0,
              total_visitas_com_tempo: 0,
              tempos_detalhados: []
            });
          } else {
            existing.total_visitas++;
            existing.total_gasto += vrPagamentos;
            existing.total_entrada += vrCouvert;
            existing.total_consumo += vrConsumo;
            if (r.dt_gerencial > existing.ultima_visita) {
              existing.ultima_visita = r.dt_gerencial;
            }
            // Usar nome mais completo
            if (r.cli_nome && r.cli_nome.length > existing.nome.length) {
              existing.nome = r.cli_nome;
            }
          }
          totalRegistrosPeriodo++;
        }

        if (periodo.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      console.log(`✅ Fase 1 completa: ${totalRegistrosPeriodo} registros, ${clientesMap.size} clientes únicos`);

      // ========== FASE 2: Buscar tempos de estadia de contahub_vendas ==========
      console.log('📥 Fase 2: Buscando tempos de estadia...');
      
      const temposPorTelefone = new Map<string, number[]>();
      offset = 0;
      let totalRegistrosVendas = 0;

      while (true) {
        const { data: vendas, error: errVendas } = await supabase
          .from('contahub_vendas')
          .select('cli_fone, tempo_estadia_minutos')
          .eq('bar_id', barId)
          .not('cli_fone', 'is', null)
          .neq('cli_fone', '')
          .gt('tempo_estadia_minutos', 0)
          .lt('tempo_estadia_minutos', 720)
          .range(offset, offset + PAGE_SIZE - 1);

        if (errVendas) {
          console.error('Erro ao buscar vendas:', errVendas);
          break;
        }

        if (!vendas || vendas.length === 0) break;

        for (const v of vendas) {
          const telefone = normalizarTelefone(v.cli_fone);
          if (!telefone) continue;

          if (!temposPorTelefone.has(telefone)) {
            temposPorTelefone.set(telefone, []);
          }
          temposPorTelefone.get(telefone)!.push(Math.round(v.tempo_estadia_minutos));
          totalRegistrosVendas++;
        }

        if (vendas.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      console.log(`✅ Fase 2 completa: ${totalRegistrosVendas} registros de tempo para ${temposPorTelefone.size} telefones`);

      // ========== FASE 3: Mesclar tempos com clientes ==========
      console.log('🔄 Fase 3: Mesclando dados...');
      
      let clientesComTempo = 0;
      for (const [telefone, cliente] of clientesMap.entries()) {
        const tempos = temposPorTelefone.get(telefone);
        if (tempos && tempos.length > 0) {
          cliente.tempos_detalhados = tempos;
          cliente.total_visitas_com_tempo = tempos.length;
          cliente.tempo_medio_minutos = tempos.reduce((a, b) => a + b, 0) / tempos.length;
          clientesComTempo++;
        }
      }

      console.log(`✅ Fase 3 completa: ${clientesComTempo} clientes com tempo de estadia`);

      // ========== FASE 4: Inserir/Atualizar no banco ==========
      console.log('💾 Fase 4: Salvando no banco...');
      
      const clientes = Array.from(clientesMap.values());
      const BATCH_SIZE = 500;
      let totalInseridos = 0;

      for (let i = 0; i < clientes.length; i += BATCH_SIZE) {
        const batch = clientes.slice(i, i + BATCH_SIZE).map(c => ({
          bar_id: barId,
          telefone: c.telefone,
          nome: c.nome,
          total_visitas: c.total_visitas,
          ultima_visita: c.ultima_visita,
          total_gasto: c.total_gasto,
          total_entrada: c.total_entrada,
          total_consumo: c.total_consumo,
          ticket_medio: c.total_visitas > 0 ? c.total_gasto / c.total_visitas : 0,
          ticket_medio_entrada: c.total_visitas > 0 ? c.total_entrada / c.total_visitas : 0,
          ticket_medio_consumo: c.total_visitas > 0 ? c.total_consumo / c.total_visitas : 0,
          tempo_medio_minutos: c.tempo_medio_minutos,
          total_visitas_com_tempo: c.total_visitas_com_tempo,
          tempos_detalhados: c.tempos_detalhados,
          updated_at: new Date().toISOString()
        }));

        const { error: upsertError } = await supabase
          .from('cliente_estatisticas')
          .upsert(batch, { 
            onConflict: 'bar_id,telefone',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`Erro no batch ${i}-${i + BATCH_SIZE}:`, upsertError);
        } else {
          totalInseridos += batch.length;
        }
      }

      const tempoMs = Date.now() - startTime;
      console.log(`✅ Bar ${barId} completo: ${totalInseridos} clientes salvos em ${tempoMs}ms`);
      
      resultados.push({
        bar_id: barId,
        clientes: totalInseridos,
        tempo_ms: tempoMs
      });
    }

    const totalClientes = resultados.reduce((sum, r) => sum + r.clientes, 0);
    const tempoTotal = resultados.reduce((sum, r) => sum + r.tempo_ms, 0);

    console.log(`\n🎉 SYNC COMPLETO: ${totalClientes} clientes em ${tempoTotal}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completo para ${barIds.length} bar(s)`,
        resultados,
        total_clientes: totalClientes,
        tempo_total_ms: tempoTotal
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

