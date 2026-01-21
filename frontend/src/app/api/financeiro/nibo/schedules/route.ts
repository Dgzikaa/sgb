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
      dueDate,
      scheduleDate,
      categoria_id,
      centro_custo_id,
      categories,
      accrualDate,
      value,
      description,
      reference,
      bar_id = 3
    } = body;

    // BUILD_VERSION: 2026-01-21-v4-DEBUG-PAYLOAD
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
    // IMPORTANTE: Para débitos (despesas), o valor deve ser NEGATIVO
    const valorNumerico = Math.abs(parseFloat(String(value)));
    const valorNegativo = valorNumerico * -1; // NIBO exige valor negativo para /schedules/debit
    
    console.log('[NIBO-SCHEDULES-V3] Valor NEGATIVO calculado:', valorNegativo, '(original:', value, ', numerico:', valorNumerico, ')');
    
    // Garantir que o valor é realmente negativo
    if (valorNegativo >= 0) {
      console.error('[NIBO-SCHEDULES-V3] ERRO: Valor não está negativo!', valorNegativo);
      return NextResponse.json(
        { success: false, error: `Erro interno: valor deveria ser negativo mas é ${valorNegativo}` },
        { status: 500 }
      );
    }
    
    // Montar objeto de categoria com valor NEGATIVO
    const categoryItem: any = {
      categoryId: categoria_id, // camelCase para /schedules
      value: valorNegativo, // Valor NEGATIVO para débitos
      description: description || 'Pagamento'
    };
    
    // Payload para /schedules/debit
    const schedulePayload: any = {
      stakeholderId: stakeholderId,
      dueDate: dueDate, // Data de vencimento
      scheduleDate: scheduleDate || dueDate, // Data do agendamento
      accrualDate: accrualDate || dueDate, // Data de competência
      description: description || 'Pagamento agendado',
      categories: [categoryItem]
    };

    // Adicionar centro de custo se fornecido (com valor negativo)
    if (centro_custo_id) {
      schedulePayload.costCenters = [{
        costCenterId: centro_custo_id, // camelCase para /schedules
        value: valorNegativo
      }];
    }

    // Adicionar referência se fornecida
    if (reference) {
      schedulePayload.reference = reference;
    }

    console.log('[NIBO-SCHEDULES-V4] ========== PAYLOAD FINAL ==========');
    console.log('[NIBO-SCHEDULES-V4] Payload para NIBO:', JSON.stringify(schedulePayload, null, 2));
    console.log('[NIBO-SCHEDULES-V4] Valor na categoria:', schedulePayload.categories[0].value);
    console.log('[NIBO-SCHEDULES-V4] Tipo do valor:', typeof schedulePayload.categories[0].value);
    console.log('[NIBO-SCHEDULES-V4] É negativo?:', schedulePayload.categories[0].value < 0);

    // Endpoint /schedules/debit para AGENDAR despesas (não paga imediatamente)
    const response = await fetch(`${NIBO_BASE_URL}/schedules/debit?apitoken=${credencial.api_token}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'apitoken': credencial.api_token
      },
      body: JSON.stringify(schedulePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NIBO-SCHEDULES] Erro ao criar:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Erro NIBO: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const niboData = await response.json();
    console.log('[NIBO-SCHEDULES] Agendamento criado no NIBO:', niboData.id || niboData.scheduleId);

    // Salvar no banco local para tracking (salva valor POSITIVO para exibição)
    const { error: insertError } = await supabase.from('nibo_agendamentos').insert({
      nibo_id: niboData.id || niboData.scheduleId,
      bar_id,
      tipo: 'despesa',
      status: 'pendente',
      valor: valorNumerico, // Salva positivo para exibição
      data_vencimento: dueDate,
      data_pagamento: null,
      descricao: description,
      categoria_id,
      stakeholder_id: stakeholderId,
      centro_custo_id,
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
        id: niboData.id || niboData.scheduleId,
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
