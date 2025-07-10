import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar configurações do ContaAzul na tabela api_credentials
    const { data: configuracoes, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar configurações', details: error.message }, { status: 500 });
    }

    const configuracaoAtiva = configuracoes?.find((config: any) => config.ativo);
    
    const resultado = {
      total_configuracoes: configuracoes?.length || 0,
      tem_configuracao_ativa: !!configuracaoAtiva,
      configuracao_ativa: configuracaoAtiva ? {
        id: configuracaoAtiva.id,
        bar_id: configuracaoAtiva.bar_id,
        sistema: configuracaoAtiva.sistema,
        ambiente: configuracaoAtiva.ambiente,
        client_id: configuracaoAtiva.client_id ? 'Configurado' : 'Não configurado',
        client_secret: configuracaoAtiva.client_secret ? 'Configurado' : 'Não configurado',
        access_token: configuracaoAtiva.access_token ? 'Configurado' : 'Não configurado',
        refresh_token: configuracaoAtiva.refresh_token ? 'Configurado' : 'Não configurado',
        expires_at: configuracaoAtiva.expires_at,
        token_expirado: configuracaoAtiva.expires_at ? 
          new Date(configuracaoAtiva.expires_at) < new Date() : 
          'Não informado',
        empresa_nome: configuracaoAtiva.empresa_nome,
        empresa_cnpj: configuracaoAtiva.empresa_cnpj,
        criado_em: configuracaoAtiva.criado_em,
        atualizado_em: configuracaoAtiva.atualizado_em,
        last_token_refresh: configuracaoAtiva.last_token_refresh,
        token_refresh_count: configuracaoAtiva.token_refresh_count,
        ativo: configuracaoAtiva.ativo,
      } : null,
      todas_configuracoes: configuracoes?.map((config: any) => ({
        id: config.id,
        bar_id: config.bar_id,
        sistema: config.sistema,
        ambiente: config.ambiente,
        ativo: config.ativo,
        tem_access_token: !!config.access_token,
        expires_at: config.expires_at,
        token_expirado: config.expires_at ? 
          new Date(config.expires_at) < new Date() : 
          'Não informado',
        empresa_nome: config.empresa_nome,
        criado_em: config.criado_em,
        last_token_refresh: config.last_token_refresh,
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