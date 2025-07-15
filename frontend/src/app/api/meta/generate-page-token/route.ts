import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 === GERANDO PAGE ACCESS TOKEN ===')
    
    const BAR_ID = 3
    
    // Obter credenciais atuais
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true)
      .single()

    if (!credenciais?.configuracoes) {
      return NextResponse.json({ error: 'Credenciais não encontradas' }, { status: 400 })
    }

    const userToken = credenciais.access_token
    const pageId = credenciais.configuracoes.page_id // 517416481460390

    console.log('👤 User Token length:', userToken?.length)
    console.log('📄 Page ID:', pageId)

    // === PASSO 1: Listar páginas do usuário ===
    console.log('📋 Listando páginas do usuário...')
    
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`
    const pagesResponse = await fetch(pagesUrl)
    
    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      return NextResponse.json({
        success: false,
        error: 'Erro ao listar páginas',
        details: errorText
      }, { status: 400 })
    }
    
    const pagesData = await pagesResponse.json()
    console.log('📄 Páginas encontradas:', pagesData.data?.length || 0)
    
    // === PASSO 2: Encontrar a página específica ===
    const targetPage = pagesData.data?.find((page: any) => page.id === pageId)
    
    if (!targetPage) {
      return NextResponse.json({
        success: false,
        error: 'Página não encontrada nas contas do usuário',
        available_pages: pagesData.data?.map((p: any) => ({ id: p.id, name: p.name })) || [],
        target_page_id: pageId
      }, { status: 400 })
    }
    
    console.log('✅ Página encontrada:', targetPage.name)
    console.log('🔑 Page Access Token disponível:', !!targetPage.access_token)
    
    // === PASSO 3: Validar Page Access Token ===
    if (!targetPage.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Page Access Token não disponível',
        page_info: {
          id: targetPage.id,
          name: targetPage.name,
          category: targetPage.category
        },
        required_permissions: [
          'pages_show_list',
          'pages_read_engagement', 
          'read_insights'
        ]
      }, { status: 400 })
    }
    
    const pageToken = targetPage.access_token
    
    // === PASSO 4: Testar Page Access Token ===
    console.log('🧪 Testando Page Access Token...')
    
    const testUrl = `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions_unique&period=day&since=2025-07-10&until=2025-07-14&access_token=${pageToken}`
    const testResponse = await fetch(testUrl)
    
    let testResult = {
      success: false,
      error: null as any,
      data: null as any
    }
    
    if (testResponse.ok) {
      const testData = await testResponse.json()
      testResult = {
        success: true,
        error: null,
        data: {
          metric: 'page_impressions_unique',
          values_count: testData.data?.[0]?.values?.length || 0,
          total_impressions: testData.data?.[0]?.values?.reduce((sum: number, item: any) => sum + item.value, 0) || 0
        }
      }
    } else {
      testResult = {
        success: false,
        error: await testResponse.text(),
        data: null
      }
    }
    
    // === PASSO 5: Salvar Page Access Token (se funcionar) ===
    let savedToken = false
    if (testResult.success) {
      console.log('💾 Salvando Page Access Token no banco...')
      
      const novasConfiguracoes = {
        ...credenciais.configuracoes,
        page_access_token: pageToken,
        page_token_generated_at: new Date().toISOString(),
        page_token_test_result: testResult.data
      }
      
      const { error: updateError } = await supabase
        .from('api_credentials')
        .update({
          configuracoes: novasConfiguracoes
        })
        .eq('sistema', 'meta')
        .eq('bar_id', BAR_ID)
        .eq('ativo', true)
      
      if (!updateError) {
        savedToken = true
        console.log('✅ Page Access Token salvo com sucesso!')
      } else {
        console.error('❌ Erro ao salvar token:', updateError)
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        user_token: {
          length: userToken?.length,
          valid: true
        },
        pages_found: pagesData.data?.length || 0,
        target_page: {
          id: targetPage.id,
          name: targetPage.name,
          category: targetPage.category,
          has_page_token: !!targetPage.access_token
        },
        page_token: {
          generated: !!targetPage.access_token,
          length: targetPage.access_token?.length || 0,
          test_result: testResult,
          saved_to_database: savedToken
        },
        next_steps: testResult.success ? [
          '✅ Page Access Token funcionando',
          '✅ Token salvo no banco de dados',
          '🚀 Robô pode usar page_access_token para Facebook insights'
        ] : [
          '❌ Page Access Token não funcionou',
          '🔧 Verificar permissões da página no Facebook',
          '📞 Pode precisar renovar permissões'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 