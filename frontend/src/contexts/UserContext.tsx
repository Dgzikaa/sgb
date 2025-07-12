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
  updateUser: (userData: Usuario) => void
  updatePermissions: (newPermissions: string[]) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

const UserContext = createContext<UserContextData>({} as UserContextData)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados do usuário ao inicializar
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem('sgb_user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (userData: Usuario) => {
    try {
      setUser(userData)
      localStorage.setItem('sgb_user', JSON.stringify(userData))
      
      // Também atualizar cookie
      import('@/lib/cookies').then(({ syncAuthData }) => {
        syncAuthData(userData)
      }).catch(console.error)
      
      console.log('✅ Dados do usuário atualizados:', userData.nome)
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
    }
  }

  const updatePermissions = (newPermissions: string[]) => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      modulos_permitidos: newPermissions,
      atualizado_em: new Date().toISOString()
    }
    
    updateUser(updatedUser)
    console.log('✅ Permissões atualizadas:', newPermissions)
  }

  const refreshUser = async (): Promise<void> => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${user.id}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.user) {
          updateUser(userData.user)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados atualizados:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Limpar dados locais
      setUser(null)
      localStorage.removeItem('sgb_user')
      localStorage.removeItem('sgb_bars')
      localStorage.removeItem('selectedBarId')
      
      // Limpar cookie do lado do cliente
      import('@/lib/cookies').then(({ clearAuthCookie }) => {
        clearAuthCookie()
      }).catch(console.error)
      
      // Chamar API de logout para limpar cookies httpOnly
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Redirecionar para login
      window.location.href = '/login'
      
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      // Mesmo com erro, redirecionar para login
      window.location.href = '/login'
    }
  }

  return (
    <UserContext.Provider value={{
      user,
      loading,
      updateUser,
      updatePermissions,
      refreshUser,
      logout
    }}>
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