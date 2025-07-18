import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface ItemResposta {
  item_id: string
  titulo: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor: string | number | boolean | null
  anexos: {
    url: string
    nome: string
    tipo: string
    tamanho?: number
  }[]
  respondido: boolean
  respondido_em?: string
}

interface SecaoResposta {
  secao_id: string
  nome: string
  itens: ItemResposta[]
}

interface RespostasExecucao {
  secoes: SecaoResposta[]
}

interface ProgressoExecucao {
  total_itens: number
  itens_respondidos: number
  percentual_completo: number
  campos_obrigatorios_total: number
  campos_obrigatorios_respondidos: number
  percentual_obrigatorios: number
  pode_ser_finalizado: boolean
  tempo_estimado: number
  tempo_decorrido: number
}

interface ExecucaoData {
  id: string
  checklist_id: string
  funcionario_id: string
  status: 'em_andamento' | 'pausado' | 'completado' | 'cancelado'
  iniciado_em: string
  finalizado_em?: string
  observacoes?: string
  observacoes_finais?: string
  score_final?: number
  tempo_total_minutos?: number
  versao_checklist: number
  estrutura_checklist: unknown
  respostas: RespostasExecucao
  progresso: ProgressoExecucao
  checklist: {
    id: string
    nome: string
    setor: string
    tipo: string
    tempo_estimado: number
  }
  funcionario: {
    id: string
    nome: string
    email: string
  }
}

interface ValidacaoExecucao {
  valido: boolean
  erros: string[]
  campos_obrigatorios_vazios: number
  pode_continuar: boolean
  pode_finalizar: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Anexo {
  url: string
  nome: string
  tipo: string
  tamanho?: number
}

interface UseChecklistExecutionResult {
  // Estados
  execucao: ExecucaoData | null
  loading: boolean
  saving: boolean
  finalizing: boolean
  error: string | null
  autoSaveEnabled: boolean
  
  // Ações principais
  iniciarExecucao: (checklistId: string, observacoesIniciais?: string) => Promise<boolean>
  carregarExecucao: (execucaoId: string) => Promise<void>
  salvarRespostas: (autoSave?: boolean) => Promise<boolean>
  finalizarExecucao: (observacoesFinais?: string, assinatura?: unknown) => Promise<boolean>
  cancelarExecucao: (motivo?: string) => Promise<boolean>
  
  // Edição de respostas
  atualizarResposta: (secaoIndex: number, itemIndex: number, valor: string | number | boolean | null, anexos?: Anexo[]) => void
  adicionarAnexo: (secaoIndex: number, itemIndex: number, anexo: Anexo) => void
  removerAnexo: (secaoIndex: number, itemIndex: number, anexoIndex: number) => void
  
  // Utilitários
  validacao: ValidacaoExecucao | null
  podeSerFinalizada: boolean
  temAlteracoesPendentes: boolean
  proximoItemPendente: { secaoIndex: number; itemIndex: number } | null
  
  // Auto-save
  toggleAutoSave: () => void
  
