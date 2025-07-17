import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface User {
  id: number
  email: string
  nome: string
  role: 'admin' | 'manager' | 'funcionario'
  modulos_permitidos: string[]
  ativo: boolean
}

// Funá§á£o para pegar dados do usuá¡rio dos cookies
function getStoredUser(request: NextRequest): User | null {
  try {
    const userDataCookie = request.cookies.get('userData')?.value
    if (!userDataCookie) return null
    
    const userData = JSON.parse(decodeURIComponent(userDataCookie))
    return userData
  } catch (error) {
    console.error('Erro ao parsear dados do usuá¡rio:', error)
    return null
  }
}

// Verificar se usuá¡rio tem permissá£o para marketing
function hasMarketingPermission(user: User): boolean {
  console.log(`ðŸ” VERIFICANDO MARKETING - User: ${user.nome}, Role: ${user.role}`)
  console.log(`ðŸ” Má“DULOS: ${JSON.stringify(user.modulos_permitidos)}`)
  
  // Admin sempre tem acesso
  if (user.role === 'admin') {
    console.log(`œ… ADMIN - Acesso liberado para ${user.nome}`)
    return true
  }
  
  // Verificar se tem má³dulo marketing_360 (ID 18)
  const hasModule18 = user.modulos_permitidos.includes('18')
  const hasModuleMarketing = user.modulos_permitidos.includes('marketing_360')
  
  console.log(`ðŸ” Tem má³dulo 18? ${hasModule18}`)
  console.log(`ðŸ” Tem má³dulo marketing_360? ${hasModuleMarketing}`)
  
  const hasPermission = hasModule18 || hasModuleMarketing
  console.log(`ðŸ” RESULTADO FINAL: ${hasPermission}`)
  
  return hasPermission
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // LOG SEMPRE - para qualquer rota
  console.log(`ðŸš€ MIDDLEWARE EXECUTANDO SEMPRE: ${pathname}`)
  
  console.log(`ðŸ”¥ MIDDLEWARE: ${pathname}`)
  
  // Sá³ verificar marketing-360
  if (pathname === '/visao-geral/marketing-360') {
    console.log(`ðŸŽ¯ VERIFICANDO MARKETING-360`)
    
    const user = getStoredUser(request)
    
    if (!user) {
      console.log('ðŸš« MIDDLEWARE: Usuá¡rio ná£o autenticado')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log(`ðŸ‘¤ USUáRIO ENCONTRADO: ${JSON.stringify(user)}`)
    
    if (!hasMarketingPermission(user)) {
      console.log(`ðŸš« MIDDLEWARE: Usuá¡rio ${user.nome} (${user.role}) sem permissá£o para marketing`)
      return NextResponse.redirect(new URL('/home?error=sem_permissao_marketing', request.url))
    }
    
    console.log(`œ… MIDDLEWARE: Usuá¡rio ${user.nome} autorizado para marketing`)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
} 

