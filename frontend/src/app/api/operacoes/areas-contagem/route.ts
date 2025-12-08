import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AreaInput {
  nome: string;
  descricao?: string;
  tipo?: string;
  ativo?: boolean;
  ordem?: number;
  bar_id?: number;
  usuario_criacao_nome?: string;
}

// GET - Listar áreas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bar_id = parseInt(searchParams.get('bar_id') || '3');
    const apenas_ativas = searchParams.get('ativas') === 'true';
    const tipo = searchParams.get('tipo');

    let query = supabase
      .from('areas_contagem')
      .select('*')
      .eq('bar_id', bar_id)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });

    if (apenas_ativas) {
      query = query.eq('ativo', true);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Buscar estatísticas de uso de cada área
    const areasComStats = await Promise.all(
      (data || []).map(async (area) => {
        const { data: stats } = await supabase
          .from('contagem_estoque_produtos')
          .select('id, estoque_total, valor_total')
          .eq('area_id', area.id);

        return {
          ...area,
          estatisticas: {
            total_itens: stats?.length || 0,
            valor_total: stats?.reduce((sum, s) => sum + parseFloat(s.valor_total || '0'), 0) || 0
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: areasComStats,
      total: areasComStats.length
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar áreas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar áreas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova área
export async function POST(request: NextRequest) {
  try {
    const body: AreaInput = await request.json();

    if (!body.nome) {
      return NextResponse.json(
        { success: false, error: 'Nome da área é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 });
    }
    const bar_id = body.bar_id;

    // Verificar se já existe área com esse nome
    const { data: existente } = await supabase
      .from('areas_contagem')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('nome', body.nome)
      .single();

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma área com este nome' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('areas_contagem')
      .insert({
        bar_id,
        nome: body.nome,
        descricao: body.descricao || null,
        tipo: body.tipo || 'outros',
        ativo: body.ativo !== undefined ? body.ativo : true,
        ordem: body.ordem || 0,
        usuario_criacao_nome: body.usuario_criacao_nome || 'Sistema'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Área criada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar área:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar área' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar área
export async function PUT(request: NextRequest) {
  try {
    const body: AreaInput & { id: number } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID da área é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (body.nome) updateData.nome = body.nome;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;
    if (body.ordem !== undefined) updateData.ordem = body.ordem;

    const { data, error } = await supabase
      .from('areas_contagem')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Área atualizada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar área:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar área' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir área
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da área é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a área tem contagens associadas
    const { data: contagens } = await supabase
      .from('contagem_estoque_produtos')
      .select('id')
      .eq('area_id', id)
      .limit(1);

    if (contagens && contagens.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir uma área com contagens associadas. Desative-a ao invés de excluir.' 
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('areas_contagem')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Área excluída com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao excluir área:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir área' },
      { status: 500 }
    );
  }
}

