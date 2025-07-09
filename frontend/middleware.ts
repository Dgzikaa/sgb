import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que requerem autenticação
const PROTECTED_ROUTES = [
  '/home',
  '/configuracoes',
  '/dashboard',
  '/admin',
  '/operacoes',
  '/producao',
  '/funcionario',
  '/relatorios',
  '/visao-geral'
]

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/redefinir-senha',
  '/auth'
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Verificar se há dados de usuário no cookie
  const userToken = request.cookies.get('sgb_user')?.value
  
  // Criar response
  const response = NextResponse.next()

  // Se há token, extrair dados do usuário e adicionar ao header para TODAS as requisições
  let isValidToken = false
  if (userToken) {
    try {
      const userData = JSON.parse(decodeURIComponent(userToken))
      
      // Verificar se os dados são válidos
      if (userData && userData.email && userData.id) {
        // Adicionar dados do usuário ao header para requisições de API
        const userDataEncoded = encodeURIComponent(JSON.stringify(userData))
        response.headers.set('x-user-data', userDataEncoded)
        isValidToken = true
      }
    } catch (error) {
      // Silenciar erro de parsing
    }
  }

  // Para rotas de API, só adicionar header e continuar
  if (pathname.startsWith('/api/')) {
    return response
  }

  // Verificar se é uma rota que precisa de proteção (páginas)
  const needsAuth = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  
  // Se não precisa de autenticação, retorna response (com headers se houver)
  if (!needsAuth) {
    return response
  }

  // Se precisa de autenticação mas não tem token válido, redireciona para login
  if (!isValidToken) {
    // Salvar a URL que o usuário tentou acessar
    const returnUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url)
    
    console.log(`🔒 Acesso negado: ${pathname} - redirecionando para login`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js).*)',
  ],
} 