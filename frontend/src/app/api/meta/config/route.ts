import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { z } from 'zod'

// Schema de validaÃ§Ã£o para configuraÃ§Ã£o
const MetaConfigSchema = z.object({
  access_token: z.string().min(10, 'Access token Ã© obrigatÃ³rio'),
  app_id: z.string().min(5, 'App ID deve ter pelo menos 5 caracteres').optional().or(z.literal(null)),
  app_secret: z.string().min(10, 'App Secret deve ter pelo menos 10 caracteres').optional().or(z.literal(null)),
  facebook_page_id: z.string().optional(),
  instagram_account_id: z.string().optional(),
  api_version: z.string().optional().default('v18.0'),
  coleta_automatica: z.boolean().optional().default(true),
  frequencia_coleta_horas: z.number().int().min(1).max(24).optional().default(6),
  horario_coleta_preferido: z.string().optional().default('09:00'),
  rate_limit_per_hour: z.number().int().min(50).max(1000).optional().default(200)
})

// ========================================
// ðŸ“Š GET /api/meta/config
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ” GET /api/meta/config - Iniciando...')
    
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    console.log('ðŸ“ Headers recebidos:', {
      hasUserData: !!userData,
      userDataLength: userData?.length || 0
    })
    
    if (!userData) {
      console.log('âŒ UsuÃ¡rio nÃ£o autenticado - header x-user-data nÃ£o encontrado')
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 });
    }

    let parsedUserData;
    try {
      // Primeiro decodificar URL encoding, depois parsear JSON
      const decodedUserData = decodeURIComponent(userData);
      console.log('ðŸ”“ Dados decodificados:', decodedUserData)
      
      parsedUserData = JSON.parse(decodedUserData);
      console.log('âœ… Dados do usuÃ¡rio parseados:', {
        hasBarId: !!parsedUserData.bar_id,
        hasPermissao: !!parsedUserData.permissao,
        barId: parsedUserData.bar_id,
        permissao: parsedUserData.permissao
      })
    } catch (parseError) {
      console.error('âŒ Erro ao parsear dados do usuÃ¡rio:', parseError)
      return NextResponse.json({ 
        error: 'Dados de usuÃ¡rio invÃ¡lidos',
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      }, { status: 400 });
    }

    const { bar_id, permissao } = parsedUserData;

    // Verificar permissÃµes - aceitar tanto 'role' quanto 'permissao'
    const userRole = parsedUserData.role || parsedUserData.permissao || 'funcionario';
    console.log('ðŸ”‘ Verificando permissÃµes:', { userRole, permissao: parsedUserData.permissao, role: parsedUserData.role })
    
    if (!['admin', 'financeiro'].includes(userRole)) {
      console.log('âŒ PermissÃ£o insuficiente:', userRole)
      return NextResponse.json({ error: 'Sem permissÃ£o para acessar configuraÃ§Ãµes' }, { status: 403 });
    }

    // Criar cliente Supabase
    console.log('ðŸ”— Criando cliente Supabase...')
    const supabase = createServiceRoleClient()

    // Buscar configuraÃ§Ã£o existente na tabela api_credentials
    console.log('ðŸ” Buscando configuraÃ§Ã£o para bar_id:', bar_id)
    const { data: config, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('sistema', 'meta')
      .eq('ambiente', 'producao')
      .eq('ativo', true)
      .single();

    console.log('ðŸ“Š Resultado da busca:', {
      hasConfig: !!config,
      error: error?.message,
      errorCode: error?.code
    })

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuraÃ§Ã£o encontrada
        console.log('â„¹ï¸ Nenhuma configuraÃ§Ã£o encontrada para o bar')
        return NextResponse.json({ 
          success: true,
          exists: false,
          config: null,
          message: 'Nenhuma configuraÃ§Ã£o encontrada'
        });
      }
      
      console.error('âŒ Erro ao buscar configuraÃ§Ã£o:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuraÃ§Ã£o' }, { status: 500 });
    }

    console.log('âœ… ConfiguraÃ§Ã£o encontrada, retornando dados mascarados')
    
    // Retornar dados mascarados
    const maskedConfig = {
      id: config.id,
      access_token: '***' + config.access_token.slice(-8),
      app_id: config.client_id,
      app_secret: config.client_secret ? '***' + config.client_secret.slice(-4) : null,
      ativo: config.ativo,
      criado_em: config.criado_em,
      atualizado_em: config.atualizado_em
    }

    return NextResponse.json({ 
      success: true,
      exists: true,
      config: maskedConfig 
    });

  } catch (error) {
    console.error('âŒ Erro crÃ­tico na API de configuraÃ§Ã£o Meta:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// ========================================
// ðŸ’¾ POST /api/meta/config
// Salvar/atualizar configuraÃ§Ã£o
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('ðŸ’¾ POST /api/meta/config - Iniciando...')
    
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    console.log('ðŸ“ Headers recebidos:', {
      hasUserData: !!userData,
      userDataLength: userData?.length || 0
    })
    
    if (!userData) {
      console.log('âŒ UsuÃ¡rio nÃ£o autenticado - header x-user-data nÃ£o encontrado')
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 })
    }

    let parsedUserData;
    try {
      // Primeiro decodificar URL encoding, depois parsear JSON
      const decodedUserData = decodeURIComponent(userData);
      console.log('ðŸ”“ Dados decodificados:', decodedUserData)
      
      parsedUserData = JSON.parse(decodedUserData);
      console.log('âœ… Dados do usuÃ¡rio parseados:', {
        hasBarId: !!parsedUserData.bar_id,
        hasPermissao: !!parsedUserData.permissao,
        barId: parsedUserData.bar_id,
        permissao: parsedUserData.permissao
      })
    } catch (parseError) {
      console.error('âŒ Erro ao parsear dados do usuÃ¡rio:', parseError)
      return NextResponse.json({ 
        error: 'Dados de usuÃ¡rio invÃ¡lidos',
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      }, { status: 400 });
    }

    const { bar_id, permissao } = parsedUserData;

    // Verificar permissÃµes - aceitar tanto 'role' quanto 'permissao'
    const userRole = parsedUserData.role || parsedUserData.permissao || 'funcionario';
    console.log('ðŸ”‘ Verificando permissÃµes:', { userRole, permissao: parsedUserData.permissao, role: parsedUserData.role })
    
    if (!['admin'].includes(userRole)) {
      console.log('âŒ PermissÃ£o insuficiente:', userRole)
      return NextResponse.json({ 
        error: 'Apenas administradores podem modificar configuraÃ§Ãµes da Meta' 
      }, { status: 403 })
    }

    // Parse e validaÃ§Ã£o dos dados
    const body = await request.json()
    console.log('ðŸ“Š Dados recebidos no body:', {
      hasAccessToken: !!body.access_token,
      hasAppId: !!body.app_id,
      hasAppSecret: !!body.app_secret
    })
    
    const configData = MetaConfigSchema.parse(body)

    console.log('ðŸ’¾ Salvando configuraÃ§Ã£o Meta para bar:', bar_id)

    // Testar conexÃ£o antes de salvar
    console.log('ðŸ” Testando conexÃ£o com Meta API...')
    const testResult = await testMetaConnection(configData)
    if (!testResult.success) {
      console.error('âŒ Falha no teste de conexÃ£o:', testResult.error)
      return NextResponse.json({ 
        error: 'Falha ao conectar com a Meta API',
        details: testResult.error 
      }, { status: 400 })
    }

    console.log('âœ… Teste de conexÃ£o passou')

    // Buscar IDs das contas se nÃ£o foram fornecidos
    let enhancedConfig = { ...configData }
    if (testResult.accounts) {
      if (!enhancedConfig.facebook_page_id && testResult.accounts.facebook_page_id) {
        enhancedConfig.facebook_page_id = testResult.accounts.facebook_page_id
      }
      if (!enhancedConfig.instagram_account_id && testResult.accounts.instagram_account_id) {
        enhancedConfig.instagram_account_id = testResult.accounts.instagram_account_id
      }
    }

    // Calcular prÃ³xima coleta
    const proximaColeta = new Date()
    proximaColeta.setHours(
      parseInt(enhancedConfig.horario_coleta_preferido?.split(':')[0] || '9'),
      parseInt(enhancedConfig.horario_coleta_preferido?.split(':')[1] || '0'),
      0, 0
    )
    
    // Se o horÃ¡rio jÃ¡ passou hoje, agendar para amanhÃ£
    if (proximaColeta <= new Date()) {
      proximaColeta.setDate(proximaColeta.getDate() + 1)
    }

    // Salvar na tabela api_credentials com sistema 'meta'
    console.log('ðŸ”— Salvando na tabela api_credentials...')
    const supabase = createServiceRoleClient()
    
    // Verificar se jÃ¡ existe configuraÃ§Ã£o
    const { data: existing } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('sistema', 'meta')
      .eq('ambiente', 'producao')
      .single()

    const credentialsData = {
      bar_id,
      sistema: 'meta',
      ambiente: 'producao',
      access_token: enhancedConfig.access_token,
      client_id: enhancedConfig.app_id || null,
      client_secret: enhancedConfig.app_secret || null,
      redirect_uri: null,
      scopes: 'pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights',
      base_url: 'https://graph.facebook.com',
      ativo: true,
      atualizado_em: new Date().toISOString()
    }

    let data, error
    
    if (existing) {
      // Atualizar existente
      console.log('ðŸ”„ Atualizando configuraÃ§Ã£o existente...')
      const { data: updateData, error: updateError } = await supabase
        .from('api_credentials')
        .update(credentialsData)
        .eq('id', existing.id)
        .select()
        .single()
      
      data = updateData
      error = updateError
    } else {
      // Criar novo
      console.log('ðŸ†• Criando nova configuraÃ§Ã£o...')
      const { data: insertData, error: insertError } = await supabase
        .from('api_credentials')
        .insert({
          ...credentialsData,
          criado_em: new Date().toISOString()
        })
        .select()
        .single()
      
      data = insertData
      error = insertError
    }

    if (error) {
      console.error('âŒ Erro ao salvar configuraÃ§Ã£o Meta:', error)
      return NextResponse.json({ 
        error: 'Erro ao salvar configuraÃ§Ã£o',
        details: error.message 
      }, { status: 500 })
    }

    console.log('âœ… ConfiguraÃ§Ã£o Meta salva com sucesso na tabela api_credentials')

    // Retornar dados mascarados
          const responseSafe = {
        id: data.id,
        sistema: 'meta',
        access_token: '***' + data.access_token.slice(-8),
      app_id: data.client_id,
      app_secret: data.client_secret ? '***' + data.client_secret.slice(-4) : null,
      ativo: data.ativo,
      criado_em: data.criado_em,
      atualizado_em: data.atualizado_em,
      // Dados especÃ­ficos do Meta
      facebook_page_id: enhancedConfig.facebook_page_id,
      instagram_account_id: enhancedConfig.instagram_account_id,
      api_version: enhancedConfig.api_version || 'v18.0',
      accounts: testResult.accounts
    }

    return NextResponse.json({
      success: true,
      config: responseSafe,
      accounts: testResult.accounts
    })

  } catch (error: any) {
    console.error('âŒ Erro crÃ­tico ao salvar configuraÃ§Ã£o Meta:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Dados invÃ¡lidos',
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
// ðŸ”¬ PUT /api/meta/config/test
// Testar configuraÃ§Ã£o
// ========================================
export async function PUT(request: NextRequest) {
  try {
    console.log('ðŸ”¬ PUT /api/meta/config/test - Iniciando...')
    
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    console.log('ðŸ“ Headers recebidos:', {
      hasUserData: !!userData,
      userDataLength: userData?.length || 0
    })
    
    if (!userData) {
      console.log('âŒ UsuÃ¡rio nÃ£o autenticado - header x-user-data nÃ£o encontrado')
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 })
    }

    let parsedUserData;
    try {
      // Primeiro decodificar URL encoding, depois parsear JSON
      const decodedUserData = decodeURIComponent(userData);
      console.log('ðŸ”“ Dados decodificados:', decodedUserData)
      
      parsedUserData = JSON.parse(decodedUserData);
      console.log('âœ… Dados do usuÃ¡rio parseados:', {
        hasBarId: !!parsedUserData.bar_id,
        hasPermissao: !!parsedUserData.permissao,
        barId: parsedUserData.bar_id,
        permissao: parsedUserData.permissao
      })
    } catch (parseError) {
      console.error('âŒ Erro ao parsear dados do usuÃ¡rio:', parseError)
      return NextResponse.json({ 
        error: 'Dados de usuÃ¡rio invÃ¡lidos',
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      }, { status: 400 });
    }

    const { bar_id, permissao } = parsedUserData;

    // Verificar permissÃµes - aceitar tanto 'role' quanto 'permissao'
    const userRole = parsedUserData.role || parsedUserData.permissao || 'funcionario';
    console.log('ðŸ”‘ Verificando permissÃµes:', { userRole, permissao: parsedUserData.permissao, role: parsedUserData.role })
    
    if (!['admin', 'financeiro'].includes(userRole)) {
      console.log('âŒ PermissÃ£o insuficiente:', userRole)
      return NextResponse.json({ 
        error: 'Sem permissÃ£o para testar configuraÃ§Ãµes da Meta' 
      }, { status: 403 })
    }

    // Parse dos dados de teste
    const body = await request.json()
    console.log('ðŸ“Š Dados recebidos no body:', {
      hasAccessToken: !!body.access_token,
      hasAppId: !!body.app_id,
      hasAppSecret: !!body.app_secret,
      appId: body.app_id,
      appSecret: body.app_secret
    })
    
    const testData = MetaConfigSchema.parse(body)

    console.log('ðŸ”¬ Testando configuraÃ§Ã£o Meta...')

    const testResult = await testMetaConnection(testData)

    console.log('ðŸ“Š Resultado do teste:', {
      success: testResult.success,
      hasAccounts: !!testResult.accounts,
      error: testResult.error
    })

    return NextResponse.json(testResult, { 
      status: testResult.success ? 200 : 400 
    })

  } catch (error: any) {
    console.error('âŒ Erro crÃ­tico ao testar configuraÃ§Ã£o Meta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// ðŸ› ï¸ FUNÃ‡Ã•ES AUXILIARES
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
    console.log('ðŸ” Testando acesso Ã  Meta API...')

    // Testar token bÃ¡sico
    const meResponse = await fetch(
      `https://graph.facebook.com/${config.api_version}/me?access_token=${config.access_token}`,
      { method: 'GET' }
    )

    const meData = await meResponse.json()

    if (!meResponse.ok) {
      return {
        success: false,
        error: `Meta API Error: ${meData.error?.message || 'Token invÃ¡lido'}`
      }
    }

    console.log('âœ… Token vÃ¡lido, buscando contas conectadas...')

    // Buscar pÃ¡ginas do Facebook
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

      console.log(`ðŸ“„ PÃ¡gina Facebook encontrada: ${firstPage.name} (${firstPage.id})`)

      // Buscar conta Instagram conectada Ã  pÃ¡gina
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
            console.log(`ðŸ“¸ Instagram encontrado: @${igProfileData.username} (${igData.instagram_business_account.id})`)
          }
        }
      } catch (igError) {
        console.warn('âš ï¸ NÃ£o foi possÃ­vel buscar conta Instagram:', igError)
      }
    }

    return {
      success: true,
      accounts: Object.keys(accounts).length > 0 ? accounts : undefined
    }

  } catch (error: any) {
    console.error('âŒ Erro ao testar conexÃ£o Meta:', error)
    return {
      success: false,
      error: error.message || 'Erro de conexÃ£o'
    }
  }
}

