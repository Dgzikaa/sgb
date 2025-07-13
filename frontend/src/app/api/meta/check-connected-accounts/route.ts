import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando contas conectadas ao token...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada' 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      connected_accounts: {}
    }

    // 1. Verificar usuário conectado
    console.log('👤 Verificando usuário conectado...')
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`)
    const userData = await userResponse.json()
    results.connected_accounts.user = userData

    // 2. Verificar páginas Facebook conectadas
    console.log('📘 Verificando páginas Facebook...')
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesResponse.json()
    results.connected_accounts.facebook_pages = pagesData.data || []

    // 3. Verificar Instagram Business conectado
    console.log('📱 Verificando Instagram Business...')
    const instagramAccounts = []
    
    for (const page of (pagesData.data || [])) {
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`)
        const igData = await igResponse.json()
        
        if (igData.instagram_business_account) {
          // Buscar detalhes do Instagram
          const igDetailsResponse = await fetch(`https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name,followers_count,biography&access_token=${accessToken}`)
          const igDetails = await igDetailsResponse.json()
          
          instagramAccounts.push({
            page_name: page.name,
            page_id: page.id,
            instagram: igDetails
          })
        }
      } catch (e) {
        console.warn(`Erro ao verificar Instagram da página ${page.name}`)
      }
    }
    
    results.connected_accounts.instagram_accounts = instagramAccounts

    // 4. Verificar Business Managers conectados
    console.log('🏢 Verificando Business Managers...')
    const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`)
    const businessData = await businessResponse.json()
    results.connected_accounts.business_managers = businessData.data || []

    // 5. Análise do que está configurado atualmente
    results.current_config = {
      instagram_id_configured: configs.instagram_account_id,
      page_id_configured: configs.page_id,
      is_instagram_found: instagramAccounts.some(ig => ig.instagram.id === configs.instagram_account_id),
             is_page_found: (pagesData.data || []).some((p: any) => p.id === configs.page_id)
    }

    // 6. Recomendações
    const recommendations = []
    
    if (instagramAccounts.length > 1) {
      recommendations.push({
        type: 'multiple_instagram',
        message: `Encontradas ${instagramAccounts.length} contas Instagram. Verifique se está usando a conta correta do Ordinário Bar.`,
        accounts: instagramAccounts.map(ig => `@${ig.instagram.username} (${ig.instagram.followers_count} seguidores)`)
      })
    }

    if (results.connected_accounts.business_managers.length > 1) {
      recommendations.push({
        type: 'multiple_business',
        message: `Encontrados ${results.connected_accounts.business_managers.length} Business Managers. As campanhas podem estar em outro Business Manager.`,
                 businesses: results.connected_accounts.business_managers.map((b: any) => b.name)
      })
    }

    const ordinaryInstagram = instagramAccounts.find(ig => 
      ig.instagram.username?.toLowerCase().includes('ordinario') || 
      ig.instagram.name?.toLowerCase().includes('ordinario') ||
      ig.instagram.followers_count === 36133
    )

    if (ordinaryInstagram) {
      recommendations.push({
        type: 'ordinario_found',
        message: 'Conta do Ordinário Bar encontrada!',
        account: ordinaryInstagram
      })
    } else {
      recommendations.push({
        type: 'ordinario_not_found',
        message: 'Conta do Ordinário Bar não encontrada. Pode estar conectada a outro Business Manager.',
        suggestion: 'Verifique se a conta @ordinario está conectada ao mesmo Business Manager das campanhas.'
      })
    }

    results.recommendations = recommendations

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro ao verificar contas conectadas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao verificar contas conectadas',
      details: error.message 
    }, { status: 500 })
  }
} 