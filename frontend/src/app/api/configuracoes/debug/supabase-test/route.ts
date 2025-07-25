import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('🔍 Testando configuração do Supabase...');

    // Verificar variáveis de ambiente
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'Configurada'
        : 'Não configurada',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? 'Configurada'
        : 'Não configurada',
      SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY
        ? 'Configurada'
        : 'Não configurada',
    };

    console.log('🔍 Variáveis de ambiente:', envCheck);

    // Testar cliente administrativo
    let adminClient;
    try {
      adminClient = await getAdminClient();
      console.log('✅ Cliente administrativo criado com sucesso');
    } catch (adminError) {
      console.error('❌ Erro ao criar cliente administrativo:', adminError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar cliente administrativo',
          details:
            adminError instanceof Error
              ? adminError.message
              : 'Erro desconhecido',
          envCheck,
        },
        { status: 500 }
      );
    }

    // Testar conexão com banco
    try {
      const { data, error } = await adminClient
        .from('usuarios_bar')
        .select('id, nome, email')
        .limit(1);

      if (error) {
        console.error('❌ Erro ao conectar com banco:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao conectar com banco',
            details: error.message,
            envCheck,
          },
          { status: 500 }
        );
      }

      console.log('✅ Conexão com banco funcionando');

      return NextResponse.json({
        success: true,
        message: 'Configuração do Supabase está funcionando corretamente',
        envCheck,
        testQuery: {
          success: true,
          recordCount: data?.length || 0,
        },
      });
    } catch (dbError) {
      console.error('❌ Erro na query de teste:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na query de teste',
          details:
            dbError instanceof Error ? dbError.message : 'Erro desconhecido',
          envCheck,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral no teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