  // Navegação
  irParaProximoItem: () => void
  irParaItemAnterior: () => void
  irParaSecao: (secaoIndex: number) => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useChecklistExecution(): UseChecklistExecutionResult {
  const [execucao, setExecucao] = useState<ExecucaoData | null>(null)
  const [execucaoOriginal, setExecucaoOriginal] = useState<ExecucaoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [validacao, setValidacao] = useState<ValidacaoExecucao | null>(null)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // =====================================================
  // EFEITOS
  // =====================================================

  // Auto-save quando há mudanças
  useEffect(() => {
    if (autoSaveEnabled && execucao && execucaoOriginal && temAlteracoesPendentes) {
      // Limpar timer anterior
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      // Configurar novo timer para salvar em 3 segundos
      const timer = setTimeout(() => {
        void salvarRespostas(true) // Auto-save
      }, 3000)
      setAutoSaveTimer(timer)
    }
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [execucao, execucaoOriginal, autoSaveEnabled])

  // Atualizar validação quando execução muda
  useEffect(() => {
    if (execucao) {
      const novaValidacao = validarExecucao(execucao)
      setValidacao(novaValidacao)
    }
  }, [execucao])

  // =====================================================
  // AÇÕES PRINCIPAIS
  // =====================================================

  const iniciarExecucao = async (checklistId: string, observacoesIniciais?: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post(`/api/checklists/${checklistId}/execucoes`, {
        observacoes_iniciais: observacoesIniciais
      }) as ApiResponse<ExecucaoData>
      
      if (response.success && response.data) {
        const novaExecucao = response.data
        setExecucao(novaExecucao)
        setExecucaoOriginal(deepClone(novaExecucao))
        return true
      } else {
        setError(response.error || 'Erro ao iniciar execução')
        return false
      }
    } catch (err) {
      console.error('Erro ao iniciar execução:', err)
      setError('Erro ao iniciar execução')
      return false
    } finally {
      setLoading(false)
    }
  }

  const carregarExecucao = async (execucaoId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/api/checklists/execucoes/${execucaoId}`) as ApiResponse<ExecucaoData>
      
      if (response.success && response.data) {
        const execucaoCarregada = response.data
        setExecucao(execucaoCarregada)
        setExecucaoOriginal(deepClone(execucaoCarregada))
      } else {
        setError(response.error || 'Erro ao carregar execução')
      }
    } catch (err) {
      console.error('Erro ao carregar execução:', err)
      setError('Erro ao carregar execução')
    } finally {
      setLoading(false)
    }
  }

  const salvarRespostas = async (autoSave = false): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      if (!autoSave) setSaving(true)
      setError(null)
      
      const response = await api.put(`/api/checklists/execucoes/${execucao.id}/respostas`, {
        respostas: execucao.respostas,
        progresso: calcularProgresso(execucao.respostas)
      }) as ApiResponse<ExecucaoData>
      
      if (response.success && response.data) {
        const execucaoAtualizada = response.data
        setExecucao(execucaoAtualizada)
        setExecucaoOriginal(deepClone(execucaoAtualizada))
        return true
      } else {
        setError(response.error || 'Erro ao salvar respostas')
        return false
      }
    } catch (err) {
      console.error('Erro ao salvar respostas:', err)
      setError('Erro ao salvar respostas')
      return false
    } finally {
      if (!autoSave) setSaving(false)
    }
  }

  const finalizarExecucao = async (observacoesFinais?: string, assinatura?: unknown): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      setFinalizing(true)
      setError(null)
      
      const response = await api.put(`/api/checklists/execucoes/${execucao.id}/finalizar`, {
        observacoes_finais: observacoesFinais,
        assinatura: assinatura,
        respostas: execucao.respostas,
        progresso: calcularProgresso(execucao.respostas)
      }) as ApiResponse<ExecucaoData>
      
      if (response.success && response.data) {
        const execucaoFinalizada = response.data
        setExecucao(execucaoFinalizada)
        setExecucaoOriginal(deepClone(execucaoFinalizada))
        return true
      } else {
        setError(response.error || 'Erro ao finalizar execução')
        return false
      }
    } catch (err) {
      console.error('Erro ao finalizar execução:', err)
      setError('Erro ao finalizar execução')
      return false
    } finally {
      setFinalizing(false)
    }
  }

  const cancelarExecucao = async (motivo?: string): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.put(`/api/checklists/execucoes/${execucao.id}/cancelar`, {
        motivo: motivo
      }) as ApiResponse<ExecucaoData>
      
      if (response.success && response.data) {
        const execucaoCancelada = response.data
        setExecucao(execucaoCancelada)
        setExecucaoOriginal(deepClone(execucaoCancelada))
        return true
      } else {
        setError(response.error || 'Erro ao cancelar execução')
        return false
      }
    } catch (err) {
      console.error('Erro ao cancelar execução:', err)
      setError('Erro ao cancelar execução')
      return false
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // EDIÇÃO DE RESPOSTAS
  // =====================================================

  const atualizarResposta = useCallback((
    secaoIndex: number, 
    itemIndex: number, 
    valor: string | number | boolean | null, 
    anexos?: Anexo[]
  ) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const secao = novaExecucao.respostas.secoes[secaoIndex]
      if (!secao) return prev
      
      const item = secao.itens[itemIndex]
      if (!item) return prev
      
      item.valor = valor
      item.respondido = valor !== null && valor !== ''
      item.respondido_em = item.respondido ? new Date().toISOString() : undefined
      
      if (anexos) {
        item.anexos = anexos
      }
      
      return novaExecucao
    })
  }, [execucao])

  const adicionarAnexo = useCallback((
    secaoIndex: number, 
    itemIndex: number, 
    anexo: Anexo
  ) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const secao = novaExecucao.respostas.secoes[secaoIndex]
      if (!secao) return prev
      
      const item = secao.itens[itemIndex]
      if (!item) return prev
      
      item.anexos.push(anexo)
      
      return novaExecucao
    })
  }, [execucao])

  const removerAnexo = useCallback((
    secaoIndex: number, 
    itemIndex: number, 
    anexoIndex: number
  ) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const secao = novaExecucao.respostas.secoes[secaoIndex]
      if (!secao) return prev
      
      const item = secao.itens[itemIndex]
      if (!item) return prev
      
      item.anexos.splice(anexoIndex, 1)
      
      return novaExecucao
    })
  }, [execucao])

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const temAlteracoesPendentes = useMemo(() => {
    if (!execucao || !execucaoOriginal) return false
    return JSON.stringify(execucao.respostas) !== JSON.stringify(execucaoOriginal.respostas)
  }, [execucao, execucaoOriginal])

  const podeSerFinalizada = useMemo(() => {
    return validacao?.pode_finalizar || false
  }, [validacao])

  const proximoItemPendente = useMemo(() => {
    if (!execucao) return null
    
    for (let secaoIndex = 0; secaoIndex < execucao.respostas.secoes.length; secaoIndex++) {
      const secao = execucao.respostas.secoes[secaoIndex]
      for (let itemIndex = 0; itemIndex < secao.itens.length; itemIndex++) {
        const item = secao.itens[itemIndex]
        if (item.obrigatorio && !item.respondido) {
          return { secaoIndex, itemIndex }
        }
      }
    }
    return null
  }, [execucao])

  // =====================================================
  // AUTO-SAVE
  // =====================================================

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev)
  }, [])

  // =====================================================
  // NAVEGAÇÃO
  // =====================================================

  const irParaProximoItem = useCallback(() => {
    // Implementação da navegação para próximo item
  }, [])

  const irParaItemAnterior = useCallback(() => {
    // Implementação da navegação para item anterior
  }, [])

  const irParaSecao = useCallback((secaoIndex: number) => {
    // Implementação da navegação para seção
  }, [])

  return {
    // Estados
    execucao,
    loading,
    saving,
    finalizing,
    error,
    autoSaveEnabled,
    
    // Ações principais
    iniciarExecucao,
    carregarExecucao,
    salvarRespostas,
    finalizarExecucao,
    cancelarExecucao,
    
    // Edição de respostas
    atualizarResposta,
    adicionarAnexo,
    removerAnexo,
    
    // Utilitários
    validacao,
    podeSerFinalizada,
    temAlteracoesPendentes,
    proximoItemPendente,
    
    // Auto-save
    toggleAutoSave,
    
    // Navegação
    irParaProximoItem,
    irParaItemAnterior,
    irParaSecao
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj) as unknown)
}

function validarExecucao(execucao: ExecucaoData): ValidacaoExecucao {
  const erros: string[] = []
  let camposObrigatoriosVazios = 0
  
  // Validar campos obrigatórios
  execucao.respostas.secoes.forEach(secao => {
    secao.itens.forEach(item => {
      if (item.obrigatorio && !item.respondido) {
        camposObrigatoriosVazios++
        erros.push(`Campo obrigatório não respondido: ${item.titulo}`)
      }
    })
  })
  
  const valido = erros.length === 0
  const podeContinuar = camposObrigatoriosVazios <= 3 // Permite até 3 campos obrigatórios vazios
  const podeFinalizar = camposObrigatoriosVazios === 0
  
  return {
    valido,
    erros,
    campos_obrigatorios_vazios: camposObrigatoriosVazios,
    pode_continuar: podeContinuar,
    pode_finalizar: podeFinalizar
  }
}

function calcularProgresso(respostas: RespostasExecucao): ProgressoExecucao {
  let totalItens = 0
  let itensRespondidos = 0
  let camposObrigatoriosTotal = 0
  let camposObrigatoriosRespondidos = 0
  
  respostas.secoes.forEach(secao => {
    secao.itens.forEach(item => {
      totalItens++
      if (item.respondido) {
        itensRespondidos++
      }
      
      if (item.obrigatorio) {
        camposObrigatoriosTotal++
        if (item.respondido) {
          camposObrigatoriosRespondidos++
        }
      }
    })
  })
  
  const percentualCompleto = totalItens > 0 ? (itensRespondidos / totalItens) * 100 : 0
  const percentualObrigatorios = camposObrigatoriosTotal > 0 ? (camposObrigatoriosRespondidos / camposObrigatoriosTotal) * 100 : 0
  const podeSerFinalizado = percentualObrigatorios === 100
  
  return {
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    percentual_completo: percentualCompleto,
    campos_obrigatorios_total: camposObrigatoriosTotal,
    campos_obrigatorios_respondidos: camposObrigatoriosRespondidos,
    percentual_obrigatorios: percentualObrigatorios,
    pode_ser_finalizado: podeSerFinalizado,
    tempo_estimado: 0, // Será calculado baseado no checklist
    tempo_decorrido: 0 // Será calculado baseado no tempo real
  }
}

// =====================================================
// HOOK SECUNDÁRIO PARA LISTAGEM
// =====================================================

export function useChecklistExecutions() {
  const carregarExecucoes = async (filtros?: Record<string, unknown>) => {
    // Implementação para carregar lista de execuções
  }
  
  return { carregarExecucoes }
} 

