import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿// Utilitário para gerenciar tokens do ContaAzul automaticamente
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não definidas');
}
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
}

export async function getValidContaAzulToken(barId: number): Promise<string | null> {
  try {
    console.log(`🔍 Verificando token válido para bar_id: ${barId}`);
    
    // Buscar credenciais
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'contaazul')
      .single();

    if (error || !credentials) {
      console.error('❌ Credenciais não encontradas');
      return null;
    }

    const typedCredentials = credentials as ContaAzulCredentials;

    if (!typedCredentials.access_token) {
      console.error('❌ Token de acesso não disponível');
      return null;
    }

    // Verificar se token expira em menos de 5 minutos (margem de segurança)
    const agora = new Date();
    const expiraEm = new Date(typedCredentials.expires_at);
    const margemSeguranca = 5 * 60 * 1000; // 5 minutos em ms
    
    if (expiraEm.getTime() - agora.getTime() > margemSeguranca) {
      console.log(`✅ Token válido até: ${expiraEm.toLocaleString()}`);
      return typedCredentials.access_token;
    }

    // Token expirando em breve ou já expirado - renovar
    console.log(`⏰ Token expira em: ${expiraEm.toLocaleString()}, renovando...`);
    
    const newToken = await renewContaAzulToken(typedCredentials);
    if (newToken) {
      console.log('✅ Token renovado com sucesso!');
      return newToken;
    }

    console.error('❌ Falha ao renovar token');
    return null;

  } catch (error) {
    console.error('❌ Erro ao verificar/renovar token:', error);
    return null;
  }
}

async function renewContaAzulToken(credentials: ContaAzulCredentials): Promise<string | null> {
  try {
    if (!credentials.refresh_token) {
      throw new Error('Refresh token não disponível');
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

    const data = await response.json() as TokenResponse;
    if (!response.ok) {
      const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    // Calcular nova data de expiração
    const expiresIn = data.expires_in || 3600;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token || credentials.refresh_token;
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    
    // Salvar novo token no banco
    await supabase
      .from('api_credentials')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        last_token_refresh: new Date().toISOString(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1
      })
      .eq('id', credentials.id);

    console.log(`🔄 Token renovado - novo expira em: ${expiresAt.toLocaleString()}`);
    return accessToken;

  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    
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

// Função para APIs que fazem chamadas para ContaAzul
export async function makeContaAzulRequest(
  barId: number, 
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidContaAzulToken(barId);
  
  if (!token) {
    throw new Error('Token do ContaAzul não disponível ou não foi possível renovar');
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

