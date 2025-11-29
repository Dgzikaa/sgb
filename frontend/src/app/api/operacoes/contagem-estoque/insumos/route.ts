import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      data_contagem,
      insumo_id,
      insumo_codigo,
      insumo_nome,
      estoque_final,
      custo_unitario,
      observacoes,
      usuario_contagem
    } = body;

    console.log('📦 Registrando contagem de insumo:', {
      bar_id,
      data_contagem,
      insumo_nome,
      estoque_final
    });

    // Validação
    if (!bar_id || !data_contagem || !insumo_id || estoque_final === undefined) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Buscar última contagem do insumo para calcular estoque_inicial
    const { data: ultimaContagem } = await supabase
      .from('contagem_estoque_insumos')
      .select('estoque_final, data_contagem')
      .eq('bar_id', bar_id)
      .eq('insumo_id', insumo_id)
      .order('data_contagem', { ascending: false })
      .limit(1)
      .single();

    const estoqueInicial = ultimaContagem ? ultimaContagem.estoque_final : 0;

    // Buscar dados do insumo
    const { data: insumo, error: erroInsumo } = await supabase
      .from('insumos')
      .select('*')
      .eq('id', insumo_id)
      .single();

    if (erroInsumo || !insumo) {
      console.error('Erro ao buscar insumo:', erroInsumo);
      return NextResponse.json(
        { success: false, error: 'Insumo não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para inserção
    const dadosContagem = {
      bar_id,
      data_contagem,
      insumo_id,
      insumo_codigo: insumo_codigo || insumo.codigo,
      insumo_nome: insumo_nome || insumo.nome,
      estoque_inicial: estoqueInicial,
      estoque_final,
      quantidade_pedido: 0,
      consumo_periodo: estoqueInicial - estoque_final,
      valor_consumo: (estoqueInicial - estoque_final) * (custo_unitario || insumo.custo_unitario),
      tipo_local: insumo.tipo_local,
      categoria: insumo.categoria,
      unidade_medida: insumo.unidade_medida,
      custo_unitario: custo_unitario || insumo.custo_unitario,
      observacoes,
      usuario_contagem: usuario_contagem || 'Sistema',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verificar se já existe contagem para este insumo nesta data
    const { data: contagemExistente } = await supabase
      .from('contagem_estoque_insumos')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('insumo_id', insumo_id)
      .eq('data_contagem', data_contagem)
      .single();

    let result;
    if (contagemExistente) {
      // Atualizar contagem existente
      const { data, error } = await supabase
        .from('contagem_estoque_insumos')
        .update({...dadosContagem, updated_at: new Date().toISOString()})
        .eq('id', contagemExistente.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar contagem:', error);
        throw error;
      }
      result = data;
      console.log('✅ Contagem atualizada:', result.id);
    } else {
      // Inserir nova contagem
      const { data, error } = await supabase
        .from('contagem_estoque_insumos')
        .insert(dadosContagem)
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir contagem:', error);
        throw error;
      }
      result = data;
      console.log('✅ Nova contagem criada:', result.id);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: contagemExistente 
        ? 'Contagem atualizada com sucesso'
        : 'Contagem registrada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao registrar contagem:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao registrar contagem' 
      },
      { status: 500 }
    );
  }
}

// GET - Buscar contagens de insumos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bar_id = parseInt(searchParams.get('bar_id') || '3');
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const insumo_id = searchParams.get('insumo_id');
    const tipo_local = searchParams.get('tipo_local');
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('contagem_estoque_insumos')
      .select('*')
      .eq('bar_id', bar_id)
      .order('data_contagem', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data_inicio) {
      query = query.gte('data_contagem', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data_contagem', data_fim);
    }

    if (insumo_id) {
      query = query.eq('insumo_id', parseInt(insumo_id));
    }

    if (tipo_local && (tipo_local === 'bar' || tipo_local === 'cozinha')) {
      query = query.eq('tipo_local', tipo_local);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar contagens:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar contagens:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao buscar contagens' 
      },
      { status: 500 }
    );
  }
}

