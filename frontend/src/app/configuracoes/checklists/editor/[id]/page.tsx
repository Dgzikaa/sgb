'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  History,
  RotateCcw,
  Eye,
  Smartphone,
  Monitor,
  Clock,
  User,
  GitBranch,
  AlertTriangle
} from 'lucide-react'
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
  opcoes?: Record<string, string | number | boolean>
  condicional?: {
    dependeDe: string
    valor: string | number | boolean | Date
  }
  validacao?: Record<string, string | number | boolean>
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

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ChecklistEditorPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const { setPageTitle } = usePageTitle()

  const [checklist, setChecklist] = useState<ChecklistData | null>(null)
  const [checklistOriginal, setChecklistOriginal] = useState<ChecklistData | null>(null)
  const [versoes, setVersoes] = useState<VersaoHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobilePreview, setMobilePreview] = useState(false)
  const [comentarioEdicao, setComentarioEdicao] = useState('')
  const [mudancasDetectadas, setMudancasDetectadas] = useState<string[]>([])

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    setPageTitle('✏️ Editor de Checklist')
    return () => setPageTitle('')
  }, [setPageTitle])

  const carregarChecklist = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/checklists/${id}?incluir_historico=false`)
      
      if (response.success) {
        const dados = response.data.checklist
        setChecklist(dados)
        setChecklistOriginal(JSON.parse(JSON.stringify(dados))) // Deep copy
      } else {
        setError(response.error || 'Erro ao carregar checklist')
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar checklist:', err)
      setError('Erro ao carregar checklist')
    } finally {
      setLoading(false)
    }
  }, [id])

  const carregarVersoes = useCallback(async () => {
    try {
      const response = await api.get(`/api/checklists/${id}/rollback`)
      
      if (response.success) {
        setVersoes(response.data.versoes_disponiveis || [])
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar versões:', err)
    }
  }, [id])

  const detectarMudancas = useCallback(() => {
    if (!checklist || !checklistOriginal) return

    const mudancas: string[] = []

    // Verificar mudanças básicas
    if (checklist.nome !== checklistOriginal.nome) {
      mudancas.push(`Nome: "${checklistOriginal.nome}" → "${checklist.nome}"`)
    }

    if (checklist.descricao !== checklistOriginal.descricao) {
      mudancas.push('Descrição alterada')
    }

    if (checklist.setor !== checklistOriginal.setor) {
      mudancas.push(`Setor: "${checklistOriginal.setor}" → "${checklist.setor}"`)
    }

    if (checklist.tipo !== checklistOriginal.tipo) {
      mudancas.push(`Tipo: "${checklistOriginal.tipo}" → "${checklist.tipo}"`)
    }

    if (checklist.tempo_estimado !== checklistOriginal.tempo_estimado) {
      mudancas.push(`Tempo: ${checklistOriginal.tempo_estimado}min → ${checklist.tempo_estimado}min`)
    }

    if (checklist.ativo !== checklistOriginal.ativo) {
      mudancas.push(`Status: ${checklistOriginal.ativo ? 'Ativo' : 'Inativo'} → ${checklist.ativo ? 'Ativo' : 'Inativo'}`)
    }

    // Verificar mudanças na estrutura
    const secoesOriginais = checklistOriginal.estrutura?.secoes || []
    const secoesAtuais = checklist.estrutura?.secoes || []

    if (secoesOriginais.length !== secoesAtuais.length) {
      mudancas.push(`Seções: ${secoesOriginais.length} → ${secoesAtuais.length}`)
    }

    // Verificar mudanças em seções
    secoesAtuais.forEach((secaoAtual, index) => {
      const secaoOriginal = secoesOriginais[index]
      
      if (!secaoOriginal) {
        mudancas.push(`+ Nova seção: "${secaoAtual.nome}"`)
        return
      }

      if (secaoAtual.nome !== secaoOriginal.nome) {
        mudancas.push(`Seção renomeada: "${secaoOriginal.nome}" → "${secaoAtual.nome}"`)
      }

      const itensOriginais = secaoOriginal.itens || []
      const itensAtuais = secaoAtual.itens || []

      if (itensOriginais.length !== itensAtuais.length) {
        mudancas.push(`"${secaoAtual.nome}": ${itensOriginais.length} → ${itensAtuais.length} itens`)
      }
    })

    setMudancasDetectadas(mudancas)
  }, [checklist, checklistOriginal])

  useEffect(() => {
    if (id) {
      carregarChecklist()
    }
  }, [id, carregarChecklist])

  useEffect(() => {
    if (checklist && checklistOriginal) {
      detectarMudancas()
    }
  }, [checklist, checklistOriginal, detectarMudancas])

  // =====================================================
  // FUNÇÕES PRINCIPAIS
  // =====================================================

  const salvarChecklist = async () => {
    if (!checklist) return

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
        comentario_edicao: comentarioEdicao || 'Atualização via editor'
      }

      const response = await api.put(`/api/checklists/${id}`, payload)
      
      if (response.success) {
        alert(`Checklist salvo com sucesso! Nova versão: ${response.nova_versao}`)
        await carregarChecklist()
        await carregarVersoes()
        setComentarioEdicao('')
      } else {
        alert(response.error || 'Erro ao salvar checklist')
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar checklist:', err)
      alert('Erro ao salvar checklist')
    } finally {
      setSaving(false)
    }
  }

  const fazerRollback = async (versaoDestino: number) => {
    if (!confirm(`Tem certeza que deseja restaurar para a versão ${versaoDestino}?`)) {
      return
    }

    try {
      const comentario = prompt('Comentário para o rollback (opcional):') || 'Rollback via interface'

      const response = await api.post(`/api/checklists/${id}/rollback`, {
        versao_destino: versaoDestino,
        comentario
      })
      
      if (response.success) {
        alert(`Rollback executado com sucesso! Nova versão: ${response.rollback_info.nova_versao}`)
        await carregarChecklist()
        await carregarVersoes()
      } else {
        alert(response.error || 'Erro ao fazer rollback')
      }
    } catch (err: unknown) {
      console.error('Erro ao fazer rollback:', err)
      alert('Erro ao fazer rollback')
    }
  }

  // =====================================================
  // FUNÇÕES DE EDIÇÃO
  // =====================================================

  const atualizarCampo = (campo: keyof ChecklistData, valor: string | number | boolean) => {
    if (!checklist) return
    
    setChecklist(prev => ({
      ...prev!,
      [campo]: valor
    }))
  }

  const adicionarSecao = () => {
    if (!checklist) return

    const novaSecao: SecaoChecklist = {
      id: `temp_${Date.now()}`,
      nome: `Seção ${(checklist.estrutura?.secoes?.length || 0) + 1}`,
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

  const atualizarSecao = (secaoIndex: number, updates: Partial<SecaoChecklist>) => {
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

  const removerSecao = (secaoIndex: number) => {
    if (!checklist) return
    if (!confirm('Tem certeza que deseja remover esta seção?')) return

    setChecklist(prev => ({
      ...prev!,
      estrutura: {
        secoes: prev!.estrutura.secoes.filter((_, index) => index !== secaoIndex)
      }
    }))
  }

  const adicionarItem = (secaoIndex: number) => {
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

  const atualizarItem = (secaoIndex: number, itemIndex: number, updates: Partial<ItemChecklist>) => {
    if (!checklist) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const itensAtualizados = secao.itens.map((item, index) =>
      index === itemIndex ? { ...item, ...updates } : item
    )

    atualizarSecao(secaoIndex, { itens: itensAtualizados })
  }

  const removerItem = (secaoIndex: number, itemIndex: number) => {
    if (!checklist) return
    if (!confirm('Tem certeza que deseja remover este item?')) return

    const secao = checklist.estrutura.secoes[secaoIndex]
    const itensAtualizados = secao.itens.filter((_, index) => index !== itemIndex)

    atualizarSecao(secaoIndex, { itens: itensAtualizados })
  }

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      texto: '📝',
      numero: '🔢',
      sim_nao: '✅',
      data: '📅',
      assinatura: '✍️',
      foto_camera: '📷',
      foto_upload: '🖼️',
      avaliacao: '⭐'
    }
    return icons[tipo] || '📋'
  }

  const cores = [
    { value: 'bg-blue-500', label: 'Azul', color: '#3B82F6' },
    { value: 'bg-green-500', label: 'Verde', color: '#10B981' },
    { value: 'bg-purple-500', label: 'Roxo', color: '#8B5CF6' },
    { value: 'bg-red-500', label: 'Vermelho', color: '#EF4444' },
    { value: 'bg-yellow-500', label: 'Amarelo', color: '#F59E0B' },
    { value: 'bg-orange-500', label: 'Laranja', color: '#F97316' },
    { value: 'bg-pink-500', label: 'Rosa', color: '#EC4899' },
    { value: 'bg-indigo-500', label: 'Índigo', color: '#6366F1' }
  ]

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando checklist...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
                          <Button onClick={() => router.push('/configuracoes/checklists')} className="mt-2">
                  Voltar para Checklists
                </Button>
        </div>
      </div>
    )
  }

  if (!checklist) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
                            onClick={() => router.push('/configuracoes/checklists')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <p className="text-gray-600 mt-1">
              {checklist.nome} • {checklist.setor}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setMobilePreview(!mobilePreview)}
            variant="outline"
            size="sm"
          >
            {mobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </Button>
          <Button
            onClick={salvarChecklist}
            disabled={saving || mudancasDetectadas.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Indicador de Mudanças */}
      {mudancasDetectadas.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {mudancasDetectadas.length} alteração(ões) detectada(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-yellow-700 space-y-1">
              {mudancasDetectadas.slice(0, 3).map((mudanca, index) => (
                <li key={index}>• {mudanca}</li>
              ))}
              {mudancasDetectadas.length > 3 && (
                <li>• ... e mais {mudancasDetectadas.length - 3} alterações</li>
              )}
            </ul>
            
            <div className="mt-3">
              <Label htmlFor="comentario">Comentário da edição:</Label>
              <Input
                id="comentario"
                value={comentarioEdicao}
                onChange={(e) => setComentarioEdicao(e.target.value)}
                placeholder="Descreva as alterações realizadas"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="historico">
            <History className="w-4 h-4 mr-2" />
            Histórico ({versoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configurações */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Checklist *</Label>
                  <Input
                    id="nome"
                    value={checklist.nome}
                    onChange={(e) => atualizarCampo('nome', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={checklist.descricao || ''}
                    onChange={(e) => atualizarCampo('descricao', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="setor">Setor *</Label>
                  <Input
                    id="setor"
                    value={checklist.setor}
                    onChange={(e) => atualizarCampo('setor', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select 
                      value={checklist.tipo} 
                      onValueChange={(value) => atualizarCampo('tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abertura">Abertura</SelectItem>
                        <SelectItem value="fechamento">Fechamento</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="qualidade">Qualidade</SelectItem>
                        <SelectItem value="seguranca">Segurança</SelectItem>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="auditoria">Auditoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tempo">Tempo (min)</Label>
                    <Input
                      id="tempo"
                      type="number"
                      min="1"
                      max="480"
                      value={checklist.tempo_estimado}
                      onChange={(e) => atualizarCampo('tempo_estimado', parseInt(e.target.value) || 30)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select 
                    value={checklist.frequencia} 
                    onValueChange={(value) => atualizarCampo('frequencia', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="conforme_necessario">Conforme necessário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={checklist.ativo}
                    onCheckedChange={(checked) => atualizarCampo('ativo', checked)}
                  />
                  <Label htmlFor="ativo">Checklist ativo</Label>
                </div>

                {/* Metadados */}
                <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Criado por: {checklist.criado_por.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Criado em: {formatarData(checklist.criado_em)}</span>
                  </div>
                  {checklist.atualizado_por && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Editado por: {checklist.atualizado_por.nome}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <span>Versão atual: {checklist.versao}</span>
                  </div>
                </div>

                {/* Estatísticas */}
                {checklist.estatisticas && (
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <h4 className="font-medium">Estatísticas de Uso</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-1 font-medium">{checklist.estatisticas.total_execucoes}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Completos:</span>
                        <span className="ml-1 font-medium">{checklist.estatisticas.execucoes_completadas}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="border-t pt-4">
                  <Button
                    onClick={adicionarSecao}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Seção
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Editor de Conteúdo */}
            <div className={`lg:col-span-2 ${mobilePreview ? 'max-w-sm mx-auto' : ''}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {mobilePreview ? 'Preview Mobile' : 'Editor de Conteúdo'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {checklist.estrutura.secoes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma seção criada
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Comece adicionando uma seção para organizar os itens
                      </p>
                      <Button onClick={adicionarSecao}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeira Seção
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {checklist.estrutura.secoes.map((secao, secaoIndex) => (
                        <Card key={secaoIndex} className="border-l-4" style={{ borderLeftColor: cores.find(c => c.value === secao.cor)?.color }}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                {mobilePreview ? (
                                  <h3 className="font-semibold text-lg">{secao.nome}</h3>
                                ) : (
                                  <Input
                                    value={secao.nome}
                                    onChange={(e) => atualizarSecao(secaoIndex, { nome: e.target.value })}
                                    className="font-semibold text-lg border-none px-0 focus:border-gray-300"
                                  />
                                )}
                              </div>
                              
                              {!mobilePreview && (
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={secao.cor} 
                                    onValueChange={(value) => atualizarSecao(secaoIndex, { cor: value })}
                                  >
                                    <SelectTrigger className="w-24">
                                      <div 
                                        className="w-4 h-4 rounded"
                                        style={{ 
                                          backgroundColor: cores.find(c => c.value === secao.cor)?.color 
                                        }}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {cores.map((cor) => (
                                        <SelectItem key={cor.value} value={cor.value}>
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-4 h-4 rounded"
                                              style={{ backgroundColor: cor.color }}
                                            />
                                            {cor.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    onClick={() => removerSecao(secaoIndex)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {secao.descricao && (
                              <p className="text-sm text-gray-600">{secao.descricao}</p>
                            )}
                            
                            {!mobilePreview && (
                              <Textarea
                                value={secao.descricao || ''}
                                onChange={(e) => atualizarSecao(secaoIndex, { descricao: e.target.value })}
                                placeholder="Descrição da seção (opcional)"
                                rows={2}
                                className="mt-2"
                              />
                            )}
                          </CardHeader>

                          <CardContent>
                            {/* Itens da Seção */}
                            <div className="space-y-3">
                              {secao.itens.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="border rounded-lg p-3 bg-gray-50"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-2 flex-1">
                                      <span className="text-lg">{getTipoIcon(item.tipo)}</span>
                                      <div className="flex-1">
                                        {mobilePreview ? (
                                          <div>
                                            <h4 className="font-medium">
                                              {item.titulo}
                                              {item.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                                            </h4>
                                            {item.descricao && (
                                              <p className="text-sm text-gray-600 mt-1">
                                                {item.descricao}
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <Input
                                              value={item.titulo}
                                              onChange={(e) => atualizarItem(secaoIndex, itemIndex, { titulo: e.target.value })}
                                              placeholder="Título do item"
                                              className="font-medium"
                                            />
                                            <Input
                                              value={item.descricao || ''}
                                              onChange={(e) => atualizarItem(secaoIndex, itemIndex, { descricao: e.target.value })}
                                              placeholder="Descrição (opcional)"
                                              className="text-sm"
                                            />
                                            <div className="flex gap-2">
                                              <Select 
                                                value={item.tipo} 
                                                onValueChange={(value: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao') => atualizarItem(secaoIndex, itemIndex, { tipo: value })}
                                              >
                                                <SelectTrigger className="flex-1">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="texto">📝 Texto</SelectItem>
                                                  <SelectItem value="numero">🔢 Número</SelectItem>
                                                  <SelectItem value="sim_nao">✅ Sim/Não</SelectItem>
                                                  <SelectItem value="data">📅 Data</SelectItem>
                                                  <SelectItem value="assinatura">✍️ Assinatura</SelectItem>
                                                  <SelectItem value="foto_camera">📷 Foto (Câmera)</SelectItem>
                                                  <SelectItem value="foto_upload">🖼️ Foto (Upload)</SelectItem>
                                                  <SelectItem value="avaliacao">⭐ Avaliação</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  checked={item.obrigatorio}
                                                  onCheckedChange={(checked) => 
                                                    atualizarItem(secaoIndex, itemIndex, { obrigatorio: checked })
                                                  }
                                                />
                                                <Label className="text-sm">Obrigatório</Label>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {!mobilePreview && (
                                      <Button
                                        onClick={() => removerItem(secaoIndex, itemIndex)}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 ml-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Adicionar Item */}
                            {!mobilePreview && (
                              <Button
                                onClick={() => adicionarItem(secaoIndex)}
                                variant="outline"
                                className="w-full mt-3"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Item
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Versões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versoes.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma versão anterior
                  </h3>
                  <p className="text-gray-600">
                    Este checklist ainda não foi editado
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versoes.map((versao) => (
                    <div
                      key={versao.versao}
                      className={`border rounded-lg p-4 ${
                        versao.e_versao_atual ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={versao.e_versao_atual ? 'default' : 'outline'}>
                            v{versao.versao} {versao.e_versao_atual && '(Atual)'}
                          </Badge>
                          <div>
                            <h4 className="font-medium">{versao.nome}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {versao.usuario}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatarData(versao.data)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {versao.tipo}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {versao.pode_rollback && (
                          <Button
                            onClick={() => fazerRollback(versao.versao)}
                            size="sm"
                            variant="outline"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurar
                          </Button>
                        )}
                      </div>

                      {versao.comentario && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                          {versao.comentario}
                        </p>
                      )}

                      {versao.mudancas.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Alterações:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {versao.mudancas.slice(0, 3).map((mudanca, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-gray-400 mt-0.5">•</span>
                                <span>{mudanca}</span>
                              </li>
                            ))}
                            {versao.mudancas.length > 3 && (
                              <li className="text-gray-500 italic">
                                ... e mais {versao.mudancas.length - 3} alterações
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 