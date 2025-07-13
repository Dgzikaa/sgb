import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as metas da base de dados
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('meta_ativa', true)
      .order('ordem_exibicao');

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }, { status: 500 });
    }

    // Organizar metas por categoria
    const metasOrganizadas = {
      financeiro: data?.filter(meta => meta.categoria === 'financeiro') || [],
      clientes: data?.filter(meta => meta.categoria === 'clientes') || [],
      avaliacoes: data?.filter(meta => meta.categoria === 'avaliacoes') || [],
      cockpit_produtos: data?.filter(meta => meta.categoria === 'cockpit_produtos') || [],
      marketing: data?.filter(meta => meta.categoria === 'marketing') || []
    };

    return NextResponse.json({ 
      success: true, 
      data: metasOrganizadas 
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoria, nome, valor_meta, unidade, descricao, icone, valor_atual = 0 } = body;

    // Validar campos obrigatórios
    if (!categoria || !nome || !valor_meta || !unidade) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: categoria, nome, valor_meta, unidade'
      }, { status: 400 });
    }

    // Validar categoria
    const categoriasValidas = ['financeiro', 'clientes', 'avaliacoes', 'cockpit_produtos', 'marketing'];
    if (!categoriasValidas.includes(categoria)) {
      return NextResponse.json({
        success: false,
        error: 'Categoria inválida'
      }, { status: 400 });
    }

    // Buscar próxima ordem de exibição
    const { data: ultimaMeta } = await supabase
      .from('metas')
      .select('ordem_exibicao')
      .eq('categoria', categoria)
      .order('ordem_exibicao', { ascending: false })
      .limit(1);

    const proximaOrdem = ultimaMeta && ultimaMeta.length > 0 ? ultimaMeta[0].ordem_exibicao + 1 : 1;

    // Inserir nova meta
    const { data, error } = await supabase
      .from('metas')
      .insert([{
        categoria,
        nome,
        valor_atual,
        valor_meta,
        unidade,
        descricao,
        icone: icone || 'Target',
        meta_ativa: true,
        ordem_exibicao: proximaOrdem
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar meta'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, valor_atual, valor_meta, meta_ativa, ...outrosCampos } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da meta é obrigatório'
      }, { status: 400 });
    }

    // Atualizar meta
    const { data, error } = await supabase
      .from('metas')
      .update({
        valor_atual,
        valor_meta,
        meta_ativa,
        ...outrosCampos
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar meta'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID da meta é obrigatório'
      }, { status: 400 });
    }

    // Deletar meta (ou marcar como inativa)
    const { error } = await supabase
      .from('metas')
      .update({ meta_ativa: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar meta:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar meta'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Meta deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 