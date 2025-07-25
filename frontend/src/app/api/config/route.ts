import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache das configurações para evitar múltiplas chamadas
let configCache: unknown = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function fetchSupabaseSecrets() {
  try {
    // Buscar secrets diretamente do Supabase usando edge function com autenticação
    const response = await fetch(
      'https://iddtrhexgjbfhxebpklf.supabase.co/functions/v1/get-config',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sgb-internal-config-token-2025',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar configurações');
    }

    const config = await response.json();
    return config;
  } catch (error) {
    console.error('❌ Erro ao buscar secrets:', error);

    // Secrets são obrigatórios
    throw new Error(
      'Configurações dos secrets não disponíveis - verificar edge function get-config'
    );
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // Verificar se o cache ainda é válido
    if (configCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(configCache);
    }

    // Buscar novas configurações
    const config = await fetchSupabaseSecrets();

    // Atualizar cache
    configCache = config;
    cacheTimestamp = now;

    return NextResponse.json(config);
  } catch (error) {
    console.error('❌ Erro na API de configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}
