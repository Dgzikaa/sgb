'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { useBar } from '@/contexts/BarContext'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requiredPermissions?: string[]
}

export default function AuthGuard({ 
  children, 
  redirectTo = '/login',
  requiredPermissions = []
}: AuthGuardProps) {
  const { user, loading: userLoading, isInitialized } = useUser()
  const { selectedBar, isLoading: barLoading } = useBar()
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Aguardar até que os dados do usuário sejam inicializados
      if (!isInitialized || userLoading || barLoading) {
        return
      }

      // Se não há usuário, redirecionar para login
      if (!user) {
        console.log('🔒 Usuário não autenticado, redirecionando para login')
        router.push(redirectTo)
        return
      }

      // Verificar permissões se necessário
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.some(permission => 
          user.modulos_permitidos?.includes(permission)
        )
        
        if (!hasRequiredPermissions) {
          console.log('🚫 Usuário não tem permissões necessárias:', requiredPermissions)
          router.push('/home') // Redirecionar para uma página permitida
          return
        }
      }

      // Verificar se o usuário está ativo
      if (!user.ativo) {
        console.log('⚠️ Usuário inativo, redirecionando para login')
        router.push(redirectTo)
        return
      }

      // Tudo ok, permitir acesso
      setIsAuthenticating(false)
    }

    checkAuth()
  }, [user, userLoading, barLoading, selectedBar, router, redirectTo, requiredPermissions])

  // Mostrar loading enquanto autentica
  if (isAuthenticating || userLoading || barLoading) {
    return <AuthLoadingScreen />
  }

  // Se chegou até aqui, usuário está autenticado e com permissões
  return <>{children}</>
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Carregando suas informações...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto verificamos suas permissões
          </p>
        </div>
      </div>
    </div>
  )
} 