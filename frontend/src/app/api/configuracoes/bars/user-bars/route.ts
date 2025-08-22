import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 API: Buscando bares do usuário...');
    }

    const user = await authenticateUser(request);
    if (!user) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ API: Usuário não autenticado');
      }
      return authErrorResponse('Usuário não autenticado');
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API: Usuário autenticado:', user.nome);
    }

    const supabase = await getAdminClient();
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 API: Cliente Supabase conectado');
    }

    // Buscar os bares do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios_bar')
      .select('id, email, nome, role, bar_id')
      .eq('email', user.email)
      .eq('ativo', true);

    if (userError) {
      console.error('❌ API: Erro ao buscar dados do usuário:', userError);
      return NextResponse.json(
        {
          error: 'Erro ao buscar dados do usuário',
        },
        { status: 500 }
      );
    }

    // Logs detalhados apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 API: Dados do usuário encontrados:', userData);
    }

    if (!userData || userData.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ API: Usuário não tem acesso a nenhum bar');
      }
      return NextResponse.json(
        {
          error: 'Usuário não tem acesso a nenhum bar',
        },
        { status: 404 }
      );
    }

    // Extrair IDs únicos dos bares
    const barIds = [...new Set(userData.map((user: any) => user.bar_id))];
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🏪 API: IDs dos bares encontrados:', barIds);
    }

    // Buscar detalhes dos bares
    const { data: barsData, error: barsError } = await supabase
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true);

    if (barsError) {
      console.error('❌ API: Erro ao buscar bares:', barsError);
      return NextResponse.json(
        {
          error: 'Erro ao buscar bares',
        },
        { status: 500 }
      );
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API: Bares encontrados:', barsData);
    }

    return NextResponse.json({
      success: true,
      bars: barsData || [],
      userData: userData,
    });
  } catch (error) {
    console.error('❌ API: Erro interno:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
