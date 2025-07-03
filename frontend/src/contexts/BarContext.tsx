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
    console.log('🔄 Resetando contexto de bares...')
    setSelectedBar(null)
    setAvailableBars([])
    setIsLoading(true)
  }

  useEffect(() => {
    let mounted = true

    async function loadUserBars() {
      try {
        console.log('🚀 Carregando bares do usuário...')
        
        const supabase = await getSupabaseClient();
        if (!supabase) return;
        
        // Primeiro verificar localStorage
        const storedUser = localStorage.getItem('sgb_user')
        let userEmail = null
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            userEmail = userData.email
            console.log('👤 Email do usuário do localStorage:', userEmail)
            console.log('🔍 Dados completos do usuário:', userData)
            
            // Verificar se já temos os bares no localStorage
            if (userData.bares_acesso && Array.isArray(userData.bares_acesso) && userData.bares_acesso.length > 0) {
              console.log('🎯 Bares encontrados no localStorage:', userData.bares_acesso)
              
              const barsFromLocalStorage = userData.bares_acesso.map((bar: any) => ({
                id: bar.id,
                nome: bar.nome
              }))
              
              setAvailableBars(barsFromLocalStorage)
              
              // Priorizar "Ordinário Bar" como padrão
              const ordinarioBar = barsFromLocalStorage.find((bar: Bar) => 
                bar.nome.toLowerCase().includes('ordinário') || 
                bar.nome.toLowerCase().includes('ordinario')
              )
              
              if (ordinarioBar) {
                console.log('🎯 Selecionando Ordinário Bar do localStorage')
                setSelectedBar(ordinarioBar)
              } else {
                console.log('📍 Selecionando primeiro bar do localStorage')
                setSelectedBar(barsFromLocalStorage[0])
              }
              
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.log('⚠️ Erro ao parsear dados do localStorage')
            localStorage.removeItem('sgb_user')
          }
        }
        
        // Se não tem localStorage, tentar sessão do Supabase
        if (!userEmail) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (!mounted) return
          
          if (session && !sessionError) {
            userEmail = session.user.email
            console.log('👤 Email do usuário da sessão:', userEmail)
          }
        }
        
        if (userEmail) {
          console.log('✅ Usuário autenticado:', userEmail)

          // Buscar IDs dos bares do usuário
          const { data: userBars, error: userError } = await supabase
            .from('usuarios_bar')
            .select('bar_id')
            .eq('email', userEmail)
            .eq('ativo', true)

          if (!mounted) return

          if (!userError && userBars?.length) {
            console.log('✅ IDs dos bares encontrados:', userBars.length)
            console.log('📊 IDs dos bares:', userBars)
            
            // Extrair IDs únicos
            const barIds = [...new Set(userBars.map((ub: any) => ub.bar_id))]
            console.log('🔢 IDs únicos dos bares:', barIds)
            
            // Buscar dados completos dos bares
            const { data: barsData, error: barsError } = await supabase
              .from('bars')
              .select('id, nome')
              .in('id', barIds)
              .eq('ativo', true)
              .order('nome')

            if (!barsError && barsData?.length) {
              console.log('📋 Bares carregados:', barsData)
            } else {
              console.log('❌ Erro ao buscar dados dos bares:', barsError)
            }
            
            const finalBarsData = barsData || []

            console.log('📋 Bares processados:', finalBarsData)
            console.log('🔢 Quantidade de bares únicos:', finalBarsData.length)
            
            if (finalBarsData.length > 0) {
              setAvailableBars(finalBarsData)
              
              // Priorizar "Ordinário Bar" como padrão
              const ordinarioBar = finalBarsData.find((bar: Bar) => 
                bar.nome.toLowerCase().includes('ordinário') || 
                bar.nome.toLowerCase().includes('ordinario')
              )
              
              if (ordinarioBar) {
                console.log('🎯 Selecionando Ordinário Bar como padrão')
                setSelectedBar(ordinarioBar)
              } else {
                console.log('📍 Selecionando primeiro bar disponível')
                setSelectedBar(finalBarsData[0])
              }
              
              setIsLoading(false)
              return
            }
          } else {
            console.log('❌ Erro ao buscar IDs dos bares do usuário:', userError)
            console.log('⚠️ Usuário pode não ter bares associados ou erro na consulta')
          }
        } else {
          console.log('⚠️ Usuário não autenticado')
          
          // Se não tem usuário, tentar carregar todos os bares mesmo assim
          console.log('🔄 Tentando carregar todos os bares sem autenticação...')
          
          const { data: allBars, error: allBarsError } = await supabase
            .from('bars')
            .select('id, nome')
            .eq('ativo', true)
            .order('nome')

          if (!mounted) return

          if (!allBarsError && allBars && allBars.length > 0) {
            console.log('✅ Bares carregados sem auth:', allBars.length)
            setAvailableBars(allBars)
            
            // Priorizar Ordinário Bar
            const ordinarioBar = allBars.find((bar: Bar) => 
              bar.nome.toLowerCase().includes('ordinário') || 
              bar.nome.toLowerCase().includes('ordinario')
            )
            
            if (ordinarioBar) {
              console.log('🎯 Selecionando Ordinário Bar (sem auth)')
              setSelectedBar(ordinarioBar)
            } else {
              setSelectedBar(allBars[0])
            }
            
            setIsLoading(false)
            return
          } else {
            console.log('❌ Erro ao carregar bares:', allBarsError)
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