import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface Template {
  id: string
  nome: string
  descricao?: string
  categoria: 'checklist' | 'produtividade' | 'compliance' | 'custom'
  modulo: string
  tipo_relatorio: 'tabular' | 'dashboard' | 'grafico' | 'calendario'
  configuracao_sql: string
  configuracao_campos: Record<string, any>
  configuracao_filtros: Record<string, any>
  configuracao_visual?: Record<string, any>
  formatos_suportados: string[]
  template_pdf?: string
  configuracao_excel?: Record<string, any>
  publico: boolean
  roles_permitidas: string[]
  criado_por?: string
  criado_em: string
  atualizado_em: string
  ativo: boolean
  criado_por_usuario?: {
    nome: string
    email: string
  }
}

interface RelatorioPersonalizado {
  id: string
  bar_id: string
  nome: string
  descricao?: string
  template_base_id: string
  criado_por: string
  compartilhado_com?: any
  filtros_salvos: Record<string, any>
  campos_selecionados: string[]
  configuracao_visual?: Record<string, any>
  agendamento_ativo: boolean
  agendamento_frequencia?: string
  agendamento_configuracao?: any
  proximo_agendamento?: string
  notificar_conclusao: boolean
  notificar_usuarios?: any
  criado_em: string
  atualizado_em: string
  ativo: boolean
}

interface Execucao {
  id: string
  bar_id: string
  relatorio_personalizado_id?: string
  template_id?: string
  solicitado_por: string
  tipo_execucao: 'manual' | 'agendada' | 'api'
  filtros_aplicados: Record<string, any>
  campos_selecionados: string[]
  formato_exportacao: 'pdf' | 'excel' | 'csv'
  status: 'pendente' | 'processando' | 'concluido' | 'erro'
  iniciado_em: string
  concluido_em?: string
  total_registros?: number
  tempo_execucao_ms?: number
  tamanho_arquivo_kb?: number
  arquivo_url?: string
  dados_cache?: any[]
  erro_detalhes?: string
  tentativas: number
  notificacao_enviada: boolean
  notificacao_id?: string
  expires_at: string
  
  // Relacionamentos
  template?: {
    nome: string
    categoria: string
    tipo_relatorio: string
  }
  solicitado_por_usuario?: {
    nome: string
    email: string
  }
}

interface FiltrosTemplates {
  categoria?: string
  modulo?: string
  tipo_relatorio?: string
  publico?: boolean
  busca?: string
  page?: number
  limit?: number
}

interface FiltrosExecucoes {
  status?: 'pendente' | 'processando' | 'concluido' | 'erro'
  formato?: string
  data_inicio?: string
  data_fim?: string
  template_id?: string
  page?: number
  limit?: number
}

interface NovoTemplate {
  nome: string
  descricao?: string
  categoria: 'checklist' | 'produtividade' | 'compliance' | 'custom'
  modulo?: string
  tipo_relatorio: 'tabular' | 'dashboard' | 'grafico' | 'calendario'
  configuracao_sql: string
  configuracao_campos: Record<string, any>
  configuracao_filtros: Record<string, any>
  configuracao_visual?: Record<string, any>
  formatos_suportados?: string[]
  template_pdf?: string
  configuracao_excel?: Record<string, any>
  publico?: boolean
  roles_permitidas?: string[]
}

interface ExecutarRelatorio {
  template_id: string
  formato?: 'pdf' | 'excel' | 'csv'
  filtros?: Record<string, any>
  campos_selecionados?: string[]
  notificar_conclusao?: boolean
  salvar_como_personalizado?: boolean
  nome_personalizado?: string
}

interface UseReportsResult {
  // Estados principais
  templates: Template[]
  execucoes: Execucao[]
  relatoriosPersonalizados: RelatorioPersonalizado[]
  templateAtual: Template | null
  execucaoAtual: Execucao | null
  
  // Estados de carregamento
  loading: boolean
  loadingTemplates: boolean
  loadingExecucoes: boolean
  executing: boolean
  creating: boolean
  error: string | null
  
