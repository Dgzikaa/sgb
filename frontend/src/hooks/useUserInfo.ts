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
        console.log('👤 Carregando informações do usuário...')
        
        // Primeiro verificar localStorage
        const storedUser = localStorage.getItem('sgb_user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            console.log('✅ Dados do usuário encontrados no localStorage:', userData.nome)
            setUserInfo(userData)
            return
          } catch (parseError) {
            console.log('⚠️ Erro ao parsear dados do localStorage, tentando Supabase...')
            localStorage.removeItem('sgb_user')
          }
        }
        
        // Tentar carregar do Supabase
        const supabase = await getSupabaseClient()
        if (!supabase) {
          throw new Error('Erro ao conectar com o banco')
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (sessionError) {
          throw new Error(`Erro na sessão: ${sessionError.message}`)
        }

        if (!session?.user?.email) {
          throw new Error('Usuário não logado')
        }

        // Buscar informações do usuário na tabela usuarios_bar
        const { data: userData, error: userError } = await supabase
          .from('usuarios_bar')
          .select('*')
          .eq('email', session.user.email)
          .eq('ativo', true)
          .single()

        if (!mounted) return

        if (userError) {
          throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`)
        }

        if (userData) {
          console.log('✅ Informações do usuário carregadas do Supabase:', userData.nome)
          setUserInfo(userData)
          // Salvar no localStorage para próximas sessões
          localStorage.setItem('sgb_user', JSON.stringify(userData))
        } else {
          throw new Error('Usuário não encontrado na base de dados')
        }

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