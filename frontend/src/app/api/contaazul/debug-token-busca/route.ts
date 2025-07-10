import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DEBUG: Investigando busca de token...');

    // Buscar TODOS os registros ContaAzul para debug
    const { data: allContaAzul } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul');

    console.log('📋 Todos os registros ContaAzul:', allContaAzul);

    // Buscar com a lógica ANTIGA
    const { data: tokensAntigos } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .eq('ativo', true);

    console.log('🔴 Busca ANTIGA (ativo=true):', tokensAntigos);

    // Buscar com a lógica NOVA
    const { data: tokensNovos } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .not('access_token', 'is', null)
      .gte('expires_at', new Date().toISOString())
      .order('last_token_refresh', { ascending: false });

    console.log('🟢 Busca NOVA (token válido):', tokensNovos);

    // Análise detalhada
    const agora = new Date();
    const analise = allContaAzul?.map((token: any) => ({
      id: token.id,
      bar_id: token.bar_id,
      ativo: token.ativo,
      tem_access_token: !!token.access_token,
      access_token_preview: token.access_token ? `${token.access_token.substring(0, 10)}...` : null,
      expires_at: token.expires_at,
      token_expirado: token.expires_at ? new Date(token.expires_at) < agora : null,
      last_token_refresh: token.last_token_refresh,
      valido_para_nova_busca: !!(
        token.access_token && 
        token.expires_at && 
        new Date(token.expires_at) > agora
      )
    })) || [];

    return NextResponse.json({
      debug: 'Análise completa da busca de tokens ContaAzul',
      timestamp: new Date().toISOString(),
      total_registros: allContaAzul?.length || 0,
      registros_busca_antiga: tokensAntigos?.length || 0,
      registros_busca_nova: tokensNovos?.length || 0,
      token_encontrado_nova_busca: tokensNovos && tokensNovos.length > 0,
      analise_detalhada: analise,
      todos_registros: allContaAzul,
      recomendacao: tokensNovos && tokensNovos.length > 0 ? 
        'Token encontrado com nova busca! Investigação deve funcionar.' :
        'Nenhum token válido encontrado. Verificar configuração OAuth.'
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 