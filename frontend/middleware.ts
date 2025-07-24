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

// Função para pegar dados do usuário dos cookies
function getStoredUser(request: NextRequest): User | null {
  try {
    const userDataCookie = request.cookies.get('userData')?.value
    if (!userDataCookie) return null
    
    const userData = JSON.parse(decodeURIComponent(userDataCookie))
    return userData
  } catch (error) {
    console.error('Erro ao parsear dados do usuário:', error)
    return null
  }
}

// Verificar se usuário tem permissão para marketing
function hasMarketingPermission(user: User): boolean {
  console.log(`🔍 VERIFICANDO MARKETING - User: ${user.nome}, Role: ${user.role}`)
  console.log(`🔍 MÓDULOS: ${JSON.stringify(user.modulos_permitidos)}`)
  
  // Admin sempre tem acesso
  if (user.role === 'admin') {
    console.log(`✅ ADMIN - Acesso liberado para ${user.nome}`)
    return true
  }
  
  // Verificar se tem módulo marketing_360 (ID 18)
  const hasModule18 = user.modulos_permitidos.includes('18')
  const hasModuleMarketing = user.modulos_permitidos.includes('marketing_360')
  
  console.log(`🔍 Tem módulo 18? ${hasModule18}`)
  console.log(`🔍 Tem módulo marketing_360? ${hasModuleMarketing}`)
  
  const hasPermission = hasModule18 || hasModuleMarketing
  console.log(`🔍 RESULTADO FINAL: ${hasPermission}`)
  
  return hasPermission
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // LOG SEMPRE - para qualquer rota
  console.log(`🚀 MIDDLEWARE EXECUTANDO SEMPRE: ${pathname}`)
  
  console.log(`🔥 MIDDLEWARE: ${pathname}`)
  
  // Só verificar marketing-360
  if (pathname === '/visao-geral/marketing-360') {
    console.log(`🎯 VERIFICANDO MARKETING-360`)
    
    const user = getStoredUser(request)
    
    if (!user) {
      console.log('🚫 MIDDLEWARE: Usuário não autenticado')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log(`👤 USUÁRIO ENCONTRADO: ${JSON.stringify(user)}`)
    
    if (!hasMarketingPermission(user)) {
      console.log(`🚫 MIDDLEWARE: Usuário ${user.nome} (${user.role}) sem permissão para marketing`)
      return NextResponse.redirect(new URL('/home?error=sem_permissao_marketing', request.url))
    }
    
    console.log(`✅ MIDDLEWARE: Usuário ${user.nome} autorizado para marketing`)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
} 