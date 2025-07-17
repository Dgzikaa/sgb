import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface Template {
  id: string
  nome: string
  descricao?: string
  categoria: string
  setor: string
  tipo: string
  frequencia: string
  tempo_estimado: number
  publico: boolean
  predefinido: boolean
  criado_em: string
  tags: string[]
  criado_por: {
    nome: string
    email: string
  }
  template_tags?: Array<{
    template_tags: {
      nome: string
      cor: string
    }
  }>
  estatisticas?: {
    total_usos: number
    usos_completados: number
    usos_em_andamento: number
  }
  estrutura?: {
    secoes: Array<{
      nome: string
      descricao?: string
      cor: string
      ordem: number
      itens: Array<{
        titulo: string
        descricao?: string
        tipo: string
        obrigatorio: boolean
        ordem: number
        opcoes?: Record<string, any>
        validacao?: Record<string, any>
      }>
    }>
  }
}

interface Estatisticas {
  total: number
  por_categoria: Record<string, number>
  publicos: number
  predefinidos: number
}

interface TemplateFilters {
  busca?: string
  categoria?: string
  setor?: string
  tipo?: string
  publico?: boolean
  predefinido?: boolean
  page?: number
  limit?: number
}

interface UseTemplatesResult {
  templates: Template[]
  estatisticas: Estatisticas | null
  loading: boolean
  error: string | null
  filtros: TemplateFilters
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null
  // Aá§áµes
  setFiltros: (filtros: Partial<TemplateFilters>) => void
  carregarTemplates: () => Promise<void>
  instalarPredefinidos: () => Promise<boolean>
  deletarTemplate: (id: string) => Promise<boolean>
  limparFiltros: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useTemplates(filtrosIniciais: TemplateFilters = {}): UseTemplatesResult {
  const [templates, setTemplates] = useState<Template[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  
  const [filtros, setFiltrosState] = useState<TemplateFilters>({
    page: 1,
    limit: 20,
    ...filtrosIniciais
  })

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    carregarTemplates()
  }, [filtros])

  // =====================================================
  // FUNá‡á•ES PRINCIPAIS
  // =====================================================

  const carregarTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key: any, String(value))
        }
      })

      const response = await api.get(`/api/templates?${params.toString()}`)
      
      if (response.success) {
        setTemplates(response.data || [])
        setEstatisticas(response.estatisticas || null)
        setPagination(response.pagination || null)
      } else {
        setError(response.error || 'Erro ao carregar templates')
      }
    } catch (err: any) {
      console.error('Erro ao carregar templates:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const instalarPredefinidos = async (): Promise<boolean> => {
    try {
      const response = await api.post('/api/templates', {
        action: 'install_predefined'
      })
      
      if (response.success) {
        await carregarTemplates() // Recarregar lista
        return true
      } else {
        setError(response.error || 'Erro ao instalar templates')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao instalar templates predefinidos:', err)
      setError('Erro ao instalar templates predefinidos')
      return false
    }
  }

  const deletarTemplate = async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete(`/api/templates/${id}`)
      
      if (response.success) {
        await carregarTemplates() // Recarregar lista
        return true
      } else {
        setError(response.error || 'Erro ao deletar template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao deletar template:', err)
      setError('Erro ao deletar template')
      return false
    }
  }

  const setFiltros = (novosFiltros: Partial<TemplateFilters>) => {
    setFiltrosState(prev => ({
      ...prev,
      ...novosFiltros,
      // Reset page when changing filters (except when explicitly setting page)
      page: 'page' in novosFiltros ? novosFiltros.page : 1
    }))
  }

  const limparFiltros = () => {
    setFiltrosState({
      page: 1,
      limit: 20
    })
  }

  return {
    templates,
    estatisticas,
    loading,
    error,
    filtros,
    pagination,
    setFiltros,
    carregarTemplates,
    instalarPredefinidos,
    deletarTemplate,
    limparFiltros
  }
}

// =====================================================
// HOOK PARA TEMPLATE INDIVIDUAL
// =====================================================

interface UseTemplateResult {
  template: Template | null
  loading: boolean
  error: string | null
  carregarTemplate: () => Promise<void>
  salvarTemplate: (data: Partial<Template>) => Promise<boolean>
  criarTemplate: (data: Omit<Template, 'id' | 'criado_em' | 'criado_por'>) => Promise<string | null>
}

