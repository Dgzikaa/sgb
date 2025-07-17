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
      // Aguardar atÃ¡Â© que os dados do usuÃ¡Â¡rio sejam inicializados
      if (!isInitialized || userLoading) {
        return
      }

      // Se nÃ¡Â£o hÃ¡Â¡ usuÃ¡Â¡rio, verificar localStorage diretamente antes de redirecionar
      if (!user) {
        // VerificaÃ¡Â§Ã¡Â£o dupla para evitar loop infinito
        try {
          const userData = localStorage.getItem('sgb_user')
          console.log('Ã°Å¸â€Â AuthGuard: Verificando localStorage...', userData ? 'Dados encontrados' : 'Nenhum dado')
          
          if (userData) {
            const parsedUser = JSON.parse(userData)
            console.log('Ã°Å¸â€Â AuthGuard: Dados parseados:', parsedUser)
            
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.nome) {
              // UsuÃ¡Â¡rio existe no localStorage, aguardar o contexto se atualizar
              console.log('Ã°Å¸â€â€ž UsuÃ¡Â¡rio encontrado no localStorage, aguardando contexto... (tentativa:', contextWaitCount + 1, ')')
              
              // Tentar forÃ¡Â§ar o contexto a recarregar os dados
              const contextRefresh = new CustomEvent('refreshUserContext')
              window.dispatchEvent(contextRefresh)
              
              // Incrementar contador de espera
              setContextWaitCount(prev => prev + 1)
              
              // Se jÃ¡Â¡ aguardou muito tempo, permitir acesso direto
              if (contextWaitCount > 5) {
                console.log('Å¡Â Ã¯Â¸Â AuthGuard: Timeout aguardando contexto, permitindo acesso direto')
                setIsAuthenticating(false)
                return
              }
              
              return
            } else {
              console.log('Å¡Â Ã¯Â¸Â AuthGuard: Dados invÃ¡Â¡lidos no localStorage')
            }
          } else {
            console.log('Ã°Å¸â€Â AuthGuard: Nenhum dado no localStorage')
          }
        } catch (error) {
          console.error('ÂÅ’ AuthGuard: Erro ao verificar localStorage:', error)
        }
        
        // Se realmente nÃ¡Â£o hÃ¡Â¡ usuÃ¡Â¡rio, definir para redirecionar
        if (!shouldRedirect) {
          console.log('Ã°Å¸â€â€™ UsuÃ¡Â¡rio nÃ¡Â£o autenticado, agendando redirecionamento...')
          setShouldRedirect(true)
          // Aguardar um pouco antes de redirecionar para evitar loop
          setTimeout(() => {
            router.push(redirectTo)
          }, 100)
          return
        }
        return
      }

      // Verificar permissÃ¡Âµes se necessÃ¡Â¡rio
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.some(permission => 
          user.modulos_permitidos?.includes(permission)
        )
        
        if (!hasRequiredPermissions) {
          console.log('Ã°Å¸Å¡Â« UsuÃ¡Â¡rio nÃ¡Â£o tem permissÃ¡Âµes necessÃ¡Â¡rias:', requiredPermissions)
          router.push('/home') // Redirecionar para uma pÃ¡Â¡gina permitida
          return
        }
      }

      // Verificar se o usuÃ¡Â¡rio estÃ¡Â¡ ativo
      if (!user.ativo) {
        console.log('Å¡Â Ã¯Â¸Â UsuÃ¡Â¡rio inativo, redirecionando para login')
        router.push(redirectTo)
        return
      }

      // Tudo ok, permitir acesso
      setShouldRedirect(false)
      setContextWaitCount(0)
      setIsAuthenticating(false)
    }

    checkAuth()
  }, [user, userLoading, isInitialized, shouldRedirect, contextWaitCount, router, redirectTo, requiredPermissions])

  // Mostrar loading enquanto autentica
  if (isAuthenticating || userLoading || !isInitialized) {
    return <AuthLoadingScreen />
  }

  // Se chegou atÃ¡Â© aqui, usuÃ¡Â¡rio estÃ¡Â¡ autenticado e com permissÃ¡Âµes
  return <>{children}</>
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Carregando suas informaÃ¡Â§Ã¡Âµes...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto verificamos suas permissÃ¡Âµes
          </p>
        </div>
      </div>
    </div>
  )
} 

