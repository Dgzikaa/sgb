// ========================================
// 🔧 API META CONFIGURATION & TESTING
// ========================================
// API para configurar e testar credenciais Meta API
// Recursos: configurar, testar, descobrir dados disponíveis

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/middleware/auth'

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ========================================
// 🔒 AUTENTICAÇÃO E VALIDAÇÃO
// ========================================
async function validateAdminAccess(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) return false
  
  // Verificar se é admin  
  return user.role === 'admin'
}

// Validação para Marketing (Admin OU Financeiro)
async function validateMarketingAccess(request: NextRequest) {
  console.log('🔍 [DEBUG] Validando acesso marketing...')
  
  const user = await authenticateUser(request)
  console.log('🔍 [DEBUG] Usuário autenticado:', user ? { nome: user.nome, role: user.role, email: user.email } : 'null')
  
  if (!user) {
    console.log('❌ [DEBUG] Usuário não encontrado/autenticado')
    return false
  }
  
  // Verificar se é admin ou financeiro
  const hasAccess = user.role === 'admin' || user.role === 'financeiro'
  console.log('🔍 [DEBUG] Acesso permitido:', hasAccess, '(role:', user.role, ')')
  
  return hasAccess
}

// ========================================
// 🧪 TESTE DA META API
// ========================================
async function testMetaAPI(accessToken: string) {
  const results: any = {
    access_token_valid: false,
    user_info: null,
    accounts: [],
    pages: [],
    instagram_accounts: [],
    permissions: [],
    available_endpoints: [],
    error_details: null
  }

  try {
    // 1. Testar validade do token e info do usuário
    console.log('🔍 Testando token de acesso...')
    const userResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
    )
    
    if (userResponse.ok) {
      results.access_token_valid = true
      results.user_info = await userResponse.json()
      console.log('✅ Token válido:', results.user_info)
    } else {
      const error = await userResponse.json()
      results.error_details = error
      console.log('❌ Token inválido:', error)
      return results
    }

    // 2. Buscar permissões do token
    console.log('🔍 Verificando permissões...')
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
    )
    
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json()
      results.permissions = permissionsData.data || []
      console.log('📋 Permissões encontradas:', results.permissions)
    }

    // 3. Buscar contas publicitárias
    console.log('🔍 Buscando contas publicitárias...')
    try {
      const accountsResponse = await fetch(
        `https://graph.facebook.com/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status,currency,timezone_name`
      )
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        results.accounts = accountsData.data || []
        console.log('💼 Contas encontradas:', results.accounts.length)
      }
    } catch (e) {
      console.log('⚠️ Erro ao buscar contas publicitárias (pode não ter permissão)')
    }

    // 4. Buscar páginas do Facebook
    console.log('🔍 Buscando páginas Facebook...')
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${accessToken}&fields=id,name,category,access_token,instagram_business_account`
      )
      
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        results.pages = pagesData.data || []
        console.log('📄 Páginas encontradas:', results.pages.length)

        // Para cada página, tentar buscar Instagram Business Account
        for (const page of results.pages) {
          if (page.instagram_business_account) {
            console.log(`🔍 Testando Instagram para página ${page.name}...`)
            try {
              const igResponse = await fetch(
                `https://graph.facebook.com/${page.instagram_business_account.id}?access_token=${page.access_token}&fields=id,username,name,followers_count,media_count,profile_picture_url`
              )
              
              if (igResponse.ok) {
                const igData = await igResponse.json()
                results.instagram_accounts.push({
                  page_id: page.id,
                  page_name: page.name,
                  instagram_account: igData
                })
                console.log('📱 Instagram conectado:', igData.username)
              }
            } catch (igError) {
              console.log('⚠️ Erro ao acessar Instagram da página:', page.name)
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Erro ao buscar páginas (pode não ter permissão)')
    }

    // 5. Testar endpoints específicos disponíveis
    console.log('🔍 Testando endpoints disponíveis...')
    const endpoints = [
      { name: 'User Basic Info', url: `me?fields=id,name,email` },
      { name: 'User Pages', url: `me/accounts?fields=id,name` },
      { name: 'Page Insights', url: results.pages[0]?.id ? `${results.pages[0].id}/insights?metric=page_fans` : null },
      { name: 'Instagram Insights', url: results.instagram_accounts[0]?.instagram_account?.id ? `${results.instagram_accounts[0].instagram_account.id}/insights?metric=follower_count` : null }
    ]

    for (const endpoint of endpoints) {
      if (!endpoint.url) continue
      
      try {
        const testResponse = await fetch(
          `https://graph.facebook.com/${endpoint.url}&access_token=${accessToken}`
        )
        
        results.available_endpoints.push({
          name: endpoint.name,
          url: endpoint.url,
          status: testResponse.ok ? 'accessible' : 'restricted',
          status_code: testResponse.status
        })
      } catch (e) {
        results.available_endpoints.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'error',
          error: e
        })
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste da API:', error)
    results.error_details = error
  }

  return results
}

