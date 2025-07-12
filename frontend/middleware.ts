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

// Mapeamento de rotas para módulos requeridos
const ROUTE_PERMISSIONS: Record<string, { modules?: string[], roles?: string[], public?: boolean }> = {
  // Páginas públicas
  '/login': { public: true },
  '/redefinir-senha': { public: true },
  '/auth/success': { public: true },
  '/contaazul-callback': { public: true },
  '/contaazul-auto-login': { public: true },
  
  // Páginas básicas - todos podem acessar
  '/home': { public: true },
  '/minha-conta': { public: true },
  
  // Checklists
  '/funcionario/checklists': { modules: ['checklists'] },
  '/checklists/abertura': { modules: ['checklists'] },
  '/admin/checklists': { modules: ['checklists_admin'], roles: ['admin'] },
  '/admin/templates': { modules: ['operacoes'], roles: ['admin'] },
  '/relatorios/checklists': { modules: ['checklists'], roles: ['admin'] },
  
  // Operações
  '/operacoes/receitas': { modules: ['receitas_insumos'] },
  '/operacoes/produtos': { modules: ['produtos'] },
  '/operacoes/tempo': { modules: ['tempo'] },
  '/operacoes/periodo': { modules: ['periodo'] },
  '/operacoes/planejamento': { modules: ['planejamento'] },
  '/operacoes/checklist-abertura': { modules: ['operacoes'] },
  '/operacoes/recorrencia': { modules: ['recorrencia'] },
  
  // Produção
  '/producao/terminal': { modules: ['terminal_producao'] },
  '/producao/receitas': { modules: ['receitas_insumos'] },
  '/producao/relatorios': { modules: ['relatorio_producoes'] },
  
  // Reservas
  '/reservas/recorrencia': { modules: ['recorrencia'] },
  
  // Dashboards e Visão Geral
  '/dashboard-financeiro': { modules: ['relatorio_produtos'] },
  '/visao-geral/diario': { modules: ['dashboard_diario'] },
  '/visao-geral/semanal': { modules: ['dashboard_semanal'] },
  '/visao-geral/financeiro-mensal': { modules: ['dashboard_financeiro_mensal'] },
  '/visao-geral/metrica-evolucao': { modules: ['dashboard_metrica_evolucao'] },
  '/visao-geral/metricas-barras': { modules: ['dashboard_metricas_barras'] },
  '/visao-geral/comparativo': { modules: ['dashboard_comparativo'] },
  '/visao-geral/garcons': { modules: ['dashboard_garcons'] },
  '/visao-geral/marketing-360': { modules: ['marketing_360'] },
  
  // Relatórios
  '/relatorios/analitico': { modules: ['analitico'] },
  '/relatorios/fatporhora': { modules: ['fatporhora'] },
  '/relatorios/nfs': { modules: ['nfs'] },
  '/relatorios/pagamentos': { modules: ['pagamentos'] },
  '/relatorios/contaazul-competencia': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-direto': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-excel': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-investigacao-completa': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-playwright': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-simples': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-teste-categorias': { modules: ['relatorio_produtos'] },
  '/relatorios/contaazul-v3': { modules: ['relatorio_produtos'] },
  '/relatorios/contahub-teste': { modules: ['relatorio_produtos'] },
  '/relatorios/dados/relatorio-produtos': { modules: ['relatorio_produtos'] },
  '/relatorios/financeiro-competencia': { modules: ['relatorio_produtos'] },
  
  // Admin
  '/admin': { roles: ['admin'] },
  '/admin/atribuicoes': { roles: ['admin'] },
  '/admin/contahub-automatico': { modules: ['relatorio_produtos'], roles: ['admin'] },
  '/admin/debug-inserção-contaazul': { roles: ['admin'] },
  '/admin/desempenho': { modules: ['dashboard_diario'], roles: ['admin'] },
  '/admin/fix-contaazul': { roles: ['admin'] },
  '/admin/meta-configuracao': { roles: ['admin'] },
  '/admin/metricas-sociais': { roles: ['admin'] },
  '/admin/relatorios': { roles: ['admin'] },
  '/admin/test-discord-checklist': { roles: ['admin'] },
  '/admin/teste-categoria-2etapas': { roles: ['admin'] },
  '/admin/whatsapp-demo': { roles: ['admin'] },
  
  // Configurações
  '/configuracoes': { modules: ['configuracoes'] },
  '/configuracoes/configuracao': { modules: ['configuracoes'] },
  '/configuracoes/discord': { modules: ['configuracoes'] },
  '/configuracoes/integracoes': { modules: ['configuracoes'] },
  '/configuracoes/whatsapp': { modules: ['configuracoes'] },
  
  // Teste e Debug
  '/teste-debug': { roles: ['admin'] },
}

