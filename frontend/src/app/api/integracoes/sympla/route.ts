import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão de admin
    const { data: usuario } = await supabase
      .from('usuarios_bar')
      .select('nivel_acesso')
      .eq('user_id', user.id)
      .single();

    if (!usuario || usuario.nivel_acesso !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem sincronizar Sympla.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventoId, tipo = 'completo' } = body;

    if (!eventoId) {
      return NextResponse.json(
        { error: 'eventoId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tipo de sincronização
    const tiposValidos = ['completo', 'participantes', 'pedidos'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de sincronização inválido. Use: completo, participantes ou pedidos' },
        { status: 400 }
      );
    }

    // Chamar Edge Function sympla-sync
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }
    
    // Chamar a Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/sympla-sync`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filtro_eventos: 'ordi',
        // Se eventoId for fornecido, usar como filtro customizado
        // Caso contrário, usa a última semana automaticamente
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();

    // Registrar a sincronização na tabela de logs local se necessário
    const logData = {
      usuario_id: user.id,
      acao: 'sympla_sync',
      detalhes: {
        evento_id: eventoId,
        tipo_sync: tipo,
        resultado: result
      },
      created_at: new Date().toISOString()
    };

    // Tentar registrar o log (não bloquear se falhar)
    try {
      await supabase
        .from('logs_sistema')
        .insert([logData]);
    } catch (logError) {
      console.warn('Falha ao registrar log da sincronização:', logError);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na API Sympla:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para buscar dados sincronizados
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get('eventoId');
    const tipo = searchParams.get('tipo') || 'all'; // 'participantes', 'pedidos', 'logs', 'all'

    if (!eventoId) {
      return NextResponse.json(
        { error: 'eventoId é obrigatório' },
        { status: 400 }
      );
    }

    const result: any = {
      evento_id: eventoId,
      timestamp: new Date().toISOString()
    };

    // Buscar participantes
    if (tipo === 'participantes' || tipo === 'all') {
      const { data: participantes, error: participantesError } = await supabase
        .from('sympla_participantes')
        .select('*')
        .eq('evento_sympla_id', eventoId)
        .order('created_at', { ascending: false });

      if (participantesError) {
        throw new Error(`Erro ao buscar participantes: ${participantesError.message}`);
      }

      result.participantes = {
        total: participantes?.length || 0,
        dados: participantes || []
      };
    }

    // Buscar pedidos
    if (tipo === 'pedidos' || tipo === 'all') {
      const { data: pedidos, error: pedidosError } = await supabase
        .from('sympla_pedidos')
        .select('*')
        .eq('evento_sympla_id', eventoId)
        .order('created_at', { ascending: false });

      if (pedidosError) {
        throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
      }

      result.pedidos = {
        total: pedidos?.length || 0,
        dados: pedidos || []
      };
    }

    // Buscar logs de sincronização
    if (tipo === 'logs' || tipo === 'all') {
      const { data: logs, error: logsError } = await supabase
        .from('sympla_sync_logs')
        .select('*')
        .eq('evento_sympla_id', eventoId)
        .order('created_at', { ascending: false })
        .limit(50); // Últimos 50 logs

      if (logsError) {
        throw new Error(`Erro ao buscar logs: ${logsError.message}`);
      }

      result.logs = {
        total: logs?.length || 0,
        dados: logs || []
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao buscar dados Sympla:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
