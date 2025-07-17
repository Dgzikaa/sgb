import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Callback do OAuth Google
 * Recebe o cá³digo de autorizaá§á£o e redireciona para pá¡gina de sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('ðŸ”„ Callback OAuth recebido:', { code: !!code, state, error })

    if (error) {
      console.error('Œ Erro OAuth:', error)
      
      const errorPageUrl = new URL('/auth/error', request.url)
      errorPageUrl.searchParams.set('error', error)
      errorPageUrl.searchParams.set('description', searchParams.get('error_description') || 'Erro na autorizaá§á£o')
      
      return NextResponse.redirect(errorPageUrl)
    }

    if (!code) {
      console.error('Œ Cá³digo de autorizaá§á£o ná£o recebido')
      
      const errorPageUrl = new URL('/auth/error', request.url)
      errorPageUrl.searchParams.set('error', 'no_code')
      errorPageUrl.searchParams.set('description', 'Cá³digo de autorizaá§á£o ná£o recebido')
      
      return NextResponse.redirect(errorPageUrl)
    }

    // Redirecionar para pá¡gina de sucesso com o cá³digo
    const successPageUrl = new URL('/auth/success', request.url)
    successPageUrl.searchParams.set('code', code)
    successPageUrl.searchParams.set('state', state || '')
    
    console.log('œ… Redirecionando para pá¡gina de sucesso...')
    
    return NextResponse.redirect(successPageUrl)

  } catch (error) {
    console.error('Œ Erro no callback OAuth:', error)
    
    const errorPageUrl = new URL('/auth/error', request.url)
    errorPageUrl.searchParams.set('error', 'internal_error')
    errorPageUrl.searchParams.set('description', 'Erro interno do servidor')
    
    return NextResponse.redirect(errorPageUrl)
  }
} 
