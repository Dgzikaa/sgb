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
  valor: any
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
  estrutura_checklist: any
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
  
  // AÃ§Ãµes principais
  iniciarExecucao: (checklistId: string, observacoesIniciais?: string) => Promise<boolean>
  carregarExecucao: (execucaoId: string) => Promise<void>
  salvarRespostas: (autoSave?: boolean) => Promise<boolean>
  finalizarExecucao: (observacoesFinais?: string, assinatura?: any) => Promise<boolean>
  cancelarExecucao: (motivo?: string) => Promise<boolean>
  
  // EdiÃ§Ã£o de respostas
  atualizarResposta: (secaoIndex: number, itemIndex: number, valor: any, anexos?: any[]) => void
  adicionarAnexo: (secaoIndex: number, itemIndex: number, anexo: any) => void
  removerAnexo: (secaoIndex: number, itemIndex: number, anexoIndex: number) => void
  
  // UtilitÃ¡rios
  validacao: ValidacaoExecucao | null
  podeSerFinalizada: boolean
  temAlteracoesPendentes: boolean
  proximoItemPendente: { secaoIndex: number; itemIndex: number } | null
  
  // Auto-save
  toggleAutoSave: () => void
  
  // NavegaÃ§Ã£o
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

  // Auto-save quando hÃ¡ mudanÃ§as
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

  // Atualizar validaÃ§Ã£o quando execuÃ§Ã£o muda
  useEffect(() => {
    if (execucao) {
      const novaValidacao = validarExecucao(execucao)
      setValidacao(novaValidacao)
    }
  }, [execucao])

  // =====================================================
  // AÃ‡Ã•ES PRINCIPAIS
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
        setError(response.error || 'Erro ao iniciar execuÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao iniciar execuÃ§Ã£o:', err)
      setError('Erro ao iniciar execuÃ§Ã£o')
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
        setError(response.error || 'Erro ao carregar execuÃ§Ã£o')
      }
    } catch (err: any) {
      console.error('Erro ao carregar execuÃ§Ã£o:', err)
      setError('Erro ao carregar execuÃ§Ã£o')
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
          console.log('ðŸ’¾ Respostas salvas manualmente')
        }
        
        return true
      } else {
        setError(response.error || 'Erro ao salvar respostas')
        return false
      }
    } catch (err: any) {
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
      
      const payload: any = {
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
        
        console.log(`âœ… ExecuÃ§Ã£o finalizada com score: ${response.data.score.score_total}%`)
        return true
      } else {
        setError(response.error || 'Erro ao finalizar execuÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao finalizar execuÃ§Ã£o:', err)
      setError('Erro ao finalizar execuÃ§Ã£o')
      return false
    } finally {
      setFinalizing(false)
    }
  }

  const cancelarExecucao = async (motivo?: string): Promise<boolean> => {
    if (!execucao) return false
    
    try {
      const response = await api.delete(`/api/execucoes/${execucao.id}?motivo=${encodeURIComponent(motivo || 'Cancelado pelo usuÃ¡rio')}`)
      
      if (response.success) {
        console.log('âŒ ExecuÃ§Ã£o cancelada')
        return true
      } else {
        setError(response.error || 'Erro ao cancelar execuÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao cancelar execuÃ§Ã£o:', err)
      setError('Erro ao cancelar execuÃ§Ã£o')
      return false
    }
  }

  // =====================================================
  // EDIÃ‡ÃƒO DE RESPOSTAS
  // =====================================================

  const atualizarResposta = useCallback((secaoIndex: number, itemIndex: number, valor: any, anexos?: any[]) => {
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

  const adicionarAnexo = useCallback((secaoIndex: number, itemIndex: number, anexo: any) => {
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
        
        // Marcar como respondido se tinha anexo obrigatÃ³rio
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
        
        // Se nÃ£o tem mais anexos e Ã© campo de anexo obrigatÃ³rio, marcar como nÃ£o respondido
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
  // UTILITÃRIOS
  // =====================================================

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev)
  }, [])

  // Calcular se tem alteraÃ§Ãµes pendentes
  const temAlteracoesPendentes = useMemo(() => {
    if (!execucao || !execucaoOriginal) return false
    return JSON.stringify(execucao.respostas) !== JSON.stringify(execucaoOriginal.respostas)
  }, [execucao, execucaoOriginal])

  // Verificar se pode ser finalizada
  const podeSerFinalizada = useMemo(() => {
    return validacao?.pode_finalizar ?? false
  }, [validacao])

  // Encontrar prÃ³ximo item pendente
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

  // NavegaÃ§Ã£o
  const irParaProximoItem = useCallback(() => {
    // Implementar lÃ³gica de navegaÃ§Ã£o
    console.log('Ir para prÃ³ximo item')
  }, [])

  const irParaItemAnterior = useCallback(() => {
    // Implementar lÃ³gica de navegaÃ§Ã£o
    console.log('Ir para item anterior')
  }, [])

  const irParaSecao = useCallback((secaoIndex: number) => {
    // Implementar lÃ³gica de navegaÃ§Ã£o
    console.log(`Ir para seÃ§Ã£o ${secaoIndex}`)
  }, [])

  return {
    // Estados
    execucao,
    loading,
    saving,
    finalizing,
    error,
    autoSaveEnabled,
    
    // AÃ§Ãµes principais
    iniciarExecucao,
    carregarExecucao,
    salvarRespostas,
    finalizarExecucao,
    cancelarExecucao,
    
    // EdiÃ§Ã£o de respostas
    atualizarResposta,
    adicionarAnexo,
    removerAnexo,
    
    // UtilitÃ¡rios
    validacao,
    podeSerFinalizada,
    temAlteracoesPendentes,
    proximoItemPendente,
    
    // Auto-save
    toggleAutoSave,
    
    // NavegaÃ§Ã£o
    irParaProximoItem,
    irParaItemAnterior,
    irParaSecao
  }
}

// =====================================================
// FUNÃ‡Ã•ES UTILITÃRIAS
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // ImplementaÃ§Ã£o simplificada do useMemo
  return factory()
}

function validarExecucao(execucao: ExecucaoData): ValidacaoExecucao {
  const erros: string[] = []
  let camposObrigatoriosVazios = 0
  
  if (!execucao.respostas?.secoes) {
    return {
      valido: false,
      erros: ['Estrutura de respostas invÃ¡lida'],
      campos_obrigatorios_vazios: 0,
      pode_continuar: false,
      pode_finalizar: false
    }
  }
  
  execucao.respostas.secoes.forEach((secao, secaoIndex) => {
    secao.itens.forEach((item, itemIndex) => {
      if (item.obrigatorio && !item.respondido) {
        erros.push(`Campo obrigatÃ³rio "${item.titulo}" nÃ£o foi preenchido`)
        camposObrigatoriosVazios++
      }
      
      // Validar anexos obrigatÃ³rios
      if (item.obrigatorio && ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo)) {
        if (!item.anexos || item.anexos.length === 0) {
          erros.push(`Anexo obrigatÃ³rio "${item.titulo}" nÃ£o foi fornecido`)
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
    tempo_decorrido: 0 // SerÃ¡ calculado pelo frontend
  }
}

// =====================================================
// HOOK PARA LISTA DE EXECUÃ‡Ã•ES
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
        setError(response.error || 'Erro ao carregar execuÃ§Ãµes')
      }
    } catch (err: any) {
      console.error('Erro ao carregar execuÃ§Ãµes:', err)
      setError('Erro ao carregar execuÃ§Ãµes')
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
