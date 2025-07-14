'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SortableList, SortableCardGrid, SortableSimpleList } from '@/components/drag-drop/SortableList'
import { DropZone, ChecklistDropZone, CategoryDropZone, TrashDropZone } from '@/components/drag-drop/DropZone'

// Mock data
interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  type: string
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

const initialTasks: Task[] = [
  { id: '1', title: 'Revisar cardápio', description: 'Atualizar preços e pratos', priority: 'high', category: 'cardapio', type: 'task' },
  { id: '2', title: 'Treinar garçons', description: 'Sessão de treinamento mensal', priority: 'medium', category: 'pessoal', type: 'task' },
  { id: '3', title: 'Verificar estoque', description: 'Conferir bebidas e ingredientes', priority: 'high', category: 'estoque', type: 'task' },
  { id: '4', title: 'Limpeza equipamentos', description: 'Manutenção preventiva', priority: 'low', category: 'manutencao', type: 'task' },
  { id: '5', title: 'Análise financeira', description: 'Relatório do mês anterior', priority: 'medium', category: 'financeiro', type: 'task' }
]

const initialChecklists: ChecklistItem[] = [
  { id: 'c1', title: 'Verificar temperaturas', description: 'Freezer e geladeiras', completed: false, priority: 'high' },
  { id: 'c2', title: 'Limpar mesas', description: 'Todas as mesas do salão', completed: true, priority: 'medium' },
  { id: 'c3', title: 'Conferir caixa', description: 'Saldo inicial e troco', completed: false, priority: 'high' },
  { id: 'c4', title: 'Verificar reservas', description: 'Confirmar reservas do dia', completed: false, priority: 'medium' }
]

