import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NIBO_BASE_URL = 'https://api.nibo.com.br/empresas/v1';

// Buscar credenciais do NIBO para um bar
async function getNiboCredentials(barId: number = 3) {
  const { data: credencial, error } = await supabase
    .from('api_credentials')
    .select('api_token, empresa_id')
    .eq('sistema', 'nibo')
    .eq('bar_id', barId)
    .eq('ativo', true)
    .single();

  if (error || !credencial?.api_token) {
    return null;
  }

  return credencial;
}

// GET - Listar agendamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');

    console.log(`[NIBO-SCHEDULES] Listando agendamentos, bar_id=${barId}`);

    // Buscar do banco de dados local (nibo_agendamentos)
    let query = supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', barId)
      .eq('deletado', false)
      .order('data_vencimento', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (dataInicio) {
      query = query.gte('data_vencimento', dataInicio);
    }

    if (dataFim) {
      query = query.lte('data_vencimento', dataFim);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('[NIBO-SCHEDULES] Erro ao buscar:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('[NIBO-SCHEDULES] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao listar agendamentos' },
      { status: 500 }
    );
  }
}

// POST - Criar agendamento no NIBO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stakeholderId,
      stakeholder_nome,
      dueDate,
      scheduleDate,
      categoria_id,
      categoria_nome,
      centro_custo_id,
      centro_custo_nome,
      categories,
      accrualDate,
      value,
      description,
      reference,
      bar_id,
      bar_nome,
      criado_por_id,
      criado_por_nome
    } = body;

    // VALIDAÇÃO CRÍTICA: bar_id é obrigatório
    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório. Selecione um bar.' },
        { status: 400 }
      );
    }

    // BUILD_VERSION: 2026-01-21-v10-DEBUG-BODY-STRING
    console.log(`[NIBO-SCHEDULES-V4] ========== NOVA REQUISIÇÃO ==========`);
    console.log(`[NIBO-SCHEDULES-V4] Body recebido:`, JSON.stringify(body, null, 2));
    console.log(`[NIBO-SCHEDULES-V4] value raw:`, value, typeof value);

    // Validações
    if (!stakeholderId || !dueDate || !value) {
      return NextResponse.json(
        { success: false, error: 'stakeholderId, dueDate e value são obrigatórios' },
        { status: 400 }
      );
    }

    // IMPORTANTE: categoria_id é OBRIGATÓRIO no NIBO
    // Se não foi passado, retornar erro claro
    if (!categoria_id) {
      return NextResponse.json(
        { success: false, error: 'categoria_id é obrigatório. Selecione uma categoria antes de agendar.' },
        { status: 400 }
      );
    }

    const credencial = await getNiboCredentials(bar_id);
    
    if (!credencial) {
      return NextResponse.json(
        { success: false, error: 'Credenciais NIBO não encontradas para este bar' },
        { status: 400 }
      );
    }

    // Preparar payload para NIBO - endpoint /schedules/debit para AGENDAMENTO de despesas
    // CONFIRMADO: NIBO exige valor NEGATIVO para /schedules/debit
    const valorNumerico = parseFloat((Math.abs(parseFloat(String(value)))).toFixed(2));
    const valorNegativo = valorNumerico * -1; // DEVE ser negativo!
    
    console.log('[NIBO-SCHEDULES-V7] Valor calculado:', {
      original: value,
      numerico: valorNumerico,
      negativo: valorNegativo,
      eh_negativo: valorNegativo < 0
    });
    
    // Montar objeto de categoria com valor NEGATIVO (obrigatório para /schedules/debit)
    // V10: Testando se value precisa ser string (como costCenters.value)
    const categoryItem: any = {
      categoryId: categoria_id,
      value: valorNegativo, // number negativo
      description: description || 'Pagamento'
    };
    
    // DEBUG V10: Logar o JSON exato que será enviado
    console.log('[NIBO-SCHEDULES-V10] categoryItem.value:', categoryItem.value, 'tipo:', typeof categoryItem.value);
    
    // Payload para /schedules/debit
    // V9: Removido 'value' do nível raiz (não existe na doc), adicionado costCenterValueType
    const schedulePayload: any = {
      stakeholderId: stakeholderId,
      dueDate: dueDate,
      scheduleDate: scheduleDate || dueDate,
      accrualDate: accrualDate || dueDate, // string
      description: description || 'Pagamento agendado',
      categories: [categoryItem]
    };

    // Adicionar centro de custo se fornecido
    // IMPORTANTE: costCenterValueType = 0 significa "valor" (não percentagem)
    if (centro_custo_id) {
      schedulePayload.costCenterValueType = 0; // 0 = valor, 1 = percentagem
      schedulePayload.costCenters = [{
        costCenterId: centro_custo_id,
        value: String(valorNegativo) // Doc diz que é string!
      }];
    }

    // Adicionar referência se fornecida
    if (reference) {
      schedulePayload.reference = reference;
    }

    console.log('[NIBO-SCHEDULES-V9] ========== PAYLOAD FINAL ==========');
    console.log('[NIBO-SCHEDULES-V9] Payload para NIBO:', JSON.stringify(schedulePayload, null, 2));
    console.log('[NIBO-SCHEDULES-V9] Valor na categoria:', schedulePayload.categories[0].value);
    console.log('[NIBO-SCHEDULES-V9] Tipo do valor:', typeof schedulePayload.categories[0].value);
    console.log('[NIBO-SCHEDULES-V9] É negativo?:', schedulePayload.categories[0].value < 0);
    console.log('[NIBO-SCHEDULES-V9] costCenterValueType:', schedulePayload.costCenterValueType);

    // Verificação de segurança - garantir que valor é negativo antes de enviar
    if (schedulePayload.categories[0].value >= 0) {
      console.error('[NIBO-SCHEDULES-V9] ERRO CRÍTICO: Valor não é negativo!', schedulePayload.categories[0].value);
      return NextResponse.json({
        success: false,
        error: 'Erro interno: valor deve ser negativo para agendamento de débito',
        debug: {
          valor_recebido: value,
          valor_calculado: schedulePayload.categories[0].value
        }
      }, { status: 400 });
    }

    // V10: Log do body exato antes de enviar
    const bodyString = JSON.stringify(schedulePayload);
    console.log('[NIBO-SCHEDULES-V10] Body string exato:', bodyString);
    
    // Endpoint /schedules/debit para AGENDAR despesas (não paga imediatamente)
    const response = await fetch(`${NIBO_BASE_URL}/schedules/debit?apitoken=${credencial.api_token}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'apitoken': credencial.api_token
      },
      body: bodyString
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NIBO-SCHEDULES] Erro ao criar:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Erro NIBO: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // NIBO retorna o ID como texto puro (UUID), não como JSON
    const responseText = await response.text();
    console.log('[NIBO-SCHEDULES] Resposta do NIBO (raw):', responseText);
    
    // Tentar parsear como JSON primeiro, senão usar o texto como ID
    let niboId: string;
    let niboData: any = {};
    
    try {
      niboData = JSON.parse(responseText);
      niboId = niboData.id || niboData.scheduleId || niboData.Id || niboData.ScheduleId || responseText.replace(/"/g, '');
    } catch {
      // Resposta é texto puro (UUID)
      niboId = responseText.replace(/"/g, '').trim();
      niboData = { id: niboId };
    }
    
    console.log('[NIBO-SCHEDULES] Agendamento criado no NIBO, ID:', niboId);

    // Salvar no banco local para tracking (salva valor POSITIVO para exibição)
    // Só salva se tiver um ID válido
    if (!niboId) {
      console.warn('[NIBO-SCHEDULES] NIBO não retornou ID do agendamento, pulando salvamento local');
    }
    
    const { error: insertError } = await supabase.from('nibo_agendamentos').insert({
      nibo_id: niboId || `temp-${Date.now()}`, // Fallback temporário se não tiver ID
      bar_id,
      bar_nome: bar_nome || null,
      tipo: 'despesa',
      status: 'pendente',
      valor: valorNumerico, // Salva positivo para exibição
      data_vencimento: dueDate,
      data_pagamento: null,
      descricao: description,
      categoria_id,
      categoria_nome: categoria_nome || null,
      stakeholder_id: stakeholderId,
      stakeholder_nome: stakeholder_nome || null,
      centro_custo_id,
      centro_custo_nome: centro_custo_nome || null,
      criado_por_id: criado_por_id || null,
      criado_por_nome: criado_por_nome || null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });

    if (insertError) {
      console.error('[NIBO-SCHEDULES] Erro ao salvar no banco local:', insertError);
      // Não falhar por causa disso, o agendamento foi criado no NIBO
    }

    return NextResponse.json({
      success: true,
      data: {
        id: niboId,
        ...niboData
      }
    });

  } catch (error) {
    console.error('[NIBO-SCHEDULES] Erro ao criar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar agendamento' },
      { status: 500 }
    );
  }
}