  // Dados auxiliares
  estatisticasTemplates: any
  estatisticasExecucoes: any
  paginacaoTemplates: any
  paginacaoExecucoes: any
  
  // AÃ§Ãµes para templates
  carregarTemplates: (filtros?: FiltrosTemplates) => Promise<void>
  carregarTemplate: (id: string) => Promise<void>
  criarTemplate: (dados: NovoTemplate) => Promise<boolean>
  atualizarTemplate: (id: string, dados: Partial<NovoTemplate>) => Promise<boolean>
  excluirTemplate: (id: string) => Promise<boolean>
  
  // AÃ§Ãµes para execuÃ§Ãµes
  carregarExecucoes: (filtros?: FiltrosExecucoes) => Promise<void>
  carregarExecucao: (id: string) => Promise<void>
  executarRelatorio: (dados: ExecutarRelatorio) => Promise<string | null>
  cancelarExecucao: (id: string) => Promise<boolean>
  baixarRelatorio: (execucaoId: string) => Promise<void>
  
  // AÃ§Ãµes para relatÃ³rios personalizados
  carregarRelatoriosPersonalizados: () => Promise<void>
  salvarRelatorioPersonalizado: (dados: any) => Promise<boolean>
  excluirRelatorioPersonalizado: (id: string) => Promise<boolean>
  
  // UtilitÃ¡rios
  obterTemplatesPorCategoria: (categoria: string) => Template[]
  formatarDadosParaExportacao: (dados: any[], template: Template) => any[]
  validarFiltrosTemplate: (template: Template, filtros: Record<string, any>) => { valido: boolean, erros: string[] }
  recarregar: () => Promise<void>
  limparErro: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useReports(): UseReportsResult {
  const [templates, setTemplates] = useState<Template[]>([])
  const [execucoes, setExecucoes] = useState<Execucao[]>([])
  const [relatoriosPersonalizados, setRelatoriosPersonalizados] = useState<RelatorioPersonalizado[]>([])
  const [templateAtual, setTemplateAtual] = useState<Template | null>(null)
  const [execucaoAtual, setExecucaoAtual] = useState<Execucao | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadingExecucoes, setLoadingExecucoes] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [estatisticasTemplates, setEstatisticasTemplates] = useState(null)
  const [estatisticasExecucoes, setEstatisticasExecucoes] = useState(null)
  const [paginacaoTemplates, setPaginacaoTemplates] = useState(null)
  const [paginacaoExecucoes, setPaginacaoExecucoes] = useState(null)

  // =====================================================
  // AÃ‡Ã•ES PARA TEMPLATES
  // =====================================================

