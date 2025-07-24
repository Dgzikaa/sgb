import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando API de status das integrações...')
    
    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return authErrorResponse('Usuário não autenticado');
    }

    console.log('✅ Usuário autenticado:', user.id)

    const { bar_id } = await request.json()
    console.log('📋 Bar ID recebido:', bar_id)

    if (!bar_id) {
      return NextResponse.json({ 
        error: 'bar_id é obrigatório' 
      }, { status: 400 })
    }

    const supabase = await getAdminClient();
    console.log('🔗 Cliente Supabase conectado')

    // Buscar credenciais configuradas
    console.log('🔍 Buscando credenciais para bar_id:', bar_id)
    const { data: credentials, error: credentialsError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ativo', true)

    if (credentialsError) {
      console.error('❌ Erro ao buscar credenciais:', credentialsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar credenciais' 
      }, { status: 500 })
    }

    console.log('✅ Credenciais encontradas:', credentials?.length || 0)

    // Buscar webhooks do Discord configurados
    const { data: discordWebhooks, error: discordError } = await supabase
      .from('discord_webhooks')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('enabled', true)

    if (discordError) {
      console.error('❌ Erro ao buscar webhooks Discord:', discordError)
    }

    // Mapear status das integrações
    const integrations = {
      inter: {
        status: 'not-configured',
        hasCredentials: false,
        hasWebhook: false,
        lastActivity: null
      },
      nibo: {
        status: 'not-configured',
        hasCredentials: false,
        hasWebhook: false,
        lastActivity: null
      },
      contahub: {
        status: 'not-configured',
        hasCredentials: false,
        hasWebhook: false,
        lastActivity: null
      },
      discord: {
        status: 'not-configured',
        webhooks: [] as any[],
        totalWebhooks: 0,
        activeWebhooks: 0
      },
      whatsapp: {
        status: 'not-configured',
        hasCredentials: false,
        lastActivity: null
      },
      windsor: {
        status: 'pending',
        hasCredentials: false,
        lastActivity: null
      }
    }

    // Verificar credenciais do Inter
    const interCreds = credentials?.find(c => c.sistema === 'inter')
    if (interCreds) {
      integrations.inter.hasCredentials = true
      integrations.inter.status = 'active'
    }

    // Verificar credenciais do NIBO
    const niboCreds = credentials?.find(c => c.sistema === 'nibo')
    if (niboCreds) {
      integrations.nibo.hasCredentials = true
      integrations.nibo.status = 'active'
    }

    // Verificar credenciais do ContaHub
    const contahubCreds = credentials?.find(c => c.sistema === 'contahub')
    if (contahubCreds) {
      integrations.contahub.hasCredentials = true
      integrations.contahub.status = 'active'
    }

    // Verificar credenciais do WhatsApp
    const whatsappCreds = credentials?.find(c => c.sistema === 'whatsapp')
    if (whatsappCreds) {
      integrations.whatsapp.hasCredentials = true
      integrations.whatsapp.status = 'active'
    }

    // Configurar Discord
    if (discordWebhooks && discordWebhooks.length > 0) {
      integrations.discord.webhooks = discordWebhooks
      integrations.discord.totalWebhooks = discordWebhooks.length
      integrations.discord.activeWebhooks = discordWebhooks.filter(w => w.enabled).length
      integrations.discord.status = integrations.discord.activeWebhooks > 0 ? 'active' : 'inactive'
    }

    // Verificar webhooks específicos
    if (discordWebhooks) {
      const interWebhook = discordWebhooks.find(w => w.webhook_type === 'pix_recebido' || w.webhook_type === 'pix_enviado')
      if (interWebhook) {
        integrations.inter.hasWebhook = true
      }

      const niboWebhook = discordWebhooks.find(w => w.webhook_type === 'nibo')
      if (niboWebhook) {
        integrations.nibo.hasWebhook = true
      }

      const contahubWebhook = discordWebhooks.find(w => w.webhook_type === 'contahub')
      if (contahubWebhook) {
        integrations.contahub.hasWebhook = true
      }
    }

    return NextResponse.json({
      success: true,
      integrations,
      credentials: credentials || [],
      discordWebhooks: discordWebhooks || []
    })

  } catch (error) {
    console.error('❌ Erro na API de status das integrações:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 