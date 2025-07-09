import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');
    
    if (!barId) {
      return NextResponse.json({ error: 'barId é obrigatório' }, { status: 400 });
    }

    // URL fixa do Vercel
    const fixedRedirectUri = 'https://sgb-v2.vercel.app/contaazul-callback';

    // Atualizar redirect_uri no banco
    const { data, error } = await supabase
      .from('api_credentials')
      .update({
        redirect_uri: fixedRedirectUri,
        atualizado_em: new Date().toISOString()
      })
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Redirect URI atualizada com sucesso',
      updated: {
        redirect_uri: fixedRedirectUri
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar redirect URI:', error);
    return NextResponse.json({ error: 'Erro ao atualizar redirect URI' }, { status: 500 });
  }
} 