'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface UserInfo {
  id: number
  nome: string
  email: string
  role: string
  avatar?: string
  bar_id: number
  modulos_permitidos: Record<string, unknown>
}

export function useUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
              setUserInfo(userData)
              if (mounted) {
                setIsLoading(false)
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
          setIsLoading(false)
        }
      }
    }

    loadUserInfo()

    return () => {
      mounted = false
    }
  }, [])

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
    userInfo,
    isLoading,
    error,
    roleDisplayName: userInfo ? roleDisplayName(userInfo.role) : null
  }
} 
