import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// For·ßar renderiza·ß·£o din·¢mica devido ao uso de request.url
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
    
    // Para callback, barId ·© extra·≠do do state, ent·£o n·£o ·© obrigat·≥rio aqui
    if (!barId && action !== 'callback') {
      return NextResponse.json({ error: 'barId ·© obrigat·≥rio' }, { status: 400 });
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
        return NextResponse.json({ error: 'A·ß·£o n·£o reconhecida' }, { status: 400 });
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
      return NextResponse.json({ error: 'barId ·© obrigat·≥rio' }, { status: 400 });
    }

    switch (action) {
      case 'configure':
        return await handleConfigure(body);
      case 'disconnect':
        return await handleDisconnect(barId);
      default:
        return NextResponse.json({ error: 'A·ß·£o n·£o reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API ContaAzul Auth:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Gerar URL de autoriza·ß·£o
async function handleAuthorize(barId: string) {
  try {
    console.log('üîç AUTHORIZE - Iniciando autoriza·ß·£o para barId:', barId);
    
    // Buscar credenciais sem filtro de ambiente primeiro
    let credentials = null;
    
    // Tentar buscar por ambiente espec·≠fico primeiro  
    const ambiente = process.env.NODE_ENV === 'development' ? 'desenvolvimento' : 'producao';
    console.log('üîç AUTHORIZE - Tentando ambiente:', ambiente);
    
    const { data: envCredentials, error: envError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ambiente', ambiente)
      .eq('ativo', true)
      .single();
    
    if (envError) {
      console.log('üîç AUTHORIZE - N·£o encontrou no ambiente espec·≠fico, tentando fallback...');
      
      // Fallback: buscar qualquer credencial ativa para este bar
      const { data: fallbackCredentials, error: fallbackError } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', parseInt(barId))
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single();
        
      if (fallbackError) {
        console.error('ùå AUTHORIZE - Nenhuma credencial encontrada:', fallbackError);
      } else {
        credentials = fallbackCredentials;
        console.log('úÖ AUTHORIZE - Credencial encontrada via fallback, ambiente:', credentials.ambiente);
      }
    } else {
      credentials = envCredentials;
      console.log('úÖ AUTHORIZE - Credencial encontrada no ambiente espec·≠fico');
    }

    if (!credentials || !credentials.client_id || !credentials.redirect_uri) {
      return NextResponse.json({ 
        error: 'Credenciais n·£o configuradas. Configure client_id e redirect_uri primeiro.' 
      }, { status: 400 });
    }

    // Gerar state ·∫nico para seguran·ßa - incluindo barId
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

    // Construir URL de autoriza·ß·£o
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
    console.error('Erro ao gerar URL de autoriza·ß·£o:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de autoriza·ß·£o' }, { status: 500 });
  }
}

// Processar callback de autoriza·ß·£o
async function handleCallback(searchParams: URLSearchParams) {
  try {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    let barId = searchParams.get('barId');

    console.log('üîç CALLBACK - Par·¢metros recebidos:', { code: code ? 'presente' : 'ausente', state: state ? 'presente' : 'ausente', barId });

    if (!code || !state) {
      console.error('ùå CALLBACK - Par·¢metros obrigat·≥rios ausentes');
      return NextResponse.json({ error: 'Par·¢metros obrigat·≥rios ausentes' }, { status: 400 });
    }

    // Extrair barId do state se n·£o foi fornecido diretamente
    if (!barId) {
      try {
        console.log('üîç CALLBACK - State recebido:', state);
        console.log('üîç CALLBACK - State length:', state.length);
        const decoded = Buffer.from(state, 'base64').toString();
        console.log('üîç CALLBACK - State decodificado string:', decoded);
        const stateData = JSON.parse(decoded);
        console.log('üîç CALLBACK - State decodificado objeto:', stateData);
        barId = stateData.barId?.toString();
        console.log('üîç CALLBACK - Bar ID extra·≠do:', barId);
        console.log('üîç CALLBACK - Bar ID tipo:', typeof barId);
      } catch (error) {
        console.error('ùå CALLBACK - Erro ao extrair barId do state:', error);
        console.error('ùå CALLBACK - State que causou erro:', state);
        console.error('ùå CALLBACK - Erro completo:', error);
      }
    }

    if (!barId) {
      console.error('ùå CALLBACK - Bar ID n·£o encontrado no state');
      console.error('ùå CALLBACK - State original:', state);
      console.error('ùå CALLBACK - Tentativa final de decodifica·ß·£o...');
      
      // ·öltima tentativa de debug
      try {
        const finalDecoded = Buffer.from(state, 'base64').toString();
        console.error('ùå CALLBACK - State final decodificado:', finalDecoded);
        const finalStateData = JSON.parse(finalDecoded);
        console.error('ùå CALLBACK - Objeto final:', finalStateData);
        console.error('ùå CALLBACK - barId no objeto:', finalStateData.barId);
      } catch (e) {
        console.error('ùå CALLBACK - Erro na tentativa final:', e);
      }
      
      return NextResponse.json({ 
        error: 'Bar ID n·£o encontrado no state',
        debug: {
          state: state,
          stateLength: state.length
        }
      }, { status: 400 });
    }

    // Buscar credenciais pelo state
    console.log('üîç CALLBACK - Buscando credenciais para barId:', barId);
    console.log('üîç CALLBACK - State recebido:', state);
    
    // Buscar credencial que possui este state espec·≠fico
    const { data: credentials, error: dbError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('oauth_state', state)
      .eq('ativo', true)
      .single();

    console.log('üîç CALLBACK - Query executada:', {
      bar_id: parseInt(barId),
      sistema: 'contaazul',
      oauth_state: state,
      ativo: true
    });
    
    if (dbError) {
      console.error('ùå CALLBACK - Erro na busca:', dbError);
    }

    console.log('üîç CALLBACK - Credenciais encontradas:', credentials ? 'SIM' : 'N·ÉO');
    
    if (credentials) {
      console.log('üîç CALLBACK - Client ID das credenciais:', credentials.client_id);
      console.log('üîç CALLBACK - Client Secret das credenciais:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
      console.log('üîç CALLBACK - Redirect URI das credenciais:', credentials.redirect_uri);
      console.log('üîç CALLBACK - Ambiente das credenciais:', credentials.ambiente);
      console.log('üîç CALLBACK - Estado OAuth das credenciais:', credentials.oauth_state);
    }

    if (!credentials) {
      console.error('ùå CALLBACK - State inv·°lido ou expirado');
      return NextResponse.json({ error: 'State inv·°lido ou expirado' }, { status: 400 });
    }

    // Verificar se j·° temos tokens v·°lidos (c·≥digo j·° foi processado)
    if (credentials.access_token && credentials.authorization_code === code) {
      console.log('úÖ CALLBACK - C·≥digo j·° foi processado anteriormente, retornando sucesso');
      return NextResponse.json({
        success: true,
        message: 'Autoriza·ß·£o j·° foi realizada com sucesso',
        tokenInfo: {
          expiresAt: credentials.expires_at, // úÖ Corrigido para camelCase
          token_type: credentials.token_type || 'Bearer'
        }
      });
    }

    // Trocar c·≥digo por token
    console.log('üîç CALLBACK - Iniciando troca de c·≥digo por token');
    const tokenResponse = await exchangeCodeForToken(code, credentials);
    
    console.log('üîç CALLBACK - Resposta da troca de token:', tokenResponse.success ? 'SUCESSO' : 'ERRO');
    
    if (!tokenResponse.success) {
      console.error('ùå CALLBACK - Erro na troca de token:', tokenResponse.error);
      return NextResponse.json({ error: tokenResponse.error }, { status: 400 });
    }

    // Salvar tokens no banco
    console.log('üîç CALLBACK - Salvando tokens no banco');
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
      console.error('ùå CALLBACK - Erro ao salvar tokens:', saveError);
      return NextResponse.json({ 
        error: 'Erro ao salvar tokens',
        details: saveError.message
      }, { status: 500 });
    }

    console.log('úÖ CALLBACK - Tokens salvos com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Autoriza·ß·£o realizada com sucesso',
      tokenInfo: {
        expiresAt: expiresAt, // úÖ Corrigido para camelCase
        token_type: tokenResponse.token_type
      }
    });
  } catch (error) {
    console.error('Erro no callback de autoriza·ß·£o:', error);
    return NextResponse.json({ error: 'Erro no callback de autoriza·ß·£o' }, { status: 500 });
  }
}

// Trocar c·≥digo por token
async function exchangeCodeForToken(code: string, credentials: any) {
  try {
    console.log('üîç TOKEN - Iniciando troca de c·≥digo por token');
    console.log('üîç TOKEN - Client ID:', credentials.client_id);
    console.log('üîç TOKEN - Client Secret:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
    console.log('üîç TOKEN - Redirect URI:', credentials.redirect_uri);
    console.log('üîç TOKEN - Code:', code);
    
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    console.log('üîç TOKEN - Basic Auth criado:', basicAuth.substring(0, 20) + '...');
    
    const tokenPayload = {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: credentials.redirect_uri
    };
    
    console.log('üîç TOKEN - Payload para envio:', {
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

    console.log('üîç TOKEN - Response status:', response.status);
    console.log('üîç TOKEN - Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('üîç TOKEN - Response data:', data);
    
    if (!response.ok) {
      console.error('ùå TOKEN - Erro na resposta:', data);
      return { success: false, error: data.error || 'Erro ao trocar c·≥digo por token' };
    }

    console.log('úÖ TOKEN - Token obtido com sucesso!');
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('ùå TOKEN - Erro ao trocar c·≥digo por token:', error);
    return { success: false, error: 'Erro ao trocar c·≥digo por token' };
  }
}

// Verificar status da integra·ß·£o
async function handleStatus(barId: string) {
  try {
    console.log('üîç STATUS - Verificando status para barId:', barId);
    
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
      console.log('üîç STATUS - Erro na busca:', directError);
    } else {
      credentials = directCredentials;
      console.log('üîç STATUS - Credencial encontrada, ambiente:', credentials.ambiente);
    }

    if (!credentials) {
      console.log('üîç STATUS - Nenhuma credencial encontrada');
      return NextResponse.json({ 
        connected: false,
        configured: false,
        message: 'Nenhuma credencial configurada' 
      });
    }
    
    console.log('üîç STATUS - Credenciais encontradas:', {
      id: credentials.id,
      client_id: credentials.client_id ? 'PRESENTE' : 'AUSENTE',
      client_secret: credentials.client_secret ? 'PRESENTE' : 'AUSENTE',
      redirect_uri: credentials.redirect_uri ? 'PRESENTE' : 'AUSENTE',
      access_token: credentials.access_token ? 'PRESENTE' : 'AUSENTE'
    });

    // Verificar se est·° configurado (tem credenciais b·°sicas)
    const configured = !!(credentials.client_id && credentials.client_secret && credentials.redirect_uri);

    // Verificar se o token ainda ·© v·°lido
    const tokenValid = credentials.access_token && 
                      credentials.expires_at && 
                      new Date(credentials.expires_at) > new Date();

    if (!tokenValid && credentials.refresh_token) {
      console.log('üîÑ STATUS - Token expirado, tentando renovar automaticamente...');
      
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

          console.log('úÖ STATUS - Token renovado automaticamente!');
          
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
          console.log('ùå STATUS - Falha na renova·ß·£o autom·°tica:', data.error);
        }
      } catch (error) {
        console.log('ùå STATUS - Erro na renova·ß·£o autom·°tica:', error);
      }
    }

    if (!tokenValid) {
      return NextResponse.json({ 
        connected: false,
        configured: configured,
        tokenExpired: !!credentials.access_token, // true se tinha token mas expirou
        message: 'Token expirado',
        expiresAt: credentials.expires_at  // úÖ Corrigido para camelCase
      });
    }

    return NextResponse.json({ 
      connected: true,
      configured: configured,
      tokenExpired: false,
      expiresAt: credentials.expires_at, // úÖ Corrigido para camelCase
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
    console.error('ùå STATUS - Erro geral:', error);
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
      return NextResponse.json({ error: 'Token de renova·ß·£o n·£o dispon·≠vel' }, { status: 400 });
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
        error: 'clientId, clientSecret e redirectUri s·£o obrigat·≥rios' 
      }, { status: 400 });
    }

    console.log('üîç CONFIGURE - Configurando credenciais para barId:', barId);

    // Usar sempre 'producao' como ambiente padr·£o para simplicidade
    const ambiente = 'producao';
    console.log('üîç CONFIGURE - Usando ambiente:', ambiente);

    // Verificar se j·° existe configura·ß·£o
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

// Testar conex·£o com a API
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
      return NextResponse.json({ error: 'Token de acesso n·£o dispon·≠vel' }, { status: 400 });
    }

    // Testar conex·£o fazendo uma chamada ·† API da ContaAzul
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
        error: data.error || 'Erro na conex·£o com a API da ContaAzul' 
      }, { status: 400 });
    }

    // Log da resposta para debug
    console.log('úÖ Resposta da API ContaAzul:', data);

    // Verificar se conseguiu acessar os servi·ßos
    const servicosCount = data[0]?.itens?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Conex·£o testada com sucesso',
      apiInfo: {
        endpoint: '/v1/servicos',
        servicosEncontrados: servicosCount,
        status: 'API v2 funcionando'
      }
    });
  } catch (error) {
    console.error('Erro ao testar conex·£o:', error);
    return NextResponse.json({ error: 'Erro ao testar conex·£o' }, { status: 500 });
  }
}

// Desconectar integra·ß·£o
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
      message: 'Integra·ß·£o desconectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar integra·ß·£o:', error);
    return NextResponse.json({ error: 'Erro ao desconectar integra·ß·£o' }, { status: 500 });
  }
} 
