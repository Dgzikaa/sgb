import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/umbler/conversas/[id]
 * Retorna detalhes de uma conversa com mensagens
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar conversa
    const { data: conversa, error: conversaError } = await supabase
      .from('umbler_conversas')
      .select('*')
      .eq('id', id)
      .single();

    if (conversaError) {
      console.error('Erro ao buscar conversa:', conversaError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar mensagens da conversa
    const { data: mensagens, error: mensagensError } = await supabase
      .from('umbler_mensagens')
      .select('*')
      .eq('conversa_id', id)
      .order('created_at', { ascending: true });

    if (mensagensError) {
      console.error('Erro ao buscar mensagens:', mensagensError);
    }

    // Buscar dados do cliente no ContaHub se tiver correlação
    let clienteContahub = null;
    if (conversa.cliente_contahub_id) {
      const { data: cliente } = await supabase
        .from('contahub_periodo')
        .select('id, cliente_nome, cliente_cpf, data_atendimento, vr_pagamentos')
        .eq('id', conversa.cliente_contahub_id)
        .single();
      
      clienteContahub = cliente;
    }

    return NextResponse.json({
      conversa,
      mensagens: mensagens || [],
      cliente_contahub: clienteContahub
    });

  } catch (error) {
    console.error('Erro na API Umbler Conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
