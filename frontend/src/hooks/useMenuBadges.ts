'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useBar } from '@/contexts/BarContext'

interface MenuBadges {
  checklist: number
  producao: number
  contaazul: number
  marketing: number
  configuracoes: number
  notifications: number
  home: number
  visaoGeral: number
}

export function useMenuBadges() {
  const { user } = useUser()
  const { selectedBar } = useBar()
  const [badges, setBadges] = useState<MenuBadges>({
    checklist: 0,
    producao: 0,
    contaazul: 0,
    marketing: 0,
    configuracoes: 0,
    notifications: 0,
    home: 0,
    visaoGeral: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBadges = useCallback(async () => {
    if (!user?.id || !selectedBar?.id) return

    try {
      setLoading(true)
      setError(null)
      
      // ðŸŽ¯ UMA Sá“ REQUISIá‡áƒO para todos os badges
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          user_id: user.id
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.badges) {
        setBadges(data.badges)
      } else {
        console.warn('Resposta invá¡lida da API badges:', data)
      }
    } catch (error) {
      console.error('Erro ao buscar badges:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      // Manter badges zerados em caso de erro
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedBar?.id])

  useEffect(() => {
    fetchBadges()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchBadges, 30000)
    
    return () => clearInterval(interval)
  }, [fetchBadges])

  // Funá§á£o para forá§ar atualizaá§á£o manual
  const refresh = useCallback(() => {
    fetchBadges()
  }, [fetchBadges])

  // Funá§á£o para limpar badges (áºtil ao trocar de bar)
  const clear = useCallback(() => {
    setBadges({
      checklist: 0,
      producao: 0,
      contaazul: 0,
      marketing: 0,
      configuracoes: 0,
      notifications: 0,
      home: 0,
      visaoGeral: 0
    })
  }, [])

  return {
    badges,
    loading,
    error,
    refresh,
    clear,
    // Computed values
    hasAnyBadge: Object.values(badges).some(count => count > 0),
    totalBadges: Object.values(badges).reduce((sum, count) => sum + count, 0),
    criticalBadges: badges.visaoGeral + badges.notifications
  }
} 
