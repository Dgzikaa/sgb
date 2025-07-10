import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    console.log('🚀 CONFIG RÁPIDA: Configurando ContaAzul...');

    const { 
      access_token, 
      refresh_token, 
      expires_at, 
      client_id, 
      client_secret,
      bar_id = 1  // Default para testes
    } = body;

    if (!access_token) {
      return NextResponse.json({ 
        error: 'access_token é obrigatório para configuração rápida' 
      }, { status: 400 });
    }

    // Criar/atualizar registro na api_credentials
    const credentialsData = {
      bar_id: parseInt(bar_id),
      sistema: 'contaazul',
      ambiente: 'producao',
      access_token,
      refresh_token,
      expires_at: expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h se não especificado
      client_id: client_id || 'configurado_via_api',
      client_secret: client_secret || 'configurado_via_api',
      redirect_uri: 'https://sgb-contaazul.vercel.app/contaazul-callback',
      token_type: 'Bearer',
      ativo: true,
      last_token_refresh: new Date().toISOString(),
      token_refresh_count: 0,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('bar_id', parseInt(bar_id))
      .eq('sistema', 'contaazul')
      .single();

    let resultado;

    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('api_credentials')
        .update(credentialsData)
        .eq('id', existing.id)
        .select();
      
      resultado = { acao: 'atualizado', data, error };
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('api_credentials')
        .insert(credentialsData)
        .select();
      
      resultado = { acao: 'criado', data, error };
    }

    if (resultado.error) {
      return NextResponse.json({ 
        error: `Erro ao ${resultado.acao} configuração: ${resultado.error.message}` 
      }, { status: 500 });
    }

    // Testar o token imediatamente
    let testeApi = null;
    try {
      const testResponse = await fetch('https://api-v2.contaazul.com/v1/servicos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      testeApi = {
        status: testResponse.status,
        ok: testResponse.ok,
        funcionando: testResponse.ok
      };
    } catch (err) {
      testeApi = {
        erro: err instanceof Error ? err.message : String(err),
        funcionando: false
      };
    }

    return NextResponse.json({
      success: true,
      message: `ContaAzul ${resultado.acao} com sucesso!`,
      configuracao: {
        id: resultado.data?.[0]?.id,
        bar_id: parseInt(bar_id),
        sistema: 'contaazul',
        token_valido_ate: credentialsData.expires_at,
        configurado_em: new Date().toISOString()
      },
      teste_api: testeApi,
      proximos_passos: [
        'Token configurado e salvo na api_credentials',
        'Teste a investigação em /relatorios/contaazul-investigacao-completa',
        'Se funcionar, configure corretamente via OAuth depois'
      ]
    });

  } catch (error) {
    console.error('❌ Erro na configuração rápida:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    info: 'API de Configuração Rápida ContaAzul',
    uso: 'POST com { access_token, refresh_token?, expires_at?, bar_id? }',
    objetivo: 'Configurar ContaAzul rapidamente para testes',
    exemplo: {
      method: 'POST',
      body: {
        access_token: 'seu_token_aqui',
        refresh_token: 'seu_refresh_token_aqui',
        expires_at: '2025-07-11T18:00:00.000Z',
        bar_id: 1
      }
    }
  });
} 