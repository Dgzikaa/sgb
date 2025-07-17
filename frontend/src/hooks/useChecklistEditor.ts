import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

// =====================================================
// TIPOS
// =====================================================

interface ItemChecklist {
  id?: string
  titulo: string
  descricao?: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  ordem: number
  opcoes?: Record<string, any>
  condicional?: {
    dependeDe: string
    valor: any
  }
  validacao?: Record<string, any>
}

interface SecaoChecklist {
  id?: string
  nome: string
  descricao?: string
  cor: string
  ordem: number
  itens: ItemChecklist[]
}

interface ChecklistData {
  id: string
  nome: string
  descricao?: string
  setor: string
  tipo: string
  frequencia: string
  tempo_estimado: number
  ativo: boolean
  versao: number
  criado_em: string
  atualizado_em: string
  criado_por: {
    nome: string
    email: string
  }
  atualizado_por?: {
    nome: string
    email: string
  }
  estrutura: {
    secoes: SecaoChecklist[]
  }
  estatisticas?: {
    total_execucoes: number
    execucoes_completadas: number
    execucoes_pendentes: number
  }
}

interface VersaoHistorico {
  versao: number
  nome: string
  mudancas: string[]
  comentario: string
  data: string
  tipo: string
  usuario: string
  pode_rollback: boolean
  e_versao_atual: boolean
}

interface MudancasDetectadas {
  mudancas: string[]
  temAlteracoes: boolean
  tipoMudanca: 'menor' | 'maior' | 'estrutural'
}

interface UseChecklistEditorResult {
  // Estados
  checklist: ChecklistData | null
  checklistOriginal: ChecklistData | null
  versoes: VersaoHistorico[]
  loading: boolean
  saving: boolean
  error: string | null
  mudancasDetectadas: MudancasDetectadas
  
  // AÃ§Ãµes principais
  carregarChecklist: () => Promise<void>
  carregarVersoes: () => Promise<void>
  salvarChecklist: (comentario?: string) => Promise<boolean>
  fazerRollback: (versaoDestino: number, comentario?: string) => Promise<boolean>
  descartarAlteracoes: () => void
  
  // EdiÃ§Ã£o de campos bÃ¡sicos
  atualizarCampo: (campo: keyof ChecklistData, valor: any) => void
  
  // EdiÃ§Ã£o de estrutura
  adicionarSecao: () => void
  atualizarSecao: (secaoIndex: number, updates: Partial<SecaoChecklist>) => void
  removerSecao: (secaoIndex: number) => void
  moverSecao: (fromIndex: number, toIndex: number) => void
  
  // EdiÃ§Ã£o de itens
  adicionarItem: (secaoIndex: number) => void
  atualizarItem: (secaoIndex: number, itemIndex: number, updates: Partial<ItemChecklist>) => void
  removerItem: (secaoIndex: number, itemIndex: number) => void
  moverItem: (secaoIndex: number, fromIndex: number, toIndex: number) => void
  
