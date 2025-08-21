import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para autenticar usuário
async function authenticateUser(request: NextRequest) {
  try {
    const userHeader = request.headers.get('x-user-data');
    if (!userHeader) {
      return null;
    }
    
    const user = JSON.parse(decodeURIComponent(userHeader));
    return user;
  } catch (error) {
    console.error('❌ Erro ao autenticar usuário:', error);
    return null;
  }
}

// GET - Buscar evento específico por data
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    const id = searchParams.get('id');

    if (id) {
      // Buscar por ID
      const { data: evento, error } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('id', id)
        .eq('bar_id', user.bar_id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar evento:', error);
        return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: evento });
    }

    if (data) {
      // Buscar por data
      const { data: evento, error } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('data_evento', data)
        .eq('bar_id', user.bar_id)
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error('❌ Erro ao buscar evento:', error);
        return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: evento || null 
      });
    }

    return NextResponse.json({ error: 'Parâmetro data ou id é obrigatório' }, { status: 400 });

  } catch (error) {
    console.error('❌ Erro na API GET eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      data_evento,
      nome,
      artista,
      genero,
      observacoes
    } = body;

    if (!data_evento || !nome) {
      return NextResponse.json({ 
        error: 'Data do evento e nome são obrigatórios' 
      }, { status: 400 });
    }

    // Calcular dia da semana
    const dataEvento = new Date(data_evento);
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[dataEvento.getDay()];

    console.log('➕ Criando novo evento:', { data_evento, nome, artista, genero });

    const { data: evento, error } = await supabase
      .from('eventos_base')
      .insert({
        data_evento,
        nome,
        artista: artista || null,
        genero: genero || null,
        observacoes: observacoes || null,
        dia_semana: diaSemana,
        bar_id: user.bar_id,
        ativo: true,
        precisa_recalculo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar evento:', error);
      return NextResponse.json({ 
        error: 'Erro ao criar evento',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Evento criado com sucesso:', evento);

    return NextResponse.json({ 
      success: true, 
      data: evento,
      message: 'Evento criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API POST eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar evento existente
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      nome,
      artista,
      genero,
      observacoes
    } = body;

    if (!id || !nome) {
      return NextResponse.json({ 
        error: 'ID e nome são obrigatórios' 
      }, { status: 400 });
    }

    console.log('🔄 Atualizando evento:', { id, nome, artista, genero });

    const { data: evento, error } = await supabase
      .from('eventos_base')
      .update({
        nome,
        artista: artista || null,
        genero: genero || null,
        observacoes: observacoes || null,
        atualizado_em: new Date().toISOString(),
        precisa_recalculo: true
      })
      .eq('id', id)
      .eq('bar_id', user.bar_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      return NextResponse.json({ 
        error: 'Erro ao atualizar evento',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Evento atualizado com sucesso:', evento);

    return NextResponse.json({ 
      success: true, 
      data: evento,
      message: 'Evento atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API PUT eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Excluir evento (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    console.log('🗑️ Excluindo evento:', id);

    // Soft delete - marcar como inativo
    const { data: evento, error } = await supabase
      .from('eventos_base')
      .update({
        ativo: false,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('bar_id', user.bar_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao excluir evento:', error);
      return NextResponse.json({ 
        error: 'Erro ao excluir evento',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Evento excluído com sucesso:', evento);

    return NextResponse.json({ 
      success: true, 
      data: evento,
      message: 'Evento excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API DELETE eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