// ========================================
// 📊 GET - BUSCAR CONFIGURAÇÕES ATUAIS
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [META CONFIG] Iniciando GET request')
    console.log('🔍 [META CONFIG] Headers disponíveis:', Object.fromEntries(request.headers.entries()))
    
    // Validar acesso marketing (admin ou financeiro)
    const hasAccess = await validateMarketingAccess(request)
    console.log('🔍 [META CONFIG] Resultado da validação de acesso:', hasAccess)
    
    if (!hasAccess) {
      console.log('❌ [META CONFIG] Acesso negado')
      return NextResponse.json(
        { error: 'Acesso negado. Necessário perfil Admin ou Financeiro.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'test') {
      // 🧪 TESTAR API COM CONFIGURAÇÕES ATUAIS
      const { data: config, error } = await supabase
        .from('meta_configuracoes')
        .select('*')
        .eq('bar_id', 3)
        .eq('ativo', true)
        .single()

      if (error || !config) {
        return NextResponse.json(
          { error: 'Nenhuma configuração Meta encontrada para testar' },
          { status: 404 }
        )
      }

      console.log('🚀 Iniciando teste da Meta API...')
      const testResults = await testMetaAPI(config.access_token)

      return NextResponse.json({
        success: true,
        test_results: testResults,
        config_used: {
          id: config.id,
          criado_em: config.criado_em,
          ultima_verificacao: config.ultima_verificacao
        },
        timestamp: new Date().toISOString()
      })

    } else {
      // 📋 BUSCAR CONFIGURAÇÕES ATUAIS
      const { data: configs, error } = await supabase
        .from('meta_configuracoes')
        .select('*')
        .eq('bar_id', 3)
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao buscar configurações:', error)
        return NextResponse.json(
          { error: 'Erro ao buscar configurações Meta' },
          { status: 500 }
        )
      }

      // Mascarar tokens por segurança
      const safeConfigs = configs.map(config => ({
        ...config,
        access_token: config.access_token ? `${config.access_token.substring(0, 10)}...` : null,
        app_secret: config.app_secret ? '***CONFIGURADO***' : null
      }))

      return NextResponse.json({
        success: true,
        configurations: safeConfigs,
        total: configs.length,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ [META CONFIG] Erro na API Meta Config GET:', error)
    console.error('❌ [META CONFIG] Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 💾 POST - SALVAR NOVA CONFIGURAÇÃO
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Validar acesso marketing (admin ou financeiro)
    const hasAccess = await validateMarketingAccess(request)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado. Necessário perfil Admin ou Financeiro.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { access_token, app_id, app_secret, test_immediately } = body

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token é obrigatório' },
        { status: 400 }
      )
    }

    // 🧪 TESTAR A API ANTES DE SALVAR
    console.log('🔍 Testando nova configuração Meta...')
    const testResults = await testMetaAPI(access_token)

    if (!testResults.access_token_valid) {
      return NextResponse.json({
        success: false,
        error: 'Token de acesso inválido',
        test_results: testResults,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 📱 EXTRAIR DADOS DOS TESTES PARA SALVAR
    const pageId = testResults.pages[0]?.id || null
    const pageName = testResults.pages[0]?.name || null
    const instagramId = testResults.instagram_accounts[0]?.instagram_account?.id || null
    const instagramUsername = testResults.instagram_accounts[0]?.instagram_account?.username || null

    // 💾 DESATIVAR CONFIGURAÇÕES ANTIGAS
    await supabase
      .from('meta_configuracoes')
      .update({ ativo: false })
      .eq('bar_id', 3)

    // 💾 SALVAR NOVA CONFIGURAÇÃO
    const { data: newConfig, error: saveError } = await supabase
      .from('meta_configuracoes')
      .insert({
        bar_id: 3,
        access_token,
        app_id: app_id || null,
        app_secret: app_secret || null,
        page_id: pageId,
        page_name: pageName,
        instagram_account_id: instagramId,
        instagram_username: instagramUsername,
        configuracoes_adicionais: {
          user_info: testResults.user_info,
          permissions: testResults.permissions,
          pages_count: testResults.pages.length,
          instagram_accounts_count: testResults.instagram_accounts.length,
          available_endpoints: testResults.available_endpoints,
          test_timestamp: new Date().toISOString()
        },
        ativo: true,
        ultima_verificacao: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar configuração:', saveError)
      return NextResponse.json(
        { error: 'Erro ao salvar configuração Meta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração Meta salva com sucesso!',
      configuration: {
        id: newConfig.id,
        page_name: pageName,
        instagram_username: instagramUsername,
        permissions_count: testResults.permissions.length,
        criado_em: newConfig.criado_em
      },
      test_results: test_immediately ? testResults : 'Teste pulado',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API Meta Config POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 🔧 PUT - ATUALIZAR CONFIGURAÇÃO EXISTENTE
// ========================================
export async function PUT(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { config_id, access_token, app_id, app_secret, retest } = body

    if (!config_id) {
      return NextResponse.json(
        { error: 'config_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar configuração atual
    const { data: currentConfig, error: fetchError } = await supabase
      .from('meta_configuracoes')
      .select('*')
      .eq('id', config_id)
      .eq('bar_id', 3)
      .single()

    if (fetchError || !currentConfig) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    let testResults = null

    // Se forneceu novo token, testar
    if (access_token && access_token !== currentConfig.access_token) {
      console.log('🔍 Testando token atualizado...')
      testResults = await testMetaAPI(access_token)
      
      if (!testResults.access_token_valid) {
        return NextResponse.json({
          success: false,
          error: 'Novo token de acesso inválido',
          test_results: testResults,
          timestamp: new Date().toISOString()
        }, { status: 400 })
      }

      updateData.access_token = access_token
      updateData.page_id = testResults.pages[0]?.id || null
      updateData.page_name = testResults.pages[0]?.name || null
      updateData.instagram_account_id = testResults.instagram_accounts[0]?.instagram_account?.id || null
      updateData.instagram_username = testResults.instagram_accounts[0]?.instagram_account?.username || null
    }

    // Reteste com token atual se solicitado
    if (retest && !testResults) {
      console.log('🔍 Retestando configuração atual...')
      testResults = await testMetaAPI(currentConfig.access_token)
    }

    // Outros campos
    if (app_id !== undefined) updateData.app_id = app_id
    if (app_secret !== undefined) updateData.app_secret = app_secret
    
    // Sempre atualizar timestamp de verificação
    updateData.ultima_verificacao = new Date().toISOString()

    // Atualizar configurações adicionais se houve teste
    if (testResults) {
      updateData.configuracoes_adicionais = {
        ...currentConfig.configuracoes_adicionais,
        last_test: {
          user_info: testResults.user_info,
          permissions: testResults.permissions,
          pages_count: testResults.pages.length,
          instagram_accounts_count: testResults.instagram_accounts.length,
          available_endpoints: testResults.available_endpoints,
          test_timestamp: new Date().toISOString()
        }
      }
    }

    // Atualizar no banco
    const { data: updatedConfig, error: updateError } = await supabase
      .from('meta_configuracoes')
      .update(updateData)
      .eq('id', config_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar configuração:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração Meta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração Meta atualizada com sucesso!',
      updated_fields: Object.keys(updateData),
      test_results: testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API Meta Config PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 🗑️ DELETE - REMOVER CONFIGURAÇÃO
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'ID da configuração é obrigatório' },
        { status: 400 }
      )
    }

    // Desativar ao invés de deletar (para manter histórico)
    const { error } = await supabase
      .from('meta_configuracoes')
      .update({ ativo: false, ultima_verificacao: new Date().toISOString() })
      .eq('id', configId)
      .eq('bar_id', 3)

    if (error) {
      console.error('Erro ao desativar configuração:', error)
      return NextResponse.json(
        { error: 'Erro ao remover configuração Meta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração Meta removida com sucesso',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API Meta Config DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 📋 OPÇÕES DISPONÍVEIS
// ========================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// ========================================
// 📝 DOCUMENTAÇÃO DA API
// ========================================
/*
META CONFIG API ENDPOINTS:

GET /api/admin/meta-config
  ?action=test     - Testar configuração atual
  (default)        - Listar todas as configurações

POST /api/admin/meta-config
  {
    "access_token": "TOKEN_META_API",
    "app_id": "OPCIONAL", 
    "app_secret": "OPCIONAL",
    "test_immediately": true/false
  }

PUT /api/admin/meta-config
  {
    "config_id": "ID",
    "access_token": "NOVO_TOKEN",
    "retest": true/false
  }

DELETE /api/admin/meta-config?id=CONFIG_ID

Todas as requisições precisam de:
  Authorization: Bearer [JWT_TOKEN]
  User role: admin
*/ 