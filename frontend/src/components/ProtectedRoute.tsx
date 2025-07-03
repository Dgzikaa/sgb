import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredModule?: string
  requiredRole?: 'admin' | 'manager' | 'funcionario'
  requiredCategory?: 'dashboards' | 'dados' | 'terminal' | 'configuracao'
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredModule,
  requiredRole,
  requiredCategory,
  fallback
}: ProtectedRouteProps) {
  const { hasPermission, isRole, canAccessModule, loading, user } = usePermissions()

  // Mostrar loading enquanto carrega permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário logado
  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">🔒 Acesso negado</p>
          <p className="text-gray-600 mt-2">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário está ativo
  if (!user.ativo) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">⚠️ Conta desativada</p>
          <p className="text-gray-600 mt-2">Sua conta foi desativada. Entre em contato com o administrador.</p>
        </div>
      </div>
    )
  }

  // Verificar permissão por módulo específico
  if (requiredModule && !hasPermission(requiredModule)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">🔒 Acesso negado</p>
          <p className="text-gray-600 mt-2">Você não tem permissão para acessar este módulo.</p>
          <p className="text-gray-500 text-sm mt-1">Módulo requerido: {requiredModule}</p>
        </div>
      </div>
    )
  }

  // Verificar permissão por role
  if (requiredRole && !isRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">🔒 Acesso negado</p>
          <p className="text-gray-600 mt-2">Você não tem o nível de acesso necessário.</p>
          <p className="text-gray-500 text-sm mt-1">Role requerida: {requiredRole}</p>
        </div>
      </div>
    )
  }

  // Verificar permissão por categoria
  if (requiredCategory && !canAccessModule(requiredCategory)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">🔒 Acesso negado</p>
          <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta categoria.</p>
          <p className="text-gray-500 text-sm mt-1">Categoria requerida: {requiredCategory}</p>
        </div>
      </div>
    )
  }

  // Se chegou até aqui, o usuário tem permissão
  return <>{children}</>
}

// Componente para ocultar/mostrar elementos baseado em permissões
interface ConditionalRenderProps {
  children: React.ReactNode
  requiredModule?: string
  requiredRole?: 'admin' | 'manager' | 'funcionario'
  requiredCategory?: 'dashboards' | 'dados' | 'terminal' | 'configuracao'
}

export function ConditionalRender({
  children,
  requiredModule,
  requiredRole,
  requiredCategory
}: ConditionalRenderProps) {
  const { hasPermission, isRole, canAccessModule, user } = usePermissions()

  if (!user || !user.ativo) return null

  if (requiredModule && !hasPermission(requiredModule)) return null
  if (requiredRole && !isRole(requiredRole)) return null
  if (requiredCategory && !canAccessModule(requiredCategory)) return null

  return <>{children}</>
} 