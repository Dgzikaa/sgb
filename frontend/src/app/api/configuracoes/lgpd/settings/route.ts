import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // cookieStore removido - não utilizado
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar configurações LGPD do usuário
    const { data: settings, error } = await supabase
      .from('user_lgpd_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Não encontrado é OK
      throw error;
    }

    // Se não existir, retornar configurações padrão
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        consents: {
          essential: {
            type: 'essential',
            granted: true,
            timestamp: new Date(),
            version: '1.0',
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
          analytics: {
            type: 'analytics',
            granted: false,
            timestamp: new Date(),
            version: '1.0',
          },
          marketing: {
            type: 'marketing',
            granted: false,
            timestamp: new Date(),
            version: '1.0',
          },
          preferences: {
            type: 'preferences',
            granted: false,
            timestamp: new Date(),
            version: '1.0',
          },
          functional: {
            type: 'functional',
            granted: false,
            timestamp: new Date(),
            version: '1.0',
          },
        },
        bannerShown: false,
        lastUpdated: new Date(),
        version: '1.0',
      };

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações LGPD:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // cookieStore removido - não utilizado
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const settings = await request.json();

    // Adicionar informações de auditoria
    const settingsWithAudit = {
      ...settings,
      user_id: user.id,
      last_updated: new Date(),
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
    };

    // Salvar/atualizar configurações
    const { data, error } = await supabase
      .from('user_lgpd_settings')
      .upsert(settingsWithAudit, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log de auditoria
    await supabase.from('lgpd_audit_log').insert({
      user_id: user.id,
      action: 'settings_updated',
      details: settingsWithAudit.consents,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao salvar configurações LGPD:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
