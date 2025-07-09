import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Schema de validação para configuração
const MetaConfigSchema = z.object({
  access_token: z.string().min(10, 'Access token é obrigatório'),
  app_id: z.string().min(5, 'App ID é obrigatório'),
  app_secret: z.string().min(10, 'App Secret é obrigatório'),
  facebook_page_id: z.string().optional(),
  instagram_account_id: z.string().optional(),
  api_version: z.string().optional().default('v18.0'),
  coleta_automatica: z.boolean().optional().default(true),
  frequencia_coleta_horas: z.number().int().min(1).max(24).optional().default(6),
  horario_coleta_preferido: z.string().optional().default('09:00'),
  rate_limit_per_hour: z.number().int().min(50).max(1000).optional().default(200)
})

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🔍 GET /api/meta/config
// Buscar configuração atual
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin', 'financeiro'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para visualizar configurações da Meta' 
      }, { status: 403 })
    }

    console.log('🔍 Buscando configuração Meta para bar:', bar_id)

    const { data: config, error } = await supabase
      .from('meta_configuracoes')
      .select(`
        id,
        access_token,
        app_id,
        app_secret,
        facebook_page_id,
        instagram_account_id,
        ativo,
        api_version,
        coleta_automatica,
        frequencia_coleta_horas,
        horario_coleta_preferido,
        dias_retencao_dados,
        rate_limit_per_hour,
        ultima_coleta,
        proxima_coleta,
        created_at,
        updated_at,
        last_tested_at
      `)
      .eq('bar_id', bar_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar configuração Meta:', error)
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }

    // Se não existe configuração, retornar dados padrão
    if (!config) {
      return NextResponse.json({
        exists: false,
        config: {
          ativo: false,
          api_version: 'v18.0',
          coleta_automatica: true,
          frequencia_coleta_horas: 6,
          horario_coleta_preferido: '09:00',
          rate_limit_per_hour: 200
        }
      })
    }

    // Mascarar dados sensíveis para retorno
    const configSafe = {
      ...config,
      access_token: config.access_token ? '***' + config.access_token.slice(-8) : null,
      app_secret: config.app_secret ? '***' + config.app_secret.slice(-4) : null
    }

    console.log('✅ Configuração Meta encontrada')
    return NextResponse.json({
      exists: true,
      config: configSafe
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar configuração Meta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 💾 POST /api/meta/config
// Salvar/atualizar configuração
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem modificar configurações da Meta' 
      }, { status: 403 })
    }

    // Parse e validação dos dados
    const body = await request.json()
    const configData = MetaConfigSchema.parse(body)

    console.log('💾 Salvando configuração Meta para bar:', bar_id)

    // Testar conexão antes de salvar
    const testResult = await testMetaConnection(configData)
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'Falha ao conectar com a Meta API',
        details: testResult.error 
      }, { status: 400 })
    }

    // Buscar IDs das contas se não foram fornecidos
    let enhancedConfig = { ...configData }
    if (testResult.accounts) {
      if (!enhancedConfig.facebook_page_id && testResult.accounts.facebook_page_id) {
        enhancedConfig.facebook_page_id = testResult.accounts.facebook_page_id
      }
      if (!enhancedConfig.instagram_account_id && testResult.accounts.instagram_account_id) {
        enhancedConfig.instagram_account_id = testResult.accounts.instagram_account_id
      }
    }

    // Calcular próxima coleta
    const proximaColeta = new Date()
    proximaColeta.setHours(
      parseInt(enhancedConfig.horario_coleta_preferido?.split(':')[0] || '9'),
      parseInt(enhancedConfig.horario_coleta_preferido?.split(':')[1] || '0'),
      0, 0
    )
    
    // Se o horário já passou hoje, agendar para amanhã
    if (proximaColeta <= new Date()) {
      proximaColeta.setDate(proximaColeta.getDate() + 1)
    }

    // Salvar no banco
    const { data, error } = await supabase
      .from('meta_configuracoes')
      .upsert({
        bar_id,
        ...enhancedConfig,
        ativo: true,
        proxima_coleta: proximaColeta.toISOString(),
        last_tested_at: new Date().toISOString()
      }, {
        onConflict: 'bar_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar configuração Meta:', error)
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
    }

    console.log('✅ Configuração Meta salva com sucesso')

    // Retornar dados mascarados
    const responseSafe = {
      ...data,
      access_token: '***' + data.access_token.slice(-8),
      app_secret: '***' + data.app_secret.slice(-4)
    }

    return NextResponse.json({
      success: true,
      config: responseSafe,
      accounts: testResult.accounts
    })

  } catch (error: any) {
    console.error('❌ Erro ao salvar configuração Meta:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 🔬 PUT /api/meta/config/test
// Testar configuração
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin', 'financeiro'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para testar configurações da Meta' 
      }, { status: 403 })
    }

    // Parse dos dados de teste
    const body = await request.json()
    const testData = MetaConfigSchema.parse(body)

    console.log('🔬 Testando configuração Meta...')

    const testResult = await testMetaConnection(testData)

    return NextResponse.json(testResult, { 
      status: testResult.success ? 200 : 400 
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar configuração Meta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 🛠️ FUNÇÕES AUXILIARES
// ========================================

async function testMetaConnection(config: any): Promise<{
  success: boolean
  error?: string
  accounts?: {
    facebook_page_id?: string
    instagram_account_id?: string
    facebook_page_name?: string
    instagram_username?: string
  }
}> {
  try {
    console.log('🔍 Testando acesso à Meta API...')

    // Testar token básico
    const meResponse = await fetch(
      `https://graph.facebook.com/${config.api_version}/me?access_token=${config.access_token}`,
      { method: 'GET' }
    )

    const meData = await meResponse.json()

    if (!meResponse.ok) {
      return {
        success: false,
        error: `Meta API Error: ${meData.error?.message || 'Token inválido'}`
      }
    }

    console.log('✅ Token válido, buscando contas conectadas...')

    // Buscar páginas do Facebook
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${config.api_version}/me/accounts?access_token=${config.access_token}`,
      { method: 'GET' }
    )

    const pagesData = await pagesResponse.json()
    const accounts: any = {}

    if (pagesResponse.ok && pagesData.data?.length > 0) {
      const firstPage = pagesData.data[0]
      accounts.facebook_page_id = firstPage.id
      accounts.facebook_page_name = firstPage.name

      console.log(`📄 Página Facebook encontrada: ${firstPage.name} (${firstPage.id})`)

      // Buscar conta Instagram conectada à página
      try {
        const igResponse = await fetch(
          `https://graph.facebook.com/${config.api_version}/${firstPage.id}?fields=instagram_business_account&access_token=${config.access_token}`,
          { method: 'GET' }
        )

        const igData = await igResponse.json()

        if (igResponse.ok && igData.instagram_business_account) {
          accounts.instagram_account_id = igData.instagram_business_account.id

          // Buscar username do Instagram
          const igProfileResponse = await fetch(
            `https://graph.facebook.com/${config.api_version}/${igData.instagram_business_account.id}?fields=username&access_token=${config.access_token}`,
            { method: 'GET' }
          )

          const igProfileData = await igProfileResponse.json()
          if (igProfileResponse.ok) {
            accounts.instagram_username = igProfileData.username
            console.log(`📸 Instagram encontrado: @${igProfileData.username} (${igData.instagram_business_account.id})`)
          }
        }
      } catch (igError) {
        console.warn('⚠️ Não foi possível buscar conta Instagram:', igError)
      }
    }

    return {
      success: true,
      accounts: Object.keys(accounts).length > 0 ? accounts : undefined
    }

  } catch (error: any) {
    console.error('❌ Erro ao testar conexão Meta:', error)
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    }
  }
}

// ========================================
// ❌ DELETE /api/meta/config
// Remover configuração
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem remover configurações da Meta' 
      }, { status: 403 })
    }

    console.log('❌ Removendo configuração Meta para bar:', bar_id)

    const { error } = await supabase
      .from('meta_configuracoes')
      .update({ ativo: false })
      .eq('bar_id', bar_id)

    if (error) {
      console.error('❌ Erro ao desativar configuração Meta:', error)
      return NextResponse.json({ error: 'Erro ao remover configuração' }, { status: 500 })
    }

    console.log('✅ Configuração Meta desativada')
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Erro ao remover configuração Meta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 