import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

// Configurações do sistema com suas categorias
const defaultConfigs = [
  // Integrações
  { key: 'SYMPLA_API_ENABLED', value: 'true', category: 'integracoes', description: 'Habilitar integração Sympla' },
  { key: 'YUZER_API_ENABLED', value: 'true', category: 'integracoes', description: 'Habilitar integração Yuzer' },
  { key: 'DISCORD_WEBHOOK_ENABLED', value: 'false', category: 'integracoes', description: 'Habilitar webhooks Discord' },
  
  // Automação
  { key: 'AUTO_SYNC_ENABLED', value: 'true', category: 'automacao', description: 'Sincronização automática habilitada' },
  { key: 'CRON_JOBS_ENABLED', value: 'true', category: 'automacao', description: 'Jobs automáticos habilitados' },
  { key: 'AUTO_BACKUP_ENABLED', value: 'false', category: 'automacao', description: 'Backup automático habilitado' },
  
  // Notificações
  { key: 'EMAIL_NOTIFICATIONS', value: 'true', category: 'notificacoes', description: 'Notificações por email' },
  { key: 'DISCORD_NOTIFICATIONS', value: 'false', category: 'notificacoes', description: 'Notificações Discord' },
  { key: 'ERROR_ALERTS', value: 'true', category: 'notificacoes', description: 'Alertas de erro' }
];

export async function GET() {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }

    // Organizar por categoria
    const configsByCategory = data?.reduce((acc: any, config: any) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      configs: configsByCategory,
      total: data?.length || 0
    });

  } catch (error) {
    console.error('Erro no endpoint de configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'init_defaults') {
      // Inicializar configurações padrão
      const { data: existing } = await supabase
        .from('system_configs')
        .select('key');

      const existingKeys = existing?.map((c: any) => c.key) || [];
      const newConfigs = defaultConfigs.filter(config => !existingKeys.includes(config.key));

      if (newConfigs.length > 0) {
        const { error } = await supabase
          .from('system_configs')
          .insert(newConfigs);

        if (error) {
          throw error;
        }
      }

      return NextResponse.json({
        success: true,
        message: `${newConfigs.length} configurações inicializadas`,
        initialized: newConfigs.length
      });
    }

    if (action === 'update_config') {
      const { key, value } = body;
      
      if (!key) {
        return NextResponse.json({ error: 'Key é obrigatória' }, { status: 400 });
      }

      const { error } = await supabase
        .from('system_configs')
        .upsert({
          key,
          value: value?.toString() || '',
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: `Configuração ${key} atualizada`
      });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });

  } catch (error) {
    console.error('Erro ao processar configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
