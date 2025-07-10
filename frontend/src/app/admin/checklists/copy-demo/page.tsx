'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CopyItemsDialog, { useCopyItems } from '@/components/checklist/CopyItemsDialog'
import { 
  Copy, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight,
  ClipboardList,
  Target,
  Clock,
  Users
} from 'lucide-react'

// =====================================================
// 📋 DEMONSTRAÇÃO DA FUNCIONALIDADE DE COPIAR ITENS
// =====================================================

export default function CopyDemoPage() {
  
  const { copyItems, isLoading, error } = useCopyItems()
  const [lastCopyResult, setLastCopyResult] = useState<string | null>(null)

  // Dados de exemplo
  const sourceChecklist = {
    id: 'checklist-1',
    titulo: 'Checklist de Abertura - Restaurante',
    descricao: 'Verificações obrigatórias para abertura do restaurante',
    categoria: 'Operacional',
    totalItens: 8,
    items: [
      {
        id: 'item-1',
        titulo: 'Verificar temperatura das geladeiras',
        tipo: 'numero',
        obrigatorio: true,
        secao: 'Cozinha',
        placeholder: 'Ex: 4°C',
        descricao: 'Temperatura deve estar entre 0-4°C',
        ordem: 1
      },
      {
        id: 'item-2',
        titulo: 'Conferir limpeza das mesas',
        tipo: 'sim_nao',
        obrigatorio: true,
        secao: 'Salão',
        ordem: 2
      },
      {
        id: 'item-3',
        titulo: 'Verificar estoque de bebidas',
        tipo: 'sim_nao',
        obrigatorio: true,
        secao: 'Bar',
        ordem: 3
      },
      {
        id: 'item-4',
        titulo: 'Foto da organização da cozinha',
        tipo: 'foto_camera',
        obrigatorio: false,
        secao: 'Cozinha',
        ordem: 4
      },
      {
        id: 'item-5',
        titulo: 'Avaliar limpeza geral',
        tipo: 'avaliacao',
        obrigatorio: true,
        secao: 'Geral',
        ordem: 5
      },
      {
        id: 'item-6',
        titulo: 'Verificar funcionamento do som',
        tipo: 'sim_nao',
        obrigatorio: false,
        secao: 'Equipamentos',
        ordem: 6
      },
      {
        id: 'item-7',
        titulo: 'Observações da abertura',
        tipo: 'texto',
        obrigatorio: false,
        secao: 'Geral',
        placeholder: 'Digite suas observações...',
        ordem: 7
      },
      {
        id: 'item-8',
        titulo: 'Assinatura do responsável',
        tipo: 'assinatura',
        obrigatorio: true,
        secao: 'Administrativo',
        ordem: 8
      }
    ]
  }

  const availableChecklists = [
    {
      id: 'checklist-2',
      titulo: 'Checklist de Fechamento - Restaurante',
      descricao: 'Verificações para fechamento do restaurante',
      categoria: 'Operacional',
      totalItens: 6
    },
    {
      id: 'checklist-3',
      titulo: 'Checklist de Limpeza Profunda',
      descricao: 'Limpeza semanal completa',
      categoria: 'Limpeza',
      totalItens: 12
    },
    {
      id: 'checklist-4',
      titulo: 'Checklist de Auditoria',
      descricao: 'Verificações para auditoria mensal',
      categoria: 'Auditoria',
      totalItens: 4
    },
    {
      id: 'checklist-5',
      titulo: 'Checklist de Eventos',
      descricao: 'Preparação para eventos especiais',
      categoria: 'Eventos',
      totalItens: 10
    }
  ]

  const handleCopyItems = async (targetChecklistId: string, items: any[]) => {
    try {
      await copyItems(targetChecklistId, items)
      const targetChecklist = availableChecklists.find(c => c.id === targetChecklistId)
      setLastCopyResult(`✅ ${items.length} itens copiados para "${targetChecklist?.titulo}"`)
    } catch (error) {
      setLastCopyResult(`❌ Erro ao copiar itens: ${error}`)
    }
  }

  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'sim_nao': return '✅'
      case 'texto': return '📝'
      case 'numero': return '🔢'
      case 'data': return '📅'
      case 'foto_camera': return '📷'
      case 'foto_upload': return '🖼️'
      case 'avaliacao': return '⭐'
      case 'assinatura': return '✍️'
      default: return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Copy className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Copiar Itens Entre Checklists
                </h1>
                <p className="text-sm text-gray-600">
                  Funcionalidade mobile-friendly para reutilizar itens
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                📱 Mobile-First
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                🔄 Reutilização
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Introdução */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📋</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Cópia Inteligente de Itens
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Reutilize itens de checklists existentes para criar novos checklists rapidamente. 
                    Sistema com <strong>3 etapas simples</strong>, <strong>filtros inteligentes</strong> e 
                    <strong>interface touch-friendly</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      <FileText className="w-3 h-3 mr-1" />
                      Seleção Múltipla
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Target className="w-3 h-3 mr-1" />
                      Destino Flexível
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Clock className="w-3 h-3 mr-1" />
                      Processo Rápido
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado da Última Cópia */}
        {lastCopyResult && (
          <div className="mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-900 font-medium">
                    {lastCopyResult}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Demonstração
            </TabsTrigger>
            <TabsTrigger value="how-it-works" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Como Funciona
            </TabsTrigger>
          </TabsList>

          {/* Tab: Demonstração */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Checklist de Origem */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Checklist de Origem
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecione itens para copiar do checklist abaixo
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Info do Checklist */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900">{sourceChecklist.titulo}</h3>
                      <p className="text-sm text-blue-700 mt-1">{sourceChecklist.descricao}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-white">
                          {sourceChecklist.categoria}
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          {sourceChecklist.totalItens} itens
                        </Badge>
                      </div>
                    </div>

                    {/* Lista de Itens */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sourceChecklist.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg">{getItemIcon(item.tipo)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.titulo}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.tipo}
                              </Badge>
                              {item.obrigatorio && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  Obrigatório
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
                      ))}
                    </div>

                    {/* Botão de Cópia */}
                    <CopyItemsDialog
                      sourceChecklist={sourceChecklist}
                      availableChecklists={availableChecklists}
                      onCopyItems={handleCopyItems}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 touch-manipulation" size="lg">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Itens Selecionados
                      </Button>
                    </CopyItemsDialog>
                  </div>
                </CardContent>
              </Card>

              {/* Checklists de Destino */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Checklists de Destino
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Checklists disponíveis para receber os itens copiados
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableChecklists.map((checklist) => (
                      <div key={checklist.id} className="p-3 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-900">{checklist.titulo}</h3>
                        <p className="text-sm text-green-700 mt-1">{checklist.descricao}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-white">
                            {checklist.categoria}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            {checklist.totalItens} itens
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Como Funciona */}
          <TabsContent value="how-it-works" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  Processo de Cópia em 3 Etapas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Etapa 1 */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Selecionar Itens</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Escolha os itens que deseja copiar usando filtros por seção, tipo ou obrigatoriedade
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">🔍 Busca por texto</Badge>
                      <Badge variant="outline" className="text-xs">📂 Filtro por seção</Badge>
                      <Badge variant="outline" className="text-xs">⚡ Apenas obrigatórios</Badge>
                      <Badge variant="outline" className="text-xs">☑️ Selecionar todos</Badge>
                    </div>
                  </div>

                  {/* Seta */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Etapa 2 */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Escolher Destino</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Selecione o checklist que receberá os itens copiados
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">🎯 Lista de destinos</Badge>
                      <Badge variant="outline" className="text-xs">📊 Info dos checklists</Badge>
                      <Badge variant="outline" className="text-xs">🔒 Apenas seus checklists</Badge>
                    </div>
                  </div>

                  {/* Seta */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Etapa 3 */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Confirmar Cópia</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Revise o resumo e confirme a cópia dos itens selecionados
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">📝 Resumo da operação</Badge>
                      <Badge variant="outline" className="text-xs">✅ Confirmação segura</Badge>
                      <Badge variant="outline" className="text-xs">📋 Lista de itens</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vantagens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Vantagens da Funcionalidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Reutilização Inteligente</h4>
                        <p className="text-sm text-gray-600">Evite retrabalho copiando itens já criados</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Filtros Avançados</h4>
                        <p className="text-sm text-gray-600">Encontre rapidamente os itens que precisa</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Interface Mobile</h4>
                        <p className="text-sm text-gray-600">Funciona perfeitamente no celular</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Processo Guiado</h4>
                        <p className="text-sm text-gray-600">3 etapas simples e intuitivas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Segurança Total</h4>
                        <p className="text-sm text-gray-600">Confirmação antes de copiar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-green-500 mt-1">✅</div>
                      <div>
                        <h4 className="font-medium">Feedback Claro</h4>
                        <p className="text-sm text-gray-600">Resultado da operação sempre visível</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 