// UtilitÃ¡rio para gerenciar tokens do ContaAzul automaticamente
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTAAZUL_TOKEN_URL = 'https://auth.contaazul.com/oauth2/token';

interface ContaAzulCredentials {
  id: string;
  bar_id: number;
  access_token: string;
  refresh_token: string;
  client_id: string;
  client_secret: string;
  expires_at: string;
  token_refresh_count: number;
}

export async function getValidContaAzulToken(barId: number): Promise<string | null> {
  try {
    console.log(`ðŸ”‘ Verificando token vÃ¡lido para bar_id: ${barId}`);
    
    // Buscar credenciais
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'contaazul')
      .single() as { data: ContaAzulCredentials | null };

    if (!credentials?.access_token) {
      console.error('âŒ Credenciais nÃ£o encontradas');
      return null;
    }

    // Verificar se token expira em menos de 5 minutos (margem de seguranÃ§a)
    const agora = new Date();
    const expiraEm = new Date(credentials.expires_at);
    const margemSeguranca = 5 * 60 * 1000; // 5 minutos em ms
    
    if (expiraEm.getTime() - agora.getTime() > margemSeguranca) {
      console.log(`âœ… Token vÃ¡lido atÃ©: ${expiraEm.toLocaleString()}`);
      return credentials.access_token;
    }

    // Token expirando em breve ou jÃ¡ expirado - renovar
    console.log(`âš ï¸ Token expira em: ${expiraEm.toLocaleString()}, renovando...`);
    
    const newToken = await renewContaAzulToken(credentials);
    if (newToken) {
      console.log('âœ… Token renovado com sucesso!');
      return newToken;
    }

    console.error('âŒ Falha ao renovar token');
    return null;

  } catch (error) {
    console.error('âŒ Erro ao verificar/renovar token:', error);
    return null;
  }
}

async function renewContaAzulToken(credentials: ContaAzulCredentials): Promise<string | null> {
  try {
    if (!credentials.refresh_token) {
      throw new Error('Refresh token nÃ£o disponÃ­vel');
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
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Calcular nova data de expiraÃ§Ã£o
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
    
    // Salvar novo token no banco
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

    console.log(`ðŸ”„ Token renovado - novo expira em: ${expiresAt.toLocaleString()}`);
    return data.access_token;

  } catch (error) {
    console.error('âŒ Erro ao renovar token:', error);
    
    // Se refresh falhou, marcar credenciais como inativas
    await supabase
      .from('api_credentials')
      .update({
        ativo: false,
        access_token: null,
        refresh_token: null
      })
      .eq('id', credentials.id);
      
    return null;
  }
}

// FunÃ§Ã£o para APIs que fazem chamadas para ContaAzul
export async function makeContaAzulRequest(
  barId: number, 
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidContaAzulToken(barId);
  
  if (!token) {
    throw new Error('Token do ContaAzul nÃ£o disponÃ­vel ou nÃ£o foi possÃ­vel renovar');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  });
} 
