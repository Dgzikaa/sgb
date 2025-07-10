import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// URLs da API da Conta Azul
const CONTAAZUL_AUTH_URL = 'https://auth.contaazul.com/oauth2/authorize';
const CONTAAZUL_TOKEN_URL = 'https://auth.contaazul.com/oauth2/token';
const CONTAAZUL_SCOPES = 'openid profile aws.cognito.signin.user.admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const barId = searchParams.get('barId');
    
    if (!barId) {
      return NextResponse.json({ error: 'barId é obrigatório' }, { status: 400 });
    }

    switch (action) {
      case 'authorize':
        return await handleAuthorize(barId);
      case 'callback':
        return await handleCallback(searchParams);
      case 'status':
        return await handleStatus(barId);
      case 'refresh':
        return await handleRefresh(barId);
      case 'test':
        return await handleTestConnection(barId);
      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API ContaAzul Auth:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, barId } = body;

    if (!barId) {
      return NextResponse.json({ error: 'barId é obrigatório' }, { status: 400 });
    }

    switch (action) {
      case 'configure':
        return await handleConfigure(body);
      case 'disconnect':
        return await handleDisconnect(barId);
      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API ContaAzul Auth:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Gerar URL de autorização
async function handleAuthorize(barId: string) {
  try {
    // Verificar se já existem credenciais configuradas
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.client_id || !credentials.redirect_uri) {
      return NextResponse.json({ 
        error: 'Credenciais não configuradas. Configure client_id e redirect_uri primeiro.' 
      }, { status: 400 });
    }

    // Gerar state único para segurança
    const state = randomBytes(16).toString('hex');
    
    // Salvar o state no banco
    await supabase
      .from('api_credentials')
      .update({ oauth_state: state })
      .eq('id', credentials.id);

    // Construir URL de autorização
    const authUrl = new URL(CONTAAZUL_AUTH_URL);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', credentials.client_id);
    authUrl.searchParams.append('redirect_uri', credentials.redirect_uri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', CONTAAZUL_SCOPES);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      state
    });
  } catch (error) {
    console.error('Erro ao gerar URL de autorização:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de autorização' }, { status: 500 });
  }
}

// Processar callback de autorização
async function handleCallback(searchParams: URLSearchParams) {
  try {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const barId = searchParams.get('barId');

    if (!code || !state || !barId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    // Verificar state
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('oauth_state', state)
      .single();

    if (!credentials) {
      return NextResponse.json({ error: 'State inválido ou expirado' }, { status: 400 });
    }

    // Trocar código por token
    const tokenResponse = await exchangeCodeForToken(code, credentials);
    
    if (!tokenResponse.success) {
      return NextResponse.json({ error: tokenResponse.error }, { status: 400 });
    }

    // Salvar tokens no banco
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    
    await supabase
      .from('api_credentials')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt.toISOString(),
        authorization_code: code,
        last_token_refresh: new Date().toISOString(),
        oauth_state: null // Limpar state após uso
      })
      .eq('id', credentials.id);

    return NextResponse.json({
      success: true,
      message: 'Autorização realizada com sucesso',
      tokenInfo: {
        expires_at: expiresAt,
        token_type: tokenResponse.token_type
      }
    });
  } catch (error) {
    console.error('Erro no callback de autorização:', error);
    return NextResponse.json({ error: 'Erro no callback de autorização' }, { status: 500 });
  }
}

// Trocar código por token
async function exchangeCodeForToken(code: string, credentials: any) {
  try {
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    
    const response = await fetch(CONTAAZUL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: credentials.redirect_uri
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao trocar código por token' };
    }

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Erro ao trocar código por token:', error);
    return { success: false, error: 'Erro ao trocar código por token' };
  }
}

