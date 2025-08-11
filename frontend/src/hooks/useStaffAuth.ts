'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface StaffSession {
  id: string
  nome: string
  email: string
  role: string
  bar_id: number
  isAuthenticated: boolean
}

export function useStaffAuth(requireAuth: boolean = true) {
  const [staff, setStaff] = useState<StaffSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Verificar se há sessão ativa de funcionário
        const sessionToken = localStorage.getItem('staff_session_token')
        
        if (!sessionToken) {
          if (requireAuth) {
            const currentPath = window.location.pathname + window.location.search
            router.push(`/auth/staff-login?redirect=${encodeURIComponent(currentPath)}`)
            return
          }
          setLoading(false)
          return
        }

        // Validar sessão no servidor
        const response = await fetch('/api/auth/staff/validate', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStaff({
            id: data.funcionario.id,
            nome: data.funcionario.nome,
            email: data.funcionario.email,
            role: data.funcionario.tipo,
            bar_id: data.funcionario.bar_id,
            isAuthenticated: true
          })
        } else {
          // Sessão inválida, limpar e redirecionar
          localStorage.removeItem('staff_session_token')
          if (requireAuth) {
            const currentPath = window.location.pathname + window.location.search
            router.push(`/auth/staff-login?redirect=${encodeURIComponent(currentPath)}`)
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        if (requireAuth) {
          const currentPath = window.location.pathname + window.location.search
          router.push(`/auth/staff-login?redirect=${encodeURIComponent(currentPath)}`)
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, router])

  const logout = () => {
    localStorage.removeItem('staff_session_token')
    setStaff(null)
    router.push('/auth/staff-login')
  }

  return {
    staff,
    loading,
    isAuthenticated: !!staff?.isAuthenticated,
    logout
  }
}
