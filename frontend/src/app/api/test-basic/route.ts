import { NextResponse } from 'next/server';

export async function GET() {
  // Teste básico das variáveis de ambiente
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
    SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINIDA' : 'NÃO DEFINIDA',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NÃO DEFINIDA',
    NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDA'
  };

  // Teste de fetch básico
  let fetchTest = 'Não testado';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        }
      });
      fetchTest = `Status: ${response.status} - ${response.statusText}`;
    } catch (error: any) {
      fetchTest = `Erro: ${error.message}`;
    }
  }

  return NextResponse.json({
    variaveisAmbiente: env,
    testeFetch: fetchTest,
    timestamp: new Date().toISOString()
  });
} 