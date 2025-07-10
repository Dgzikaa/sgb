import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar configurações do ContaAzul
    const { data: configuracoes, error } = await supabase
      .from('contaazul_configuracoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar configurações', details: error.message }, { status: 500 });
    }

    const configuracaoAtiva = configuracoes?.find((config: any) => config.ativo);
    
    const resultado = {
      total_configuracoes: configuracoes?.length || 0,
      tem_configuracao_ativa: !!configuracaoAtiva,
      configuracao_ativa: configuracaoAtiva ? {
        id: configuracaoAtiva.id,
        client_id: configuracaoAtiva.client_id ? 'Configurado' : 'Não configurado',
        client_secret: configuracaoAtiva.client_secret ? 'Configurado' : 'Não configurado',
        access_token: configuracaoAtiva.access_token ? 'Configurado' : 'Não configurado',
        refresh_token: configuracaoAtiva.refresh_token ? 'Configurado' : 'Não configurado',
        token_expires_at: configuracaoAtiva.token_expires_at,
        token_expirado: configuracaoAtiva.token_expires_at ? 
          new Date(configuracaoAtiva.token_expires_at) < new Date() : 
          'Não informado',
        created_at: configuracaoAtiva.created_at,
        updated_at: configuracaoAtiva.updated_at,
        ativo: configuracaoAtiva.ativo,
      } : null,
      todas_configuracoes: configuracoes?.map((config: any) => ({
        id: config.id,
        ativo: config.ativo,
        tem_access_token: !!config.access_token,
        token_expires_at: config.token_expires_at,
        token_expirado: config.token_expires_at ? 
          new Date(config.token_expires_at) < new Date() : 
          'Não informado',
        created_at: config.created_at,
      })) || [],
    };

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 