import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic'

// ========================================
// 📊 API PARA EVENTOS DE ANALYTICS
// ========================================

interface UsuarioEvento {
  user_id: string;
  evento_tipo: string;
  pagina_atual?: string;
  timestamp_evento: string;
}

interface EventoInput {
  user_id?: string;
  bar_id: string | number;
  sessao_id: string;
  evento_tipo: string;
  evento_nome: string;
  pagina_atual?: string;
  elemento_alvo?: string;
  dados_evento?: Record<string, unknown>;
  tempo_gasto_segundos?: string | number;
  dispositivo_tipo?: string;
  navegador?: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  timestamp_evento?: string;
}

interface EventosAccumulator {
  [key: string]: number;
}

// ========================================
// 📊 GET /api/analytics/eventos
// ========================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barId = searchParams.get('bar_id') || '3';
    const userId = searchParams.get('user_id');
    const eventoTipo = searchParams.get('tipo'); // 'page_view', 'click', 'action', 'error', 'performance'
    const periodo = searchParams.get('periodo') || '7'; // dias
    const limit = searchParams.get('limit') || '100';

    const supabase = await getAdminClient();

    // Query base
    let query = supabase
      .from('usuario_eventos')
      .select(
        `
        *,
        usuarios_bar(nome, email),
        bars(nome)
      `
      )
      .eq('bar_id', parseInt(barId))
      .gte(
        'timestamp_evento',
        new Date(
          Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000
        ).toISOString()
      )
      .order('timestamp_evento', { ascending: false })
      .limit(parseInt(limit));

    // Filtros opcionais
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (eventoTipo) {
      query = query.eq('evento_tipo', eventoTipo);
    }

    const { data: eventos, error } = await query;

    if (error) {
      throw error;
    }

    // Calcular estatísticas resumidas
    const resumo = {
      total_eventos: eventos?.length || 0,
      usuarios_unicos: new Set(
        eventos?.map((e: UsuarioEvento) => e.user_id).filter(Boolean)
      ).size,
      eventos_por_tipo: {} as EventosAccumulator,
      paginas_mais_visitadas: {} as EventosAccumulator,
      periodo_consultado: `${periodo} dias`,
      ultima_atividade: eventos?.[0]?.timestamp_evento || null,
    };

    eventos?.forEach((evento: UsuarioEvento) => {
      // Contadores por tipo
      resumo.eventos_por_tipo[evento.evento_tipo] =
        (resumo.eventos_por_tipo[evento.evento_tipo] || 0) + 1;

      // Páginas mais visitadas
      if (evento.pagina_atual) {
        resumo.paginas_mais_visitadas[evento.pagina_atual] =
          (resumo.paginas_mais_visitadas[evento.pagina_atual] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        eventos,
        resumo,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar eventos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar eventos de usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ========================================
// 📊 POST /api/analytics/eventos
// ========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      bar_id,
      sessao_id,
      evento_tipo,
      evento_nome,
      pagina_atual,
      elemento_alvo,
      dados_evento = {},
      tempo_gasto_segundos,
      dispositivo_tipo,
      navegador,
      user_agent,
    } = body as EventoInput;

    // Validação básica
    if (!bar_id || !sessao_id || !evento_tipo || !evento_nome) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Campos obrigatórios: bar_id, sessao_id, evento_tipo, evento_nome',
        },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Extrair informações da requisição
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0]
      : request.headers.get('x-real-ip') || 'unknown';
    const referrer = request.headers.get('referer');
    const userAgent =
      user_agent || request.headers.get('user-agent') || 'unknown';

    // Detectar dispositivo se não fornecido
    let tipoDispositivo = dispositivo_tipo;
    if (!tipoDispositivo) {
      if (userAgent.includes('Mobile')) tipoDispositivo = 'mobile';
      else if (userAgent.includes('Tablet')) tipoDispositivo = 'tablet';
      else tipoDispositivo = 'desktop';
    }

    // Detectar navegador se não fornecido
    let browserDetectado = navegador;
    if (!browserDetectado) {
      if (userAgent.includes('Chrome')) browserDetectado = 'Chrome';
      else if (userAgent.includes('Firefox')) browserDetectado = 'Firefox';
      else if (userAgent.includes('Safari')) browserDetectado = 'Safari';
      else if (userAgent.includes('Edge')) browserDetectado = 'Edge';
      else browserDetectado = 'Unknown';
    }

    // Inserir evento
    const { data: evento, error } = await supabase
      .from('usuario_eventos')
      .insert({
        user_id: user_id || null,
        bar_id: parseInt(bar_id as string),
        sessao_id,
        evento_tipo,
        evento_nome,
        pagina_atual,
        elemento_alvo,
        dados_evento,
        tempo_gasto_segundos: tempo_gasto_segundos
          ? parseInt(tempo_gasto_segundos as string)
          : null,
        dispositivo_tipo: tipoDispositivo,
        navegador: browserDetectado,
        user_agent: userAgent,
        ip_address: ip,
        referrer,
        timestamp_evento: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: evento,
      message: 'Evento registrado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao registrar evento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao registrar evento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ========================================
// 📊 PUT /api/analytics/eventos/batch
// ========================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventos } = body;

    if (!eventos || !Array.isArray(eventos) || eventos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campo obrigatório: eventos (array com pelo menos 1 item)',
        },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Processar eventos em lote
    const eventosProcessados = eventos.map((evento: EventoInput) => ({
      user_id: evento.user_id || null,
      bar_id: parseInt(evento.bar_id as string),
      sessao_id: evento.sessao_id,
      evento_tipo: evento.evento_tipo,
      evento_nome: evento.evento_nome,
      pagina_atual: evento.pagina_atual,
      elemento_alvo: evento.elemento_alvo,
      dados_evento: evento.dados_evento || {},
      tempo_gasto_segundos: evento.tempo_gasto_segundos
        ? parseInt(evento.tempo_gasto_segundos as string)
        : null,
      dispositivo_tipo: evento.dispositivo_tipo || 'desktop',
      navegador: evento.navegador || 'Unknown',
      user_agent: evento.user_agent || 'Unknown',
      ip_address: evento.ip_address || 'unknown',
      referrer: evento.referrer,
      timestamp_evento: evento.timestamp_evento || new Date().toISOString(),
    }));

    const { data: eventosInseridos, error } = await supabase
      .from('usuario_eventos')
      .insert(eventosProcessados)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: eventosInseridos,
      message: `${eventosInseridos?.length || 0} eventos registrados com sucesso`,
    });
  } catch (error) {
    console.error('❌ Erro ao registrar eventos em lote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao registrar eventos em lote',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