// Verificar status da integração
async function handleStatus(barId: string) {
  try {
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        configured: false,
        message: 'Integração não configurada'
      });
    }

    const hasBasicConfig = credentials.client_id && credentials.client_secret && credentials.redirect_uri;
    const hasTokens = credentials.access_token && credentials.refresh_token;
    const tokenValid = credentials.expires_at ? new Date(credentials.expires_at) > new Date() : false;

    return NextResponse.json({
      connected: hasTokens && tokenValid,
      configured: hasBasicConfig,
      tokenExpired: hasTokens && !tokenValid,
      expiresAt: credentials.expires_at,
      empresa: {
        id: credentials.empresa_id,
        nome: credentials.empresa_nome,
        cnpj: credentials.empresa_cnpj
      },
      lastRefresh: credentials.last_token_refresh,
      refreshCount: credentials.token_refresh_count
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 });
  }
}

// Renovar tokens
async function handleRefresh(barId: string) {
  try {
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.refresh_token) {
      return NextResponse.json({ error: 'Token de renovação não disponível' }, { status: 400 });
    }

    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    
    const response = await fetch(CONTAAZUL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Erro ao renovar token' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
    
    await supabase
      .from('api_credentials')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || credentials.refresh_token,
        expires_at: expiresAt.toISOString(),
        last_token_refresh: new Date().toISOString(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1
      })
      .eq('id', credentials.id);

    return NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso',
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return NextResponse.json({ error: 'Erro ao renovar token' }, { status: 500 });
  }
}

// Configurar credenciais
async function handleConfigure(body: any) {
  try {
    const { barId, clientId, clientSecret, redirectUri, ambiente = 'producao' } = body;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ 
        error: 'clientId, clientSecret e redirectUri são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se já existe configuração
    const { data: existing } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    const credentialsData = {
      bar_id: parseInt(barId),
      sistema: 'contaazul',
      ambiente,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      scopes: CONTAAZUL_SCOPES,
      base_url: CONTAAZUL_AUTH_URL,
      ativo: true,
      atualizado_em: new Date().toISOString()
    };

    if (existing) {
      // Atualizar existente
      await supabase
        .from('api_credentials')
        .update(credentialsData)
        .eq('id', existing.id);
    } else {
      // Criar novo
      await supabase
        .from('api_credentials')
        .insert({
          ...credentialsData,
          criado_em: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciais configuradas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao configurar credenciais:', error);
    return NextResponse.json({ error: 'Erro ao configurar credenciais' }, { status: 500 });
  }
}

// Testar conexão com a API
async function handleTestConnection(barId: string) {
  try {
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json({ error: 'Token de acesso não disponível' }, { status: 400 });
    }

    // Testar conexão fazendo uma chamada à API da ContaAzul
    const response = await fetch('https://api-v2.contaazul.com/v1/servicos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || 'Erro na conexão com a API da ContaAzul' 
      }, { status: 400 });
    }

    // Log da resposta para debug
    console.log('✅ Resposta da API ContaAzul:', data);

    // Verificar se conseguiu acessar os serviços
    const servicosCount = data[0]?.itens?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Conexão testada com sucesso',
      apiInfo: {
        endpoint: '/v1/servicos',
        servicosEncontrados: servicosCount,
        status: 'API v2 funcionando'
      }
    });
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return NextResponse.json({ error: 'Erro ao testar conexão' }, { status: 500 });
  }
}

// Desconectar integração
async function handleDisconnect(barId: string) {
  try {
    await supabase
      .from('api_credentials')
      .update({
        access_token: null,
        refresh_token: null,
        authorization_code: null,
        expires_at: null,
        oauth_state: null,
        empresa_id: null,
        empresa_nome: null,
        empresa_cnpj: null,
        last_token_refresh: null,
        token_refresh_count: 0,
        ativo: false
      })
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul');

    return NextResponse.json({
      success: true,
      message: 'Integração desconectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar integração:', error);
    return NextResponse.json({ error: 'Erro ao desconectar integração' }, { status: 500 });
  }
} 