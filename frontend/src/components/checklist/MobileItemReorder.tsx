'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronUp, 
  ChevronDown, 
  GripVertical,
  Move,
  Check,
  X,
  RotateCcw
} from 'lucide-react'

// =====================================================
// Ã°Å¸â€œÂ± REORDENAÃ¡â€¡Ã¡Æ’O MOBILE-FRIENDLY
// =====================================================
// Interface otimizada para touch com botÃ¡Âµes grandes
// ao invÃ¡Â©s de drag & drop complexo

interface ReorderableItem {
  id: string
  titulo: string
  tipo: string
  obrigatorio: boolean
  ordem: number
  secao?: string
  placeholder?: string
}

interface MobileItemReorderProps {
  itens: ReorderableItem[]
  onReorder: (itens: ReorderableItem[]) => void
  onCancel?: () => void
  onSave?: () => void
  readonly?: boolean
}

export default function MobileItemReorder({
  itens,
  onReorder,
  onCancel,
  onSave,
  readonly = false
}: MobileItemReorderProps) {
  
  const [isReordering, setIsReordering] = useState(false)
  const [localItens, setLocalItens] = useState(itens)
  const [originalItens] = useState(itens)

  const startReordering = () => {
    setIsReordering(true)
    setLocalItens([...itens])
  }

  const cancelReordering = () => {
    setIsReordering(false)
    setLocalItens([...originalItens])
    onCancel?.()
  }

  const saveReordering = () => {
    setIsReordering(false)
    onReorder(localItens)
    onSave?.()
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = localItens.findIndex(item => item.id === itemId)
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === localItens.length - 1)
    ) {
      return // NÃ¡Â£o pode mover
    }

    const newItens = [...localItens]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Trocar posiÃ¡Â§Ã¡Âµes
    const temp = newItens[currentIndex]
    newItens[currentIndex] = newItens[targetIndex]
    newItens[targetIndex] = temp
    
    // Atualizar ordens
    newItens.forEach((item, index) => {
      item.ordem = index + 1
    })

    setLocalItens(newItens)
  }

  const canMoveUp = (itemId: string) => {
    const index = localItens.findIndex(item => item.id === itemId)
    return index > 0
  }

  const canMoveDown = (itemId: string) => {
    const index = localItens.findIndex(item => item.id === itemId)
    return index < localItens.length - 1
  }

  const getItemTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'sim_nao': return 'Å“â€¦'
      case 'texto': return 'Ã°Å¸â€œÂ'
      case 'numero': return 'Ã°Å¸â€Â¢'
      case 'data': return 'Ã°Å¸â€œâ€¦'
      case 'foto_camera': return 'Ã°Å¸â€œÂ·'
      case 'foto_upload': return 'Ã°Å¸â€“Â¼Ã¯Â¸Â'
      case 'avaliacao': return 'Â­Â'
      case 'assinatura': return 'Å“ÂÃ¯Â¸Â'
      default: return 'Ã°Å¸â€œâ€¹'
    }
  }

  if (readonly) {
    return (
      <div className="space-y-3">
        {itens.map((item, index) => (
          <Card key={item.id} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-lg text-gray-400">
                  {index + 1}
                </div>
                <div className="text-xl">
                  {getItemTypeIcon(item.tipo)}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{item.titulo}</span>
                  {item.obrigatorio && (
                    <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                      ObrigatÃ¡Â³rio
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de Controle */}
      {!isReordering ? (
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Move className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <Button 
            onClick={startReordering}
            className="bg-blue-600 hover:bg-blue-700 touch-manipulation"
            size="lg"
          >
            <Move className="w-4 h-4 mr-2" />
            Reordenar
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 p-4 bg-orange-50 rounded-lg">
          <Button 
            onClick={cancelReordering}
            variant="outline"
            className="flex-1 touch-manipulation"
            size="lg"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={saveReordering}
            className="flex-1 bg-green-600 hover:bg-green-700 touch-manipulation"
            size="lg"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}

      {/* Lista de Itens */}
      <div className="space-y-3">
        {localItens.map((item, index) => (
          <Card 
            key={item.id} 
            className={`
              transition-all duration-200
              ${isReordering ? 'ring-2 ring-blue-200 bg-blue-50' : 'bg-white'}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* NÃ¡Âºmero da Ordem */}
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-bold text-gray-700">
                  {index + 1}
                </div>

                {/* Ã¡Âcone do Tipo */}
                <div className="text-2xl">
                  {getItemTypeIcon(item.tipo)}
                </div>

                {/* InformaÃ¡Â§Ã¡Âµes do Item */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {item.titulo}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.tipo}
                    </Badge>
                    {item.obrigatorio && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        ObrigatÃ¡Â³rio
                      </Badge>
                    )}
                  </div>
                </div>

                {/* BotÃ¡Âµes de ReordenaÃ¡Â§Ã¡Â£o */}
                {isReordering && (
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(item.id, 'up')}
                      disabled={!canMoveUp(item.id)}
                      className="h-12 w-12 p-0 touch-manipulation"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(item.id, 'down')}
                      disabled={!canMoveDown(item.id)}
                      className="h-12 w-12 p-0 touch-manipulation"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Indicador de Modo de ReordenaÃ¡Â§Ã¡Â£o */}
                {isReordering && (
                  <div className="text-blue-500">
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dicas de Uso */}
      {isReordering && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-1">Ã°Å¸â€™Â¡</div>
            <div className="text-sm text-blue-800">
              <strong>Dicas:</strong>
              <ul className="mt-1 space-y-1">
                <li>â‚¬Â¢ Use os botÃ¡Âµes Â¬â€ Ã¯Â¸ÂÂ¬â€¡Ã¯Â¸Â para mover os itens</li>
                <li>â‚¬Â¢ A numeraÃ¡Â§Ã¡Â£o atualiza automaticamente</li>
                <li>â‚¬Â¢ Toque em "Salvar" para confirmar as mudanÃ¡Â§as</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* BotÃ¡Â£o de Reset (apenas durante reordenaÃ¡Â§Ã¡Â£o) */}
      {isReordering && (
        <Button 
          onClick={() => setLocalItens([...originalItens])}
          variant="outline"
          className="w-full touch-manipulation"
          size="lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Ordem Original
        </Button>
      )}
    </div>
  )
}

// =====================================================
// Ã°Å¸Å½Â¯ HOOK PARA GERENCIAR REORDENAÃ¡â€¡Ã¡Æ’O
// =====================================================

export function useItemReorder(initialItems: ReorderableItem[]) {
  const [items, setItems] = useState(initialItems)
  const [hasChanges, setHasChanges] = useState(false)

  const handleReorder = (newItems: ReorderableItem[]) => {
    setItems(newItems)
    setHasChanges(true)
  }

  const resetChanges = () => {
    setItems(initialItems)
    setHasChanges(false)
  }

  const saveChanges = async (onSave?: (items: ReorderableItem[]) => Promise<void>) => {
    try {
      if (onSave) {
        await onSave(items)
      }
      setHasChanges(false)
      return true
    } catch (error) {
      console.error('Erro ao salvar reordenaÃ¡Â§Ã¡Â£o:', error)
      return false
    }
  }

  return {
    items,
    hasChanges,
    handleReorder,
    resetChanges,
    saveChanges
  }
} 

