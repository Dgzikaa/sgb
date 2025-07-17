import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface ItemResposta {
  item_id: string
  titulo: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor
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
  estrutura_checklist
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

interface UseChecklistExecutionResult {
  // Estados
  execucao: ExecucaoData | null
  loading: boolean
  saving: boolean
  finalizing: boolean
  error: string | null
  autoSaveEnabled: boolean
  
  // A·ß·µes principais
  iniciarExecucao: (checklistId: string, observacoesIniciais?: string) => Promise<boolean>
  carregarExecucao: (execucaoId: string) => Promise<void>
  salvarRespostas: (autoSave?: boolean) => Promise<boolean>
  finalizarExecucao: (observacoesFinais?: string, assinatura?: any) => Promise<boolean>
  cancelarExecucao: (motivo?: string) => Promise<boolean>
  
  // Edi·ß·£o de respostas
  atualizarResposta: (secaoIndex: number, itemIndex: number, valor, anexos?: any[]) => void
  adicionarAnexo: (secaoIndex: number, itemIndex: number, anexo) => void
  removerAnexo: (secaoIndex: number, itemIndex: number, anexoIndex: number) => void
  
  // Utilit·°rios
  validacao: ValidacaoExecucao | null
  podeSerFinalizada: boolean
  temAlteracoesPendentes: boolean
  proximoItemPendente: { secaoIndex: number; itemIndex: number } | null
  
  // Auto-save
  toggleAutoSave: () => void
  
  // Navega·ß·£o
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

  // Auto-save quando h·° mudan·ßas
  useEffect(() => {
    if (autoSaveEnabled && execucao && execucaoOriginal && temAlteracoesPendentes) {
      // Limpar timer anterior
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      
      // Configurar novo timer para salvar em 3 segundos
      const timer = setTimeout(() => {
        salvarRespostas(true) // Auto-save
      }, 3000)
      
      setAutoSaveTimer(timer)
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [execucao, execucaoOriginal, autoSaveEnabled])

  // Atualizar valida·ß·£o quando execu·ß·£o muda
  useEffect(() => {
    if (execucao) {
      const novaValidacao = validarExecucao(execucao)
      setValidacao(novaValidacao)
    }
  }, [execucao])

  // =====================================================
  // A·á·ïES PRINCIPAIS
  // =====================================================

  const iniciarExecucao = async (checklistId: string, observacoesIniciais?: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post(`/api/checklists/${checklistId}/execucoes`, {
        observacoes_iniciais: observacoesIniciais
      })
      
      if (response.success) {
        const novaExecucao = response.data
        setExecucao(novaExecucao)
        setExecucaoOriginal(deepClone(novaExecucao))
        return true
      } else {
        setError(response.error || 'Erro ao iniciar execu·ß·£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao iniciar execu·ß·£o:', err)
      setError('Erro ao iniciar execu·ß·£o')
      return false
    } finally {
      setLoading(false)
    }
  }

  const carregarExecucao = async (execucaoId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/api/execucoes/${execucaoId}`)
      
      if (response.success) {
        const execucaoCarregada = response.data
        setExecucao(execucaoCarregada)
        setExecucaoOriginal(deepClone(execucaoCarregada))
      } else {
        setError(response.error || 'Erro ao carregar execu·ß·£o')
      }
    } catch (err) {
      console.error('Erro ao carregar execu·ß·£o:', err)
      setError('Erro ao carregar execu·ß·£o')
    } finally {
      setLoading(false)
    }
  }

  const salvarRespostas = async (autoSave: boolean = false): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      setSaving(true)
      
      const response = await api.put(`/api/execucoes/${execucao.id}`, {
        respostas: execucao.respostas,
        observacoes: execucao.observacoes,
        auto_save: autoSave
      })
      
      if (response.success) {
        const execucaoAtualizada = response.data.execucao
        setExecucao(execucaoAtualizada)
        setExecucaoOriginal(deepClone(execucaoAtualizada))
        
        if (!autoSave) {
          console.log('üíæ Respostas salvas manualmente')
        }
        
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
      setSaving(false)
    }
  }

  const finalizarExecucao = async (observacoesFinais?: string, assinatura?: any): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      setFinalizing(true)
      
      // Primeiro salvar as respostas atuais
      const salvou = await salvarRespostas(false)
      if (!salvou) {
        return false
      }
      
      const payload = {
        observacoes_finais: observacoesFinais,
        confirmacao_finalizacao: true
      }
      
      if (assinatura) {
        payload.assinatura_digital = assinatura
      }
      
      const response = await api.post(`/api/execucoes/${execucao.id}/finalizar`, payload)
      
      if (response.success) {
        const execucaoFinalizada = response.data.execucao
        setExecucao(execucaoFinalizada)
        setExecucaoOriginal(deepClone(execucaoFinalizada))
        
        console.log(`úÖ Execu·ß·£o finalizada com score: ${response.data.score.score_total}%`)
        return true
      } else {
        setError(response.error || 'Erro ao finalizar execu·ß·£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao finalizar execu·ß·£o:', err)
      setError('Erro ao finalizar execu·ß·£o')
      return false
    } finally {
      setFinalizing(false)
    }
  }

  const cancelarExecucao = async (motivo?: string): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      const response = await api.delete(`/api/execucoes/${execucao.id}?motivo=${encodeURIComponent(motivo || 'Cancelado pelo usu·°rio')}`)
      
      if (response.success) {
        console.log('ùå Execu·ß·£o cancelada')
        return true
      } else {
        setError(response.error || 'Erro ao cancelar execu·ß·£o')
        return false
      }
    } catch (err) {
      console.error('Erro ao cancelar execu·ß·£o:', err)
      setError('Erro ao cancelar execu·ß·£o')
      return false
    }
  }

  // =====================================================
  // EDI·á·ÉO DE RESPOSTAS
  // =====================================================

  const atualizarResposta = useCallback((secaoIndex: number, itemIndex: number, valor, anexos?: any[]) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const item = novaExecucao.respostas.secoes[secaoIndex]?.itens[itemIndex]
      
      if (item) {
        item.valor = valor
        item.respondido = valor !== null && valor !== undefined && valor !== ''
        item.respondido_em = item.respondido ? new Date().toISOString() : undefined
        
        if (anexos) {
          item.anexos = anexos
        }
        
        // Recalcular progresso
        novaExecucao.progresso = calcularProgresso(novaExecucao.respostas)
      }
      
      return novaExecucao
    })
  }, [execucao])

  const adicionarAnexo = useCallback((secaoIndex: number, itemIndex: number, anexo) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const item = novaExecucao.respostas.secoes[secaoIndex]?.itens[itemIndex]
      
      if (item) {
        if (!item.anexos) {
          item.anexos = []
        }
        item.anexos.push(anexo)
        
        // Marcar como respondido se tinha anexo obrigat·≥rio
        if (!item.respondido && ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo)) {
          item.respondido = true
          item.respondido_em = new Date().toISOString()
        }
        
        // Recalcular progresso
        novaExecucao.progresso = calcularProgresso(novaExecucao.respostas)
      }
      
      return novaExecucao
    })
  }, [execucao])

  const removerAnexo = useCallback((secaoIndex: number, itemIndex: number, anexoIndex: number) => {
    if (!execucao) return
    
    setExecucao(prev => {
      if (!prev) return prev
      
      const novaExecucao = deepClone(prev)
      const item = novaExecucao.respostas.secoes[secaoIndex]?.itens[itemIndex]
      
      if (item?.anexos) {
        item.anexos.splice(anexoIndex, 1)
        
        // Se n·£o tem mais anexos e ·© campo de anexo obrigat·≥rio, marcar como n·£o respondido
        if (item.anexos.length === 0 && ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo) && item.obrigatorio) {
          item.respondido = false
          item.respondido_em = undefined
        }
        
        // Recalcular progresso
        novaExecucao.progresso = calcularProgresso(novaExecucao.respostas)
      }
      
      return novaExecucao
    })
  }, [execucao])

  // =====================================================
  // UTILIT·ÅRIOS
  // =====================================================

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev)
  }, [])

  // Calcular se tem altera·ß·µes pendentes
  const temAlteracoesPendentes = useMemo(() => {
    if (!execucao || !execucaoOriginal) return false
    return JSON.stringify(execucao.respostas) !== JSON.stringify(execucaoOriginal.respostas)
  }, [execucao, execucaoOriginal])

  // Verificar se pode ser finalizada
  const podeSerFinalizada = useMemo(() => {
    return validacao?.pode_finalizar ?? false
  }, [validacao])

  // Encontrar pr·≥ximo item pendente
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

  // Navega·ß·£o
  const irParaProximoItem = useCallback(() => {
    // Implementar l·≥gica de navega·ß·£o
    console.log('Ir para pr·≥ximo item')
  }, [])

  const irParaItemAnterior = useCallback(() => {
    // Implementar l·≥gica de navega·ß·£o
    console.log('Ir para item anterior')
  }, [])

  const irParaSecao = useCallback((secaoIndex: number) => {
    // Implementar l·≥gica de navega·ß·£o
    console.log(`Ir para se·ß·£o ${secaoIndex}`)
  }, [])

  return {
    // Estados
    execucao,
    loading,
    saving,
    finalizing,
    error,
    autoSaveEnabled,
    
    // A·ß·µes principais
    iniciarExecucao,
    carregarExecucao,
    salvarRespostas,
    finalizarExecucao,
    cancelarExecucao,
    
    // Edi·ß·£o de respostas
    atualizarResposta,
    adicionarAnexo,
    removerAnexo,
    
    // Utilit·°rios
    validacao,
    podeSerFinalizada,
    temAlteracoesPendentes,
    proximoItemPendente,
    
    // Auto-save
    toggleAutoSave,
    
    // Navega·ß·£o
    irParaProximoItem,
    irParaItemAnterior,
    irParaSecao
  }
}

// =====================================================
// FUN·á·ïES UTILIT·ÅRIAS
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // Implementa·ß·£o simplificada do useMemo
  return factory()
}

function validarExecucao(execucao: ExecucaoData): ValidacaoExecucao {
  const erros: string[] = []
  let camposObrigatoriosVazios = 0
  
  if (!execucao.respostas?.secoes) {
    return {
      valido: false,
      erros: ['Estrutura de respostas inv·°lida'],
      campos_obrigatorios_vazios: 0,
      pode_continuar: false,
      pode_finalizar: false
    }
  }
  
  execucao.respostas.secoes.forEach((secao, secaoIndex) => {
    secao.itens.forEach((item, itemIndex) => {
      if (item.obrigatorio && !item.respondido) {
        erros.push(`Campo obrigat·≥rio "${item.titulo}" n·£o foi preenchido`)
        camposObrigatoriosVazios++
      }
      
      // Validar anexos obrigat·≥rios
      if (item.obrigatorio && ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo)) {
        if (!item.anexos || item.anexos.length === 0) {
          erros.push(`Anexo obrigat·≥rio "${item.titulo}" n·£o foi fornecido`)
          camposObrigatoriosVazios++
        }
      }
    })
  })
  
  return {
    valido: erros.length === 0,
    erros,
    campos_obrigatorios_vazios: camposObrigatoriosVazios,
    pode_continuar: ['em_andamento', 'pausado'].includes(execucao.status),
    pode_finalizar: camposObrigatoriosVazios === 0 && execucao.status === 'em_andamento'
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
  
  const percentualCompleto = totalItens > 0 ? Math.round((itensRespondidos / totalItens) * 100) : 0
  const percentualObrigatorios = camposObrigatoriosTotal > 0 ? 
    Math.round((camposObrigatoriosRespondidos / camposObrigatoriosTotal) * 100) : 100
  
  return {
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    percentual_completo: percentualCompleto,
    campos_obrigatorios_total: camposObrigatoriosTotal,
    campos_obrigatorios_respondidos: camposObrigatoriosRespondidos,
    percentual_obrigatorios: percentualObrigatorios,
    pode_ser_finalizado: percentualObrigatorios === 100,
    tempo_estimado: 30, // Default
    tempo_decorrido: 0 // Ser·° calculado pelo frontend
  }
}

// =====================================================
// HOOK PARA LISTA DE EXECU·á·ïES
// =====================================================

export function useChecklistExecutions() {
  const [execucoes, setExecucoes] = useState<ExecucaoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const carregarExecucoes = async (filtros?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams(filtros || {})
      const response = await api.get(`/api/execucoes?${params.toString()}`)
      
      if (response.success) {
        setExecucoes(response.data.execucoes || [])
      } else {
        setError(response.error || 'Erro ao carregar execu·ß·µes')
      }
    } catch (err) {
      console.error('Erro ao carregar execu·ß·µes:', err)
      setError('Erro ao carregar execu·ß·µes')
    } finally {
      setLoading(false)
    }
  }
  
  return {
    execucoes,
    loading,
    error,
    carregarExecucoes
  }
} 