export function useTemplate(id?: string): UseTemplateResult {
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (id && id !== 'novo') {
      carregarTemplate()
    }
  }, [id])

  // =====================================================
  // FUNá‡á•ES
  // =====================================================

  const carregarTemplate = async () => {
    if (!id || id === 'novo') return

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/api/templates/${id}`)
      
      if (response.success) {
        setTemplate(response.data)
      } else {
        setError(response.error || 'Template ná£o encontrado')
      }
    } catch (err: any) {
      console.error('Erro ao carregar template:', err)
      setError('Erro ao carregar template')
    } finally {
      setLoading(false)
    }
  }

  const salvarTemplate = async (data: Partial<Template>): Promise<boolean> => {
    if (!id || id === 'novo') return false

    try {
      const response = await api.put(`/api/templates/${id}`, data)
      
      if (response.success) {
        setTemplate(response.data)
        return true
      } else {
        setError(response.error || 'Erro ao salvar template')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao salvar template:', err)
      setError('Erro ao salvar template')
      return false
    }
  }

  const criarTemplate = async (data: Omit<Template, 'id' | 'criado_em' | 'criado_por'>): Promise<string | null> => {
    try {
      const response = await api.post('/api/templates', data)
      
      if (response.success) {
        return response.data.id
      } else {
        setError(response.error || 'Erro ao criar template')
        return null
      }
    } catch (err: any) {
      console.error('Erro ao criar template:', err)
      setError('Erro ao criar template')
      return null
    }
  }

  return {
    template,
    loading,
    error,
    carregarTemplate,
    salvarTemplate,
    criarTemplate
  }
}

// =====================================================
// UTILITáRIOS
// =====================================================

export const templateUtils = {
  // Obter cor da categoria
  getCategoriaColor: (categoria: string): string => {
    const colors: Record<string, string> = {
      limpeza: 'bg-blue-100 text-blue-800',
      seguranca: 'bg-red-100 text-red-800',
      qualidade: 'bg-green-100 text-green-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      abertura: 'bg-purple-100 text-purple-800',
      fechamento: 'bg-indigo-100 text-indigo-800',
      auditoria: 'bg-gray-100 text-gray-800',
      geral: 'bg-orange-100 text-orange-800'
    }
    return colors[categoria] || 'bg-gray-100 text-gray-800'
  },

  // Obter á­cone do tipo
  getTipoIcon: (tipo: string): string => {
    const icons: Record<string, string> = {
      abertura: 'ðŸŒ…',
      fechamento: 'ðŸŒ™',
      manutencao: 'ðŸ”§',
      qualidade: 'œ…',
      seguranca: 'ðŸ›¡ï¸',
      limpeza: 'ðŸ§¹',
      auditoria: 'ðŸ“‹'
    }
    return icons[tipo] || 'ðŸ“‹'
  },

  // Obter á­cone do tipo de campo
  getCampoIcon: (tipo: string): string => {
    const icons: Record<string, string> = {
      texto: 'ðŸ“',
      numero: 'ðŸ”¢',
      sim_nao: 'œ…',
      data: 'ðŸ“…',
      assinatura: 'œï¸',
      foto_camera: 'ðŸ“·',
      foto_upload: 'ðŸ–¼ï¸',
      avaliacao: '­'
    }
    return icons[tipo] || 'ðŸ“‹'
  },

  // Obter label do tipo de campo
  getCampoLabel: (tipo: string): string => {
    const labels: Record<string, string> = {
      texto: 'Texto',
      numero: 'Náºmero',
      sim_nao: 'Sim/Ná£o',
      data: 'Data',
      assinatura: 'Assinatura',
      foto_camera: 'Foto (Cá¢mera)',
      foto_upload: 'Foto (Upload)',
      avaliacao: 'Avaliaá§á£o'
    }
    return labels[tipo] || tipo
  },

  // Validar template
  validarTemplate: (template: Partial<Template>): string[] => {
    const erros: string[] = []

    if (!template.nome?.trim()) {
      erros.push('Nome á© obrigatá³rio')
    }

    if (!template.setor?.trim()) {
      erros.push('Setor á© obrigatá³rio')
    }

    if (!template.categoria) {
      erros.push('Categoria á© obrigatá³ria')
    }

    if (!template.tipo) {
      erros.push('Tipo á© obrigatá³rio')
    }

    if (!template.estrutura?.secoes?.length) {
      erros.push('Pelo menos uma seá§á£o á© obrigatá³ria')
    }

    // Validar seá§áµes
    template.estrutura?.secoes?.forEach((secao: any, index: any) => {
      if (!secao.nome?.trim()) {
        erros.push(`Nome da seá§á£o ${index + 1} á© obrigatá³rio`)
      }

      if (!secao.itens?.length) {
        erros.push(`Seá§á£o "${secao.nome}" deve ter pelo menos um item`)
      }

      // Validar itens
      secao.itens?.forEach((item: any, itemIndex: any) => {
        if (!item.titulo?.trim()) {
          erros.push(`Tá­tulo do item ${itemIndex + 1} na seá§á£o "${secao.nome}" á© obrigatá³rio`)
        }
      })
    })

    return erros
  },

  // Criar template a partir de checklist
  criarTemplateDeChecklist: (checklist: any): Partial<Template> => {
    return {
      nome: `Template - ${checklist.nome}`,
      descricao: `Template criado a partir do checklist: ${checklist.nome}`,
      categoria: 'geral',
      setor: checklist.setor || 'geral',
      tipo: 'qualidade',
      frequencia: 'conforme_necessario',
      tempo_estimado: 30,
      publico: false,
      tags: [],
      estrutura: checklist.estrutura || { secoes: [] }
    }
  }
} 
