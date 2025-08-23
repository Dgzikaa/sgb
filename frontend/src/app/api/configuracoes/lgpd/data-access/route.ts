import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

// ========================================
// 🔒 API PARA ACESSO A DADOS LGPD
// ========================================

interface UserSettings {
  user_id: string;
  [key: string]: unknown;
}

interface UserSession {
  user_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface LgpdAuditLog {
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

interface Bar {
  id: string;
  name: string;
  role: string;
}

interface ChecklistExecution {
  user_id: string;
  [key: string]: unknown;
}

interface UserData {
  metadata: {
    requestedAt: Date;
    userId: string;
    email: string;
    purpose: string;
  };
  personalData: Record<string, unknown>;
  systemData: {
    settings: UserSettings[];
    preferences: {
      theme: string;
      language: string;
      notifications: string;
    };
  };
  activityData: {
    recentLogins: UserSession[];
    auditTrail: LgpdAuditLog[];
    lastActivity: Date;
  };
  consentData: {
    currentConsents: Record<string, boolean>;
    lastUpdated?: string;
    version: string;
    bannerShown: boolean;
  };
  businessData: {
    associatedBars: Bar[];
    recentChecklists: ChecklistExecution[];
    roles: string;
  };
  technicalData: {
    ipAddresses: string;
    userAgents: string;
    cookies: string;
    sessions: string;
  };
}

interface ApiError {
  message: string;
}

// ========================================
// 🔒 GET /api/lgpd/data-access
// ========================================

export async function GET(request: NextRequest) {
  try {
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

    // Compilar todos os dados do usuário de diferentes tabelas
    const userData: UserData = {
      metadata: {
        requestedAt: new Date(),
        userId: user.id,
        email: user.email || '',
        purpose: 'LGPD Art. 15 - Direito de Acesso aos Dados',
      },
      personalData: {},
      systemData: {
        settings: [],
        preferences: {
          theme: 'Obtido do localStorage',
          language: 'pt-BR',
          notifications: 'Configurações de notificação',
        },
      },
      activityData: {
        recentLogins: [],
        auditTrail: [],
        lastActivity: new Date(),
      },
      consentData: {
        currentConsents: {},
        lastUpdated: undefined,
        version: '1.0',
        bannerShown: false,
      },
      businessData: {
        associatedBars: [],
        recentChecklists: [],
        roles: 'Extraído dos bars',
      },
      technicalData: {
        ipAddresses: 'Histórico obtido dos logs',
        userAgents: 'Histórico obtido dos logs',
        cookies: 'Baseado nos consentimentos',
        sessions: 'Dados de sessão ativa',
      },
    };

    // 1. Dados pessoais básicos (tabela profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      userData.personalData = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        metadata: profile.metadata,
      };
    }

    // 2. Dados do sistema (configurações, preferências)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id);

    userData.systemData.settings = settings || [];

    // 3. Dados de atividade
    const { data: loginHistory } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: auditLogs } = await supabase
      .from('lgpd_audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    userData.activityData.recentLogins = loginHistory || [];
    userData.activityData.auditTrail = auditLogs || [];

    // 4. Dados de consentimento LGPD
    const { data: lgpdSettings } = await supabase
      .from('user_lgpd_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (lgpdSettings) {
      userData.consentData = {
        currentConsents: lgpdSettings.consents || {},
        lastUpdated: lgpdSettings.last_updated,
        version: lgpdSettings.version || '1.0',
        bannerShown: lgpdSettings.bannerShown || false,
      };
    }

    // 5. Dados de negócio específicos (se aplicável)
    const { data: bars } = await supabase
      .from('bars')
      .select('id, name, role')
      .contains('members', [{ user_id: user.id }]);

    const { data: checklists } = await supabase
      .from('checklist_executions')
      .select('*')
      .eq('user_id', user.id)
      .limit(20);

    userData.businessData.associatedBars = bars || [];
    userData.businessData.recentChecklists = checklists || [];

    // Log da solicitação de acesso
    await supabase.from('lgpd_audit_log').insert({
      user_id: user.id,
      action: 'data_access_requested',
      details: {
        requestedAt: new Date(),
        ipAddress: getClientIP(request),
      },
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json(userData);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao acessar dados do usuário:', apiError);
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
