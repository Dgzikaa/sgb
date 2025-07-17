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
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [contextWaitCount, setContextWaitCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Aguardar at·© que os dados do usu·°rio sejam inicializados
      if (!isInitialized || userLoading) {
        return
      }

      // Se n·£o h·° usu·°rio, verificar localStorage diretamente antes de redirecionar
      if (!user) {
        // Verifica·ß·£o dupla para evitar loop infinito
        try {
          const userData = localStorage.getItem('sgb_user')
          console.log('üîç AuthGuard: Verificando localStorage...', userData ? 'Dados encontrados' : 'Nenhum dado')
          
          if (userData) {
            const parsedUser = JSON.parse(userData)
            console.log('üîç AuthGuard: Dados parseados:', parsedUser)
            
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.nome) {
              // Usu·°rio existe no localStorage, aguardar o contexto se atualizar
              console.log('üîÑ Usu·°rio encontrado no localStorage, aguardando contexto... (tentativa:', contextWaitCount + 1, ')')
              
              // Tentar for·ßar o contexto a recarregar os dados
              const contextRefresh = new CustomEvent('refreshUserContext')
              window.dispatchEvent(contextRefresh)
              
              // Incrementar contador de espera
              setContextWaitCount(prev => prev + 1)
              
              // Se j·° aguardou muito tempo, permitir acesso direto
              if (contextWaitCount > 5) {
                console.log('ö†Ô∏è AuthGuard: Timeout aguardando contexto, permitindo acesso direto')
                setIsAuthenticating(false)
                return
              }
              
              return
            } else {
              console.log('ö†Ô∏è AuthGuard: Dados inv·°lidos no localStorage')
            }
          } else {
            console.log('üîç AuthGuard: Nenhum dado no localStorage')
          }
        } catch (error) {
          console.error('ùå AuthGuard: Erro ao verificar localStorage:', error)
        }
        
        // Se realmente n·£o h·° usu·°rio, definir para redirecionar
        if (!shouldRedirect) {
          console.log('üîí Usu·°rio n·£o autenticado, agendando redirecionamento...')
          setShouldRedirect(true)
          // Aguardar um pouco antes de redirecionar para evitar loop
          setTimeout(() => {
            router.push(redirectTo)
          }, 100)
          return
        }
        return
      }

      // Verificar permiss·µes se necess·°rio
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.some(permission => 
          user.modulos_permitidos?.includes(permission)
        )
        
        if (!hasRequiredPermissions) {
          console.log('üö´ Usu·°rio n·£o tem permiss·µes necess·°rias:', requiredPermissions)
          router.push('/home') // Redirecionar para uma p·°gina permitida
          return
        }
      }

      // Verificar se o usu·°rio est·° ativo
      if (!user.ativo) {
        console.log('ö†Ô∏è Usu·°rio inativo, redirecionando para login')
        router.push(redirectTo)
        return
      }

      // Tudo ok, permitir acesso
      setShouldRedirect(false)
      setContextWaitCount(0)
      setIsAuthenticating(false)
    }

    checkAuth()
  }, [user, userLoading: any, isInitialized, shouldRedirect: any, contextWaitCount, router: any, redirectTo, requiredPermissions])

  // Mostrar loading enquanto autentica
  if (isAuthenticating || userLoading || !isInitialized) {
    return <AuthLoadingScreen />
  }

  // Se chegou at·© aqui, usu·°rio est·° autenticado e com permiss·µes
  return <>{children}</>
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Carregando suas informa·ß·µes...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto verificamos suas permiss·µes
          </p>
        </div>
      </div>
    </div>
  )
} 