  // UtilitÃ¡rios
  podeSerSalvo: boolean
  temMudancas: boolean
  resetarMudancas: () => void
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useChecklistEditor(checklistId: string): UseChecklistEditorResult {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null)
  const [checklistOriginal, setChecklistOriginal] = useState<ChecklistData | null>(null)
  const [versoes, setVersoes] = useState<VersaoHistorico[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mudancasDetectadas, setMudancasDetectadas] = useState<MudancasDetectadas>({
    mudancas: [],
    temAlteracoes: false,
    tipoMudanca: 'menor'
  })

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (checklistId) {
      carregarChecklist()
      carregarVersoes()
    }
  }, [checklistId])

  useEffect(() => {
    if (checklist && checklistOriginal) {
      const mudancas = detectarMudancas(checklistOriginal, checklist)
      setMudancasDetectadas(mudancas)
    }
  }, [checklist, checklistOriginal])

  // =====================================================
  // FUNÃ‡Ã•ES PRINCIPAIS
  // =====================================================

  const carregarChecklist = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/api/checklists/${checklistId}?incluir_historico=false`)
      
      if (response.success) {
        const dados = response.data.checklist
        setChecklist(dados)
        setChecklistOriginal(deepClone(dados))
      } else {
        setError(response.error || 'Erro ao carregar checklist')
      }
    } catch (err: any) {
      console.error('Erro ao carregar checklist:', err)
      setError('Erro ao carregar checklist')
    } finally {
      setLoading(false)
    }
  }

  const carregarVersoes = async (): Promise<void> => {
    try {
      const response = await api.get(`/api/checklists/${checklistId}/rollback`)
      
      if (response.success) {
        setVersoes(response.data.versoes_disponiveis || [])
      }
    } catch (err: any) {
      console.error('Erro ao carregar versÃµes:', err)
    }
  }

  const salvarChecklist = async (comentario?: string): Promise<boolean> => {
    if (!checklist || !mudancasDetectadas.temAlteracoes) {
      return false
    }

    try {
      setSaving(true)
      
      const payload = {
        nome: checklist.nome,
        descricao: checklist.descricao,
        setor: checklist.setor,
        tipo: checklist.tipo,
        frequencia: checklist.frequencia,
        tempo_estimado: checklist.tempo_estimado,
        ativo: checklist.ativo,
        estrutura: checklist.estrutura,
        comentario_edicao: comentario || 'AtualizaÃ§Ã£o via editor'
      }

      const response = await api.put(`/api/checklists/${checklistId}`, payload)
      
      if (response.success) {
        await carregarChecklist()
        await carregarVersoes()
        return true
      } else {
        setError(response.error || 'Erro ao salvar checklist')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao salvar checklist:', err)
      setError('Erro ao salvar checklist')
      return false
    } finally {
      setSaving(false)
    }
  }

  const fazerRollback = async (versaoDestino: number, comentario?: string): Promise<boolean> => {
    try {
      const response = await api.post(`/api/checklists/${checklistId}/rollback`, {
        versao_destino: versaoDestino,
        comentario: comentario || 'Rollback via interface'
      })
      
      if (response.success) {
        await carregarChecklist()
        await carregarVersoes()
        return true
      } else {
        setError(response.error || 'Erro ao fazer rollback')
        return false
      }
    } catch (err: any) {
      console.error('Erro ao fazer rollback:', err)
      setError('Erro ao fazer rollback')
      return false
    }
  }

  const descartarAlteracoes = (): void => {
    if (checklistOriginal) {
      setChecklist(deepClone(checklistOriginal))
    }
  }

  // =====================================================
  // EDIÃ‡ÃƒO DE CAMPOS BÃSICOS
  // =====================================================

  const atualizarCampo = (campo: keyof ChecklistData, valor: any): void => {
    if (!checklist) return
    
    setChecklist(prev => ({
      ...prev!,
      [campo]: valor
    }))
  }

  // =====================================================
  // EDIÃ‡ÃƒO DE ESTRUTURA - SEÃ‡Ã•ES
  // =====================================================

  const adicionarSecao = (): void => {
    if (!checklist) return

    const novaSecao: SecaoChecklist = {
      id: `temp_${Date.now()}`,
      nome: `SeÃ§Ã£o ${(checklist.estrutura?.secoes?.length || 0) + 1}`,
      descricao: '',
      cor: 'bg-blue-500',
      ordem: (checklist.estrutura?.secoes?.length || 0) + 1,
      itens: []
    }

    setChecklist(prev => ({
      ...prev!,
      estrutura: {
        secoes: [...(prev!.estrutura?.secoes || []), novaSecao]
      }
    }))
  }

  const atualizarSecao = (secaoIndex: number, updates: Partial<SecaoChecklist>): void => {
    if (!checklist) return

    setChecklist(prev => ({
      ...prev!,
      estrutura: {
        secoes: prev!.estrutura.secoes.map((secao, index) =>
          index === secaoIndex ? { ...secao, ...updates } : secao
        )
      }
    }))
  }

  const removerSecao = (secaoIndex: number): void => {
    if (!checklist) return

    setChecklist(prev => ({
      ...prev!,
      estrutura: {
        secoes: prev!.estrutura.secoes.filter((_, index) => index !== secaoIndex)
      }
    }))
  }

  const moverSecao = (fromIndex: number, toIndex: number): void => {
    if (!checklist) return

    setChecklist(prev => {
      const secoes = [...prev!.estrutura.secoes]
      const [movedSection] = secoes.splice(fromIndex, 1)
      secoes.splice(toIndex, 0, movedSection)
      
      // Atualizar ordens
      secoes.forEach((secao, index) => {
        secao.ordem = index + 1
      })

      return {
        ...prev!,
        estrutura: { secoes }
      }
    })
  }

  // =====================================================
  // EDIÃ‡ÃƒO DE ESTRUTURA - ITENS
  // =====================================================

  const adicionarItem = (secaoIndex: number): void => {
    if (!checklist) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const novoItem: ItemChecklist = {
      id: `temp_${Date.now()}`,
      titulo: 'Novo item',
      descricao: '',
      tipo: 'sim_nao',
      obrigatorio: false,
      ordem: (secao.itens?.length || 0) + 1
    }

    atualizarSecao(secaoIndex, {
      itens: [...(secao.itens || []), novoItem]
    })
  }

  const atualizarItem = (secaoIndex: number, itemIndex: number, updates: Partial<ItemChecklist>): void => {
    if (!checklist) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const itensAtualizados = secao.itens.map((item, index) =>
      index === itemIndex ? { ...item, ...updates } : item
    )

    atualizarSecao(secaoIndex, { itens: itensAtualizados })
  }

  const removerItem = (secaoIndex: number, itemIndex: number): void => {
    if (!checklist) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const itensAtualizados = secao.itens.filter((_, index) => index !== itemIndex)

    atualizarSecao(secaoIndex, { itens: itensAtualizados })
  }

  const moverItem = (secaoIndex: number, fromIndex: number, toIndex: number): void => {
    if (!checklist) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const itens = [...secao.itens]
    const [movedItem] = itens.splice(fromIndex, 1)
    itens.splice(toIndex, 0, movedItem)
    
    // Atualizar ordens
    itens.forEach((item, index) => {
      item.ordem = index + 1
    })

    atualizarSecao(secaoIndex, { itens })
  }

  // =====================================================
  // COMPUTADOS
  // =====================================================

  const podeSerSalvo = Boolean(
    checklist && 
    checklist.nome.trim() && 
    checklist.setor.trim() && 
    mudancasDetectadas.temAlteracoes
  )

  const temMudancas = mudancasDetectadas.temAlteracoes

  const resetarMudancas = (): void => {
    if (checklistOriginal) {
      setChecklist(deepClone(checklistOriginal))
    }
  }

  return {
    // Estados
    checklist,
    checklistOriginal,
    versoes,
    loading,
    saving,
    error,
    mudancasDetectadas,
    
    // AÃ§Ãµes principais
    carregarChecklist,
    carregarVersoes,
    salvarChecklist,
    fazerRollback,
    descartarAlteracoes,
    
    // EdiÃ§Ã£o de campos bÃ¡sicos
    atualizarCampo,
    
    // EdiÃ§Ã£o de estrutura
    adicionarSecao,
    atualizarSecao,
    removerSecao,
    moverSecao,
    
    // EdiÃ§Ã£o de itens
    adicionarItem,
    atualizarItem,
    removerItem,
    moverItem,
    
    // UtilitÃ¡rios
    podeSerSalvo,
    temMudancas,
    resetarMudancas
  }
}

// =====================================================
// FUNÃ‡Ã•ES UTILITÃRIAS
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function detectarMudancas(original: ChecklistData, atual: ChecklistData): MudancasDetectadas {
  const mudancas: string[] = []
  let tipoMudanca: 'menor' | 'maior' | 'estrutural' = 'menor'

  // Verificar mudanÃ§as nos campos bÃ¡sicos
  if (atual.nome !== original.nome) {
    mudancas.push(`Nome: "${original.nome}" â†’ "${atual.nome}"`)
    tipoMudanca = 'maior'
  }

  if (atual.descricao !== original.descricao) {
    mudancas.push('DescriÃ§Ã£o alterada')
  }

  if (atual.setor !== original.setor) {
    mudancas.push(`Setor: "${original.setor}" â†’ "${atual.setor}"`)
    tipoMudanca = 'maior'
  }

  if (atual.tipo !== original.tipo) {
    mudancas.push(`Tipo: "${original.tipo}" â†’ "${atual.tipo}"`)
    tipoMudanca = 'maior'
  }

  if (atual.frequencia !== original.frequencia) {
    mudancas.push(`FrequÃªncia: "${original.frequencia}" â†’ "${atual.frequencia}"`)
  }

  if (atual.tempo_estimado !== original.tempo_estimado) {
    mudancas.push(`Tempo: ${original.tempo_estimado}min â†’ ${atual.tempo_estimado}min`)
  }

  if (atual.ativo !== original.ativo) {
    mudancas.push(`Status: ${original.ativo ? 'Ativo' : 'Inativo'} â†’ ${atual.ativo ? 'Ativo' : 'Inativo'}`)
    tipoMudanca = 'maior'
  }

  // Verificar mudanÃ§as na estrutura
  const secoesOriginais = original.estrutura?.secoes || []
  const secoesAtuais = atual.estrutura?.secoes || []

  if (secoesOriginais.length !== secoesAtuais.length) {
    mudancas.push(`NÃºmero de seÃ§Ãµes: ${secoesOriginais.length} â†’ ${secoesAtuais.length}`)
    tipoMudanca = 'estrutural'
  }

  // Verificar mudanÃ§as detalhadas na estrutura
  const mudancasEstrutura = detectarMudancasEstrutura(secoesOriginais, secoesAtuais)
  if (mudancasEstrutura.length > 0) {
    mudancas.push(...mudancasEstrutura)
    tipoMudanca = 'estrutural'
  }

  return {
    mudancas,
    temAlteracoes: mudancas.length > 0,
    tipoMudanca
  }
}

function detectarMudancasEstrutura(secoesOriginais: SecaoChecklist[], secoesAtuais: SecaoChecklist[]): string[] {
  const mudancas: string[] = []

  // Verificar mudanÃ§as em seÃ§Ãµes existentes
  secoesAtuais.forEach((secaoAtual, index) => {
    const secaoOriginal = secoesOriginais[index]
    
    if (!secaoOriginal) {
      mudancas.push(`+ Nova seÃ§Ã£o: "${secaoAtual.nome}"`)
      return
    }

    if (secaoAtual.nome !== secaoOriginal.nome) {
      mudancas.push(`SeÃ§Ã£o renomeada: "${secaoOriginal.nome}" â†’ "${secaoAtual.nome}"`)
    }

    if (secaoAtual.cor !== secaoOriginal.cor) {
      mudancas.push(`Cor da seÃ§Ã£o "${secaoAtual.nome}" alterada`)
    }

    const itensOriginais = secaoOriginal.itens || []
    const itensAtuais = secaoAtual.itens || []

    if (itensOriginais.length !== itensAtuais.length) {
      mudancas.push(`"${secaoAtual.nome}": ${itensOriginais.length} â†’ ${itensAtuais.length} itens`)
    }

    // Verificar mudanÃ§as em itens
    itensAtuais.forEach((itemAtual, itemIndex) => {
      const itemOriginal = itensOriginais[itemIndex]
      
      if (!itemOriginal) {
        mudancas.push(`+ "${secaoAtual.nome}": novo item "${itemAtual.titulo}"`)
      } else {
        if (itemAtual.titulo !== itemOriginal.titulo) {
          mudancas.push(`Item renomeado: "${itemOriginal.titulo}" â†’ "${itemAtual.titulo}"`)
        }
        
        if (itemAtual.tipo !== itemOriginal.tipo) {
          mudancas.push(`Tipo do item "${itemAtual.titulo}": ${itemOriginal.tipo} â†’ ${itemAtual.tipo}`)
        }
        
        if (itemAtual.obrigatorio !== itemOriginal.obrigatorio) {
          mudancas.push(`"${itemAtual.titulo}": ${itemOriginal.obrigatorio ? 'ObrigatÃ³rio â†’ Opcional' : 'Opcional â†’ ObrigatÃ³rio'}`)
        }
      }
    })
  })

  // Verificar seÃ§Ãµes removidas
  if (secoesOriginais.length > secoesAtuais.length) {
    const secoesRemovidas = secoesOriginais.slice(secoesAtuais.length)
    secoesRemovidas.forEach((secao) => {
      mudancas.push(`- SeÃ§Ã£o removida: "${secao.nome}"`)
    })
  }

  return mudancas
}

// =====================================================
// UTILITÃRIOS PARA VALIDAÃ‡ÃƒO
// =====================================================

export const checklistValidators = {
  // Validar campos obrigatÃ³rios
  validarCamposBasicos: (checklist: ChecklistData): string[] => {
    const erros: string[] = []

    if (!checklist.nome.trim()) {
      erros.push('Nome Ã© obrigatÃ³rio')
    }

    if (!checklist.setor.trim()) {
      erros.push('Setor Ã© obrigatÃ³rio')
    }

    if (checklist.tempo_estimado < 1 || checklist.tempo_estimado > 480) {
      erros.push('Tempo estimado deve estar entre 1 e 480 minutos')
    }

    return erros
  },

  // Validar estrutura
  validarEstrutura: (checklist: ChecklistData): string[] => {
    const erros: string[] = []

    if (!checklist.estrutura?.secoes?.length) {
      erros.push('Pelo menos uma seÃ§Ã£o Ã© obrigatÃ³ria')
      return erros
    }

    checklist.estrutura.secoes.forEach((secao, secaoIndex) => {
      if (!secao.nome.trim()) {
        erros.push(`Nome da seÃ§Ã£o ${secaoIndex + 1} Ã© obrigatÃ³rio`)
      }

      if (!secao.itens?.length) {
        erros.push(`SeÃ§Ã£o "${secao.nome}" deve ter pelo menos um item`)
      }

      secao.itens?.forEach((item, itemIndex) => {
        if (!item.titulo.trim()) {
          erros.push(`TÃ­tulo do item ${itemIndex + 1} na seÃ§Ã£o "${secao.nome}" Ã© obrigatÃ³rio`)
        }
      })
    })

    return erros
  },

  // ValidaÃ§Ã£o completa
  validarCompleto: (checklist: ChecklistData): { valido: boolean; erros: string[] } => {
    const errosBasicos = checklistValidators.validarCamposBasicos(checklist)
    const errosEstrutura = checklistValidators.validarEstrutura(checklist)
    const erros = [...errosBasicos, ...errosEstrutura]

    return {
      valido: erros.length === 0,
      erros
    }
  }
} 
