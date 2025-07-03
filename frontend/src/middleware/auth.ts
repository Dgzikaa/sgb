import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export interface AuthResult {
  isValid: boolean
  error?: string
  user?: any
}

export async function verifyAPIAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return { isValid: false, error: 'Authorization header missing' }
    }

    // Verificar se é um Bearer token válido
    if (!authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Invalid authorization format' }
    }

    const token = authHeader.substring(7)
    
    // Verificar com Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return { isValid: false, error: 'Database connection failed' };
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { isValid: false, error: 'Invalid token' }
    }

    return { isValid: true, user: user }
  } catch (error) {
    return { isValid: false, error: 'Auth verification failed' }
  }
}

export function createAuthErrorResponse(error: string, status = 401) {
  return NextResponse.json(
    { 
      error: 'Unauthorized', 
      message: error,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// Lista de rotas que requerem autenticação
export const PROTECTED_ROUTES = [
  '/api/admin',
  '/api/dashboard',
  '/api/contaazul-auth',
  '/api/contaazul-sync',
  '/api/contaazul-automation'
]

// Lista de rotas públicas (podem ser acessadas sem auth)
export const PUBLIC_ROUTES = [
  '/api/config', // Temporariamente público até implementar auth adequada
  '/api/relatorios' // Dados agregados, sem informações sensíveis
]

export function requiresAuth(pathname: string): boolean {
  // Verificar se é uma rota protegida
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export function isPublicRoute(pathname: string): boolean {
  // Verificar se é uma rota explicitamente pública
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
} 