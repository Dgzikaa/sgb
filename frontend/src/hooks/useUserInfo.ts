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
  modulos_permitidos: any
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
        
        // Se chegou atÃ© aqui, nÃ£o hÃ¡ dados vÃ¡lidos no localStorage
        throw new Error('UsuÃ¡rio nÃ£o logado - faÃ§a login novamente')

      } catch (err) {
        console.error('âŒ Erro ao carregar informaÃ§Ãµes do usuÃ¡rio:', err)
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
        return 'FuncionÃ¡rio'
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
