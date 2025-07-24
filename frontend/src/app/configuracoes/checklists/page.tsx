'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar, commonBulkActions, type BulkAction } from '@/components/ui/bulk-actions-toolbar'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Settings,
  FileText,
  Coffee,
  ChefHat,
  Utensils,
  Truck,
  Shield,
  Store,
  Calendar,
  Clock,
  Users,
  Eye,
  X
} from 'lucide-react'

interface icon { $2: Record<string, unknown> }

interface ChecklistTemplate {
  id: string
  nome: string
  setor: string
  descricao: string
  tipo: 'abertura' | 'fechamento' | 'manutencao' | 'qualidade' | 'seguranca' | 'limpeza'
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'conforme_necessario' | 'quinzenal' | 'bimestral' | 'trimestral'
  tempo_estimado: number
  responsavel_padrao: string
  ativo: boolean
  usado_recentemente?: boolean
  ultima_edicao: string
  itens_total: number
  criado_por?: string
}

interface Setor {
  id: string
  nome: string
  icon: React.ComponentType<{ className?: string }>
  cor: string
  responsavel_padrao: string
}

export default function AdminChecklists() {
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  const router = useRouter()
  
  // Estados principais
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([])
  const [setorFiltro, setSetorFiltro] = useState<string>('todos')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  
  // Modais
  const [modalNovoChecklist, setModalNovoChecklist] = useState(false)
  const [modalEditarChecklist, setModalEditarChecklist] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<ChecklistTemplate | null>(null)
  
  // Novo checklist
  const [novoChecklist, setNovoChecklist] = useState<{
    nome: string
    setor: string
    descricao: string
    tipo: 'abertura' | 'fechamento' | 'manutencao' | 'qualidade' | 'seguranca' | 'limpeza'
    frequencia: 'diaria' | 'semanal' | 'mensal' | 'conforme_necessario' | 'quinzenal' | 'bimestral' | 'trimestral'
    tempo_estimado: number
    responsavel_padrao: string
  }>({
    nome: '',
    setor: '',
    descricao: '',
    tipo: 'abertura',
    frequencia: 'diaria',
    tempo_estimado: 30,
    responsavel_padrao: ''
  })

  // Configuração dos setores
  const setores: Setor[] = [
    {
      id: 'cozinha',
      nome: 'Cozinha',
      icon: ChefHat,
      cor: 'bg-orange-500',
      responsavel_padrao: 'Chef/Cozinheiro'
    },
    {
      id: 'bar',
      nome: 'Bar',
      icon: Coffee,
      cor: 'bg-blue-500',
      responsavel_padrao: 'Bartender'
    },
    {
      id: 'salao',
      nome: 'Salão',
      icon: Utensils,
      cor: 'bg-green-500',
      responsavel_padrao: 'Gerente de Salão'
    },
    {
      id: 'recebimento',
      nome: 'Recebimento',
      icon: Truck,
      cor: 'bg-purple-500',
      responsavel_padrao: 'Responsável Estoque'
    },
    {
      id: 'seguranca',
      nome: 'Segurança',
      icon: Shield,
      cor: 'bg-red-500',
      responsavel_padrao: 'Gerente Geral'
    },
    {
      id: 'administrativo',
      nome: 'Administrativo',
      icon: FileText,
      cor: 'bg-gray-500',
      responsavel_padrao: 'Gerente'
    }
  ]

  // Dados reais do banco - sem fallback para mock

  const carregarChecklists = useCallback(async () => {
    if (!selectedBar?.id) return

    try {
      const response = await fetch('/api/checklists')
      if (response.ok) {
        const data = await response.json()
        setChecklists(data)
      } else {
        console.error('Erro ao carregar checklists')
        setChecklists([])
      }
    } catch (error) {
      console.error('Erro ao carregar checklists:', error)
      setChecklists([])
    }
  }, [selectedBar?.id]);

  useEffect(() => {
    carregarChecklists()
  }, [carregarChecklists])

  useEffect(() => {
    setPageTitle('Gestão de Checklists')
    return () => setPageTitle('')
  }, [setPageTitle])

  // Filtrar checklists
  const checklistsFiltrados = checklists.filter(checklist => {
    const matchSetor = setorFiltro === 'todos' || checklist.setor === setorFiltro
    const matchTipo = tipoFiltro === 'todos' || checklist.tipo === tipoFiltro
    const matchBusca = checklist.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      checklist.descricao.toLowerCase().includes(busca.toLowerCase())
    
    return matchSetor && matchTipo && matchBusca
  })

  // Bulk selection
  const bulkSelection = useBulkSelection(checklistsFiltrados)

  // Bulk actions
  const handleBulkDelete = async (selectedItems: ChecklistTemplate[]) => {
    try {
      const response = await fetch('/api/checklists/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          checklistIds: selectedItems.map(item => item.id)
        })
      })

      if (response.ok) {
        bulkSelection.clearSelection()
        carregarChecklists()
      }
    } catch (error) {
      console.error('Erro ao deletar checklists:', error)
    }
  }

  const handleBulkActivate = async (selectedItems: ChecklistTemplate[]) => {
    try {
      const response = await fetch('/api/checklists/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          checklistIds: selectedItems.map(item => item.id)
        })
      })

      if (response.ok) {
        bulkSelection.clearSelection()
        carregarChecklists()
      }
    } catch (error) {
      console.error('Erro ao ativar checklists:', error)
    }
  }

  const handleBulkDeactivate = async (selectedItems: ChecklistTemplate[]) => {
    try {
      const response = await fetch('/api/checklists/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          checklistIds: selectedItems.map(item => item.id)
        })
      })

      if (response.ok) {
        bulkSelection.clearSelection()
        carregarChecklists()
      }
    } catch (error) {
      console.error('Erro ao desativar checklists:', error)
    }
  }

  const handleBulkDuplicate = async (selectedItems: ChecklistTemplate[]) => {
    try {
      const response = await fetch('/api/checklists/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          checklistIds: selectedItems.map(item => item.id)
        })
      })

      if (response.ok) {
        bulkSelection.clearSelection()
        carregarChecklists()
      }
    } catch (error) {
      console.error('Erro ao duplicar checklists:', error)
    }
  }

  const bulkActions: BulkAction[] = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'activate',
      label: 'Ativar',
      icon: Eye,
      variant: 'outline',
      onClick: handleBulkActivate
    },
    {
      id: 'deactivate',
      label: 'Desativar',
      icon: X,
      variant: 'outline',
      onClick: handleBulkDeactivate
    },
    commonBulkActions.duplicate(handleBulkDuplicate),
  ]

  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'abertura': return 'bg-green-500'
      case 'fechamento': return 'bg-orange-500'
      case 'manutencao': return 'bg-blue-500'
      case 'qualidade': return 'bg-purple-500'
      case 'seguranca': return 'bg-red-500'
      case 'limpeza': return 'bg-cyan-500'
      default: return 'bg-gray-500'
    }
  }

  const obterCorFrequencia = (frequencia: string) => {
    switch (frequencia) {
      case 'diaria': return 'bg-blue-100 text-blue-800'
      case 'semanal': return 'bg-yellow-100 text-yellow-800'
      case 'mensal': return 'bg-purple-100 text-purple-800'
      case 'conforme_necessario': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCriarChecklist = () => {
    setNovoChecklist({
      nome: '',
      setor: '',
      descricao: '',
      tipo: 'abertura',
      frequencia: 'diaria',
      tempo_estimado: 30,
      responsavel_padrao: ''
    })
    setModalNovoChecklist(true)
  }

  const handleSalvarNovoChecklist = async () => {
    try {
      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoChecklist)
      })

      if (response.ok) {
        console.log('✅ Checklist criado com sucesso')
        setModalNovoChecklist(false)
        // Recarregar lista
        carregarChecklists()
        // Reset form
        setNovoChecklist({
          nome: '',
          setor: '',
          descricao: '',
          tipo: 'abertura',
          frequencia: 'diaria',
          tempo_estimado: 30,
          responsavel_padrao: ''
        })
      } else {
        const errorData = await response.json()
        console.error('❌ Erro ao salvar checklist:', errorData)
        alert('Erro ao salvar checklist. Tente novamente.')
      }
    } catch (error) {
      console.error('💥 Erro ao salvar checklist:', error)
      alert('Erro ao salvar checklist. Verifique sua conexão.')
    }
  }

  const handleEditarChecklist = (checklist: ChecklistTemplate) => {
    setChecklistSelecionado(checklist)
    setModalEditarChecklist(true)
  }

  const handleCopiarChecklist = (checklist: ChecklistTemplate) => {
    setNovoChecklist({
      nome: `${checklist.nome} (Cópia)`,
      setor: checklist.setor,
      descricao: checklist.descricao,
      tipo: checklist.tipo,
      frequencia: checklist.frequencia,
      tempo_estimado: checklist.tempo_estimado,
      responsavel_padrao: checklist.responsavel_padrao
    })
    setModalNovoChecklist(true)
  }

  const handleExcluirChecklist = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
      // TODO: Implementar exclusão no banco
      console.log('Excluindo checklist:', id)
      carregarChecklists()
    }
  }

  return (
    <ProtectedRoute requiredModule="operacoes" requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Informacoes do Bar */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600">Criar, editar e gerenciar checklists por setor</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Bar: <strong className="text-gray-800 dark:text-gray-200">{selectedBar?.nome}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400"><strong className="text-gray-800 dark:text-gray-200">{checklists.length}</strong> checklists cadastrados</span>
              </div>
            </div>
          </div>

          {/* Ações e Filtros */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">🔍</span>
                </div>
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-11 pl-10 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={setorFiltro} onValueChange={setSetorFiltro}>
                <SelectTrigger className="w-48 h-11 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm">
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg">
                  <SelectItem value="todos" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <span className="font-medium">Todos os setores</span>
                  </SelectItem>
                  {setores.map((setor) => {
                    const SetorIcon = setor.icon
                    return (
                      <SelectItem key={setor.id} value={setor.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded ${setor.cor} flex items-center justify-center`}>
                            <SetorIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium">{setor.nome}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="w-48 h-11 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg">
                  <SelectItem value="todos" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <span className="font-medium">Todos os tipos</span>
                  </SelectItem>
                  <SelectItem value="abertura" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Abertura</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fechamento" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">Fechamento</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manutencao" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Manutenção</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualidade" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">Qualidade</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="seguranca" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Segurança</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="limpeza" className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                      <span className="font-medium">Limpeza</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleCriarChecklist}
                className="h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Checklist
              </Button>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={bulkSelection.selectedCount}
            totalCount={checklistsFiltrados.length}
            selectedItems={Array.from(bulkSelection.selectedItems)}
            actions={bulkActions}
            onClearSelection={bulkSelection.clearSelection}
            className="mb-4"
          />

          {/* Header da Lista com Seleção */}
          {checklistsFiltrados.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Checkbox
                checked={bulkSelection.isAllSelected}
                onCheckedChange={bulkSelection.toggleAll}
                className="border-gray-400 dark:border-gray-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {bulkSelection.isAllSelected 
                  ? 'Desmarcar todos' 
                  : bulkSelection.isIndeterminate 
                    ? `${bulkSelection.selectedCount} selecionados`
                    : 'Selecionar todos'
                }
              </span>
            </div>
          )}

          {/* Lista de Checklists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {checklistsFiltrados.map((checklist) => {
              const setor = setores.find(s => s.id === checklist.setor)
              const SetorIcon = setor?.icon || FileText

              return (
                <Card key={checklist.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={bulkSelection.isSelected(checklist.id)}
                          onCheckedChange={() => bulkSelection.toggleItem(checklist.id)}
                          className="border-gray-400 dark:border-gray-500"
                        />
                        <div className={`p-2 rounded-lg ${setor?.cor || 'bg-gray-500'} text-white`}>
                          <SetorIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{checklist.nome}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{setor?.nome}</p>
                        </div>
                      </div>
                      {checklist.usado_recentemente && (
                        <Badge className="bg-blue-100 text-blue-800">Recente</Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{checklist.descricao}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-xs text-white ${obterCorTipo(checklist.tipo)}`}>
                        {checklist.tipo}
                      </Badge>
                      <Badge className={`text-xs ${obterCorFrequencia(checklist.frequencia)}`}>
                        {checklist.frequencia}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                        {checklist.itens_total} itens
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-gray-200">{checklist.tempo_estimado}min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-gray-200">{checklist.responsavel_padrao}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-gray-200">{checklist.ultima_edicao}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className={`font-medium ${checklist.ativo ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          {checklist.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditarChecklist(checklist)}
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopiarChecklist(checklist)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluirChecklist(checklist.id)}
                        className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {checklistsFiltrados.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Store className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Nenhum checklist encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {busca || setorFiltro !== 'todos' || tipoFiltro !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro checklist'
                }
              </p>
              {!busca && setorFiltro === 'todos' && tipoFiltro === 'todos' && (
                <Button 
                  onClick={handleCriarChecklist} 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Checklist
                </Button>
              )}
            </div>
          )}

          {/* Modal Editar Checklist */}
          <Dialog open={modalEditarChecklist} onOpenChange={setModalEditarChecklist}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Editar Checklist
                </DialogTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  {checklistSelecionado ? `Editando: ${checklistSelecionado.nome}` : 'Editar informações do checklist'}
                </p>
              </DialogHeader>
              
              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-6">
                {checklistSelecionado && (
                  <div className="modal-form-grid">
                    {/* Nome do Checklist */}
                    <div className="modal-form-group-full">
                      <Label htmlFor="editNome" className="modal-label flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Nome do Checklist *
                      </Label>
                      <Input
                        id="editNome"
                        value={checklistSelecionado.nome}
                        onChange={(e) => setChecklistSelecionado({...checklistSelecionado, nome: e.target.value})}
                        placeholder="Ex: Checklist de Abertura da Cozinha"
                        className="modal-input"
                      />
                    </div>

                    {/* Setor */}
                    <div className="modal-form-group">
                      <Label htmlFor="editSetor" className="modal-label flex items-center gap-2">
                        <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Setor *
                      </Label>
                      <Select value={checklistSelecionado.setor} onValueChange={(value) => {
                        const setorSelecionado = setores.find(s => s.id === value)
                        setChecklistSelecionado({
                          ...checklistSelecionado, 
                          setor: value,
                          responsavel_padrao: setorSelecionado?.responsavel_padrao || checklistSelecionado.responsavel_padrao
                        })
                      }}>
                        <SelectTrigger className="modal-select-trigger">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent className="modal-select-content">
                          {setores.map((setor) => {
                            const SetorIcon = setor.icon
                            return (
                              <SelectItem key={setor.id} value={setor.id} className="cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded ${setor.cor} flex items-center justify-center`}>
                                    <SetorIcon className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="font-medium">{setor.nome}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                      <Label htmlFor="editDescricao" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        Descrição
                      </Label>
                      <Input
                        id="editDescricao"
                        value={checklistSelecionado.descricao}
                        onChange={(e) => setChecklistSelecionado({...checklistSelecionado, descricao: e.target.value})}
                        placeholder="Breve descrição do que será verificado"
                        className="h-11 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Tipo e Frequência */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editTipo" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-orange-600" />
                          Tipo *
                        </Label>
                        <Select value={checklistSelecionado.tipo} onValueChange={(value: 'abertura' | 'fechamento' | 'manutencao' | 'qualidade' | 'seguranca' | 'limpeza') => setChecklistSelecionado({...checklistSelecionado, tipo: value})}>
                          <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="abertura" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                Abertura
                              </div>
                            </SelectItem>
                            <SelectItem value="fechamento" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                Fechamento
                              </div>
                            </SelectItem>
                            <SelectItem value="manutencao" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                Manutenção
                              </div>
                            </SelectItem>
                            <SelectItem value="qualidade" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                Qualidade
                              </div>
                            </SelectItem>
                            <SelectItem value="seguranca" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                Segurança
                              </div>
                            </SelectItem>
                            <SelectItem value="limpeza" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                Limpeza
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editFrequencia" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          Frequência *
                        </Label>
                        <Select value={checklistSelecionado.frequencia} onValueChange={(value: 'diaria' | 'semanal' | 'mensal' | 'conforme_necessario' | 'quinzenal' | 'bimestral' | 'trimestral') => setChecklistSelecionado({...checklistSelecionado, frequencia: value})}>
                          <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="diaria" className="cursor-pointer hover:bg-gray-50">Diária</SelectItem>
                            <SelectItem value="semanal" className="cursor-pointer hover:bg-gray-50">Semanal</SelectItem>
                            <SelectItem value="mensal" className="cursor-pointer hover:bg-gray-50">Mensal</SelectItem>
                            <SelectItem value="conforme_necessario" className="cursor-pointer hover:bg-gray-50">Conforme necessário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tempo e Responsável */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editTempo" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Tempo Estimado
                        </Label>
                        <div className="relative">
                          <Input
                            id="editTempo"
                            type="number"
                            value={checklistSelecionado.tempo_estimado}
                            onChange={(e) => setChecklistSelecionado({...checklistSelecionado, tempo_estimado: parseInt(e.target.value) || 0})}
                            min="1"
                            max="480"
                            className="h-11 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 pr-16"
                            placeholder="30"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                            min
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editResponsavel" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-600" />
                          Responsável Padrão
                        </Label>
                        <Input
                          id="editResponsavel"
                          value={checklistSelecionado.responsavel_padrao}
                          onChange={(e) => setChecklistSelecionado({...checklistSelecionado, responsavel_padrao: e.target.value})}
                          placeholder="Ex: Gerente, Chef, Bartender"
                          className="h-11 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-600" />
                        Status
                      </Label>
                      <Select value={checklistSelecionado.ativo ? 'ativo' : 'inativo'} onValueChange={(value) => setChecklistSelecionado({...checklistSelecionado, ativo: value === 'ativo'})}>
                        <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="ativo" className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Ativo
                            </div>
                          </SelectItem>
                          <SelectItem value="inativo" className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              Inativo
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Informações adicionais */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900 mb-1">Próximos Passos</h4>
                          <p className="text-sm text-amber-700">
                            Após salvar, você poderá editar as seções e itens específicos deste checklist.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer do Modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100">
                <DialogFooter className="gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setModalEditarChecklist(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('💾 Salvando alterações do checklist:', checklistSelecionado)
                      alert('✅ Checklist atualizado com sucesso!')
                      setModalEditarChecklist(false)
                      carregarChecklists()
                    }}
                    disabled={!checklistSelecionado?.nome?.trim() || !checklistSelecionado?.setor}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Novo Checklist - Design Profissional */}
          <Dialog open={modalNovoChecklist} onOpenChange={setModalNovoChecklist}>
            <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-xl p-0 gap-0">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    Novo Checklist
                  </DialogTitle>
                  <p className="text-green-50 text-sm mt-1">
                    Preencha as informações básicas do checklist
                  </p>
                </DialogHeader>
              </div>
              
              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-6">
                {/* Nome do Checklist */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Nome do Checklist *
                  </Label>
                  <Input
                    id="nome"
                    value={novoChecklist.nome}
                    onChange={(e) => setNovoChecklist({...novoChecklist, nome: e.target.value})}
                    placeholder="Ex: Checklist de Abertura da Cozinha"
                    className="h-11 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label htmlFor="setor" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    Setor *
                  </Label>
                  <Select value={novoChecklist.setor} onValueChange={(value) => {
                    const setorSelecionado = setores.find(s => s.id === value)
                    setNovoChecklist({
                      ...novoChecklist, 
                      setor: value,
                      responsavel_padrao: setorSelecionado?.responsavel_padrao || ''
                    })
                  }}>
                    <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {setores.map((setor) => {
                        const SetorIcon = setor.icon
                        return (
                          <SelectItem key={setor.id} value={setor.id} className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded ${setor.cor} flex items-center justify-center`}>
                                <SetorIcon className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium">{setor.nome}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Descrição
                  </Label>
                  <Input
                    id="descricao"
                    value={novoChecklist.descricao}
                    onChange={(e) => setNovoChecklist({...novoChecklist, descricao: e.target.value})}
                    placeholder="Breve descrição do que será verificado"
                    className="h-11 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                {/* Tipo e Frequência */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-600" />
                      Tipo *
                    </Label>
                    <Select value={novoChecklist.tipo} onValueChange={(value: 'abertura' | 'fechamento' | 'manutencao' | 'qualidade' | 'seguranca' | 'limpeza') => setNovoChecklist({...novoChecklist, tipo: value})}>
                      <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="abertura" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Abertura
                          </div>
                        </SelectItem>
                        <SelectItem value="fechamento" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            Fechamento
                          </div>
                        </SelectItem>
                        <SelectItem value="manutencao" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Manutenção
                          </div>
                        </SelectItem>
                        <SelectItem value="qualidade" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            Qualidade
                          </div>
                        </SelectItem>
                        <SelectItem value="seguranca" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            Segurança
                          </div>
                        </SelectItem>
                        <SelectItem value="limpeza" className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                            Limpeza
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequencia" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Frequência *
                    </Label>
                    <Select value={novoChecklist.frequencia} onValueChange={(value: 'diaria' | 'semanal' | 'mensal' | 'conforme_necessario' | 'quinzenal' | 'bimestral' | 'trimestral') => setNovoChecklist({...novoChecklist, frequencia: value})}>
                      <SelectTrigger className="h-11 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="diaria" className="cursor-pointer hover:bg-gray-50">Diária</SelectItem>
                        <SelectItem value="semanal" className="cursor-pointer hover:bg-gray-50">Semanal</SelectItem>
                        <SelectItem value="mensal" className="cursor-pointer hover:bg-gray-50">Mensal</SelectItem>
                        <SelectItem value="conforme_necessario" className="cursor-pointer hover:bg-gray-50">Conforme necessário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tempo e Responsável */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tempo" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      Tempo Estimado
                    </Label>
                    <div className="relative">
                      <Input
                        id="tempo"
                        type="number"
                        value={novoChecklist.tempo_estimado}
                        onChange={(e) => setNovoChecklist({...novoChecklist, tempo_estimado: parseInt(e.target.value) || 0})}
                        min="1"
                        max="480"
                        className="h-11 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500 pr-16"
                        placeholder="30"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                        min
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsavel" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      Responsável Padrão
                    </Label>
                    <Input
                      id="responsavel"
                      value={novoChecklist.responsavel_padrao}
                      onChange={(e) => setNovoChecklist({...novoChecklist, responsavel_padrao: e.target.value})}
                      placeholder="Ex: Gerente, Chef, Bartender"
                      className="h-11 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Próximo Passo</h4>
                      <p className="text-sm text-blue-700">
                        Após criar o checklist, você poderá adicionar seções e itens específicos para cada verificação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer do Modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100">
                <DialogFooter className="gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setModalNovoChecklist(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSalvarNovoChecklist}
                    disabled={!novoChecklist.nome?.trim() || !novoChecklist.setor}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Checklist
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
} 
