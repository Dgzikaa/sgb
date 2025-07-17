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
  estatisticas: {
    total_agendados: number
    concluidos: number
    pendentes: number
    atrasados: number
    taxa_conclusao: number
  } | null
  paginacao: {
    page: number
    total: number
    perPage: number
  } | null
  
  // AÃ¡Â§Ã¡Âµes CRUD
  carregarAtribuicoes: (filtros?: FiltrosAtribuicao) => Promise<void>
  carregarAtribuicao: (id: string) => Promise<void>
  criarAtribuicao: (dados: NovaAtribuicao) => Promise<boolean>
  atualizarAtribuicao: (id: string, dados: Partial<NovaAtribuicao>) => Promise<boolean>
  excluirAtribuicao: (id: string, force?: boolean) => Promise<boolean>
  
  // UtilitÃ¡Â¡rios
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
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [paginacao, setPaginacao] = useState<any>(null)
  const [filtrosAtuais, setFiltrosAtuais] = useState<FiltrosAtribuicao>({})

  // =====================================================
  // AÃ¡â€¡Ã¡â€¢ES CRUD
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
        setError(response.error || 'Erro ao carregar atribuiÃ¡Â§Ã¡Âµes')
      }
    } catch (err) {
      console.error('Erro ao carregar atribuiÃ¡Â§Ã¡Âµes:', err)
      setError('Erro ao carregar atribuiÃ¡Â§Ã¡Âµes')
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
        setError(response.error || 'Erro ao carregar atribuiÃ¡Â§Ã¡Â£o')
      }
    } catch (err) {
      console.error('Erro ao carregar atribuiÃ¡Â§Ã¡Â£o:', err)
      setError('Erro ao carregar atribuiÃ¡Â§Ã¡Â£o')
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
        console.log('Å“â€¦ AtribuiÃ¡Â§Ã¡Â£o criada com sucesso!')
        // Recarregar lista
        await carregarAtribuicoes(filtrosAtuais)
        return true
      } else {
        setError(response.error || 'Erro ao criar atribuiÃ¡Â§Ã¡Â£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao criar atribuiÃ¡Â§Ã¡Â£o:', err)
      setError('Erro ao criar atribuiÃ¡Â§Ã¡Â£o')
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
        console.log('Ã°Å¸â€œÂ AtribuiÃ¡Â§Ã¡Â£o atualizada com sucesso!')
        
        // Atualizar na lista
        setAtribuicoes(prev => prev.map((a) => 
          a.id === id ? { ...a, ...response.data } : a
        ))
        
        // Atualizar atribuiÃ¡Â§Ã¡Â£o individual se carregada
        if (atribuicao?.id === id) {
          setAtribuicao(prev => prev ? { ...prev, ...response.data } : null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao atualizar atribuiÃ¡Â§Ã¡Â£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao atualizar atribuiÃ¡Â§Ã¡Â£o:', err)
      setError('Erro ao atualizar atribuiÃ¡Â§Ã¡Â£o')
      return false
    } finally {
      setUpdating(false)
    }
  }, [atribuicao])

  const excluirAtribuicao = useCallback(async (id: string, force = false): Promise<boolean> => {
    try {
      setDeleting(true)
      setError(null)

      const params = force ? '?force=true' : ''
      const response = await api.delete(`/api/atribuicoes/${id}${params}`)

      if (response.success) {
        console.log('Ã°Å¸â€”â€˜Ã¯Â¸Â AtribuiÃ¡Â§Ã¡Â£o excluÃ¡Â­da com sucesso!')
        
        // Remover da lista
        setAtribuicoes(prev => prev.filter((a) => a.id !== id))
        
        // Limpar atribuiÃ¡Â§Ã¡Â£o individual se era a atual
        if (atribuicao?.id === id) {
          setAtribuicao(null)
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao excluir atribuiÃ¡Â§Ã¡Â£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao excluir atribuiÃ¡Â§Ã¡Â£o:', err)
      setError('Erro ao excluir atribuiÃ¡Â§Ã¡Â£o')
      return false
    } finally {
      setDeleting(false)
    }
  }, [atribuicao])

  // =====================================================
  // UTILITÃ¡ÂRIOS
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
    
    // AÃ¡Â§Ã¡Âµes CRUD
    carregarAtribuicoes,
    carregarAtribuicao,
    criarAtribuicao,
    atualizarAtribuicao,
    excluirAtribuicao,
    
    // UtilitÃ¡Â¡rios
    recarregar,
    limparErro
  }
}

