import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Testando acesso à página Meta com novo page_id')
    
    // Inicializar Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar credenciais
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', 3)
      .single()

    if (!credenciais) {
      throw new Error('Credenciais Meta não encontradas')
    }

    const pageId = credenciais.configuracoes.page_id
    const accessToken = credenciais.access_token

    console.log(`🎯 Testando page_id: ${pageId}`)

    // Teste 1: Buscar dados básicos da página
    const pageUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,fan_count,about&access_token=${accessToken}`
    console.log('📡 URL de teste:', pageUrl.replace(accessToken, 'TOKEN_HIDDEN'))

    const pageResponse = await fetch(pageUrl)
    const pageResponseText = await pageResponse.text()

    console.log(`📊 Status: ${pageResponse.status}`)
    console.log(`📊 Response: ${pageResponseText}`)

    let pageData = null
    try {
      pageData = JSON.parse(pageResponseText)
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e)
    }

    // Teste 2: Verificar permissões
    const permissionsUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    const permissionsResponse = await fetch(permissionsUrl)
    const permissionsData = await permissionsResponse.json()

    console.log('🔑 Páginas acessíveis:', permissionsData)

    // Teste 3: Verificar se o page_id está na lista de páginas acessíveis
    const hasAccess = permissionsData.data?.some((page: any) => page.id === pageId)

    return NextResponse.json({
      success: pageResponse.ok,
      status: pageResponse.status,
      page_id: pageId,
      page_data: pageData,
      has_access_to_page: hasAccess,
      accessible_pages: permissionsData.data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token ? 'EXISTS' : 'MISSING'
      })),
      error: pageResponse.ok ? null : pageResponseText,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 