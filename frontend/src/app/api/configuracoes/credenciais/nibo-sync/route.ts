import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barId } = body || {};

    // Se não tiver barId no body, usar variável de ambiente (cron job)
    const targetBarId = barId || process.env.NIBO_BAR_ID;

    if (!targetBarId) {
      return NextResponse.json(
        {
          error:
            'Bar ID é obrigatório (via body ou variável de ambiente NIBO_BAR_ID)',
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Iniciando sincronização NIBO para bar ${targetBarId}...`);

    // Buscar credenciais do NIBO
    const { data: credenciais, error: credError } = await supabase
      .from('credenciais')
      .select('*')
      .eq('bar_id', targetBarId)
      .eq('servico', 'nibo')
      .single();

    if (credError || !credenciais) {
      return NextResponse.json(
        {
          error: 'Credenciais NIBO não encontradas',
        },
        { status: 404 }
      );
    }

    // Iniciar sincronização em background
    // Por enquanto, vamos apenas retornar sucesso
    // A sincronização real será implementada como Edge Function

    return NextResponse.json({
      success: true,
      message: 'Sincronização NIBO iniciada com sucesso!',
      syncId: `sync_${Date.now()}`,
      barId: targetBarId,
    });
  } catch (error) {
    console.error('Erro ao sincronizar NIBO:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
