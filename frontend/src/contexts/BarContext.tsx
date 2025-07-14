'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface Bar {
  id: number
  nome: string
}

interface BarContextType {
  selectedBar: Bar | null
  availableBars: Bar[]
  setSelectedBar: (bar: Bar) => void
  isLoading: boolean
  resetBars: () => void
}

const BarContext = createContext<BarContextType | undefined>(undefined)

export function BarProvider({ children }: { children: ReactNode }) {
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null)
  const [availableBars, setAvailableBars] = useState<Bar[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const resetBars = () => {
    setSelectedBar(null)
    setAvailableBars([])
    setIsLoading(true)
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadUserBars() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          if (mounted) setIsLoading(false)
          return
        }
        
        // Primeiro verificar localStorage
        const storedUser = localStorage.getItem('sgb_user')
        let userEmail = null
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            userEmail = userData.email
            
            // Verificar se já temos os bares no localStorage
            if (userData.availableBars && Array.isArray(userData.availableBars) && userData.availableBars.length > 0) {
              if (mounted) {
                setAvailableBars(userData.availableBars)
                
                // Verificar se há um bar selecionado no localStorage
                const selectedBarId = localStorage.getItem('sgb_selected_bar_id')
                if (selectedBarId) {
                  const selectedBar = userData.availableBars.find((bar: Bar) => bar.id === parseInt(selectedBarId))
                  if (selectedBar) {
                    setSelectedBar(selectedBar)
                  } else {
                    setSelectedBar(userData.availableBars[0])
                  }
                } else {
                  setSelectedBar(userData.availableBars[0])
                }
                
                setIsLoading(false)
                return
              }
            }
          } catch (e) {
            console.error('Erro ao parsear dados do usuário:', e)
          }
        }

        // Se não conseguiu do localStorage, tentar buscar da sessão do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.email) {
          userEmail = session.user.email
        }

        if (!userEmail) {
          console.log('Nenhum usuário logado encontrado')
          if (mounted) setIsLoading(false)
          return
        }

        // Buscar os bares do usuário no banco
        const { data: userData, error: userError } = await supabase
          .from('usuarios_bar')
          .select('id, email, nome, role, bar_id')
          .eq('email', userEmail)
          .eq('ativo', true)

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError)
          if (mounted) setIsLoading(false)
          return
        }

        if (!userData || userData.length === 0) {
          console.log('Usuário não tem acesso a nenhum bar')
          if (mounted) setIsLoading(false)
          return
        }

        // Extrair IDs únicos dos bares (caso usuário tenha acesso a múltiplos bares)
        const barIds = [...new Set(userData.map((user: any) => user.bar_id))]
        
        // Buscar detalhes dos bares
        const { data: barsData, error: barsError } = await supabase
          .from('bars')
          .select('id, nome')
          .in('id', barIds)
          .eq('ativo', true)

        if (barsError) {
          console.error('Erro ao buscar bares:', barsError)
          if (mounted) setIsLoading(false)
          return
        }

        if (mounted) {
          setAvailableBars(barsData || [])
          
                     // Verificar se há um bar selecionado no localStorage
           const selectedBarId = localStorage.getItem('sgb_selected_bar_id')
           if (selectedBarId && barsData) {
             const selectedBar = barsData.find((bar: Bar) => bar.id === parseInt(selectedBarId))
            if (selectedBar) {
              setSelectedBar(selectedBar)
            } else {
              setSelectedBar(barsData[0] || null)
            }
          } else if (barsData && barsData.length > 0) {
            setSelectedBar(barsData[0])
          }
          
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Erro ao carregar bares do usuário:', error)
        if (mounted) setIsLoading(false)
      }
    }

    loadUserBars()

    return () => {
      mounted = false
    }
  }, [])

  // Função para alterar o bar selecionado
  const handleSetSelectedBar = (bar: Bar) => {
    setSelectedBar(bar)
    // Salvar no localStorage apenas se estamos no cliente
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgb_selected_bar_id', bar.id.toString())
    }
  }

  return (
    <BarContext.Provider
      value={{
        selectedBar,
        availableBars,
        setSelectedBar: handleSetSelectedBar,
        isLoading,
        resetBars,
      }}
    >
      {children}
    </BarContext.Provider>
  )
}

export function useBar() {
  const context = useContext(BarContext)
  if (context === undefined) {
    throw new Error('useBar must be used within a BarProvider')
  }
  return context
}

// Alias para compatibilidade com código existente
export const useBarContext = useBar 