import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface NiboAgendamento {
  scheduleId: string;
  type: 'Debit' | 'Credit';
  value: number;
  isBill: boolean;
  isDued: boolean;
  isPaid: boolean;
  dueDate: string;
  accrualDate: string;
  scheduleDate: string;
  description: string;
  category?: {
    id: string;
    name: string;
    type: string;
  };
  stakeholder?: {
    id: string;
    name: string;
    type: string;
    cpfCnpj?: string;
  };
  costCenters?: Record<string, unknown>[];
  categories?: Record<string, unknown>[];
  paidValue?: number;
  openValue?: number;
  createDate: string;
  createUser: string;
  updateDate: string;
  updateUser: string;
  hasRecurrence: boolean;
  hasInstallment: boolean;
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
}

function parseAgendamentosData(rawData: NiboAgendamento): AgendamentoMapped[] {
  // O raw_data já vem como objeto individual, não como lista
  if (!rawData) {
    console.warn('⚠️ Dados de agendamento vazios');
    return [];
  }

  // Mapear campos do NIBO para estrutura do banco
  const agendamento = {
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

  return [agendamento];
}

async function processAgendamentosBatch(supabase: SupabaseClient, batchId: string, batchSize: number = 50) {
  console.log(`💳 Processando batch NIBO agendamentos: ${batchId}`);
  
  // Buscar agendamentos não processados do batch
  const { data: tempAgendamentos, error: fetchError } = await supabase
    .from('nibo_temp_agendamentos')
    .select('id, bar_id, raw_data')
    .eq('batch_id', batchId)
    .eq('processed', false)
    .order('id', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    console.error('❌ Erro ao buscar agendamentos temporários:', fetchError);
    throw fetchError;
  }

  if (!tempAgendamentos || tempAgendamentos.length === 0) {
    console.log('✅ Nenhum agendamento pendente no batch');
    return { processed: 0, inserted: 0 };
  }

  console.log(`📦 Processando ${tempAgendamentos.length} agendamentos`);

  let totalInserted = 0;
  let totalProcessed = 0;
  let errors = 0;

  // Processar cada agendamento
  for (const tempItem of tempAgendamentos) {
    try {
      const agendamentos = parseAgendamentosData(tempItem.raw_data);
      
      if (agendamentos.length === 0) {
        console.warn(`⚠️ Nenhum dado para processar no item ${tempItem.id}`);
        continue;
      }

      // Adicionar bar_id aos dados
      const insertData = agendamentos.map(ag => ({
        ...ag,
        bar_id: tempItem.bar_id
      }));

      // Inserir/atualizar agendamento
      const { data, error } = await supabase
        .from('nibo_agendamentos')
        .upsert(insertData, {
          onConflict: 'nibo_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error(`❌ Erro ao inserir agendamento ${tempItem.id}:`, error);
        errors++;
      } else {
        totalInserted += data?.length || 0;
        
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
      console.error(`❌ Erro ao processar item ${tempItem.id}:`, error);
      errors++;
    }
  }

  console.log(`✅ Batch processado: ${totalProcessed} itens, ${totalInserted} inseridos, ${errors} erros`);
  
  return { 
    processed: totalProcessed, 
    inserted: totalInserted, 
    errors: errors 
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

    const { batch_id, batch_size = 50 } = await req.json();

    if (!batch_id) {
      throw new Error('batch_id é obrigatório');
    }

    console.log(`🚀 Iniciando processamento NIBO batch ${batch_id}`);

    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let hasMore = true;

    // Processar em loops até acabar todos os itens
    while (hasMore) {
      const result = await processAgendamentosBatch(supabase, batch_id, batch_size);
      
      totalProcessed += result.processed;
      totalInserted += result.inserted;
      totalErrors += result.errors || 0;

      // Se não processou nada, não há mais itens
      hasMore = result.processed > 0;

      // Pequena pausa entre batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Atualizar status do job
    await supabase
      .from('nibo_background_jobs')
      .update({
        processed_records: totalProcessed,
        status: 'completed',
        completed_at: new Date().toISOString(),
        error_message: totalErrors > 0 ? `${totalErrors} erros durante processamento` : null
      })
      .eq('batch_id', batch_id);

    // Notificar Discord sobre conclusão
    if (totalProcessed > 0) {
      try {
        const discordData = {
          webhook_type: 'nibo',
          batch_id: batch_id,
          processed_records: totalProcessed,
          inserted_records: totalInserted,
          error_count: totalErrors
        };

        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/discord-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify(discordData)
          }
        );
      } catch (error) {
        console.error('❌ Erro ao enviar notificação Discord:', error instanceof Error ? error.message : 'Erro desconhecido');
      }
    }

    const response = {
      success: true,
      batch_id: batch_id,
      processed_count: totalProcessed,
      inserted_count: totalInserted,
      error_count: totalErrors,
      message: `Batch processado: ${totalProcessed} agendamentos (${totalInserted} inseridos, ${totalErrors} erros)`
    };

    console.log('✅ Processamento NIBO concluído:', response);

    return new Response(JSON.stringify(response), {
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
