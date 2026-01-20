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

    console.log(`[NIBO-SCHEDULES] Criando agendamento: ${description}, valor=${value}`);

    // Validações
    if (!stakeholderId || !dueDate || !value) {
      return NextResponse.json(
        { success: false, error: 'stakeholderId, dueDate e value são obrigatórios' },
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

    // Preparar payload para NIBO
    // Documentação: https://nibo.readme.io/reference/agendar-pagamento
    // Endpoint correto para pagamentos (despesas): /schedules/debit
    const valorAbsoluto = Math.abs(parseFloat(value));
    
    // Montar objeto de categoria
    const categoryItem: any = {
      value: valorAbsoluto,
      description: description || 'Pagamento'
    };
    
    // Só adicionar categoryId se existir (pode ser opcional no NIBO)
    if (categoria_id) {
      categoryItem.categoryId = categoria_id;
    }
    
    const schedulePayload: any = {
      stakeholderId,
      dueDate, // Data de vencimento (YYYY-MM-DD)
      scheduleDate: scheduleDate || dueDate, // Data do agendamento
      accrualDate: accrualDate || dueDate, // Data de competência
      description: description || 'Pagamento agendado',
      // Categories é obrigatório no formato correto
      categories: [categoryItem]
    };

    // Adicionar centro de custo se fornecido
    if (centro_custo_id) {
      schedulePayload.costCenters = [{
        costCenterId: centro_custo_id,
        value: valorAbsoluto
      }];
    }

    // Adicionar referência se fornecida
    if (reference) {
      schedulePayload.reference = reference;
    }

    console.log('[NIBO-SCHEDULES] Payload para NIBO (debit):', JSON.stringify(schedulePayload, null, 2));

    // Endpoint correto: /schedules/debit para pagamentos (despesas)
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

    // Salvar no banco local para tracking
    const { error: insertError } = await supabase.from('nibo_agendamentos').insert({
      nibo_id: niboData.id || niboData.scheduleId,
      bar_id,
      tipo: 'despesa',
      status: 'pendente',
      valor: Math.abs(parseFloat(value)),
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
