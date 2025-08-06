import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Deletar todos os registros do bar
    const { error } = await supabase
      .from('desempenho_semanal')
      .delete()
      .eq('bar_id', barId);

    if (error) {
      console.error('Erro ao limpar dados:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao limpar dados de desempenho' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Todos os dados de desempenho foram excluídos com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
