'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Usuario {
  id: number
  email: string
  nome: string
  role: 'admin' | 'manager' | 'funcionario'
  modulos_permitidos: string[]
  ativo: boolean
}

interface UserContextData {
  user: Usuario | null
  loading: boolean
  isInitialized: boolean
  updateUser: (userData: Usuario) => void
  updatePermissions: (newPermissions: string[]) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

const UserContext = createContext<UserContextData>({} as UserContextData)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar dados do usuário ao inicializar
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    
    loadUserData()
  }, [])

  // Configurar listeners para atualizações
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgb_user') {
        console.log('🔄 UserContext: Storage change detectado')
        loadUserData()
      }
    }

    const handleUserDataUpdated = () => {
      console.log('🔄 UserContext: Evento userDataUpdated recebido')
      loadUserData()
    }

    const handleRefreshContext = () => {
      console.log('🔄 UserContext: Refresh forçado recebido')
      loadUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userDataUpdated', handleUserDataUpdated)
    window.addEventListener('refreshUserContext', handleRefreshContext)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userDataUpdated', handleUserDataUpdated)
      window.removeEventListener('refreshUserContext', handleRefreshContext)
    }
  }, [])

  const loadUserData = () => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      setLoading(false)
      setIsInitialized(true)
      return
    }

    setLoading(true)
    
    try {
      const userData = localStorage.getItem('sgb_user')
      console.log('🔍 UserContext: Verificando localStorage...', userData ? 'Dados encontrados' : 'Nenhum dado')
      
      if (userData) {
        const parsedUser = JSON.parse(userData)
        console.log('🔍 UserContext: Dados parseados:', parsedUser)
        
        // Validar se os dados do usuário são válidos
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.nome) {
          setUser(parsedUser)
          console.log('✅ Dados do usuário carregados:', parsedUser.nome)
        } else {
          console.log('⚠️ Dados do usuário inválidos, limpando localStorage')
          localStorage.removeItem('sgb_user')
          setUser(null)
        }
      } else {
        console.log('🔍 Nenhum usuário encontrado no localStorage')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error)
      // Limpar dados corrompidos
      localStorage.removeItem('sgb_user')
      setUser(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  const updateUser = (userData: Usuario) => {
    try {
      setUser(userData)
      // Only update localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem('sgb_user', JSON.stringify(userData))
        // Disparar evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('userDataUpdated'))
      }
      console.log('✅ Dados do usuário atualizados:', userData.nome)
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error)
    }
  }

  const updatePermissions = (newPermissions: string[]) => {
    if (user) {
      const updatedUser = { ...user, modulos_permitidos: newPermissions }
      setUser(updatedUser)
      // Only update localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem('sgb_user', JSON.stringify(updatedUser))
      }
    }
  }

  const refreshUser = async (): Promise<void> => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return
    }

    try {
      const userData = localStorage.getItem('sgb_user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error)
      setUser(null)
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      // Only clear localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sgb_user')
        localStorage.removeItem('sgb_selected_bar_id')
        localStorage.removeItem('sgb_session')
      }
      
      // Aguardar um pouco antes de recarregar para garantir limpeza
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }, 100)
    } catch (error) {
      console.error('Erro no logout:', error)
      // Em caso de erro, tentar recarregar mesmo assim
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isInitialized,
        updateUser,
        updatePermissions,
        refreshUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser deve ser usado dentro de UserProvider')
  }
  return context
} 