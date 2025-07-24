import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

// =====================================================
// GET - LISTAR METAS
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const ativas = searchParams.get('ativas') !== 'false';

    const supabase = await getAdminClient();

    // Construir query
    let query = supabase
      .from('metas_negocio')
      .select('*')
      .eq('bar_id', user.bar_id)
      .order('ordem_exibicao', { ascending: true });

    // Filtrar por categoria se especificada
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Filtrar apenas metas ativas se especificado
    if (ativas) {
      query = query.eq('meta_ativa', true);
    }

    const { data: metas, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar metas:', error);
      return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 });
    }

    // Organizar por categoria
    const metasOrganizadas = {
      financeiro: metas?.filter((m: unknown) => m.categoria === 'financeiro') || [],
      clientes: metas?.filter((m: unknown) => m.categoria === 'clientes') || [],
      avaliacoes: metas?.filter((m: unknown) => m.categoria === 'avaliacoes') || [],
      cockpit_produtos: metas?.filter((m: unknown) => m.categoria === 'cockpit_produtos') || [],
      marketing: metas?.filter((m: unknown) => m.categoria === 'marketing') || [],
    };

    return NextResponse.json({
      success: true,
      data: metasOrganizadas,
      total: metas?.length || 0
    });

  } catch (error) {
    console.error('❌ Erro na API de metas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// =====================================================
// POST - CRIAR NOVA META
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const body = await request.json();
    const {
      categoria,
      subcategoria,
      nome_meta,
      tipo_valor,
      valor_semanal,
      valor_mensal,
      valor_unico,
      unidade,
      descricao,
      cor_categoria,
      icone_categoria
    } = body;

    // Validações
    if (!categoria || !nome_meta || !tipo_valor) {
      return NextResponse.json(
        { error: 'Categoria, nome da meta e tipo do valor são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Buscar próxima ordem
    const { data: ultimaMeta } = await supabase
      .from('metas_negocio')
      .select('ordem_exibicao')
      .eq('bar_id', user.bar_id)
      .order('ordem_exibicao', { ascending: false })
      .limit(1)
      .single();

    const novaOrdem = (ultimaMeta?.ordem_exibicao || 0) + 1;

    // Criar nova meta
    const { data: novaMeta, error } = await supabase
      .from('metas_negocio')
      .insert({
        bar_id: user.bar_id,
        categoria,
        subcategoria,
        nome_meta,
        tipo_valor,
        valor_semanal,
        valor_mensal,
        valor_unico,
        unidade,
        descricao,
        cor_categoria,
        icone_categoria,
        ordem_exibicao: novaOrdem,
        criado_por: user.user_id,
        atualizado_por: user.user_id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar meta:', error);
      return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
    }

    console.log(`✅ Meta criada: ${nome_meta}`);
    return NextResponse.json({
      success: true,
      data: novaMeta,
      message: 'Meta criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// =====================================================
// PUT - ATUALIZAR METAS EM LOTE
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { metas } = await request.json();

    if (!Array.isArray(metas)) {
      return NextResponse.json(
        { error: 'Formato inválido: esperado array de metas' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();
    const metasAtualizadas = [];

    // Atualizar cada meta
    for (const meta of metas) {
      const { data: metaAtualizada, error } = await supabase
        .from('metas_negocio')
        .update({
          valor_semanal: meta.valor_semanal,
          valor_mensal: meta.valor_mensal,
          valor_unico: meta.valor_unico,
          meta_ativa: meta.meta_ativa,
          atualizado_por: user.user_id
        })
        .eq('id', meta.id)
        .eq('bar_id', user.bar_id)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao atualizar meta ${meta.id}:`, error);
        continue;
      }

      metasAtualizadas.push(metaAtualizada);
    }

    console.log(`✅ ${metasAtualizadas.length} metas atualizadas`);
    return NextResponse.json({
      success: true,
      data: metasAtualizadas,
      message: `${metasAtualizadas.length} metas atualizadas com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar metas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
