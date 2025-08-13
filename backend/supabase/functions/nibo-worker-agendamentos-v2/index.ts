import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgendamentoMapped {
  nibo_id: string;
  tipo: string;
  status: string;
  valor: number;
  valor_pago: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  data_competencia: string | null;
  descricao: string;
  categoria_id: string | null;
  categoria_nome: string | null;
  stakeholder_id: string | null;
  stakeholder_nome: string | null;
  stakeholder_tipo: string | null;
  recorrente: boolean;
  data_atualizacao: string;
  usuario_atualizacao: string;
  centro_custo_config: Record<string, unknown>[];
  deletado: boolean;
  bar_id?: number;
}

function parseAgendamentosData(rawData: any): AgendamentoMapped | null {
  if (!rawData) return null;

  return {
    nibo_id: rawData.scheduleId,
    tipo: rawData.type === 'Debit' ? 'Despesa' : 'Receita',
    status: rawData.isPaid ? 'Pago' : (rawData.isDued ? 'Vencido' : 'Pendente'),
    valor: Math.abs(rawData.value || 0),
    valor_pago: Math.abs(rawData.paidValue || 0),
    data_vencimento: rawData.dueDate ? rawData.dueDate.split('T')[0] : null,
    data_pagamento: rawData.isPaid && rawData.accrualDate ? rawData.accrualDate.split('T')[0] : null,
    data_competencia: rawData.accrualDate ? rawData.accrualDate.split('T')[0] : null,
    descricao: rawData.description || '',
    categoria_id: rawData.category?.id || null,
    categoria_nome: rawData.category?.name || null,
    stakeholder_id: rawData.stakeholder?.id || null,
    stakeholder_nome: rawData.stakeholder?.name || null,
    stakeholder_tipo: rawData.stakeholder?.type || null,
    recorrente: rawData.hasRecurrence || false,
    data_atualizacao: rawData.updateDate || new Date().toISOString(),
    usuario_atualizacao: rawData.updateUser || 'Sistema',
    centro_custo_config: rawData.costCenters || [],
    deletado: false
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { batch_id, batch_size = 10 } = await req.json();

    if (!batch_id) {
      throw new Error('batch_id é obrigatório');
    }

    console.log(`💳 Processando batch NIBO: ${batch_id} (limite: ${batch_size})`);
    
    // Buscar apenas UM batch de agendamentos não processados
    const { data: tempAgendamentos, error: fetchError } = await supabase
      .from('nibo_temp_agendamentos')
      .select('id, bar_id, raw_data')
      .eq('batch_id', batch_id)
      .eq('processed', false)
      .order('id', { ascending: true })
      .limit(batch_size);

    if (fetchError) {
      console.error('❌ Erro ao buscar agendamentos:', fetchError);
      throw fetchError;
    }

    if (!tempAgendamentos || tempAgendamentos.length === 0) {
      console.log('✅ Nenhum agendamento pendente');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        inserted: 0,
        message: 'Nenhum agendamento pendente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📦 Processando ${tempAgendamentos.length} agendamentos`);

    let totalInserted = 0;
    let totalProcessed = 0;
    let errors = 0;

    // Processar cada agendamento
    for (const tempItem of tempAgendamentos) {
      try {
        const agendamento = parseAgendamentosData(tempItem.raw_data);
        
        if (!agendamento) {
          console.warn(`⚠️ Dados inválidos no item ${tempItem.id}`);
          continue;
        }

        // Adicionar bar_id
        agendamento.bar_id = tempItem.bar_id;

        // Inserir/atualizar agendamento
        const { error } = await supabase
          .from('nibo_agendamentos')
          .upsert(agendamento, {
            onConflict: 'nibo_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Erro ao inserir ${tempItem.id}:`, error);
          errors++;
        } else {
          totalInserted++;
          
          // Marcar como processado
          await supabase
            .from('nibo_temp_agendamentos')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString() 
            })
            .eq('id', tempItem.id);
        }

        totalProcessed++;
      } catch (error) {
        console.error(`❌ Erro no item ${tempItem.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Batch processado: ${totalProcessed} itens, ${totalInserted} inseridos, ${errors} erros`);

    return new Response(JSON.stringify({
      success: true,
      processed: totalProcessed,
      inserted: totalInserted,
      errors: errors,
      message: `Processados ${totalProcessed} de ${tempAgendamentos.length} agendamentos`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no NIBO worker:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
