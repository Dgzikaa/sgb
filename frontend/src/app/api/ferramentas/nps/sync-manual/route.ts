import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API para disparar manualmente a sincronização da Pesquisa da Felicidade
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização manual da Pesquisa da Felicidade...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    // Chamar a Edge Function de sincronização
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-pesquisa-felicidade`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na Edge Function:', errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao executar sincronização',
          details: errorText,
          status: response.status
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Sincronização concluída:', result);

    return NextResponse.json({
      success: true,
      message: 'Sincronização executada com sucesso',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na sincronização manual:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

