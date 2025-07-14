"use client"

import { useState, useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar, commonBulkActions, type BulkAction } from '@/components/ui/bulk-actions-toolbar'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { 
  Settings,
  Users,
  FileText,
  CheckSquare,
  Trash2,
  Edit,
  Copy,
  Download,
  Archive,
  Eye,
  X,
  Play,
  Pause
} from 'lucide-react'

interface DemoItem {
  id: string
  nome: string
  tipo: 'usuario' | 'checklist' | 'documento'
  status: 'ativo' | 'inativo' | 'pendente'
  categoria: string
  criado_em: string
  ativo: boolean
}

export default function BulkActionsDemo() {
  const { setPageTitle } = usePageTitle()
  
  useEffect(() => {
    setPageTitle('Bulk Actions - Sistema')
  }, [setPageTitle])

  // Estados
  const [items, setItems] = useState<DemoItem[]>([])
  const [filtro, setFiltro] = useState('')

  // Mock data
  useEffect(() => {
    const mockItems: DemoItem[] = [
      {
        id: '1',
        nome: 'João Silva',
        tipo: 'usuario',
        status: 'ativo',
        categoria: 'Gerente',
        criado_em: '2024-01-15',
        ativo: true
      },
      {
        id: '2',
        nome: 'Checklist Abertura',
        tipo: 'checklist',
        status: 'ativo',
        categoria: 'Operacional',
        criado_em: '2024-01-10',
        ativo: true
      },
      {
        id: '3',
        nome: 'Maria Santos',
        tipo: 'usuario',
        status: 'inativo',
        categoria: 'Funcionário',
        criado_em: '2024-01-08',
        ativo: false
      },
      {
        id: '4',
        nome: 'Relatório Mensal',
        tipo: 'documento',
        status: 'pendente',
        categoria: 'Financeiro',
        criado_em: '2024-01-20',
        ativo: true
      },
      {
        id: '5',
        nome: 'Checklist Limpeza',
        tipo: 'checklist',
        status: 'ativo',
        categoria: 'Qualidade',
        criado_em: '2024-01-12',
        ativo: true
      },
      {
        id: '6',
        nome: 'Pedro Costa',
        tipo: 'usuario',
        status: 'ativo',
        categoria: 'Funcionário',
        criado_em: '2024-01-18',
        ativo: true
      }
    ]
    setItems(mockItems)
  }, [])

  // Filtros
  const itemsFiltrados = items.filter(item =>
    item.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    item.categoria.toLowerCase().includes(filtro.toLowerCase())
  )

  // Bulk selection
  const bulkSelection = useBulkSelection(itemsFiltrados, {
    onSelectionChange: (selectedItems) => {
      console.log('Seleção alterada:', selectedItems)
    }
  })

  // Bulk actions handlers
  const handleBulkDelete = async (selectedItems: DemoItem[]) => {
    console.log('Deletando items:', selectedItems)
    setItems(prev => prev.filter(item => !selectedItems.find(selected => selected.id === item.id)))
    bulkSelection.clearSelection()
  }

  const handleBulkActivate = async (selectedItems: DemoItem[]) => {
    console.log('Ativando items:', selectedItems)
    const ids = selectedItems.map(item => item.id)
    setItems(prev => prev.map(item => 
      ids.includes(item.id) ? { ...item, ativo: true, status: 'ativo' as const } : item
    ))
    bulkSelection.clearSelection()
  }

  const handleBulkDeactivate = async (selectedItems: DemoItem[]) => {
    console.log('Desativando items:', selectedItems)
    const ids = selectedItems.map(item => item.id)
    setItems(prev => prev.map(item => 
      ids.includes(item.id) ? { ...item, ativo: false, status: 'inativo' as const } : item
    ))
    bulkSelection.clearSelection()
  }

  const handleBulkDuplicate = async (selectedItems: DemoItem[]) => {
    console.log('Duplicando items:', selectedItems)
    const newItems = selectedItems.map(item => ({
      ...item,
      id: `${item.id}_copy_${Date.now()}`,
      nome: `${item.nome} (Cópia)`,
      criado_em: new Date().toISOString().split('T')[0]
    }))
    setItems(prev => [...prev, ...newItems])
    bulkSelection.clearSelection()
  }

  const handleBulkArchive = async (selectedItems: DemoItem[]) => {
    console.log('Arquivando items:', selectedItems)
    const ids = selectedItems.map(item => item.id)
    setItems(prev => prev.map(item => 
      ids.includes(item.id) ? { ...item, status: 'pendente' as const } : item
    ))
    bulkSelection.clearSelection()
  }

  const handleBulkExport = async (selectedItems: DemoItem[]) => {
    console.log('Exportando items:', selectedItems)
    const csvContent = [
      'Nome,Tipo,Status,Categoria,Criado em',
      ...selectedItems.map(item => 
        `${item.nome},${item.tipo},${item.status},${item.categoria},${item.criado_em}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    bulkSelection.clearSelection()
  }

  // Configurar bulk actions
  const bulkActions: BulkAction[] = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'activate',
      label: 'Ativar',
      icon: Play,
      variant: 'outline',
      onClick: handleBulkActivate
    },
    {
      id: 'deactivate',
      label: 'Desativar',
      icon: Pause,
      variant: 'outline',
      onClick: handleBulkDeactivate,
      requiresConfirmation: true
    },
    commonBulkActions.duplicate(handleBulkDuplicate),
    commonBulkActions.archive(handleBulkArchive),
    commonBulkActions.download(handleBulkExport)
  ]

  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'usuario': return Users
      case 'checklist': return CheckSquare
      case 'documento': return FileText
      default: return FileText
    }
  }

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'inativo': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <ProtectedRoute requiredModule="configuracoes" requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Bulk Actions</h1>
                <p className="text-gray-600 dark:text-gray-400">Demonstração de seleção múltipla e operações em lote</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <div className="text-blue-600 dark:text-blue-400 font-semibold text-lg">{items.length}</div>
                <div className="text-blue-600 dark:text-blue-400 text-sm">Total de Items</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
                  {items.filter(item => item.status === 'ativo').length}
                </div>
                <div className="text-green-600 dark:text-green-400 text-sm">Ativos</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold text-lg">
                  {bulkSelection.selectionCount}
                </div>
                <div className="text-yellow-600 dark:text-yellow-400 text-sm">Selecionados</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                <div className="text-purple-600 dark:text-purple-400 font-semibold text-lg">
                  {bulkSelection.getSelectionStats().percentage}%
                </div>
                <div className="text-purple-600 dark:text-purple-400 text-sm">Percentual</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <Input
              placeholder="Filtrar por nome ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={bulkSelection.selectionCount}
            totalCount={itemsFiltrados.length}
            selectedItems={bulkSelection.selectedItems}
            actions={bulkActions}
            onClearSelection={bulkSelection.clearSelection}
            className="mb-6"
          />

          {/* Header da Lista */}
          {itemsFiltrados.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Checkbox
                checked={bulkSelection.isAllSelected}
                onCheckedChange={bulkSelection.selectAll}
                className="border-gray-400 dark:border-gray-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {bulkSelection.isAllSelected 
                  ? 'Desmarcar todos' 
                  : bulkSelection.isIndeterminate 
                    ? `${bulkSelection.selectionCount} selecionados`
                    : 'Selecionar todos'
                }
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                {itemsFiltrados.length} items totais
              </span>
            </div>
          )}

          {/* Lista de Items */}
          <div className="space-y-3">
            {itemsFiltrados.map((item) => {
              const IconeComponent = obterIconeTipo(item.tipo)

              return (
                <Card 
                  key={item.id} 
                  className={`transition-all duration-200 hover:shadow-md ${
                    bulkSelection.isSelected(item.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'bg-white dark:bg-gray-800'
                  } border-gray-200 dark:border-gray-700`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={bulkSelection.isSelected(item.id)}
                        onCheckedChange={(e) => bulkSelection.toggleItem(item.id, e as any)}
                        className="border-gray-400 dark:border-gray-500"
                      />
                      
                      <div className={`p-2 rounded-lg ${item.ativo ? 'bg-blue-500' : 'bg-gray-400'} text-white`}>
                        <IconeComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.nome}</h3>
                          <Badge className={obterCorStatus(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>Categoria: {item.categoria}</span>
                          <span>Criado: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => bulkSelection.selectItem(item.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Estado vazio */}
          {itemsFiltrados.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400">Ajuste os filtros para ver os resultados</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
} 