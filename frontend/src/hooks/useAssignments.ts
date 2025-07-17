import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface ConfiguracaoFrequencia {
  horarios?: string[]
  dias_semana?: number[]
  recorrencia_personalizada?: string
  tolerancia_minutos?: number
  lembrete_antecipado_minutos?: number
  auto_cancelar_apos_horas?: number
}

interface Atribuicao {
  id: string
  checklist_id: string
  tipo_atribuicao: 'funcionario_especifico' | 'cargo' | 'setor' | 'todos'
  funcionario_id?: string
  cargo?: string
  setor?: string
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'personalizada'
  configuracao_frequencia: ConfiguracaoFrequencia
  ativo: boolean
  observacoes?: string
  data_inicio: string
  data_fim?: string
  checklist: {
    id: string
    nome: string
    setor: string
    tipo: string
    tempo_estimado: number
  }
  funcionario?: {
    id: string
    nome: string
    email: string
    cargo: string
  }
  criado_por_usuario: {
    nome: string
  }
  criado_em: string
  estatisticas?: {
    total_agendados: number
    concluidos: number
    pendentes: number
    atrasados: number
    taxa_conclusao: number
  }
}

interface NovaAtribuicao {
  checklist_id: string
  tipo_atribuicao: 'funcionario_especifico' | 'cargo' | 'setor' | 'todos'
  funcionario_id?: string
  cargo?: string
  setor?: string
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'personalizada'
  configuracao_frequencia: ConfiguracaoFrequencia
  ativo?: boolean
  observacoes?: string
  data_inicio: string
  data_fim?: string
}

interface FiltrosAtribuicao {
  checklist_id?: string
  funcionario_id?: string
  tipo?: string
  ativo?: boolean
  setor?: string
  cargo?: string
  page?: number
  limit?: number
}

interface UseAssignmentsResult {
  // Estados
  atribuicoes: Atribuicao[]
  atribuicao: Atribuicao | null
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  error: string | null
  
  // Dados auxiliares
  estatisticas: any
  paginacao: any
  
  // AÃ§Ãµes CRUD
  carregarAtribuicoes: (filtros?: FiltrosAtribuicao) => Promise<void>
  carregarAtribuicao: (id: string) => Promise<void>
  criarAtribuicao: (dados: NovaAtribuicao) => Promise<boolean>
  atualizarAtribuicao: (id: string, dados: Partial<NovaAtribuicao>) => Promise<boolean>
  excluirAtribuicao: (id: string, force?: boolean) => Promise<boolean>
  
  // UtilitÃ¡rios
  recarregar: () => Promise<void>
  limparErro: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useAssignments(): UseAssignmentsResult {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([])
  const [atribuicao, setAtribuicao] = useState<Atribuicao | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState(null)
  const [paginacao, setPaginacao] = useState(null)
  const [filtrosAtuais, setFiltrosAtuais] = useState<FiltrosAtribuicao>({})

  // =====================================================
  // AÃ‡Ã•ES CRUD
  // =====================================================

  const carregarAtribuicoes = useCallback(async (filtros: FiltrosAtribuicao = {}) => {
    try {
      setLoading(true)
      setError(null)
      setFiltrosAtuais(filtros)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/api/atribuicoes?${params.toString()}`)

      if (response.success) {
        setAtribuicoes(response.data.atribuicoes || [])
        setEstatisticas(response.data.estatisticas)
        setPaginacao(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar atribuiÃ§Ãµes')
      }
    } catch (err: any) {
      console.error('Erro ao carregar atribuiÃ§Ãµes:', err)
      setError('Erro ao carregar atribuiÃ§Ãµes')
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarAtribuicao = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/api/atribuicoes/${id}`)

      if (response.success) {
        setAtribuicao(response.data)
      } else {
        setError(response.error || 'Erro ao carregar atribuiÃ§Ã£o')
      }
    } catch (err: any) {
      console.error('Erro ao carregar atribuiÃ§Ã£o:', err)
      setError('Erro ao carregar atribuiÃ§Ã£o')
    } finally {
      setLoading(false)
    }
  }, [])

  const criarAtribuicao = useCallback(async (dados: NovaAtribuicao): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)

      const response = await api.post('/api/atribuicoes', dados)