// =====================================================
// HOOK PARA DASHBOARD DE PRODUTIVIDADE
// =====================================================

// Interfaces auxiliares para dashboard
interface FuncionarioRanking {
  id: string;
  nome: string;
  score: number;
  [key: string]: unknown;
}
interface EvolucaoTemporal {
  data: string;
  valor: number;
  [key: string]: unknown;
}
interface AlertaDashboard {
  tipo: string;
  mensagem: string;
  [key: string]: unknown;
}
interface SetorEstatistica {
  setor: string;
  valor: number;
  [key: string]: unknown;
}
interface CargoEstatistica {
  cargo: string;
  valor: number;
  [key: string]: unknown;
}
interface ChecklistResumo {
  id: string;
  nome: string;
  score: number;
  [key: string]: unknown;
}

interface DashboardData {
  periodo: {
    inicio: string;
    fim: string;
    dias: number;
  };
  metricas_gerais: {
    total_execucoes: number;
    execucoes_concluidas: number;
    execucoes_pendentes: number;
    taxa_conclusao: number;
    score_medio: number;
    tempo_medio: number;
    funcionarios_ativos: number;
  };
  ranking_funcionarios: FuncionarioRanking[];
  evolucao_temporal: EvolucaoTemporal[];
  alertas: AlertaDashboard[];
  estatisticas: {
    por_setor: SetorEstatistica[];
    por_cargo: CargoEstatistica[];
  };
  top_checklists: ChecklistResumo[];
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
    } catch (err) {
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
      errors.push('Checklist Ã¡Â© obrigatÃ¡Â³rio')
    }

    if (!formData.tipo_atribuicao) {
      errors.push('Tipo de atribuiÃ¡Â§Ã¡Â£o Ã¡Â© obrigatÃ¡Â³rio')
    }

    if (formData.tipo_atribuicao === 'funcionario_especifico' && !formData.funcionario_id) {
      errors.push('FuncionÃ¡Â¡rio Ã¡Â© obrigatÃ¡Â³rio para atribuiÃ¡Â§Ã¡Â£o especÃ¡Â­fica')
    }

    if (formData.tipo_atribuicao === 'cargo' && !formData.cargo) {
      errors.push('Cargo Ã¡Â© obrigatÃ¡Â³rio para atribuiÃ¡Â§Ã¡Â£o por cargo')
    }

    if (formData.tipo_atribuicao === 'setor' && !formData.setor) {
      errors.push('Setor Ã¡Â© obrigatÃ¡Â³rio para atribuiÃ¡Â§Ã¡Â£o por setor')
    }

    if (!formData.frequencia) {
      errors.push('FrequÃ¡Âªncia Ã¡Â© obrigatÃ¡Â³ria')
    }

    if (!formData.data_inicio) {
      errors.push('Data de inÃ¡Â­cio Ã¡Â© obrigatÃ¡Â³ria')
    }

    if (formData.data_fim && formData.data_inicio) {
      if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
        errors.push('Data de fim deve ser posterior Ã¡Â  data de inÃ¡Â­cio')
      }
    }

    const config = formData.configuracao_frequencia
    if (config) {
      if (formData.frequencia === 'diaria' && (!config.horarios || config.horarios.length === 0)) {
        errors.push('HorÃ¡Â¡rios sÃ¡Â£o obrigatÃ¡Â³rios para frequÃ¡Âªncia diÃ¡Â¡ria')
      }

      if (formData.frequencia === 'semanal') {
        if (!config.dias_semana || config.dias_semana.length === 0) {
          errors.push('Dias da semana sÃ¡Â£o obrigatÃ¡Â³rios para frequÃ¡Âªncia semanal')
        }
        if (!config.horarios || config.horarios.length === 0) {
          errors.push('HorÃ¡Â¡rios sÃ¡Â£o obrigatÃ¡Â³rios para frequÃ¡Âªncia semanal')
        }
      }

      if (formData.frequencia === 'personalizada' && !config.recorrencia_personalizada) {
        errors.push('ExpressÃ¡Â£o de recorrÃ¡Âªncia Ã¡Â© obrigatÃ¡Â³ria para frequÃ¡Âªncia personalizada')
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
// UTILITÃ¡ÂRIOS
// =====================================================

export const tiposAtribuicao = [
  { value: 'funcionario_especifico', label: 'FuncionÃ¡Â¡rio EspecÃ¡Â­fico', icon: 'Ã°Å¸â€˜Â¤' },
  { value: 'cargo', label: 'Por Cargo', icon: 'Ã°Å¸â€™Â¼' },
  { value: 'setor', label: 'Por Setor', icon: 'Ã°Å¸ÂÂ¢' },
  { value: 'todos', label: 'Todos os FuncionÃ¡Â¡rios', icon: 'Ã°Å¸â€˜Â¥' }
]

export const frequencias = [
  { value: 'diaria', label: 'DiÃ¡Â¡ria', icon: 'Ã°Å¸â€œâ€¦' },
  { value: 'semanal', label: 'Semanal', icon: 'Ã°Å¸â€œâ€ ' },
  { value: 'mensal', label: 'Mensal', icon: 'Ã°Å¸â€”â€œÃ¯Â¸Â' },
  { value: 'personalizada', label: 'Personalizada', icon: 'Å¡â„¢Ã¯Â¸Â' }
]

export const diasSemana = [
  { value: 0, label: 'Domingo', abrev: 'Dom' },
  { value: 1, label: 'Segunda', abrev: 'Seg' },
  { value: 2, label: 'TerÃ¡Â§a', abrev: 'Ter' },
  { value: 3, label: 'Quarta', abrev: 'Qua' },
  { value: 4, label: 'Quinta', abrev: 'Qui' },
  { value: 5, label: 'Sexta', abrev: 'Sex' },
  { value: 6, label: 'SÃ¡Â¡bado', abrev: 'SÃ¡Â¡b' }
]

export function formatarTipoAtribuicao(tipo: string): string {
  const tipos: Record<string, string> = {
    'funcionario_especifico': 'FuncionÃ¡Â¡rio EspecÃ¡Â­fico',
    'cargo': 'Por Cargo',
    'setor': 'Por Setor',
    'todos': 'Todos os FuncionÃ¡Â¡rios'
  }
  return tipos[tipo] || tipo
}

export function formatarFrequencia(frequencia: string): string {
  const frequencias: Record<string, string> = {
    'diaria': 'DiÃ¡Â¡ria',
    'semanal': 'Semanal',
    'mensal': 'Mensal',
    'personalizada': 'Personalizada'
  }
  return frequencias[frequencia] || frequencia
}

export function formatarHorarios(horarios: string[]): string {
  if (!horarios || horarios.length === 0) return 'Nenhum horÃ¡Â¡rio'
  
  if (horarios.length === 1) return horarios[0]
  
  if (horarios.length <= 3) return horarios.join(', ')
  
  return `${horarios.slice(0, 2).join(', ')} e +${horarios.length - 2}`
}

export function formatarDiasSemana(dias: number[]): string {
  if (!dias || dias.length === 0) return 'Nenhum dia'
  
  const nomesDias = dias
    .sort()
    .map((dia) => diasSemana.find((d) => d.value === dia)?.abrev || dia.toString())
  
  if (nomesDias.length <= 3) return nomesDias.join(', ')
  
  return `${nomesDias.slice(0, 2).join(', ')} e +${nomesDias.length - 2}`
} 

