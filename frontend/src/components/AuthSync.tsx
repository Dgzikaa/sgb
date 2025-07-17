'use client'

import { useEffect } from 'react'
import { syncAuthData } from '@/lib/cookies'

/**
 * Componente para sincronizar automaticamente dados de autenticaá§á£o
 * entre localStorage e cookies para que o middleware funcione corretamente
 */
export default function AuthSync() {
  useEffect(() => {
    // Funá§á£o para sincronizar dados
    const syncUserData = () => {
      try {
        const userData = localStorage.getItem('sgb_user')
        if (userData) {
          const parsedData = JSON.parse(userData)
          if (parsedData && parsedData.id && parsedData.email) {
            syncAuthData(parsedData)
          }
        }
      } catch (error) {
        console.error('Œ Erro ao sincronizar dados de auth:', error)
      }
    }

    // Sincronizar imediatamente
    syncUserData()

    // Listener para mudaná§as no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgb_user' && e.newValue) {
        syncUserData()
      }
    }

    // Listener customizado para mudaná§as internas
    const handleCustomUpdate = () => {
      syncUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userDataUpdated', handleCustomUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userDataUpdated', handleCustomUpdate)
    }
  }, [])

  // Este componente ná£o renderiza nada
  return null
} 
