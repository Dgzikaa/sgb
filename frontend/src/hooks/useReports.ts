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

﻿import { useState, useEffect, useCallback } from 'react'
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
  configuracao_campos: Record<string, unknown>
  configuracao_filtros: Record<string, unknown>
  configuracao_visual?: Record<string, unknown>
  formatos_suportados: string[]
  template_pdf?: string
  configuracao_excel?: Record<string, unknown>
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
  compartilhado_com?: unknown
  filtros_salvos: Record<string, unknown>
  campos_selecionados: string[]
  configuracao_visual?: Record<string, unknown>
  agendamento_ativo: boolean
  agendamento_frequencia?: string
  agendamento_configuracao?: unknown
  proximo_agendamento?: string
  notificar_conclusao: boolean
  notificar_usuarios?: unknown
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
  filtros_aplicados: Record<string, unknown>
  campos_selecionados: string[]
  formato_exportacao: 'pdf' | 'excel' | 'csv'
  status: 'pendente' | 'processando' | 'concluido' | 'erro' | 'cancelado'
  iniciado_em: string
  concluido_em?: string
  total_registros?: number
  tempo_execucao_ms?: number
  tamanho_arquivo_kb?: number
  arquivo_url?: string
  dados_cache?: unknown[]
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
  configuracao_campos: Record<string, unknown>
  configuracao_filtros: Record<string, unknown>
  configuracao_visual?: Record<string, unknown>
  formatos_suportados?: string[]
  template_pdf?: string
  configuracao_excel?: Record<string, unknown>
  publico?: boolean
  roles_permitidas?: string[]
}

