import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { agora, formatarDataHora, timestampBrasilia } from '@/lib/timezone';

export async function GET() {
  try {
    // Teste do frontend
    const frontendTime = agora();
    const frontendFormatted = formatarDataHora(frontendTime);
    const frontendISO = timestampBrasilia();

    // Teste do Supabase
    const supabaseQuery = `
      SELECT 
        current_setting('timezone') as timezone_config,
        now() as utc_time,
        now() AT TIME ZONE 'America/Sao_Paulo' as brasil_time,
        agora_brasil() as agora_brasil_func,
        formatar_data_brasil(now()) as formatado_brasil
    `;

    let supabaseResult = null;
    try {
      // Usar cliente Supabase para executar SQL
      const supabase = await getAdminClient();
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: supabaseQuery 
      });
      
      if (!error && data) {
        supabaseResult = data;
      }
    } catch (supabaseError) {
      console.error('Erro ao executar SQL no Supabase:', supabaseError);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frontend: {
        agora: frontendTime.toISOString(),
        formatado: frontendFormatted,
        timestamp_brasil: frontendISO,
        timezone: 'America/Sao_Paulo (Frontend)'
      },
      supabase: supabaseResult ? {
        timezone_config: supabaseResult[0]?.timezone_config,
        utc_time: supabaseResult[0]?.utc_time,
        brasil_time: supabaseResult[0]?.brasil_time,
        agora_brasil_func: supabaseResult[0]?.agora_brasil_func,
        formatado_brasil: supabaseResult[0]?.formatado_brasil
      } : {
        error: 'Não foi possível conectar ao Supabase'
      },
      comparison: {
        frontend_vs_utc: `Frontend está ${Math.round((frontendTime.getTime() - new Date().getTime()) / 1000 / 60 / 60)} horas de diferença do UTC`,
        ambiente: process.env.NODE_ENV,
        vercel_timezone: process.env.TZ || 'Não configurado'
      },
      debug: {
        env_tz: process.env.TZ,
        node_env: process.env.NODE_ENV,
        vercel_region: process.env.VERCEL_REGION,
        user_agent: 'API Test'
      }
    });

  } catch (error) {
    console.error('Erro no teste de timezone:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
