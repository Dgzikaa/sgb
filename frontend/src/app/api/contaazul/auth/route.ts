import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Forá§ar renderizaá§á£o diná¢mica devido ao uso de request.url
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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
    
    // Para callback, barId á© extraá­do do state, entá£o ná£o á© obrigatá³rio aqui
    if (!barId && action !== 'callback') {
      return NextResponse.json({ error: 'barId á© obrigatá³rio' }, { status: 400 });
    }

    switch (action) {
      case 'authorize':
        return await handleAuthorize(barId!);
      case 'callback':
        return await handleCallback(searchParams);
      case 'status':
        return await handleStatus(barId!);
      case 'refresh':
        return await handleRefresh(barId!);
      case 'test':
        return await handleTestConnection(barId!);
      default:
        return NextResponse.json({ error: 'Aá§á£o ná£o reconhecida' }, { status: 400 });
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
      return NextResponse.json({ error: 'barId á© obrigatá³rio' }, { status: 400 });
    }

    switch (action) {
      case 'configure':
        return await handleConfigure(body);
      case 'disconnect':
        return await handleDisconnect(barId);
      default:
        return NextResponse.json({ error: 'Aá§á£o ná£o reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API ContaAzul Auth:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Gerar URL de autorizaá§á£o
async function handleAuthorize(barId: string) {
  try {
    console.log('ðŸ” AUTHORIZE - Iniciando autorizaá§á£o para barId:', barId);
    
    // Buscar credenciais sem filtro de ambiente primeiro
    let credentials = null;
    
    // Tentar buscar por ambiente especá­fico primeiro  
    const ambiente = process.env.NODE_ENV === 'development' ? 'desenvolvimento' : 'producao';
    console.log('ðŸ” AUTHORIZE - Tentando ambiente:', ambiente);
    
    const { data: envCredentials, error: envError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ambiente', ambiente)
      .eq('ativo', true)
      .single();
    
    if (envError) {
      console.log('ðŸ” AUTHORIZE - Ná£o encontrou no ambiente especá­fico, tentando fallback...');
      
      // Fallback: buscar qualquer credencial ativa para este bar
      const { data: fallbackCredentials, error: fallbackError } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', parseInt(barId))
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single();
        
      if (fallbackError) {
        console.error('Œ AUTHORIZE - Nenhuma credencial encontrada:', fallbackError);
      } else {
        credentials = fallbackCredentials;
        console.log('œ… AUTHORIZE - Credencial encontrada via fallback, ambiente:', credentials.ambiente);
      }
    } else {
      credentials = envCredentials;
      console.log('œ… AUTHORIZE - Credencial encontrada no ambiente especá­fico');
    }

    if (!credentials || !credentials.client_id || !credentials.redirect_uri) {
      return NextResponse.json({ 
        error: 'Credenciais ná£o configuradas. Configure client_id e redirect_uri primeiro.' 
      }, { status: 400 });
    }

    // Gerar state áºnico para seguraná§a - incluindo barId
    const stateData = {
      random: randomBytes(16).toString('hex'),
      barId: parseInt(barId)
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Salvar o state no banco
    await supabase
      .from('api_credentials')
      .update({ oauth_state: state })
      .eq('id', credentials.id);

    // Construir URL de autorizaá§á£o
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
    console.error('Erro ao gerar URL de autorizaá§á£o:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de autorizaá§á£o' }, { status: 500 });
  }
}

// Processar callback de autorizaá§á£o
async function handleCallback(searchParams: URLSearchParams) {
  try {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    let barId = searchParams.get('barId');

    console.log('ðŸ” CALLBACK - Pará¢metros recebidos:', { code: code ? 'presente' : 'ausente', state: state ? 'presente' : 'ausente', barId });

    if (!code || !state) {
      console.error('Œ CALLBACK - Pará¢metros obrigatá³rios ausentes');
      return NextResponse.json({ error: 'Pará¢metros obrigatá³rios ausentes' }, { status: 400 });
    }

    // Extrair barId do state se ná£o foi fornecido diretamente
    if (!barId) {
      try {
        console.log('ðŸ” CALLBACK - State recebido:', state);
        console.log('ðŸ” CALLBACK - State length:', state.length);
        const decoded = Buffer.from(state, 'base64').toString();
        console.log('ðŸ” CALLBACK - State decodificado string:', decoded);
        const stateData = JSON.parse(decoded);
        console.log('ðŸ” CALLBACK - State decodificado objeto:', stateData);
        barId = stateData.barId?.toString();
        console.log('ðŸ” CALLBACK - Bar ID extraá­do:', barId);
        console.log('ðŸ” CALLBACK - Bar ID tipo:', typeof barId);
      } catch (error) {
        console.error('Œ CALLBACK - Erro ao extrair barId do state:', error);
        console.error('Œ CALLBACK - State que causou erro:', state);
        console.error('Œ CALLBACK - Erro completo:', error);
      }
    }

    if (!barId) {
      console.error('Œ CALLBACK - Bar ID ná£o encontrado no state');
      console.error('Œ CALLBACK - State original:', state);
      console.error('Œ CALLBACK - Tentativa final de decodificaá§á£o...');
      
      // ášltima tentativa de debug
      try {
        const finalDecoded = Buffer.from(state, 'base64').toString();
        console.error('Œ CALLBACK - State final decodificado:', finalDecoded);
        const finalStateData = JSON.parse(finalDecoded);
        console.error('Œ CALLBACK - Objeto final:', finalStateData);
        console.error('Œ CALLBACK - barId no objeto:', finalStateData.barId);
      } catch (e) {
        console.error('Œ CALLBACK - Erro na tentativa final:', e);
      }
      
      return NextResponse.json({ 
        error: 'Bar ID ná£o encontrado no state',
        debug: {
          state: state,
          stateLength: state.length
        }
      }, { status: 400 });
    }

    // Buscar credenciais pelo state
    console.log('ðŸ” CALLBACK - Buscando credenciais para barId:', barId);
    console.log('ðŸ” CALLBACK - State recebido:', state);
    
    // Buscar credencial que possui este state especá­fico
    const { data: credentials, error: dbError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('oauth_state', state)
      .eq('ativo', true)
      .single();

    console.log('ðŸ” CALLBACK - Query executada:', {
      bar_id: parseInt(barId),
      sistema: 'contaazul',
      oauth_state: state,
      ativo: true
    });
    
    if (dbError) {
      console.error('Œ CALLBACK - Erro na busca:', dbError);
    }

    console.log('ðŸ” CALLBACK - Credenciais encontradas:', credentials ? 'SIM' : 'NáƒO');
    
    if (credentials) {
      console.log('ðŸ” CALLBACK - Client ID das credenciais:', credentials.client_id);
      console.log('ðŸ” CALLBACK - Client Secret das credenciais:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
      console.log('ðŸ” CALLBACK - Redirect URI das credenciais:', credentials.redirect_uri);
      console.log('ðŸ” CALLBACK - Ambiente das credenciais:', credentials.ambiente);
      console.log('ðŸ” CALLBACK - Estado OAuth das credenciais:', credentials.oauth_state);
    }

    if (!credentials) {
      console.error('Œ CALLBACK - State invá¡lido ou expirado');
      return NextResponse.json({ error: 'State invá¡lido ou expirado' }, { status: 400 });
    }

    // Verificar se já¡ temos tokens vá¡lidos (cá³digo já¡ foi processado)
    if (credentials.access_token && credentials.authorization_code === code) {
      console.log('œ… CALLBACK - Cá³digo já¡ foi processado anteriormente, retornando sucesso');
      return NextResponse.json({
        success: true,
        message: 'Autorizaá§á£o já¡ foi realizada com sucesso',
        tokenInfo: {
          expiresAt: credentials.expires_at, // œ… Corrigido para camelCase
          token_type: credentials.token_type || 'Bearer'
        }
      });
    }

    // Trocar cá³digo por token
    console.log('ðŸ” CALLBACK - Iniciando troca de cá³digo por token');
    const tokenResponse = await exchangeCodeForToken(code, credentials);
    
    console.log('ðŸ” CALLBACK - Resposta da troca de token:', tokenResponse.success ? 'SUCESSO' : 'ERRO');
    
    if (!tokenResponse.success) {
      console.error('Œ CALLBACK - Erro na troca de token:', tokenResponse.error);
      return NextResponse.json({ error: tokenResponse.error }, { status: 400 });
    }

    // Salvar tokens no banco
    console.log('ðŸ” CALLBACK - Salvando tokens no banco');
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    
    const { error: saveError } = await supabase
      .from('api_credentials')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt.toISOString(),
        authorization_code: code,
        last_token_refresh: new Date().toISOString(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', credentials.id);

    if (saveError) {
      console.error('Œ CALLBACK - Erro ao salvar tokens:', saveError);
      return NextResponse.json({ 
        error: 'Erro ao salvar tokens',
        details: saveError.message
      }, { status: 500 });
    }

    console.log('œ… CALLBACK - Tokens salvos com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Autorizaá§á£o realizada com sucesso',
      tokenInfo: {
        expiresAt: expiresAt, // œ… Corrigido para camelCase
        token_type: tokenResponse.token_type
      }
    });
  } catch (error) {
    console.error('Erro no callback de autorizaá§á£o:', error);
    return NextResponse.json({ error: 'Erro no callback de autorizaá§á£o' }, { status: 500 });
  }
}

// Trocar cá³digo por token
async function exchangeCodeForToken(code: string, credentials: any) {
  try {
    console.log('ðŸ” TOKEN - Iniciando troca de cá³digo por token');
    console.log('ðŸ” TOKEN - Client ID:', credentials.client_id);
    console.log('ðŸ” TOKEN - Client Secret:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
    console.log('ðŸ” TOKEN - Redirect URI:', credentials.redirect_uri);
    console.log('ðŸ” TOKEN - Code:', code);
    
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    console.log('ðŸ” TOKEN - Basic Auth criado:', basicAuth.substring(0, 20) + '...');
    
    const tokenPayload = {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: credentials.redirect_uri
    };
    
    console.log('ðŸ” TOKEN - Payload para envio:', {
      ...tokenPayload,
      client_secret: 'HIDDEN'
    });
    
    const response = await fetch(CONTAAZUL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams(tokenPayload)
    });

    console.log('ðŸ” TOKEN - Response status:', response.status);
    console.log('ðŸ” TOKEN - Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('ðŸ” TOKEN - Response data:', data);
    
    if (!response.ok) {
      console.error('Œ TOKEN - Erro na resposta:', data);
      return { success: false, error: data.error || 'Erro ao trocar cá³digo por token' };
    }

    console.log('œ… TOKEN - Token obtido com sucesso!');
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Œ TOKEN - Erro ao trocar cá³digo por token:', error);
    return { success: false, error: 'Erro ao trocar cá³digo por token' };
  }
}

// Verificar status da integraá§á£o
async function handleStatus(barId: string) {
  try {
    console.log('ðŸ” STATUS - Verificando status para barId:', barId);
    
    let credentials = null;
    
    // Buscar credenciais ativas para este bar (qualquer ambiente)
    const { data: directCredentials, error: directError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single();

    if (directError) {
      console.log('ðŸ” STATUS - Erro na busca:', directError);
    } else {
      credentials = directCredentials;
      console.log('ðŸ” STATUS - Credencial encontrada, ambiente:', credentials.ambiente);
    }

    if (!credentials) {
      console.log('ðŸ” STATUS - Nenhuma credencial encontrada');
      return NextResponse.json({ 
        connected: false,
        configured: false,
        message: 'Nenhuma credencial configurada' 
      });
    }
    
    console.log('ðŸ” STATUS - Credenciais encontradas:', {
      id: credentials.id,
      client_id: credentials.client_id ? 'PRESENTE' : 'AUSENTE',
      client_secret: credentials.client_secret ? 'PRESENTE' : 'AUSENTE',
      redirect_uri: credentials.redirect_uri ? 'PRESENTE' : 'AUSENTE',
      access_token: credentials.access_token ? 'PRESENTE' : 'AUSENTE'
    });

    // Verificar se está¡ configurado (tem credenciais bá¡sicas)
    const configured = !!(credentials.client_id && credentials.client_secret && credentials.redirect_uri);

    // Verificar se o token ainda á© vá¡lido
    const tokenValid = credentials.access_token && 
                      credentials.expires_at && 
                      new Date(credentials.expires_at) > new Date();

    if (!tokenValid && credentials.refresh_token) {
      console.log('ðŸ”„ STATUS - Token expirado, tentando renovar automaticamente...');
      
      try {
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
        
        if (response.ok) {
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

          console.log('œ… STATUS - Token renovado automaticamente!');
          
          return NextResponse.json({ 
            connected: true,
            configured: configured,
            tokenExpired: false,
            expiresAt: expiresAt,
            empresa: {
              id: credentials.empresa_id || '',
              nome: credentials.empresa_nome || '',
              cnpj: credentials.empresa_cnpj || ''
            },
            lastRefresh: new Date().toISOString(),
            refreshCount: (credentials.token_refresh_count || 0) + 1,
            debug: {
              access_token: data.access_token,
              refresh_token: data.refresh_token || credentials.refresh_token,
              authorization_code: credentials.authorization_code,
              client_id: credentials.client_id,
              environment: credentials.ambiente || 'producao'
            }
          });
        } else {
          console.log('Œ STATUS - Falha na renovaá§á£o automá¡tica:', data.error);
        }
      } catch (error) {
        console.log('Œ STATUS - Erro na renovaá§á£o automá¡tica:', error);
      }
    }

    if (!tokenValid) {
      return NextResponse.json({ 
        connected: false,
        configured: configured,
        tokenExpired: !!credentials.access_token, // true se tinha token mas expirou
        message: 'Token expirado',
        expiresAt: credentials.expires_at  // œ… Corrigido para camelCase
      });
    }

    return NextResponse.json({ 
      connected: true,
      configured: configured,
      tokenExpired: false,
      expiresAt: credentials.expires_at, // œ… Corrigido para camelCase
      empresa: {
        id: credentials.empresa_id || '',
        nome: credentials.empresa_nome || '',
        cnpj: credentials.empresa_cnpj || ''
      },
      lastRefresh: credentials.last_token_refresh,
      refreshCount: credentials.token_refresh_count || 0,
      // Dados para debug/testes locais
      debug: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        authorization_code: credentials.authorization_code,
        client_id: credentials.client_id,
        environment: credentials.ambiente || 'producao'
      }
    });

  } catch (error) {
    console.error('Œ STATUS - Erro geral:', error);
    return NextResponse.json({ 
      connected: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Renovar tokens
async function handleRefresh(barId: string) {
  try {
    // Buscar credenciais ativas (qualquer ambiente)
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single();

    if (!credentials || !credentials.refresh_token) {
      return NextResponse.json({ error: 'Token de renovaá§á£o ná£o disponá­vel' }, { status: 400 });
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
    const { barId, clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ 
        error: 'clientId, clientSecret e redirectUri sá£o obrigatá³rios' 
      }, { status: 400 });
    }

    console.log('ðŸ” CONFIGURE - Configurando credenciais para barId:', barId);

    // Usar sempre 'producao' como ambiente padrá£o para simplicidade
    const ambiente = 'producao';
    console.log('ðŸ” CONFIGURE - Usando ambiente:', ambiente);

    // Verificar se já¡ existe configuraá§á£o
    const { data: existing } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ambiente', ambiente)
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

// Testar conexá£o com a API
async function handleTestConnection(barId: string) {
  try {
    // Buscar credenciais ativas (qualquer ambiente)
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json({ error: 'Token de acesso ná£o disponá­vel' }, { status: 400 });
    }

    // Testar conexá£o fazendo uma chamada á  API da ContaAzul
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
        error: data.error || 'Erro na conexá£o com a API da ContaAzul' 
      }, { status: 400 });
    }

    // Log da resposta para debug
    console.log('œ… Resposta da API ContaAzul:', data);

    // Verificar se conseguiu acessar os serviá§os
    const servicosCount = data[0]?.itens?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Conexá£o testada com sucesso',
      apiInfo: {
        endpoint: '/v1/servicos',
        servicosEncontrados: servicosCount,
        status: 'API v2 funcionando'
      }
    });
  } catch (error) {
    console.error('Erro ao testar conexá£o:', error);
    return NextResponse.json({ error: 'Erro ao testar conexá£o' }, { status: 500 });
  }
}

// Desconectar integraá§á£o
async function handleDisconnect(barId: string) {
  try {
    // Desconectar todas as credenciais ativas para este bar
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
      .eq('sistema', 'contaazul')
      .eq('ativo', true);

    return NextResponse.json({
      success: true,
      message: 'Integraá§á£o desconectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar integraá§á£o:', error);
    return NextResponse.json({ error: 'Erro ao desconectar integraá§á£o' }, { status: 500 });
  }
} 
