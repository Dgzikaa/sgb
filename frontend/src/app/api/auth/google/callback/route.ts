import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Callback do OAuth Google
 * Recebe o código de autorização e redireciona para página de sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('🔄 Callback OAuth recebido:', { code: !!code, state, error })

    if (error) {
      console.error('❌ Erro OAuth:', error)
      
      const errorPageUrl = new URL('/auth/error', request.url)
      errorPageUrl.searchParams.set('error', error)
      errorPageUrl.searchParams.set('description', searchParams.get('error_description') || 'Erro na autorização')
      
      return NextResponse.redirect(errorPageUrl)
    }

    if (!code) {
      console.error('❌ Código de autorização não recebido')
      
      const errorPageUrl = new URL('/auth/error', request.url)
      errorPageUrl.searchParams.set('error', 'no_code')
      errorPageUrl.searchParams.set('description', 'Código de autorização não recebido')
      
      return NextResponse.redirect(errorPageUrl)
    }

    // Redirecionar para página de sucesso com o código
    const successPageUrl = new URL('/auth/success', request.url)
    successPageUrl.searchParams.set('code', code)
    successPageUrl.searchParams.set('state', state || '')
    
    console.log('✅ Redirecionando para página de sucesso...')
    
    return NextResponse.redirect(successPageUrl)

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error)
    
    const errorPageUrl = new URL('/auth/error', request.url)
    errorPageUrl.searchParams.set('error', 'internal_error')
    errorPageUrl.searchParams.set('description', 'Erro interno do servidor')
    
    return NextResponse.redirect(errorPageUrl)
  }
} 
