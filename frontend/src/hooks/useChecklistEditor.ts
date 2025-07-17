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
  
  // Aá§áµes principais
  carregarChecklist: () => Promise<void>
  carregarVersoes: () => Promise<void>
  salvarChecklist: (comentario?: string) => Promise<boolean>
  fazerRollback: (versaoDestino: number, comentario?: string) => Promise<boolean>
  descartarAlteracoes: () => void
  
  // Ediá§á£o de campos bá¡sicos
  atualizarCampo: (campo: keyof ChecklistData, valor: any) => void
  
  // Ediá§á£o de estrutura
  adicionarSecao: () => void
  atualizarSecao: (secaoIndex: number, updates: Partial<SecaoChecklist>) => void
  removerSecao: (secaoIndex: number) => void
  moverSecao: (fromIndex: number, toIndex: number) => void
  
  // Ediá§á£o de itens
  adicionarItem: (secaoIndex: number) => void
  atualizarItem: (secaoIndex: number, itemIndex: number, updates: Partial<ItemChecklist>) => void
  removerItem: (secaoIndex: number, itemIndex: number) => void
  moverItem: (secaoIndex: number, fromIndex: number, toIndex: number) => void
  
  // Utilitá¡rios
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
  // FUNá‡á•ES PRINCIPAIS
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
      console.error('Erro ao carregar versáµes:', err)
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
        comentario_edicao: comentario || 'Atualizaá§á£o via editor'
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
  // EDIá‡áƒO DE CAMPOS BáSICOS
  // =====================================================

  const atualizarCampo = (campo: keyof ChecklistData, valor: any): void => {
    if (!checklist) return
    
    setChecklist(prev => ({
      ...prev!,
      [campo]: valor
    }))
  }

  // =====================================================
  // EDIá‡áƒO DE ESTRUTURA - SEá‡á•ES
  // =====================================================

  const adicionarSecao = (): void => {
    if (!checklist) return

    const novaSecao: SecaoChecklist = {
      id: `temp_${Date.now()}`,
      nome: `Seá§á£o ${(checklist.estrutura?.secoes?.length || 0) + 1}`,
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
  // EDIá‡áƒO DE ESTRUTURA - ITENS
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
    
    // Aá§áµes principais
    carregarChecklist,
    carregarVersoes,
    salvarChecklist,
    fazerRollback,
    descartarAlteracoes,
    
    // Ediá§á£o de campos bá¡sicos
    atualizarCampo,
    
    // Ediá§á£o de estrutura
    adicionarSecao,
    atualizarSecao,
    removerSecao,
    moverSecao,
    
    // Ediá§á£o de itens
    adicionarItem,
    atualizarItem,
    removerItem,
    moverItem,
    
    // Utilitá¡rios
    podeSerSalvo,
    temMudancas,
    resetarMudancas
  }
}