  const carregarTemplates = useCallback(async (filtros: FiltrosTemplates = {}) => {
    try {
      setLoadingTemplates(true)
      setError(null)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/api/reports/templates?${params.toString()}`)

      if (response.success) {
        setTemplates(response.data.templates || [])
        setEstatisticasTemplates(response.data.estatisticas)
        setPaginacaoTemplates(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar templates')
      }
    } catch (err: any) {
      console.error('Erro ao carregar templates:', err)
      setError('Erro ao carregar templates')
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  const carregarTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/api/reports/templates/${id}`)

      if (response.success) {
        setTemplateAtual(response.data)
      } else {
        setError(response.error || 'Erro ao carregar template')
      }
    } catch (err: any) {
      console.error('Erro ao carregar template:', err)
      setError('Erro ao carregar template')
    } finally {
      setLoading(false)
    }
  }, [])

  const criarTemplate = useCallback(async (dados: NovoTemplate): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)

      const response = await api.post('/api/reports/templates', dados)

      if (response.success) {
        console.log('ðŸ“Š Template criado com sucesso!')
        await carregarTemplates()
        return true
      } else {
        setError(response.error || 'Erro ao criar template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao criar template:', err)
      setError('Erro ao criar template')
      return false
    } finally {
      setCreating(false)
    }
  }, [carregarTemplates])

  const atualizarTemplate = useCallback(async (id: string, dados: Partial<NovoTemplate>): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.put(`/api/reports/templates/${id}`, dados)

      if (response.success) {
        console.log('ðŸ“Š Template atualizado com sucesso!')
        await carregarTemplates()
        if (templateAtual?.id === id) {
          await carregarTemplate(id)
        }
        return true
      } else {
        setError(response.error || 'Erro ao atualizar template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao atualizar template:', err)
      setError('Erro ao atualizar template')
      return false
    } finally {
      setLoading(false)
    }
  }, [carregarTemplates, carregarTemplate, templateAtual])

  const excluirTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.delete(`/api/reports/templates/${id}`)

      if (response.success) {
        console.log('ðŸ—‘ï¸ Template excluÃ­do com sucesso!')
        setTemplates(prev => prev.filter((t: any) => t.id !== id))
        if (templateAtual?.id === id) {
          setTemplateAtual(null)
        }
        return true
      } else {
        setError(response.error || 'Erro ao excluir template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao excluir template:', err)
      setError('Erro ao excluir template')
      return false
    } finally {
      setLoading(false)
    }
  }, [templateAtual])

  // =====================================================
  // AÃ‡Ã•ES PARA EXECUÃ‡Ã•ES
  // =====================================================

  const carregarExecucoes = useCallback(async (filtros: FiltrosExecucoes = {}) => {
    try {
      setLoadingExecucoes(true)
      setError(null)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/api/reports/execute?${params.toString()}`)

      if (response.success) {
        setExecucoes(response.data.execucoes || [])
        setEstatisticasExecucoes(response.data.estatisticas)
        setPaginacaoExecucoes(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar execuÃ§Ãµes')
      }
    } catch (err: any) {
      console.error('Erro ao carregar execuÃ§Ãµes:', err)
      setError('Erro ao carregar execuÃ§Ãµes')
    } finally {
      setLoadingExecucoes(false)
    }
  }, [])

  const carregarExecucao = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/api/reports/execute/${id}`)

      if (response.success) {
        setExecucaoAtual(response.data)
      } else {
        setError(response.error || 'Erro ao carregar execuÃ§Ã£o')
      }
    } catch (err: any) {
      console.error('Erro ao carregar execuÃ§Ã£o:', err)
      setError('Erro ao carregar execuÃ§Ã£o')
    } finally {
      setLoading(false)
    }
  }, [])

  const executarRelatorio = useCallback(async (dados: ExecutarRelatorio): Promise<string | null> => {
    try {
      setExecuting(true)
      setError(null)

      const response = await api.post('/api/reports/execute', dados)

      if (response.success) {
        console.log('ðŸš€ RelatÃ³rio enviado para processamento!')
        
        // Recarregar execuÃ§Ãµes para mostrar a nova
        await carregarExecucoes()
        
        return response.data.execucao_id
      } else {
        setError(response.error || 'Erro ao executar relatÃ³rio')
        return null
      }
    } catch (err: any) {
      console.error('Erro ao executar relatÃ³rio:', err)
      setError('Erro ao executar relatÃ³rio')
      return null
    } finally {
      setExecuting(false)
    }
  }, [carregarExecucoes])

  const cancelarExecucao = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.put(`/api/reports/execute/${id}`, { action: 'cancel' })

      if (response.success) {
        console.log('â¹ï¸ ExecuÃ§Ã£o cancelada!')
        await carregarExecucoes()
        return true
      } else {
        setError(response.error || 'Erro ao cancelar execuÃ§Ã£o')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao cancelar execuÃ§Ã£o:', err)
      setError('Erro ao cancelar execuÃ§Ã£o')
      return false
    } finally {
      setLoading(false)
    }
  }, [carregarExecucoes])

  const baixarRelatorio = useCallback(async (execucaoId: string) => {
    try {
      const execucao = execucoes.find((e: any) => e.id === execucaoId)
      if (!execucao || !execucao.arquivo_url) {
        setError('Arquivo do relatÃ³rio nÃ£o encontrado')
        return
      }

      // Simular download (em produÃ§Ã£o seria redirect ou fetch do arquivo)
      const link = document.createElement('a')
      link.href = execucao.arquivo_url
      link.download = `relatorio_${execucao.template?.nome?.toLowerCase().replace(/\s+/g, '_')}.${execucao.formato_exportacao}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log(`ðŸ“¥ Download iniciado: ${execucao.template?.nome}`)

    } catch (err: any) {
      console.error('Erro ao baixar relatÃ³rio:', err)
      setError('Erro ao baixar relatÃ³rio')
    }
  }, [execucoes])

  // =====================================================
  // AÃ‡Ã•ES PARA RELATÃ“RIOS PERSONALIZADOS
  // =====================================================

  const carregarRelatoriosPersonalizados = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get('/api/reports/personalized')

      if (response.success) {
        setRelatoriosPersonalizados(response.data.relatorios || [])
      } else {
        setError(response.error || 'Erro ao carregar relatÃ³rios personalizados')
      }
    } catch (err: any) {
      console.error('Erro ao carregar relatÃ³rios personalizados:', err)
      setError('Erro ao carregar relatÃ³rios personalizados')
    } finally {
      setLoading(false)
    }
  }, [])

  const salvarRelatorioPersonalizado = useCallback(async (dados: any): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)

      const response = await api.post('/api/reports/personalized', dados)

      if (response.success) {
        console.log('ðŸ’¾ RelatÃ³rio personalizado salvo!')
        await carregarRelatoriosPersonalizados()
        return true
      } else {
        setError(response.error || 'Erro ao salvar relatÃ³rio personalizado')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao salvar relatÃ³rio personalizado:', err)
      setError('Erro ao salvar relatÃ³rio personalizado')
      return false
    } finally {
      setCreating(false)
    }
  }, [carregarRelatoriosPersonalizados])

  const excluirRelatorioPersonalizado = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.delete(`/api/reports/personalized/${id}`)

      if (response.success) {
        console.log('ðŸ—‘ï¸ RelatÃ³rio personalizado excluÃ­do!')
        setRelatoriosPersonalizados(prev => prev.filter((r: any) => r.id !== id))
        return true
      } else {
        setError(response.error || 'Erro ao excluir relatÃ³rio personalizado')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao excluir relatÃ³rio personalizado:', err)
      setError('Erro ao excluir relatÃ³rio personalizado')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // =====================================================
  // UTILITÃRIOS
  // =====================================================

  const obterTemplatesPorCategoria = useCallback((categoria: string): Template[] => {
    return templates.filter((t: any) => t.categoria === categoria && t.ativo)
  }, [templates])

  const formatarDadosParaExportacao = useCallback((dados: any[], template: Template): any[] => {
    const campos = template.configuracao_campos || {}
    
    return dados.map((item: any) => {
      const itemFormatado: any = {}
      
      Object.entries(campos).forEach(([campo, config]: [string, any]) => {
        const valor = item[campo]
        
        switch (config.tipo) {
          case 'percentual':
            itemFormatado[config.label || campo] = `${valor}%`
            break
          case 'numero':
            itemFormatado[config.label || campo] = config.decimais ? 
              parseFloat(valor).toFixed(config.decimais) : parseInt(valor)
            break
          case 'data_hora':
            itemFormatado[config.label || campo] = valor ? 
              new Date(valor).toLocaleString('pt-BR') : ''
            break
          default:
            itemFormatado[config.label || campo] = valor || ''
        }
      })
      
      return itemFormatado
    })
  }, [])

  const validarFiltrosTemplate = useCallback((template: Template, filtros: Record<string, any>): { valido: boolean, erros: string[] } => {
    const erros: string[] = []
    const configFiltros = template.configuracao_filtros || {}
    
    Object.entries(configFiltros).forEach(([filtro, config]: [string, any]) => {
      if (config.obrigatorio && (!filtros[filtro] || filtros[filtro] === '')) {
        erros.push(`${config.label || filtro} Ã© obrigatÃ³rio`)
      }
      
      if (config.tipo === 'data' && filtros[filtro]) {
        const data = new Date(filtros[filtro])
        if (isNaN(data.getTime())) {
          erros.push(`${config.label || filtro} deve ser uma data vÃ¡lida`)
        }
      }
      
      if (config.tipo === 'numero' && filtros[filtro]) {
        const numero = parseFloat(filtros[filtro])
        if (isNaN(numero)) {
          erros.push(`${config.label || filtro} deve ser um nÃºmero vÃ¡lido`)
        }
      }
    })
    
    return { valido: erros.length === 0, erros }
  }, [])

  const recarregar = useCallback(async () => {
    await Promise.all([
      carregarTemplates(),
      carregarExecucoes(),
      carregarRelatoriosPersonalizados()
    ])
  }, [carregarTemplates, carregarExecucoes, carregarRelatoriosPersonalizados])

  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Estados principais
    templates,
    execucoes,
    relatoriosPersonalizados,
    templateAtual,
    execucaoAtual,
    
    // Estados de carregamento
    loading,
    loadingTemplates,
    loadingExecucoes,
    executing,
    creating,
    error,
    
    // Dados auxiliares
    estatisticasTemplates,
    estatisticasExecucoes,
    paginacaoTemplates,
    paginacaoExecucoes,
    
    // AÃ§Ãµes para templates
    carregarTemplates,
    carregarTemplate,
    criarTemplate,
    atualizarTemplate,
    excluirTemplate,
    
    // AÃ§Ãµes para execuÃ§Ãµes
    carregarExecucoes,
    carregarExecucao,
    executarRelatorio,
    cancelarExecucao,
    baixarRelatorio,
    
    // AÃ§Ãµes para relatÃ³rios personalizados
    carregarRelatoriosPersonalizados,
    salvarRelatorioPersonalizado,
    excluirRelatorioPersonalizado,
    
    // UtilitÃ¡rios
    obterTemplatesPorCategoria,
    formatarDadosParaExportacao,
    validarFiltrosTemplate,
    recarregar,
    limparErro
  }
}

// =====================================================
// HOOKS ESPECIALIZADOS
// =====================================================

export function useReportTemplates() {
  const {
    templates,
    templateAtual,
    loadingTemplates,
    creating,
    error,
    estatisticasTemplates,
    carregarTemplates,
    carregarTemplate,
    criarTemplate,
    atualizarTemplate,
    excluirTemplate,
    obterTemplatesPorCategoria,
    limparErro
  } = useReports()

  return {
    templates,
    templateAtual,
    loading: loadingTemplates,
    creating,
    error,
    estatisticas: estatisticasTemplates,
    carregar: carregarTemplates,
    carregarPorId: carregarTemplate,
    criar: criarTemplate,
    atualizar: atualizarTemplate,
    excluir: excluirTemplate,
    porCategoria: obterTemplatesPorCategoria,
    limparErro
  }
}

export function useReportExecutions() {
  const {
    execucoes,
    execucaoAtual,
    loadingExecucoes,
    executing,
    error,
    estatisticasExecucoes,
    carregarExecucoes,
    carregarExecucao,
    executarRelatorio,
    cancelarExecucao,
    baixarRelatorio,
    limparErro
  } = useReports()

  return {
    execucoes,
    execucaoAtual,
    loading: loadingExecucoes,
    executing,
    error,
    estatisticas: estatisticasExecucoes,
    carregar: carregarExecucoes,
    carregarPorId: carregarExecucao,
    executar: executarRelatorio,
    cancelar: cancelarExecucao,
    baixar: baixarRelatorio,
    limparErro
  }
}

// =====================================================
// UTILITÃRIOS EXPORTADOS
// =====================================================

export function formatarStatusExecucao(status: string): { label: string, cor: string, icone: string } {
  switch (status) {
    case 'pendente':
      return { label: 'Pendente', cor: 'gray', icone: 'Clock' }
    case 'processando':
      return { label: 'Processando', cor: 'blue', icone: 'Loader' }
    case 'concluido':
      return { label: 'ConcluÃ­do', cor: 'green', icone: 'CheckCircle' }
    case 'erro':
      return { label: 'Erro', cor: 'red', icone: 'XCircle' }
    default:
      return { label: status, cor: 'gray', icone: 'Circle' }
  }
}

export function formatarTamanhoArquivo(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${(kb / (1024 * 1024)).toFixed(1)} GB`
}

export function formatarTempoExecucao(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60000)}min`
} 
