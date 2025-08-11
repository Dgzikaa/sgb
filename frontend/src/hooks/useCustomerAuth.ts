'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CustomerSession {
  id: string
  nome: string
  email: string
  cpf: string
  isAuthenticated: boolean
}

export function useCustomerAuth(requireAuth: boolean = true, redirectTo?: string) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Verificar se há sessão ativa
        const sessionToken = localStorage.getItem('customer_session_token')
        
        if (!sessionToken) {
          if (requireAuth) {
            const currentPath = window.location.pathname + window.location.search
            const redirectUrl = redirectTo || currentPath
            router.push(`/fidelidade/login?redirect=${encodeURIComponent(redirectUrl)}`)
            return
          }
          setLoading(false)
          return
        }

        // Validar sessão no servidor
        const response = await fetch('/api/fidelidade/auth/validate', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })

        if (response.ok) {
          const customerData = await response.json()
          setCustomer({
            id: customerData.id,
            nome: customerData.nome,
            email: customerData.email,
            cpf: customerData.cpf,
            isAuthenticated: true
          })
        } else {
          // Sessão inválida, limpar e redirecionar
          localStorage.removeItem('customer_session_token')
          if (requireAuth) {
            const currentPath = window.location.pathname + window.location.search
            const redirectUrl = redirectTo || currentPath
            router.push(`/fidelidade/login?redirect=${encodeURIComponent(redirectUrl)}`)
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        if (requireAuth) {
          const currentPath = window.location.pathname + window.location.search
          const redirectUrl = redirectTo || currentPath
          router.push(`/fidelidade/login?redirect=${encodeURIComponent(redirectUrl)}`)
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, redirectTo, router])

  const logout = () => {
    localStorage.removeItem('customer_session_token')
    setCustomer(null)
    router.push('/fidelidade')
  }

  return {
    customer,
    loading,
    isAuthenticated: !!customer?.isAuthenticated,
    logout
  }
}