export default function ExemploDragDropPage() {
  // Estados para diferentes exemplos
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [checklists, setChecklists] = useState<ChecklistItem[]>(initialChecklists)
  const [todoItems, setTodoItems] = useState<string[]>(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'])
  
  // Estados para categorias
  const [cardapioTasks, setCardapioTasks] = useState<Task[]>([])
  const [pessoalTasks, setPessoalTasks] = useState<Task[]>([])
  const [estoqueTasks, setEstoqueTasks] = useState<Task[]>([])
  const [removedItems, setRemovedItems] = useState<any[]>([])

  // Handlers para reordenação
  const handleTaskReorder = (newTasks: Task[]) => {
    setTasks(newTasks)
  }

  const handleChecklistReorder = (newChecklists: ChecklistItem[]) => {
    setChecklists(newChecklists)
  }

  const handleTodoReorder = (newItems: string[]) => {
    setTodoItems(newItems)
  }

  // Handlers para drop zones
  const handleCategoryDrop = (item: any) => {
    const task = tasks.find(t => t.id === item.id)
    if (!task) return

    // Remove from main list
    setTasks(prev => prev.filter(t => t.id !== item.id))

    // Add to appropriate category
    const updatedTask = { ...task, category: item.targetZone.replace('category-', '') }
    
    switch (item.targetZone) {
      case 'category-cardapio':
        setCardapioTasks(prev => [...prev, updatedTask])
        break
      case 'category-pessoal':
        setPessoalTasks(prev => [...prev, updatedTask])
        break
      case 'category-estoque':
        setEstoqueTasks(prev => [...prev, updatedTask])
        break
    }
  }

  const handleTrashDrop = (item: any) => {
    // Remove from all lists
    setTasks(prev => prev.filter(t => t.id !== item.id))
    setChecklists(prev => prev.filter(c => c.id !== item.id))
    setCardapioTasks(prev => prev.filter(t => t.id !== item.id))
    setPessoalTasks(prev => prev.filter(t => t.id !== item.id))
    setEstoqueTasks(prev => prev.filter(t => t.id !== item.id))
    
    // Add to removed items
    setRemovedItems(prev => [...prev, { ...item, removedAt: new Date() }])
  }

  const handleRestoreItem = (item: any) => {
    setRemovedItems(prev => prev.filter(i => i.id !== item.id))
    
    if (item.type === 'task') {
      setTasks(prev => [...prev, item])
    } else {
      setChecklists(prev => [...prev, item])
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-8">
        
        {/* Header */}
        <div className="card-dark p-6">
          <h1 className="card-title-dark mb-4">🎯 Sistema de Drag & Drop</h1>
          <p className="card-description-dark">
            Demonstração completa do sistema de arrastar e soltar com múltiplos exemplos práticos.
            Funciona tanto no desktop quanto no mobile (touch).
          </p>
        </div>

        {/* Exemplo 1: Lista Simples */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">📝 Lista Simples - To-Do</CardTitle>
            <p className="card-description-dark">Reordene os itens arrastando-os para cima ou para baixo</p>
          </CardHeader>
          <CardContent>
            <SortableSimpleList
              items={todoItems}
              onReorder={handleTodoReorder}
              renderItem={(item, index) => (
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">{item}</span>
                </div>
              )}
              getId={(item, index) => `todo-${index}`}
            />
          </CardContent>
        </Card>

        {/* Exemplo 2: Tasks com Prioridades */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">🎯 Tasks com Prioridades</CardTitle>
            <p className="card-description-dark">Arraste para reordenar. Use Ctrl+Setas para navegação por teclado</p>
          </CardHeader>
          <CardContent>
            <SortableList
              items={tasks}
              onReorder={handleTaskReorder}
              renderItem={(task) => (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                  </div>
                </div>
              )}
              getId={(task) => task.id}
            />
          </CardContent>
        </Card>

        {/* Exemplo 3: Checklist Cards */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">✅ Checklist Items</CardTitle>
            <p className="card-description-dark">Layout em grid responsivo com cards arrastáveis</p>
          </CardHeader>
          <CardContent>
            <SortableCardGrid
              items={checklists}
              onReorder={handleChecklistReorder}
              renderItem={(item) => (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      item.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {item.completed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <h4 className={`font-medium ${
                      item.completed 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  <Badge className={getPriorityColor(item.priority)} variant="outline">
                    {item.priority === 'high' ? 'Urgente' : item.priority === 'medium' ? 'Normal' : 'Baixa'}
                  </Badge>
                </div>
              )}
              getId={(item) => item.id}
            />
          </CardContent>
        </Card>

        {/* Exemplo 4: Drop Zones Categorizadas */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">📂 Drop Zones - Categorização</CardTitle>
            <p className="card-description-dark">
              Arraste tasks para diferentes categorias ou para a lixeira. 
              Somente aceita itens do tipo correto.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CategoryDropZone
                category="cardapio"
                onDrop={handleCategoryDrop}
              >
                {cardapioTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cardápio ({cardapioTasks.length})</h4>
                    {cardapioTasks.map(task => (
                      <div key={task.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{task.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CategoryDropZone>

              <CategoryDropZone
                category="pessoal"
                onDrop={handleCategoryDrop}
              >
                {pessoalTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pessoal ({pessoalTasks.length})</h4>
                    {pessoalTasks.map(task => (
                      <div key={task.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{task.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CategoryDropZone>

              <CategoryDropZone
                category="estoque"
                onDrop={handleCategoryDrop}
              >
                {estoqueTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Estoque ({estoqueTasks.length})</h4>
                    {estoqueTasks.map(task => (
                      <div key={task.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{task.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CategoryDropZone>
            </div>

            {/* Lixeira */}
            <TrashDropZone onDrop={handleTrashDrop}>
              {removedItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Lixeira ({removedItems.length})
                  </h4>
                  {removedItems.map(item => (
                    <div key={`removed-${item.id}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{item.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Removido em {new Date(item.removedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreItem(item)}
                        className="text-xs"
                      >
                        Restaurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TrashDropZone>
          </CardContent>
        </Card>

        {/* Exemplo 5: Recursos e Estados */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">⚙️ Recursos e Estados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Desktop Support */}
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl mb-2">🖱️</div>
                <div className="font-semibold text-green-800 dark:text-green-300">Desktop</div>
                <div className="text-sm text-green-600 dark:text-green-400">HTML5 Drag & Drop</div>
              </div>

              {/* Mobile Support */}
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold text-blue-800 dark:text-blue-300">Mobile/Touch</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Touch Events</div>
              </div>

              {/* Accessibility */}
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl mb-2">♿</div>
                <div className="font-semibold text-purple-800 dark:text-purple-300">Acessibilidade</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Ctrl+Setas</div>
              </div>

              {/* Performance */}
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold text-orange-800 dark:text-orange-300">Performance</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Otimizado</div>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">📖 Como usar:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <strong>🖱️ Desktop:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Clique e arraste para mover</li>
                    <li>• Hover para ver indicadores</li>
                    <li>• Auto-scroll nas bordas</li>
                  </ul>
                </div>
                <div>
                  <strong>📱 Mobile:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Pressione e arraste</li>
                    <li>• Feedback visual animado</li>
                    <li>• Detecção de drop zones</li>
                  </ul>
                </div>
                <div>
                  <strong>⌨️ Teclado:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Tab para navegar</li>
                    <li>• Ctrl+↑/↓ para reordenar</li>
                    <li>• Enter para selecionar</li>
                  </ul>
                </div>
                <div>
                  <strong>🎨 Visual:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Rotação durante drag</li>
                    <li>• Indicadores de drop zone</li>
                    <li>• Transições suaves</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              setTasks(initialTasks)
              setChecklists(initialChecklists)
              setTodoItems(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'])
              setCardapioTasks([])
              setPessoalTasks([])
              setEstoqueTasks([])
              setRemovedItems([])
            }}
            variant="outline"
            className="btn-secondary-dark"
          >
            🔄 Resetar Todos os Exemplos
          </Button>
        </div>

      </div>
    </div>
  )
} 