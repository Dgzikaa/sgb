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
    let mounted = true

    async function loadUserBars() {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) return;
        
        // Primeiro verificar localStorage
        const storedUser = localStorage.getItem('sgb_user')
        let userEmail = null
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            userEmail = userData.email
            
            // Verificar se já temos os bares no localStorage
            if (userData.bares_acesso && Array.isArray(userData.bares_acesso) && userData.bares_acesso.length > 0) {
              const barsFromLocalStorage = userData.bares_acesso.map((bar: any) => ({
                id: bar.id || bar.bar_id,
                nome: bar.nome || `Bar ${bar.id || bar.bar_id}`
              }))
              
              setAvailableBars(barsFromLocalStorage)
              
              // Priorizar "Ordinário Bar" como padrão
              const ordinarioBar = barsFromLocalStorage.find((bar: Bar) => 
                bar.nome.toLowerCase().includes('ordinário') || 
                bar.nome.toLowerCase().includes('ordinario')
              )
              
              if (ordinarioBar) {
                setSelectedBar(ordinarioBar)
              } else {
                setSelectedBar(barsFromLocalStorage[0])
              }
              
              setIsLoading(false)
              return
            }
          } catch (error) {
            localStorage.removeItem('sgb_user')
          }
        }
        
        // Se não tem localStorage, tentar sessão do Supabase
        if (!userEmail) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (!mounted) return
          
          if (session && !sessionError) {
            userEmail = session.user.email
          }
        }
        
        if (userEmail) {
          // Buscar IDs dos bares do usuário
          const { data: userBars, error: userError } = await supabase
            .from('usuarios_bar')
            .select('bar_id')
            .eq('email', userEmail)
            .eq('ativo', true)

          if (!mounted) return

          if (!userError && userBars?.length) {
            // Extrair IDs únicos
            const barIds = [...new Set(userBars.map((ub: any) => ub.bar_id))]
            
            // Buscar dados completos dos bares
            const { data: barsData, error: barsError } = await supabase
              .from('bars')
              .select('id, nome')
              .in('id', barIds)
              .eq('ativo', true)
              .order('nome')

            if (barsError) {
              console.error('❌ Erro ao buscar dados dos bares:', barsError)
            }
            
            const finalBarsData = barsData || []
            
            if (finalBarsData.length > 0) {
              setAvailableBars(finalBarsData)
              
              // Priorizar "Ordinário Bar" como padrão
              const ordinarioBar = finalBarsData.find((bar: Bar) => 
                bar.nome.toLowerCase().includes('ordinário') || 
                bar.nome.toLowerCase().includes('ordinario')
              )
              
              if (ordinarioBar) {
                setSelectedBar(ordinarioBar)
              } else {
                setSelectedBar(finalBarsData[0])
              }
              
              setIsLoading(false)
              return
            }
          } else if (userError) {
            console.error('❌ Erro ao buscar IDs dos bares do usuário:', userError)
          }
        } else {
          // Se não tem usuário, tentar carregar todos os bares mesmo assim
          const { data: allBars, error: allBarsError } = await supabase
            .from('bars')
            .select('id, nome')
            .eq('ativo', true)
            .order('nome')

          if (!mounted) return

          if (!allBarsError && allBars && allBars.length > 0) {
            setAvailableBars(allBars)
            
            // Priorizar Ordinário Bar
            const ordinarioBar = allBars.find((bar: Bar) => 
              bar.nome.toLowerCase().includes('ordinário') || 
              bar.nome.toLowerCase().includes('ordinario')
            )
            
            if (ordinarioBar) {
              setSelectedBar(ordinarioBar)
            } else {
              setSelectedBar(allBars[0])
            }
            
            setIsLoading(false)
            return
          } else {
            if (allBarsError) {
              console.error('❌ Erro ao carregar bares:', allBarsError)
            }
            setAvailableBars([])
            setSelectedBar(null)
          }
        }
        
      } catch (error) {
        console.error('💥 Erro crítico no BarContext:', error)
        setAvailableBars([])
        setSelectedBar(null)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadUserBars()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <BarContext.Provider value={{
      selectedBar,
      availableBars,
      setSelectedBar,
      isLoading,
      resetBars
    }}>
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