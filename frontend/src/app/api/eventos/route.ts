import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ========================================
// 🎉 API PARA EVENTOS
// ========================================

interface Evento {
  id?: string;
  bar_id: string;
  nome: string;
  data_evento: string;
  valor?: number;
  status?: string;
  descricao?: string;
  created_at?: string;
}

interface EventoInput {
  bar_id: string;
  nome: string;
  data_evento: string;
  valor?: number;
  status?: string;
  descricao?: string;
}

interface ApiError {
  message: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// 🎉 GET /api/eventos
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!barId) {
      return NextResponse.json(
        { error: 'Bar ID é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('eventos')
      .select('*')
      .eq('bar_id', barId)
      .order('data_evento', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: eventos, error } = await query;

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: eventos || [],
    });
  } catch (error) {
    console.error('Erro na API de eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ========================================
// 🎉 POST /api/eventos
// ========================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventoInput;
    const { bar_id, nome, data_evento, valor, status, descricao } = body;

    if (!bar_id || !nome || !data_evento) {
      return NextResponse.json(
        {
          error: 'Bar ID, nome e data do evento são obrigatórios',
        },
        { status: 400 }
      );
    }

    const novoEvento: Evento = {
      bar_id,
      nome,
      data_evento,
      valor: valor || 0,
      status: status || 'pendente',
      descricao: descricao || '',
      created_at: new Date().toISOString(),
    };

    const { data } = await supabase
      .from('eventos')
      .insert([novoEvento])
      .select()
      .single();

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Evento criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro na API de eventos:', apiError);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
