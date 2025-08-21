import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventoId = params.id;
    const body = await request.json();
    
    const {
      nome,
      m1_r,
      cl_plan,
      te_plan,
      tb_plan,
      c_artistico_plan,
      observacoes
    } = body;

    console.log('🔧 Atualizando evento:', eventoId, body);

    // Atualizar evento na tabela eventos_base (editável)
    const { data, error } = await supabase
      .from('eventos_base')
      .update({
        nome,
        m1_r: m1_r ? parseFloat(m1_r) : null,
        cl_plan: cl_plan ? parseInt(cl_plan) : null,
        te_plan: te_plan ? parseFloat(te_plan) : null,
        tb_plan: tb_plan ? parseFloat(tb_plan) : null,
        c_artistico_plan: c_artistico_plan ? parseFloat(c_artistico_plan) : null,
        observacoes,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', eventoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
    }

    console.log('✅ Evento atualizado com sucesso:', data);

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Evento atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API de atualização de evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventoId = params.id;

    const { data, error } = await supabase
      .from('eventos_base')
      .select('*')
      .eq('id', eventoId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar evento:', error);
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('❌ Erro na API de busca de evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}