// =====================================================
// FUNá‡á•ES UTILITáRIAS
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function detectarMudancas(original: ChecklistData, atual: ChecklistData): MudancasDetectadas {
  const mudancas: string[] = []
  let tipoMudanca: 'menor' | 'maior' | 'estrutural' = 'menor'

  // Verificar mudaná§as nos campos bá¡sicos
  if (atual.nome !== original.nome) {
    mudancas.push(`Nome: "${original.nome}" †’ "${atual.nome}"`)
    tipoMudanca = 'maior'
  }

  if (atual.descricao !== original.descricao) {
    mudancas.push('Descriá§á£o alterada')
  }

  if (atual.setor !== original.setor) {
    mudancas.push(`Setor: "${original.setor}" †’ "${atual.setor}"`)
    tipoMudanca = 'maior'
  }

  if (atual.tipo !== original.tipo) {
    mudancas.push(`Tipo: "${original.tipo}" †’ "${atual.tipo}"`)
    tipoMudanca = 'maior'
  }

  if (atual.frequencia !== original.frequencia) {
    mudancas.push(`Frequáªncia: "${original.frequencia}" †’ "${atual.frequencia}"`)
  }

  if (atual.tempo_estimado !== original.tempo_estimado) {
    mudancas.push(`Tempo: ${original.tempo_estimado}min †’ ${atual.tempo_estimado}min`)
  }

  if (atual.ativo !== original.ativo) {
    mudancas.push(`Status: ${original.ativo ? 'Ativo' : 'Inativo'} †’ ${atual.ativo ? 'Ativo' : 'Inativo'}`)
    tipoMudanca = 'maior'
  }

  // Verificar mudaná§as na estrutura
  const secoesOriginais = original.estrutura?.secoes || []
  const secoesAtuais = atual.estrutura?.secoes || []

  if (secoesOriginais.length !== secoesAtuais.length) {
    mudancas.push(`Náºmero de seá§áµes: ${secoesOriginais.length} †’ ${secoesAtuais.length}`)
    tipoMudanca = 'estrutural'
  }

  // Verificar mudaná§as detalhadas na estrutura
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

  // Verificar mudaná§as em seá§áµes existentes
  secoesAtuais.forEach((secaoAtual, index) => {
    const secaoOriginal = secoesOriginais[index]
    
    if (!secaoOriginal) {
      mudancas.push(`+ Nova seá§á£o: "${secaoAtual.nome}"`)
      return
    }

    if (secaoAtual.nome !== secaoOriginal.nome) {
      mudancas.push(`Seá§á£o renomeada: "${secaoOriginal.nome}" †’ "${secaoAtual.nome}"`)
    }

    if (secaoAtual.cor !== secaoOriginal.cor) {
      mudancas.push(`Cor da seá§á£o "${secaoAtual.nome}" alterada`)
    }

    const itensOriginais = secaoOriginal.itens || []
    const itensAtuais = secaoAtual.itens || []

    if (itensOriginais.length !== itensAtuais.length) {
      mudancas.push(`"${secaoAtual.nome}": ${itensOriginais.length} †’ ${itensAtuais.length} itens`)
    }

    // Verificar mudaná§as em itens
    itensAtuais.forEach((itemAtual, itemIndex) => {
      const itemOriginal = itensOriginais[itemIndex]
      
      if (!itemOriginal) {
        mudancas.push(`+ "${secaoAtual.nome}": novo item "${itemAtual.titulo}"`)
      } else {
        if (itemAtual.titulo !== itemOriginal.titulo) {
          mudancas.push(`Item renomeado: "${itemOriginal.titulo}" †’ "${itemAtual.titulo}"`)
        }
        
        if (itemAtual.tipo !== itemOriginal.tipo) {
          mudancas.push(`Tipo do item "${itemAtual.titulo}": ${itemOriginal.tipo} †’ ${itemAtual.tipo}`)
        }
        
        if (itemAtual.obrigatorio !== itemOriginal.obrigatorio) {
          mudancas.push(`"${itemAtual.titulo}": ${itemOriginal.obrigatorio ? 'Obrigatá³rio †’ Opcional' : 'Opcional †’ Obrigatá³rio'}`)
        }
      }
    })
  })

  // Verificar seá§áµes removidas
  if (secoesOriginais.length > secoesAtuais.length) {
    const secoesRemovidas = secoesOriginais.slice(secoesAtuais.length)
    secoesRemovidas.forEach((secao) => {
      mudancas.push(`- Seá§á£o removida: "${secao.nome}"`)
    })
  }

  return mudancas
}

// =====================================================
// UTILITáRIOS PARA VALIDAá‡áƒO
// =====================================================

export const checklistValidators = {
  // Validar campos obrigatá³rios
  validarCamposBasicos: (checklist: ChecklistData): string[] => {
    const erros: string[] = []

    if (!checklist.nome.trim()) {
      erros.push('Nome á© obrigatá³rio')
    }

    if (!checklist.setor.trim()) {
      erros.push('Setor á© obrigatá³rio')
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
      erros.push('Pelo menos uma seá§á£o á© obrigatá³ria')
      return erros
    }

    checklist.estrutura.secoes.forEach((secao, secaoIndex) => {
      if (!secao.nome.trim()) {
        erros.push(`Nome da seá§á£o ${secaoIndex + 1} á© obrigatá³rio`)
      }

      if (!secao.itens?.length) {
        erros.push(`Seá§á£o "${secao.nome}" deve ter pelo menos um item`)
      }

      secao.itens?.forEach((item, itemIndex) => {
        if (!item.titulo.trim()) {
          erros.push(`Tá­tulo do item ${itemIndex + 1} na seá§á£o "${secao.nome}" á© obrigatá³rio`)
        }
      })
    })

    return erros
  },

  // Validaá§á£o completa
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
