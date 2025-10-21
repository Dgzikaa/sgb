import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service_role para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DadosAdicionais {
  id?: number;
  bar_id: number;
  data_evento: string;
  nps_score?: number;
  avaliacao_google?: number;
  pesquisa_felicidade?: number;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

// GET - Buscar dados adicionais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }

    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');

    let query = supabase
      .from('dados_adicionais')
      .select('*')
      .eq('bar_id', barId)
      .order('data_evento', { ascending: false });

    // Filtrar por período se especificado
    if (dataInicio) {
      query = query.gte('data_evento', dataInicio);
    }
    if (dataFim) {
      query = query.lte('data_evento', dataFim);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados adicionais:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados adicionais' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Erro na API de dados adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar/Atualizar dados adicionais
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const dadosAdicionais: DadosAdicionais = {
      ...body,
      bar_id: barId,
      atualizado_em: new Date().toISOString()
    };

    // Verificar se já existe registro para esta data
    const { data: existente } = await supabase
      .from('dados_adicionais')
      .select('id')
      .eq('bar_id', barId)
      .eq('data_evento', dadosAdicionais.data_evento)
      .single();

    let result;
    if (existente) {
      // Atualizar registro existente
      result = await supabase
        .from('dados_adicionais')
        .update(dadosAdicionais)
        .eq('id', existente.id)
        .select()
        .single();
    } else {
      // Criar novo registro
      dadosAdicionais.criado_em = new Date().toISOString();
      result = await supabase
        .from('dados_adicionais')
        .insert(dadosAdicionais)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Erro ao salvar dados adicionais:', result.error);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar dados adicionais' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: existente ? 'Dados atualizados com sucesso' : 'Dados criados com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de dados adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados específicos
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, ...dadosAtualizacao } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do registro é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('dados_adicionais')
      .update({
        ...dadosAtualizacao,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('bar_id', barId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar dados adicionais:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar dados adicionais' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Dados atualizados com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de dados adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover dados adicionais
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId || !id) {
      return NextResponse.json(
        { success: false, error: 'Bar e ID são obrigatórios' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('dados_adicionais')
      .delete()
      .eq('id', parseInt(id))
      .eq('bar_id', barId);

    if (error) {
      console.error('Erro ao deletar dados adicionais:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar dados adicionais' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dados removidos com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de dados adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