// ========================================
// âŒ DELETE /api/meta/config
// Remover configuraÃ§Ã£o
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    console.log('âŒ DELETE /api/meta/config - Iniciando...')
    
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    console.log('ðŸ“ Headers recebidos:', {
      hasUserData: !!userData,
      userDataLength: userData?.length || 0
    })
    
    if (!userData) {
      console.log('âŒ UsuÃ¡rio nÃ£o autenticado - header x-user-data nÃ£o encontrado')
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 })
    }

    let parsedUserData;
    try {
      // Primeiro decodificar URL encoding, depois parsear JSON
      const decodedUserData = decodeURIComponent(userData);
      console.log('ðŸ”“ Dados decodificados:', decodedUserData)
      
      parsedUserData = JSON.parse(decodedUserData);
      console.log('âœ… Dados do usuÃ¡rio parseados:', {
        hasBarId: !!parsedUserData.bar_id,
        hasPermissao: !!parsedUserData.permissao,
        barId: parsedUserData.bar_id,
        permissao: parsedUserData.permissao
      })
    } catch (parseError) {
      console.error('âŒ Erro ao parsear dados do usuÃ¡rio:', parseError)
      return NextResponse.json({ 
        error: 'Dados de usuÃ¡rio invÃ¡lidos',
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      }, { status: 400 });
    }

    const { bar_id, permissao } = parsedUserData;

    // Verificar permissÃµes
    if (!['admin'].includes(permissao)) {
      console.log('âŒ PermissÃ£o insuficiente:', permissao)
      return NextResponse.json({ 
        error: 'Apenas administradores podem remover configuraÃ§Ãµes da Meta' 
      }, { status: 403 })
    }

    console.log('âŒ Removendo configuraÃ§Ã£o Meta para bar:', bar_id)

    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('api_credentials')
      .update({ ativo: false })
      .eq('bar_id', bar_id)
      .eq('sistema', 'meta')
      .eq('ambiente', 'producao')

    if (error) {
      console.error('âŒ Erro ao desativar configuraÃ§Ã£o Meta:', error)
      return NextResponse.json({ 
        error: 'Erro ao remover configuraÃ§Ã£o',
        details: error.message 
      }, { status: 500 })
    }

    console.log('âœ… ConfiguraÃ§Ã£o Meta desativada')
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('âŒ Erro crÃ­tico ao remover configuraÃ§Ã£o Meta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 
