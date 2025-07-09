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

    // URL correta que deve ser usada
    const correctRedirectUri = 'https://sgb-contaazul.vercel.app/contaazul-callback';

    // Atualizar a URL no banco de dados
    const { data, error } = await supabase
      .from('api_credentials')
      .update({ 
        redirect_uri: correctRedirectUri,
        atualizado_em: new Date().toISOString()
      })
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar redirect URI:', error);
      return NextResponse.json({ error: 'Erro ao atualizar redirect URI' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Configuração ContaAzul não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Redirect URI atualizada com sucesso',
      oldUri: data.redirect_uri,
      newUri: correctRedirectUri
    });

  } catch (error) {
    console.error('Erro ao corrigir URL:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Endpoint para corrigir redirect URI do ContaAzul',
    info: 'Use POST para executar a correção'
  });
} 