      if (response.success) {
        console.log('âœ… AtribuiÃ§Ã£o criada com sucesso!')
        // Recarregar lista
        await carregarAtribuicoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao criar atribuiÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao criar atribuiÃ§Ã£o:', err)
      setError('Erro ao criar atribuiÃ§Ã£o')
      return false
    } finally {
      setCreating(false)
    }
  }, [carregarAtribuicoes, filtrosAtuais])

  const atualizarAtribuicao = useCallback(async (id: string, dados: Partial<NovaAtribuicao>): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const response = await api.put(`/api/atribuicoes/${id}`, dados)

      if (response.success) {
        console.log('ðŸ“ AtribuiÃ§Ã£o atualizada com sucesso!')
        
        // Atualizar na lista
        setAtribuicoes(prev => prev.map((a: any) => 
          a.id === id ? { ...a, ...response.data } : a
        ))
        
        // Atualizar atribuiÃ§Ã£o individual se carregada
        if (atribuicao?.id === id) {
          setAtribuicao(prev => prev ? { ...prev, ...response.data } : null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao atualizar atribuiÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao atualizar atribuiÃ§Ã£o:', err)
      setError('Erro ao atualizar atribuiÃ§Ã£o')
      return false
    } finally {
      setUpdating(false)
    }
  }, [atribuicao])

  const excluirAtribuicao = useCallback(async (id: string, force: boolean = false): Promise<boolean> => {
    try {
      setDeleting(true)
      setError(null)

      const params = force ? '?force=true' : ''
      const response = await api.delete(`/api/atribuicoes/${id}${params}`)

      if (response.success) {
        console.log('ðŸ—‘ï¸ AtribuiÃ§Ã£o excluÃ­da com sucesso!')
        
        // Remover da lista
        setAtribuicoes(prev => prev.filter((a: any) => a.id !== id))
        
        // Limpar atribuiÃ§Ã£o individual se era a atual
        if (atribuicao?.id === id) {
          setAtribuicao(null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao excluir atribuiÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao excluir atribuiÃ§Ã£o:', err)
      setError('Erro ao excluir atribuiÃ§Ã£o')
      return false
    } finally {
      setDeleting(false)
    }
  }, [atribuicao])

  // =====================================================
  // UTILITÃRIOS
  // =====================================================

  const recarregar = useCallback(async () => {
    await carregarAtribuicoes(filtrosAtuais)
  }, [carregarAtribuicoes, filtrosAtuais])

  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Estados
    atribuicoes,
    atribuicao,
    loading,
    creating,
    updating,
    deleting,
    error,
    
    // Dados auxiliares
    estatisticas,
    paginacao,
    
    // AÃ§Ãµes CRUD
    carregarAtribuicoes,
    carregarAtribuicao,
    criarAtribuicao,
    atualizarAtribuicao,
    excluirAtribuicao,
    
    // UtilitÃ¡rios
    recarregar,
    limparErro
  }
}

// =====================================================
// HOOK PARA DASHBOARD DE PRODUTIVIDADE
// =====================================================

interface DashboardData {
  periodo: {
    inicio: string
    fim: string
    dias: number
  }
  metricas_gerais: {
    total_execucoes: number
    execucoes_concluidas: number
    execucoes_pendentes: number
    taxa_conclusao: number
    score_medio: number
    tempo_medio: number
    funcionarios_ativos: number
  }
  ranking_funcionarios: any[]
  evolucao_temporal: any[]
  alertas: any[]
  estatisticas: {
    por_setor: any[]
    por_cargo: any[]
  }
  top_checklists: any[]
}

interface UseDashboardResult {
  dashboard: DashboardData | null
  loading: boolean
  error: string | null
  carregarDashboard: (filtros?: {
    periodo?: string
    funcionario_id?: string
    setor?: string
    cargo?: string
  }) => Promise<void>
  recarregar: () => Promise<void>
}

export function useProductivityDashboard(): UseDashboardResult {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtrosAtuais, setFiltrosAtuais] = useState({})

  const carregarDashboard = useCallback(async (filtros = {}) => {
    try {
      setLoading(true)
      setError(null)
      setFiltrosAtuais(filtros)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/api/dashboard/produtividade?${params.toString()}`)

      if (response.success) {
        setDashboard(response.data)
      } else {
        setError(response.error || 'Erro ao carregar dashboard')
      }
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  const recarregar = useCallback(async () => {
    await carregarDashboard(filtrosAtuais)
  }, [carregarDashboard, filtrosAtuais])

  return {
    dashboard,
    loading,
    error,
    carregarDashboard,
    recarregar
  }
}

// =====================================================
// HOOKS AUXILIARES
// =====================================================

export function useAssignmentForm() {
  const [formData, setFormData] = useState<Partial<NovaAtribuicao>>({
    ativo: true,
    configuracao_frequencia: {
      tolerancia_minutos: 30,
      lembrete_antecipado_minutos: 15,
      auto_cancelar_apos_horas: 24
    }
  })

  const updateField = useCallback((field: keyof NovaAtribuicao, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateFrequencyConfig = useCallback((config: Partial<ConfiguracaoFrequencia>) => {
    setFormData(prev => ({
      ...prev,
      configuracao_frequencia: {
        ...prev.configuracao_frequencia,
        ...config
      }
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      ativo: true,
      configuracao_frequencia: {
        tolerancia_minutos: 30,
        lembrete_antecipado_minutos: 15,
        auto_cancelar_apos_horas: 24
      }
    })
  }, [])

  const validateForm = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!formData.checklist_id) {
      errors.push('Checklist Ã© obrigatÃ³rio')
    }

    if (!formData.tipo_atribuicao) {
      errors.push('Tipo de atribuiÃ§Ã£o Ã© obrigatÃ³rio')
    }

    if (formData.tipo_atribuicao === 'funcionario_especifico' && !formData.funcionario_id) {
      errors.push('FuncionÃ¡rio Ã© obrigatÃ³rio para atribuiÃ§Ã£o especÃ­fica')
    }

    if (formData.tipo_atribuicao === 'cargo' && !formData.cargo) {
      errors.push('Cargo Ã© obrigatÃ³rio para atribuiÃ§Ã£o por cargo')
    }

    if (formData.tipo_atribuicao === 'setor' && !formData.setor) {
      errors.push('Setor Ã© obrigatÃ³rio para atribuiÃ§Ã£o por setor')
    }

    if (!formData.frequencia) {
      errors.push('FrequÃªncia Ã© obrigatÃ³ria')
    }

    if (!formData.data_inicio) {
      errors.push('Data de inÃ­cio Ã© obrigatÃ³ria')
    }

    if (formData.data_fim && formData.data_inicio) {
      if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
        errors.push('Data de fim deve ser posterior Ã  data de inÃ­cio')
      }
    }

    const config = formData.configuracao_frequencia
    if (config) {
      if (formData.frequencia === 'diaria' && (!config.horarios || config.horarios.length === 0)) {
        errors.push('HorÃ¡rios sÃ£o obrigatÃ³rios para frequÃªncia diÃ¡ria')
      }

      if (formData.frequencia === 'semanal') {
        if (!config.dias_semana || config.dias_semana.length === 0) {
          errors.push('Dias da semana sÃ£o obrigatÃ³rios para frequÃªncia semanal')
        }
        if (!config.horarios || config.horarios.length === 0) {
          errors.push('HorÃ¡rios sÃ£o obrigatÃ³rios para frequÃªncia semanal')
        }
      }

      if (formData.frequencia === 'personalizada' && !config.recorrencia_personalizada) {
        errors.push('ExpressÃ£o de recorrÃªncia Ã© obrigatÃ³ria para frequÃªncia personalizada')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }, [formData])

  return {
    formData,
    updateField,
    updateFrequencyConfig,
    resetForm,
    validateForm
  }
}

// =====================================================
// UTILITÃRIOS
// =====================================================

export const tiposAtribuicao = [
  { value: 'funcionario_especifico', label: 'FuncionÃ¡rio EspecÃ­fico', icon: 'ðŸ‘¤' },
  { value: 'cargo', label: 'Por Cargo', icon: 'ðŸ’¼' },
  { value: 'setor', label: 'Por Setor', icon: 'ðŸ¢' },
  { value: 'todos', label: 'Todos os FuncionÃ¡rios', icon: 'ðŸ‘¥' }
]

export const frequencias = [
  { value: 'diaria', label: 'DiÃ¡ria', icon: 'ðŸ“…' },
  { value: 'semanal', label: 'Semanal', icon: 'ðŸ“†' },
  { value: 'mensal', label: 'Mensal', icon: 'ðŸ—“ï¸' },
  { value: 'personalizada', label: 'Personalizada', icon: 'âš™ï¸' }
]

export const diasSemana = [
  { value: 0, label: 'Domingo', abrev: 'Dom' },
  { value: 1, label: 'Segunda', abrev: 'Seg' },
  { value: 2, label: 'TerÃ§a', abrev: 'Ter' },
  { value: 3, label: 'Quarta', abrev: 'Qua' },
  { value: 4, label: 'Quinta', abrev: 'Qui' },
  { value: 5, label: 'Sexta', abrev: 'Sex' },
  { value: 6, label: 'SÃ¡bado', abrev: 'SÃ¡b' }
]

export function formatarTipoAtribuicao(tipo: string): string {
  const tipos: Record<string, string> = {
    'funcionario_especifico': 'FuncionÃ¡rio EspecÃ­fico',
    'cargo': 'Por Cargo',
    'setor': 'Por Setor',
    'todos': 'Todos os FuncionÃ¡rios'
  }
  return tipos[tipo] || tipo
}

export function formatarFrequencia(frequencia: string): string {
  const frequencias: Record<string, string> = {
    'diaria': 'DiÃ¡ria',
    'semanal': 'Semanal',
    'mensal': 'Mensal',
    'personalizada': 'Personalizada'
  }
  return frequencias[frequencia] || frequencia
}

export function formatarHorarios(horarios: string[]): string {
  if (!horarios || horarios.length === 0) return 'Nenhum horÃ¡rio'
  
  if (horarios.length === 1) return horarios[0]
  
  if (horarios.length <= 3) return horarios.join(', ')
  
  return `${horarios.slice(0, 2).join(', ')} e +${horarios.length - 2}`
}

export function formatarDiasSemana(dias: number[]): string {
  if (!dias || dias.length === 0) return 'Nenhum dia'
  
  const nomesDias = dias
    .sort()
    .map((dia: any) => diasSemana.find((d: any) => d.value === dia)?.abrev || dia.toString())
  
  if (nomesDias.length <= 3) return nomesDias.join(', ')
  
  return `${nomesDias.slice(0, 2).join(', ')} e +${nomesDias.length - 2}`
} 
