import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('receitas')
      .select('id, receita_nome, receita_codigo, receita_categoria')
      .eq('ativo', true)
      .order('receita_nome');

    if (search) {
      query = query.or(`receita_nome.ilike.%${search}%,receita_codigo.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return NextResponse.json({ receitas: data || [] });
  } catch (error: any) {
    console.error('Erro ao buscar receitas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar receitas' },
      { status: 500 }
    );
  }
}

