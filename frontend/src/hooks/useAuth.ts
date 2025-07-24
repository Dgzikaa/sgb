'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface UserInfo {
  id: number
  nome: string
  email: string
  role: string
  avatar?: string
  bar_id?: number
  modulos_permitidos?: string[] | Record<string, unknown>
  ativo?: boolean
  availableBars?: any[]
  credenciais_apis?: any[]
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadUserInfo() {
      try {
        // Primeiro verificar localStorage
        const storedUser = localStorage.getItem('sgb_user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            if (userData && userData.nome && userData.email) {
              setUser(userData)
              if (mounted) {
                setLoading(false)
              }
              return
            } else {
              localStorage.removeItem('sgb_user')
            }
          } catch (parseError) {
            localStorage.removeItem('sgb_user')
          }
        }
        
        // Se chegou até aqui, não há dados válidos no localStorage
        throw new Error('Usuário não logado - faça login novamente')

      } catch (err) {
        console.error('❌ Erro ao carregar informações do usuário:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadUserInfo()

    return () => {
      mounted = false
    }
  }, [])

  const hasPermission = (permission: string) => {
    if (!user || !user.modulos_permitidos) return false
    
    // Se modulos_permitidos é um array
    if (Array.isArray(user.modulos_permitidos)) {
      return user.modulos_permitidos.includes(permission)
    }
    
    // Se modulos_permitidos é um objeto
    if (typeof user.modulos_permitidos === 'object') {
      return user.modulos_permitidos[permission] === true
    }
    
    return false
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }

  const isRole = (role: string) => {
    return user?.role?.toLowerCase() === role.toLowerCase()
  }

  const roleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrador'
      case 'financeiro':
        return 'Financeiro'
      case 'funcionario':
        return 'Funcionário'
      default:
        return role
    }
  }

  return {
    user,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    isRole,
    roleDisplayName: user ? roleDisplayName(user.role) : null
  }
} 