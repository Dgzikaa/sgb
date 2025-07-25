import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ [DELETE EVENTO] Iniciando exclusão do evento ID:', id);

    const eventoId = parseInt(id);
    if (isNaN(eventoId)) {
      console.log('❌ [DELETE EVENTO] ID inválido:', id);
      return NextResponse.json(
        {
          success: false,
          error: 'ID do evento inválido',
        },
        { status: 400 }
      );
    }

    console.log('🔗 [DELETE EVENTO] Inicializando cliente Supabase...');
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao conectar com banco de dados',
        },
        { status: 500 }
      );
    }

    // Primeiro verificar se o evento existe
    console.log('🔍 [DELETE EVENTO] Verificando se evento existe...');
    const { data: eventoExistente, error: erroConsulta } = await supabase
      .from('eventos')
      .select('id, nome_evento')
      .eq('id', eventoId)
      .single();

    if (erroConsulta) {
      console.error(
        '❌ [DELETE EVENTO] Erro ao consultar evento:',
        erroConsulta
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado',
        },
        { status: 404 }
      );
    }

    if (!eventoExistente) {
      console.log('❌ [DELETE EVENTO] Evento não encontrado:', eventoId);
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado',
        },
        { status: 404 }
      );
    }

    console.log(
      '📝 [DELETE EVENTO] Evento encontrado:',
      eventoExistente.nome_evento
    );

    // Deletar o evento
    console.log('🗑️ [DELETE EVENTO] Executando exclusão...');
    const { error: erroDelecao } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventoId);

    if (erroDelecao) {
      console.error('❌ [DELETE EVENTO] Erro ao deletar:', erroDelecao);
      return NextResponse.json(
        {
          success: false,
          error: erroDelecao.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ [DELETE EVENTO] Evento excluído com sucesso:', eventoId);
    return NextResponse.json({
      success: true,
      message: 'Evento excluído com sucesso',
      deletedId: eventoId,
    });
  } catch (error) {
    console.error('💥 [DELETE EVENTO] Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
