import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Tipos para o usuÃ¡rio autenticado
export interface AuthenticatedUser {
  id: number
  user_id: string
  email: string
  nome: string
  role: 'admin' | 'financeiro' | 'funcionario'
  bar_id: number
  modulos_permitidos: string[]
  ativo: boolean
}

// Tipos para permissÃµes
export interface PermissionCheck {
  module: string
  action: 'read' | 'write' | 'delete' | 'admin'
  resource?: string
}

/**
 * Middleware de autenticaÃ§Ã£o para APIs
 * Valida o usuÃ¡rio logado via cookie/header
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Tentar pegar token do header Authorization
    let userToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Se nÃ£o tem no header, tentar no cookie
    if (!userToken) {
      userToken = request.cookies.get('sgb_user')?.value
    }
    
    // Se nÃ£o tem token, tentar parsear dados do localStorage via cookie
    if (!userToken) {
      // Buscar dados do usuÃ¡rio que o frontend envia via header customizado
      const userDataHeader = request.headers.get('x-user-data')
      if (userDataHeader) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataHeader))
          if (userData && userData.email && userData.id) {
            return userData as AuthenticatedUser
          }
        } catch (e) {
          console.log('Falha ao parsear x-user-data header')
        }
      }
    }
    
    if (!userToken) {
      console.log('ðŸš« Nenhum token de autenticaÃ§Ã£o encontrado')
      return null
    }
    
    // Tentar parsear o token como JSON (dados do usuÃ¡rio)
    try {
      const userData = JSON.parse(decodeURIComponent(userToken))
      
      if (!userData || !userData.email || !userData.id) {
        console.log('ðŸš« Token invÃ¡lido - dados incompletos')
        return null
      }
      
      // Validar se o usuÃ¡rio ainda existe e estÃ¡ ativo
      const supabase = await getAdminClient()
      const { data: usuario, error } = await supabase
        .from('usuarios_bar')
        .select('*')
        .eq('id', userData.id)
        .eq('ativo', true)
        .single()
      
      if (error || !usuario) {
        console.log('ðŸš« UsuÃ¡rio nÃ£o encontrado ou inativo:', userData.email)
        return null
      }
      
      console.log('âœ… UsuÃ¡rio autenticado:', usuario.nome)
      return usuario as AuthenticatedUser
      
    } catch (parseError) {
      console.log('ðŸš« Erro ao parsear token de usuÃ¡rio:', parseError)
      return null
    }
    
  } catch (error) {
    console.error('âŒ Erro na autenticaÃ§Ã£o:', error)
    return null
  }
}

/**
 * Verificar permissÃµes do usuÃ¡rio
 */
export function checkPermission(user: AuthenticatedUser, permission: PermissionCheck): boolean {
  // Admin pode tudo
  if ((user.role as string) === 'admin') {
    return true
  }
  
  // Verificar permissÃµes especÃ­ficas do mÃ³dulo
  const modulePermissions = user.modulos_permitidos || []
  
  switch (permission.module) {
    case 'checklists':
      switch (permission.action) {
        case 'read':
          // Todos podem ler checklists
          return modulePermissions.includes('checklists') || 
                 modulePermissions.includes('checklists_read') ||
                 user.role === 'financeiro'
        
        case 'write':
          // Financeiro e admin podem criar/editar
          return user.role === 'financeiro' || 
                 modulePermissions.includes('checklists_write') ||
                 modulePermissions.includes('checklists_admin')
        
        case 'delete':
          // SÃ³ admin pode deletar
          return (user.role as string) === 'admin' || 
                 modulePermissions.includes('checklists_admin')
        
        case 'admin':
          // SÃ³ admin tem acesso total
          return (user.role as string) === 'admin'
        
        default:
          return false
      }
    
    default:
      return false
  }
}

/**
 * Resposta de erro de autenticaÃ§Ã£o
 */
export function authErrorResponse(message: string = 'NÃ£o autorizado', status: number = 401) {
  return NextResponse.json({
    success: false,
    error: message,
    code: 'AUTH_ERROR'
  }, { status })
}

/**
 * Resposta de erro de permissÃ£o
 */
export function permissionErrorResponse(message: string = 'PermissÃ£o negada', status: number = 403) {
  return NextResponse.json({
    success: false,
    error: message,
    code: 'PERMISSION_DENIED'
  }, { status })
}

// Lista de rotas que requerem autenticaÃ§Ã£o
export const PROTECTED_ROUTES = [
  '/api/admin',
  '/api/dashboard',
  '/api/contaazul-auth',
  '/api/contaazul-sync',
  '/api/contaazul-automation'
]

// Lista de rotas pÃºblicas (podem ser acessadas sem auth)
export const PUBLIC_ROUTES = [
  '/api/config', // Temporariamente pÃºblico atÃ© implementar auth adequada
  '/api/relatorios' // Dados agregados, sem informaÃ§Ãµes sensÃ­veis
]

export function requiresAuth(pathname: string): boolean {
  // Verificar se Ã© uma rota protegida
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export function isPublicRoute(pathname: string): boolean {
  // Verificar se Ã© uma rota explicitamente pÃºblica
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
} 
