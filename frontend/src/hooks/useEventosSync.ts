import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface EventoSyncData {
  id: number
  nome: string
  data_evento: string
  m1_r: number
  te_plan: number
  tb_plan: number
  c_art: number
  c_prod: number
  percent_art_fat: number
  atualizado_em: string
}

interface UseEventosSyncReturn {
  sincronizarEventos: (barId: number, dataInicio?: string, dataFim?: string) => Promise<void>
  popularDadosMockados: (barId: number) => Promise<void>
  verificarStatus: (barId: number) => Promise<EventoSyncData[]>
  loading: boolean
  eventosAtualizados: EventoSyncData[]
}

export function useEventosSync(): UseEventosSyncReturn {
  const [loading, setLoading] = useState(false)
  const [eventosAtualizados, setEventosAtualizados] = useState<EventoSyncData[]>([])
  const { toast } = useToast()

  const sincronizarEventos = async (barId: number, dataInicio?: string, dataFim?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/eventos/sync-eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barId,
          dataInicio,
          dataFim
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao sincronizar eventos')
      }

      setEventosAtualizados(data.eventos_atualizados || [])
      
      toast({
        title: 'Sincronização Concluída',
        description: data.message,
        variant: 'default',
      })

    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast({
        title: 'Erro na Sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const popularDadosMockados = async (barId: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/eventos/popular-dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao popular dados')
      }

      setEventosAtualizados(data.eventos_atualizados || [])
      
      toast({
        title: 'Dados Populados',
        description: data.message,
        variant: 'default',
      })

    } catch (error) {
      console.error('Erro ao popular dados:', error)
      toast({
        title: 'Erro ao Popular Dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const verificarStatus = async (barId: number): Promise<EventoSyncData[]> => {
    try {
      const response = await fetch(`/api/eventos/popular-dados?barId=${barId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status')
      }

      return data.eventos || []

    } catch (error) {
      console.error('Erro ao verificar status:', error)
      toast({
        title: 'Erro ao Verificar Status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      return []
    }
  }

  return {
    sincronizarEventos,
    popularDadosMockados,
    verificarStatus,
    loading,
    eventosAtualizados,
  }
} 