function getStoredUser(request: NextRequest): User | null {
  try {
    // Tentar pegar do cookie primeiro
    const userCookie = request.cookies.get('sgb_user')?.value
    
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie))
        if (userData && userData.email && userData.id && userData.ativo) {
          return userData as User
        }
      } catch (e) {
        console.log('Erro ao parsear cookie de usuário')
      }
    }
    
    // Tentar pegar do header personalizado (para SPAs)
    const userDataHeader = request.headers.get('x-user-data')
    if (userDataHeader) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataHeader))
        if (userData && userData.email && userData.id && userData.ativo) {
          return userData as User
        }
      } catch (e) {
        console.log('Erro ao parsear header de usuário')
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao recuperar dados do usuário:', error)
    return null
  }
}

function hasPermission(user: User, requiredModules: string[], requiredRoles?: string[]): boolean {
  // Verificar se o usuário está ativo
  if (!user.ativo) {
    return false
  }
  
  // Verificar roles primeiro (mais restritivo)
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return false
    }
  }
  
  // Admin tem acesso a tudo por padrão (exceto se tem permissões específicas configuradas)
  if (user.role === 'admin') {
    // Se o admin tem permissões específicas configuradas (menos de 23 módulos), respeitar elas
    const hasExplicitPermissions = user.modulos_permitidos && user.modulos_permitidos.length < 23
    if (!hasExplicitPermissions) {
      return true
    }
  }
  
  // Verificar módulos requeridos
  if (requiredModules && requiredModules.length > 0) {
    const hasAllModules = requiredModules.every(module => 
      user.modulos_permitidos?.includes(module)
    )
    if (!hasAllModules) {
      return false
    }
  }
  
  return true
}

function findMatchingRoute(pathname: string): { modules?: string[], roles?: string[], public?: boolean } | null {
  // Busca exata primeiro
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }
  
  // Busca por prefixo (para rotas dinâmicas)
  const matchingRoute = Object.entries(ROUTE_PERMISSIONS).find(([route]) => {
    if (route.includes('/[')) {
      // Rota dinâmica - verificar se o prefixo bate
      const routePrefix = route.split('/[')[0]
      return pathname.startsWith(routePrefix)
    }
    return pathname.startsWith(route)
  })
  
  return matchingRoute ? matchingRoute[1] : null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar arquivos estáticos e APIs
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/android-chrome-') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Verificar se a rota precisa de permissões
  const routeConfig = findMatchingRoute(pathname)
  
  // Se não encontrou configuração, bloquear por segurança (exceto home)
  if (!routeConfig) {
    if (pathname === '/' || pathname === '/home') {
      return NextResponse.next()
    }
    console.log(`🚫 Middleware: Rota não configurada - ${pathname}`)
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Rota pública - permitir acesso
  if (routeConfig.public) {
    return NextResponse.next()
  }
  
  // Obter dados do usuário
  const user = getStoredUser(request)
  
  // Não está logado - redirecionar para login
  if (!user) {
    console.log(`🚫 Middleware: Usuário não autenticado tentando acessar ${pathname}`)
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verificar permissões
  const canAccess = hasPermission(
    user,
    routeConfig.modules || [],
    routeConfig.roles
  )
  
  if (!canAccess) {
    console.log(`🚫 Middleware: Acesso negado para ${user.nome} (${user.role}) tentando acessar ${pathname}`)
    console.log(`   Módulos requeridos: ${routeConfig.modules?.join(', ') || 'nenhum'}`)
    console.log(`   Roles requeridos: ${routeConfig.roles?.join(', ') || 'nenhum'}`)
    console.log(`   Módulos do usuário: ${user.modulos_permitidos?.join(', ') || 'nenhum'}`)
    
    // Redirecionar para página de acesso negado ou home
    return NextResponse.redirect(new URL('/home?error=acesso_negado', request.url))
  }
  
  // Acesso permitido
  console.log(`✅ Middleware: Acesso permitido para ${user.nome} em ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, manifest, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
} 