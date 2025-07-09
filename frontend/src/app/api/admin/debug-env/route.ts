import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const envStatus = {
      CONTAHUB_EMAIL: process.env.CONTAHUB_EMAIL ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      CONTAHUB_PASSWORD: process.env.CONTAHUB_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO', 
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'undefined',
      
      // Preview das variáveis (sem mostrar valores completos por segurança)
      CONTAHUB_EMAIL_PREVIEW: process.env.CONTAHUB_EMAIL ? 
        process.env.CONTAHUB_EMAIL.substring(0, 5) + '***' : 'undefined',
      SUPABASE_KEY_PREVIEW: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '***' : 'undefined'
    };

    return NextResponse.json({
      success: true,
      environment: envStatus,
      message: 'Debug das variáveis de ambiente'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar variáveis',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 