interface ExecutarRelatorio {
  template_id: string
  formato?: 'pdf' | 'excel' | 'csv'
  filtros?: Record<string, unknown>
  campos_selecionados?: string[]
  notificar_conclusao?: boolean
  salvar_como_personalizado?: boolean
  nome_personalizado?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface ConfiguracaoFiltro {
  obrigatorio?: boolean
  tipo?: string
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
  estatisticasTemplates: EstatisticasTemplates | null;
  estatisticasExecucoes: EstatisticasExecucoes | null;
  paginacaoTemplates: Paginacao | null;
  paginacaoExecucoes: Paginacao | null;
  
  // Ações para templates
  carregarTemplates: (filtros?: FiltrosTemplates) => Promise<void>
  carregarTemplate: (id: string) => Promise<void>
  criarTemplate: (dados: NovoTemplate) => Promise<boolean>
  atualizarTemplate: (id: string, dados: Partial<NovoTemplate>) => Promise<boolean>
  excluirTemplate: (id: string) => Promise<boolean>
  
  // Ações para execuções
  carregarExecucoes: (filtros?: FiltrosExecucoes) => Promise<void>
  carregarExecucao: (id: string) => Promise<void>
  executarRelatorio: (dados: ExecutarRelatorio) => Promise<string | null>
  cancelarExecucao: (id: string) => Promise<boolean>
  baixarRelatorio: (execucaoId: string) => Promise<void>
  
  // Ações para relatórios personalizados
  carregarRelatoriosPersonalizados: () => Promise<void>
  salvarRelatorioPersonalizado: (dados: Record<string, unknown>) => Promise<boolean>
  excluirRelatorioPersonalizado: (id: string) => Promise<boolean>
  
  // Utilitários
  obterTemplatesPorCategoria: (categoria: string) => Template[];
  formatarDadosParaExportacao: (dados: unknown[], template: Template) => unknown[];
  validarFiltrosTemplate: (template: Template, filtros: Record<string, unknown>) => { valido: boolean; erros: string[] };
  recarregar: () => Promise<void>;
  limparErro: () => void;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

// Interfaces auxiliares para estatísticas e paginação
interface EstatisticasTemplates {
  total: number;
  ativos: number;
  publicos: number;
  privados: number;
  [key: string]: number;
}

interface EstatisticasExecucoes {
  total: number;
  concluidas: number;
  pendentes: number;
  erro: number;
  [key: string]: number;
}

interface Paginacao {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useReports(): UseReportsResult {
  // Estados principais
  const [templates, setTemplates] = useState<Template[]>([])
  const [execucoes, setExecucoes] = useState<Execucao[]>([])
  const [relatoriosPersonalizados, setRelatoriosPersonalizados] = useState<RelatorioPersonalizado[]>([])
  const [templateAtual, setTemplateAtual] = useState<Template | null>(null)
  const [execucaoAtual, setExecucaoAtual] = useState<Execucao | null>(null)
  
  // Estados de carregamento
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadingExecucoes, setLoadingExecucoes] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dados auxiliares
  const [estatisticasTemplates, setEstatisticasTemplates] = useState<EstatisticasTemplates | null>(null)
  const [estatisticasExecucoes, setEstatisticasExecucoes] = useState<EstatisticasExecucoes | null>(null)
  const [paginacaoTemplates, setPaginacaoTemplates] = useState<Paginacao | null>(null)
  const [paginacaoExecucoes, setPaginacaoExecucoes] = useState<Paginacao | null>(null)

  // =====================================================
  // AÇÕES PARA TEMPLATES
  // =====================================================

  const carregarTemplates = useCallback(async (filtros?: FiltrosTemplates) => {
    try {
      setLoadingTemplates(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await api.get(`/api/templates?${params.toString()}`) as ApiResponse<{
        templates: Template[]
        estatisticas: EstatisticasTemplates
        paginacao: Paginacao
      }>
      
      if (response.success && response.data) {
        setTemplates(response.data.templates)
        setEstatisticasTemplates(response.data.estatisticas)
        setPaginacaoTemplates(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar templates')
      }
    } catch (err) {
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
      
      const response = await api.get(`/api/templates/${id}`) as ApiResponse<Template>
      
      if (response.success && response.data) {
        setTemplateAtual(response.data)
      } else {
        setError(response.error || 'Erro ao carregar template')
      }
    } catch (err) {
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
      
      const response = await api.post('/api/templates', dados) as ApiResponse<Template>
      
      if (response.success && response.data) {
        setTemplates(prev => [...prev, response.data!])
        return true
      } else {
        setError(response.error || 'Erro ao criar template')
        return false
      }
    } catch (err) {
      console.error('Erro ao criar template:', err)
      setError('Erro ao criar template')
      return false
    } finally {
      setCreating(false)
    }
  }, [])

  const atualizarTemplate = useCallback(async (id: string, dados: Partial<NovoTemplate>): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)
      
      const response = await api.put(`/api/templates/${id}`, dados) as ApiResponse<Template>
      
      if (response.success && response.data) {
        setTemplates(prev => prev.map(t => t.id === id ? response.data! : t))
        if (templateAtual?.id === id) {
          setTemplateAtual(response.data)
        }
        return true
      } else {
        setError(response.error || 'Erro ao atualizar template')
        return false
      }
    } catch (err) {
      console.error('Erro ao atualizar template:', err)
      setError('Erro ao atualizar template')
      return false
    } finally {
      setCreating(false)
    }
  }, [templateAtual])

  const excluirTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.delete(`/api/templates/${id}`) as ApiResponse<{ success: boolean }>
      
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        if (templateAtual?.id === id) {
          setTemplateAtual(null)
        }
        return true
      } else {
        setError(response.error || 'Erro ao excluir template')
        return false
      }
    } catch (err) {
      console.error('Erro ao excluir template:', err)
      setError('Erro ao excluir template')
      return false
    } finally {
      setLoading(false)
    }
  }, [templateAtual])

  // =====================================================
  // AÇÕES PARA EXECUÇÕES
  // =====================================================

  const carregarExecucoes = useCallback(async (filtros?: FiltrosExecucoes) => {
    try {
      setLoadingExecucoes(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await api.get(`/api/reports/execucoes?${params.toString()}`) as ApiResponse<{
        execucoes: Execucao[]
        estatisticas: EstatisticasExecucoes
        paginacao: Paginacao
      }>
      
      if (response.success && response.data) {
        setExecucoes(response.data.execucoes)
        setEstatisticasExecucoes(response.data.estatisticas)
        setPaginacaoExecucoes(response.data.paginacao)
      } else {
        setError(response.error || 'Erro ao carregar execuções')
      }
    } catch (err) {
      console.error('Erro ao carregar execuções:', err)
      setError('Erro ao carregar execuções')
    } finally {
      setLoadingExecucoes(false)
    }
  }, [])

  const carregarExecucao = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/api/reports/execucoes/${id}`) as ApiResponse<Execucao>
      
      if (response.success && response.data) {
        setExecucaoAtual(response.data)
      } else {
        setError(response.error || 'Erro ao carregar execução')
      }
    } catch (err) {
      console.error('Erro ao carregar execução:', err)
      setError('Erro ao carregar execução')
    } finally {
      setLoading(false)
    }
  }, [])

  const executarRelatorio = useCallback(async (dados: ExecutarRelatorio): Promise<string | null> => {
    try {
      setExecuting(true)
      setError(null)
      
      const response = await api.post('/api/reports/executar', dados) as ApiResponse<{ execucao_id: string }>
      
      if (response.success && response.data) {
        return response.data.execucao_id
      } else {
        setError(response.error || 'Erro ao executar relatório')
        return null
      }
    } catch (err) {
      console.error('Erro ao executar relatório:', err)
      setError('Erro ao executar relatório')
      return null
    } finally {
      setExecuting(false)
    }
  }, [])

  const cancelarExecucao = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.put(`/api/reports/execucoes/${id}/cancelar`) as ApiResponse<{ success: boolean }>
      
      if (response.success) {
        setExecucoes(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelado' as const } : e))
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
  }, [])

  const baixarRelatorio = useCallback(async (execucaoId: string) => {
    try {
      const response = await fetch(`/api/reports/execucoes/${execucaoId}/download`)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${execucaoId}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      if (document.body.contains(a)) {
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Erro ao baixar relatório:', err)
      setError('Erro ao baixar relatório')
    }
  }, [setError])

  // =====================================================
  // AÇÕES PARA RELATÓRIOS PERSONALIZADOS
  // =====================================================

  const carregarRelatoriosPersonalizados = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/api/reports/personalizados') as ApiResponse<RelatorioPersonalizado[]>
      
      if (response.success && response.data) {
        setRelatoriosPersonalizados(response.data)
      } else {
        setError(response.error || 'Erro ao carregar relatórios personalizados')
      }
    } catch (err) {
      console.error('Erro ao carregar relatórios personalizados:', err)
      setError('Erro ao carregar relatórios personalizados')
    } finally {
      setLoading(false)
    }
  }, [])

  const salvarRelatorioPersonalizado = useCallback(async (dados: Record<string, unknown>): Promise<boolean> => {
    try {
      setCreating(true)
      setError(null)
      
      const response = await api.post('/api/reports/personalizados', dados) as ApiResponse<RelatorioPersonalizado>
      
      if (response.success && response.data) {
        setRelatoriosPersonalizados(prev => [...prev, response.data!])
        return true
      } else {
        setError(response.error || 'Erro ao salvar relatório personalizado')
        return false
      }
    } catch (err) {
      console.error('Erro ao salvar relatório personalizado:', err)
      setError('Erro ao salvar relatório personalizado')
      return false
    } finally {
      setCreating(false)
    }
  }, [])

  const excluirRelatorioPersonalizado = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.delete(`/api/reports/personalizados/${id}`) as ApiResponse<{ success: boolean }>
      
      if (response.success) {
        setRelatoriosPersonalizados(prev => prev.filter(r => r.id !== id))
        return true
      } else {
        setError(response.error || 'Erro ao excluir relatório personalizado')
        return false
      }
    } catch (err) {
      console.error('Erro ao excluir relatório personalizado:', err)
      setError('Erro ao excluir relatório personalizado')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const obterTemplatesPorCategoria = useCallback((categoria: string): Template[] => {
    return templates.filter(t => t.categoria === categoria)
  }, [templates])

  const formatarDadosParaExportacao = useCallback((dados: unknown[], template: Template): unknown[] => {
    // Implementação da formatação de dados
    return dados
  }, [])

  const validarFiltrosTemplate = useCallback((template: Template, filtros: Record<string, unknown>): { valido: boolean; erros: string[] } => {
    const erros: string[] = []
    
    // Validação básica dos filtros
    if (template.configuracao_filtros) {
      Object.entries(template.configuracao_filtros).forEach(([key, config]) => {
        const configTyped = config as ConfiguracaoFiltro
        if (configTyped.obrigatorio && !filtros[key]) {
          erros.push(`Filtro obrigatório não informado: ${key}`)
        }
      })
    }
    
    return {
      valido: erros.length === 0,
      erros
    }
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

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    void recarregar()
  }, [recarregar])

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
    
    // Ações para templates
    carregarTemplates,
    carregarTemplate,
    criarTemplate,
    atualizarTemplate,
    excluirTemplate,
    
    // Ações para execuções
    carregarExecucoes,
    carregarExecucao,
    executarRelatorio,
    cancelarExecucao,
    baixarRelatorio,
    
    // Ações para relatórios personalizados
    carregarRelatoriosPersonalizados,
    salvarRelatorioPersonalizado,
    excluirRelatorioPersonalizado,
    
    // Utilitários
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
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarTemplates = useCallback(async (filtros?: FiltrosTemplates) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await api.get(`/api/templates?${params.toString()}`) as ApiResponse<{ templates: Template[] }>
      
      if (response.success && response.data) {
        setTemplates(response.data.templates)
      } else {
        setError(response.error || 'Erro ao carregar templates')
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
      setError('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    templates,
    loading,
    error,
    carregarTemplates
  }
}

export function useReportExecutions() {
  const [execucoes, setExecucoes] = useState<Execucao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarExecucoes = useCallback(async (filtros?: FiltrosExecucoes) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await api.get(`/api/reports/execucoes?${params.toString()}`) as ApiResponse<{ execucoes: Execucao[] }>
      
      if (response.success && response.data) {
        setExecucoes(response.data.execucoes)
      } else {
        setError(response.error || 'Erro ao carregar execuções')
      }
    } catch (err) {
      console.error('Erro ao carregar execuções:', err)
      setError('Erro ao carregar execuções')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    execucoes,
    loading,
    error,
    carregarExecucoes
  }
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

export function formatarStatusExecucao(status: string): { label: string, cor: string, icone: string } {
  const statusMap: Record<string, { label: string, cor: string, icone: string }> = {
    pendente: { label: 'Pendente', cor: 'text-yellow-600', icone: '⏳' },
    processando: { label: 'Processando', cor: 'text-blue-600', icone: '🔄' },
    concluido: { label: 'Concluído', cor: 'text-green-600', icone: '✅' },
    erro: { label: 'Erro', cor: 'text-red-600', icone: '❌' }
  }
  
  return statusMap[status] || { label: 'Desconhecido', cor: 'text-gray-600', icone: '❓' }
}

export function formatarTamanhoArquivo(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${(kb / (1024 * 1024)).toFixed(1)} GB`
}

export function formatarTempoExecucao(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
} 

