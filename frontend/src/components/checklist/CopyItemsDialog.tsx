'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Copy, 
  Search, 
  Check, 
  X,
  ChevronRight,
  FileText,
  Filter,
  CheckSquare,
  ArrowRight,
  Clipboard,
  Target
} from 'lucide-react'

// =====================================================
// ðŸ“± COPIAR ITENS ENTRE CHECKLISTS (MOBILE-FRIENDLY)
// =====================================================

interface ChecklistItem {
  id: string
  titulo: string
  tipo: string
  obrigatorio: boolean
  secao?: string
  placeholder?: string
  descricao?: string
  ordem?: number
}

interface Checklist {
  id: string
  titulo: string
  descricao?: string
  categoria: string
  totalItens: number
  items?: ChecklistItem[]
}

interface CopyItemsDialogProps {
  sourceChecklist: Checklist
  availableChecklists: Checklist[]
  onCopyItems: (targetChecklistId: string, items: ChecklistItem[]) => Promise<void>
  children: React.ReactNode
}

export default function CopyItemsDialog({
  sourceChecklist,
  availableChecklists,
  onCopyItems,
  children
}: CopyItemsDialogProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'select-items' | 'choose-target' | 'confirm'>('select-items')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [targetChecklistId, setTargetChecklistId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBySection, setFilterBySection] = useState<string>('')
  const [onlyRequired, setOnlyRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Filtros
  const filteredItems = sourceChecklist.items?.filter((item) => {
    const matchesSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSection = !filterBySection || item.secao === filterBySection
    const matchesRequired = !onlyRequired || item.obrigatorio
    return matchesSearch && matchesSection && matchesRequired
  }) || []

  const sections = [...new Set(sourceChecklist.items?.map((item) => item.secao).filter(Boolean))]
  const selectedItemsData = sourceChecklist.items?.filter((item) => selectedItems.includes(item.id)) || []
  const targetChecklist = availableChecklists.find((c) => c.id === targetChecklistId)

  const resetDialog = () => {
    setCurrentStep('select-items')
    setSelectedItems([])
    setTargetChecklistId('')
    setSearchTerm('')
    setFilterBySection('')
    setOnlyRequired(false)
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    const allFilteredIds = filteredItems.map((item) => item.id)
    const isAllSelected = allFilteredIds.every(id => selectedItems.includes(id))
    
    if (isAllSelected) {
      setSelectedItems(prev => prev.filter((id) => !allFilteredIds.includes(id)))
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...allFilteredIds])])
    }
  }

  const handleCopy = async () => {
    if (!targetChecklistId || selectedItemsData.length === 0) return
    
    setIsLoading(true)
    try {
      await onCopyItems(targetChecklistId, selectedItemsData)
      setIsOpen(false)
      resetDialog()
    } catch (error) {
      console.error('Erro ao copiar itens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'sim_nao': return 'œ…'
      case 'texto': return 'ðŸ“'
      case 'numero': return 'ðŸ”¢'
      case 'data': return 'ðŸ“…'
      case 'foto_camera': return 'ðŸ“·'
      case 'foto_upload': return 'ðŸ–¼ï¸'
      case 'avaliacao': return '­'
      case 'assinatura': return 'œï¸'
      default: return 'ðŸ“‹'
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-items':
        return (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterBySection}
                  onChange={(e) => setFilterBySection(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Todas as seá§áµes</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="only-required"
                    checked={onlyRequired}
                    onCheckedChange={setOnlyRequired}
                  />
                  <Label htmlFor="only-required" className="text-sm">
                    Apenas obrigatá³rios
                  </Label>
                </div>
              </div>
            </div>

            {/* Botá£o Selecionar Todos */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedItems.length} de {filteredItems.length} itens selecionados
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="touch-manipulation"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                {filteredItems.every(item => selectedItems.includes(item.id)) ? 'Desmarcar' : 'Selecionar'} Todos
              </Button>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer transition-all touch-manipulation ${
                    selectedItems.includes(item.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${selectedItems.includes(item.id) 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {selectedItems.includes(item.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-lg">{getItemIcon(item.tipo)}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.titulo}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.tipo}
                          </Badge>
                          {item.obrigatorio && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Obrigatá³rio
                            </Badge>
                          )}
                          {item.secao && (
                            <Badge variant="outline" className="text-xs">
                              {item.secao}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum item encontrado com os filtros aplicados</p>
              </div>
            )}
          </div>
        )

      case 'choose-target':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">ðŸ“‹</div>
              <div className="text-sm font-medium">
                {selectedItems.length} {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Escolher checklist de destino:
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableChecklists
                  .filter((c) => c.id !== sourceChecklist.id)
                  .map((checklist) => (
                    <Card 
                      key={checklist.id}
                      className={`cursor-pointer transition-all touch-manipulation ${
                        targetChecklistId === checklist.id 
                          ? 'ring-2 ring-green-500 bg-green-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setTargetChecklistId(checklist.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full
                            ${targetChecklistId === checklist.id 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                            }
                          `}>
                            {targetChecklistId === checklist.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Target className="w-4 h-4" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {checklist.titulo}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {checklist.categoria}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {checklist.totalItens} itens
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">œ…</div>
              <div className="text-sm font-medium">
                Confirmar cá³pia de itens
              </div>
            </div>

            <div className="space-y-4">
              {/* Resumo da Origem */}
              <div>
                <Label className="text-sm font-medium text-gray-700">De:</Label>
                <Card className="mt-1 bg-blue-50">
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{sourceChecklist.titulo}</div>
                    <div className="text-xs text-gray-600">{selectedItems.length} itens selecionados</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* Resumo do Destino */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Para:</Label>
                <Card className="mt-1 bg-green-50">
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{targetChecklist?.titulo}</div>
                    <div className="text-xs text-gray-600">{targetChecklist?.totalItens} itens existentes</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Itens a Copiar */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Itens que será£o copiados:</Label>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {selectedItemsData.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-lg">{getItemIcon(item.tipo)}</span>
                      <span className="truncate">{item.titulo}</span>
                      {item.obrigatorio && (
                        <Badge className="bg-red-100 text-red-800 text-xs">*</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case 'select-items':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 touch-manipulation"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={() => setCurrentStep('choose-target')}
              disabled={selectedItems.length === 0}
              className="flex-1 touch-manipulation"
            >
              Prá³ximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'choose-target':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('select-items')}
              className="flex-1 touch-manipulation"
            >
              Voltar
            </Button>
            <Button
              onClick={() => setCurrentStep('confirm')}
              disabled={!targetChecklistId}
              className="flex-1 touch-manipulation"
            >
              Prá³ximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 'confirm':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('choose-target')}
              className="flex-1 touch-manipulation"
              disabled={isLoading}
            >
              Voltar
            </Button>
            <Button
              onClick={handleCopy}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 touch-manipulation"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Copiando...
                </div>
              ) : (
                <>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copiar Itens
                </>
              )}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-600" />
            Copiar Itens
          </DialogTitle>
        </DialogHeader>
        
        {/* Indicador de Etapas */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'select-items' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'choose-target' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'confirm' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
        </div>

        {renderStepContent()}
        
        <Separator className="my-4" />
        
        {renderFooter()}
        </DialogContent>
      </Dialog>
    </>
  )
}

// =====================================================
// ðŸŽ¯ HOOK PARA GERENCIAR Cá“PIA DE ITENS
// =====================================================

export function useCopyItems() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copyItems = async (
    targetChecklistId: string, 
    items: ChecklistItem[]
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/checklists/copy-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetChecklistId,
          items: items.map((item) => ({
            ...item,
            id: undefined, // Remove ID para criar novo
            ordem: undefined // Será¡ definido automaticamente
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao copiar itens')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    copyItems,
    isLoading,
    error
  }
} 
