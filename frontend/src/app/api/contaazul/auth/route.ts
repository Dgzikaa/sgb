import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Forçar renderização dinâmica devido ao uso de request.url
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
    
    // Para callback, barId é extraído do state, então não é obrigatório aqui
    if (!barId && action !== 'callback') {
      return NextResponse.json({ error: 'barId é obrigatório' }, { status: 400 });
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
    console.log('🔍 AUTHORIZE - Iniciando autorização para barId:', barId);
    
    // Buscar credenciais sem filtro de ambiente primeiro
    let credentials = null;
    
    // Tentar buscar por ambiente específico primeiro  
    const ambiente = process.env.NODE_ENV === 'development' ? 'desenvolvimento' : 'producao';
    console.log('🔍 AUTHORIZE - Tentando ambiente:', ambiente);
    
    const { data: envCredentials, error: envError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ambiente', ambiente)
      .eq('ativo', true)
      .single();
    
    if (envError) {
      console.log('🔍 AUTHORIZE - Não encontrou no ambiente específico, tentando fallback...');
      
      // Fallback: buscar qualquer credencial ativa para este bar
      const { data: fallbackCredentials, error: fallbackError } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', parseInt(barId))
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single();
        
      if (fallbackError) {
        console.error('❌ AUTHORIZE - Nenhuma credencial encontrada:', fallbackError);
      } else {
        credentials = fallbackCredentials;
        console.log('✅ AUTHORIZE - Credencial encontrada via fallback, ambiente:', credentials.ambiente);
      }
    } else {
      credentials = envCredentials;
      console.log('✅ AUTHORIZE - Credencial encontrada no ambiente específico');
    }

    if (!credentials || !credentials.client_id || !credentials.redirect_uri) {
      return NextResponse.json({ 
        error: 'Credenciais não configuradas. Configure client_id e redirect_uri primeiro.' 
      }, { status: 400 });
    }

    // Gerar state único para segurança - incluindo barId
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
    let barId = searchParams.get('barId');

    console.log('🔍 CALLBACK - Parâmetros recebidos:', { code: code ? 'presente' : 'ausente', state: state ? 'presente' : 'ausente', barId });

    if (!code || !state) {
      console.error('❌ CALLBACK - Parâmetros obrigatórios ausentes');
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    // Extrair barId do state se não foi fornecido diretamente
    if (!barId) {
      try {
        console.log('🔍 CALLBACK - State recebido:', state);
        console.log('🔍 CALLBACK - State length:', state.length);
        const decoded = Buffer.from(state, 'base64').toString();
        console.log('🔍 CALLBACK - State decodificado string:', decoded);
        const stateData = JSON.parse(decoded);
        console.log('🔍 CALLBACK - State decodificado objeto:', stateData);
        barId = stateData.barId?.toString();
        console.log('🔍 CALLBACK - Bar ID extraído:', barId);
        console.log('🔍 CALLBACK - Bar ID tipo:', typeof barId);
      } catch (error) {
        console.error('❌ CALLBACK - Erro ao extrair barId do state:', error);
        console.error('❌ CALLBACK - State que causou erro:', state);
        console.error('❌ CALLBACK - Erro completo:', error);
      }
    }

    if (!barId) {
      console.error('❌ CALLBACK - Bar ID não encontrado no state');
      console.error('❌ CALLBACK - State original:', state);
      console.error('❌ CALLBACK - Tentativa final de decodificação...');
      
      // Última tentativa de debug
      try {
        const finalDecoded = Buffer.from(state, 'base64').toString();
        console.error('❌ CALLBACK - State final decodificado:', finalDecoded);
        const finalStateData = JSON.parse(finalDecoded);
        console.error('❌ CALLBACK - Objeto final:', finalStateData);
        console.error('❌ CALLBACK - barId no objeto:', finalStateData.barId);
      } catch (e) {
        console.error('❌ CALLBACK - Erro na tentativa final:', e);
      }
      
      return NextResponse.json({ 
        error: 'Bar ID não encontrado no state',
        debug: {
          state: state,
          stateLength: state.length
        }
      }, { status: 400 });
    }

    // Buscar credenciais pelo state
    console.log('🔍 CALLBACK - Buscando credenciais para barId:', barId);
    console.log('🔍 CALLBACK - State recebido:', state);
    
    // Buscar credencial que possui este state específico
    const { data: credentials, error: dbError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('oauth_state', state)
      .eq('ativo', true)
      .single();

    console.log('🔍 CALLBACK - Query executada:', {
      bar_id: parseInt(barId),
      sistema: 'contaazul',
      oauth_state: state,
      ativo: true
    });
    
    if (dbError) {
      console.error('❌ CALLBACK - Erro na busca:', dbError);
    }

    console.log('🔍 CALLBACK - Credenciais encontradas:', credentials ? 'SIM' : 'NÃO');
    
    if (credentials) {
      console.log('🔍 CALLBACK - Client ID das credenciais:', credentials.client_id);
      console.log('🔍 CALLBACK - Client Secret das credenciais:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
      console.log('🔍 CALLBACK - Redirect URI das credenciais:', credentials.redirect_uri);
      console.log('🔍 CALLBACK - Ambiente das credenciais:', credentials.ambiente);
      console.log('🔍 CALLBACK - Estado OAuth das credenciais:', credentials.oauth_state);
    }

    if (!credentials) {
      console.error('❌ CALLBACK - State inválido ou expirado');
      return NextResponse.json({ error: 'State inválido ou expirado' }, { status: 400 });
    }

    // Verificar se já temos tokens válidos (código já foi processado)
    if (credentials.access_token && credentials.authorization_code === code) {
      console.log('✅ CALLBACK - Código já foi processado anteriormente, retornando sucesso');
      return NextResponse.json({
        success: true,
        message: 'Autorização já foi realizada com sucesso',
        tokenInfo: {
          expiresAt: credentials.expires_at, // ✅ Corrigido para camelCase
          token_type: credentials.token_type || 'Bearer'
        }
      });
    }

    // Trocar código por token
    console.log('🔍 CALLBACK - Iniciando troca de código por token');
    const tokenResponse = await exchangeCodeForToken(code, credentials);
    
    console.log('🔍 CALLBACK - Resposta da troca de token:', tokenResponse.success ? 'SUCESSO' : 'ERRO');
    
    if (!tokenResponse.success) {
      console.error('❌ CALLBACK - Erro na troca de token:', tokenResponse.error);
      return NextResponse.json({ error: tokenResponse.error }, { status: 400 });
    }

    // Salvar tokens no banco
    console.log('🔍 CALLBACK - Salvando tokens no banco');
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
      console.error('❌ CALLBACK - Erro ao salvar tokens:', saveError);
      return NextResponse.json({ 
        error: 'Erro ao salvar tokens',
        details: saveError.message
      }, { status: 500 });
    }

    console.log('✅ CALLBACK - Tokens salvos com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Autorização realizada com sucesso',
      tokenInfo: {
        expiresAt: expiresAt, // ✅ Corrigido para camelCase
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
    console.log('🔍 TOKEN - Iniciando troca de código por token');
    console.log('🔍 TOKEN - Client ID:', credentials.client_id);
    console.log('🔍 TOKEN - Client Secret:', credentials.client_secret ? 'PRESENTE' : 'AUSENTE');
    console.log('🔍 TOKEN - Redirect URI:', credentials.redirect_uri);
    console.log('🔍 TOKEN - Code:', code);
    
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    console.log('🔍 TOKEN - Basic Auth criado:', basicAuth.substring(0, 20) + '...');
    
    const tokenPayload = {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: credentials.redirect_uri
    };
    
    console.log('🔍 TOKEN - Payload para envio:', {
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

    console.log('🔍 TOKEN - Response status:', response.status);
    console.log('🔍 TOKEN - Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('🔍 TOKEN - Response data:', data);
    
    if (!response.ok) {
      console.error('❌ TOKEN - Erro na resposta:', data);
      return { success: false, error: data.error || 'Erro ao trocar código por token' };
    }

    console.log('✅ TOKEN - Token obtido com sucesso!');
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('❌ TOKEN - Erro ao trocar código por token:', error);
    return { success: false, error: 'Erro ao trocar código por token' };
  }
}

// Verificar status da integração
async function handleStatus(barId: string) {
  try {
    console.log('🔍 STATUS - Verificando status para barId:', barId);
    
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
      console.log('🔍 STATUS - Erro na busca:', directError);
    } else {
      credentials = directCredentials;
      console.log('🔍 STATUS - Credencial encontrada, ambiente:', credentials.ambiente);
    }

    if (!credentials) {
      console.log('🔍 STATUS - Nenhuma credencial encontrada');
      return NextResponse.json({ 
        connected: false,
        configured: false,
        message: 'Nenhuma credencial configurada' 
      });
    }
    
    console.log('🔍 STATUS - Credenciais encontradas:', {
      id: credentials.id,
      client_id: credentials.client_id ? 'PRESENTE' : 'AUSENTE',
      client_secret: credentials.client_secret ? 'PRESENTE' : 'AUSENTE',
      redirect_uri: credentials.redirect_uri ? 'PRESENTE' : 'AUSENTE',
      access_token: credentials.access_token ? 'PRESENTE' : 'AUSENTE'
    });

    // Verificar se está configurado (tem credenciais básicas)
    const configured = !!(credentials.client_id && credentials.client_secret && credentials.redirect_uri);

    // Verificar se o token ainda é válido
    const tokenValid = credentials.access_token && 
                      credentials.expires_at && 
                      new Date(credentials.expires_at) > new Date();

    if (!tokenValid && credentials.refresh_token) {
      console.log('🔄 STATUS - Token expirado, tentando renovar automaticamente...');
      
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

          console.log('✅ STATUS - Token renovado automaticamente!');
          
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
          console.log('❌ STATUS - Falha na renovação automática:', data.error);
        }
      } catch (error) {
        console.log('❌ STATUS - Erro na renovação automática:', error);
      }
    }

    if (!tokenValid) {
      return NextResponse.json({ 
        connected: false,
        configured: configured,
        tokenExpired: !!credentials.access_token, // true se tinha token mas expirou
        message: 'Token expirado',
        expiresAt: credentials.expires_at  // ✅ Corrigido para camelCase
      });
    }

    return NextResponse.json({ 
      connected: true,
      configured: configured,
      tokenExpired: false,
      expiresAt: credentials.expires_at, // ✅ Corrigido para camelCase
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
    console.error('❌ STATUS - Erro geral:', error);
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
    const { barId, clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ 
        error: 'clientId, clientSecret e redirectUri são obrigatórios' 
      }, { status: 400 });
    }

    console.log('🔍 CONFIGURE - Configurando credenciais para barId:', barId);

    // Usar sempre 'producao' como ambiente padrão para simplicidade
    const ambiente = 'producao';
    console.log('🔍 CONFIGURE - Usando ambiente:', ambiente);

    // Verificar se já existe configuração
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

// Testar conexão com a API
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
      message: 'Integração desconectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar integração:', error);
    return NextResponse.json({ error: 'Erro ao desconectar integração' }, { status: 500 });
  }
} 