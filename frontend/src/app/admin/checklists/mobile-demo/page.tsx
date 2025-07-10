'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MobileItemReorder from '@/components/checklist/MobileItemReorder'
import MobilePreview from '@/components/checklist/MobilePreview'
import { useMobilePreview } from '@/components/checklist/MobilePreview'
import { 
  Smartphone, 
  Move, 
  Eye,
  Wand2,
  Zap,
  TouchpadOff
} from 'lucide-react'

// =====================================================
// 📱 DEMONSTRAÇÃO DOS COMPONENTES MOBILE-FRIENDLY
// =====================================================

export default function MobileDemoPage() {
  
  const { showPreview, previewData, updatePreview, togglePreview } = useMobilePreview()
  
  const [demoItems, setDemoItems] = useState([
    {
      id: '1',
      titulo: 'Verificar temperatura da geladeira',
      tipo: 'numero',
      obrigatorio: true,
      ordem: 1,
      secao: 'Cozinha',
      placeholder: 'Ex: 4°C'
    },
    {
      id: '2',
      titulo: 'Conferir limpeza das mesas',
      tipo: 'sim_nao',
      obrigatorio: true,
      ordem: 2,
      secao: 'Salão'
    },
    {
      id: '3',
      titulo: 'Foto do estoque do bar',
      tipo: 'foto_camera',
      obrigatorio: false,
      ordem: 3,
      secao: 'Bar'
    },
    {
      id: '4',
      titulo: 'Avaliar atendimento do dia',
      tipo: 'avaliacao',
      obrigatorio: true,
      ordem: 4,
      secao: 'Administrativo'
    },
    {
      id: '5',
      titulo: 'Observações gerais',
      tipo: 'texto',
      obrigatorio: false,
      ordem: 5,
      secao: 'Geral',
      placeholder: 'Digite suas observações...'
    }
  ])

  const updatePreviewData = () => {
    updatePreview({
      titulo: 'Checklist de Fechamento',
      descricao: 'Verificações obrigatórias para fechamento do restaurante',
      itens: demoItems
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Componentes Mobile-Friendly
                </h1>
                <p className="text-sm text-gray-600">
                  Interfaces otimizadas para dispositivos móveis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                📱 Touch Optimized
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                🎯 Mobile-First
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Introdução */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📱</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Interface Mobile-First
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Todos os componentes foram repensados para funcionar perfeitamente em dispositivos móveis, 
                    priorizando <strong>gestos simples</strong>, <strong>botões grandes</strong> e 
                    <strong>interações touch-friendly</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      <TouchpadOff className="w-3 h-3 mr-1" />
                      Sem Drag & Drop
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Botões Grandes
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview em Tempo Real
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs dos Componentes */}
        <Tabs defaultValue="reorder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reorder" className="flex items-center gap-2">
              <Move className="w-4 h-4" />
              Reordenação Mobile
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Mobile
            </TabsTrigger>
          </TabsList>

          {/* Tab: Reordenação Mobile */}
          <TabsContent value="reorder" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Move className="w-5 h-5 text-blue-600" />
                      Reordenação Mobile-Friendly
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Interface otimizada para touch com botões grandes ao invés de drag & drop
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    🔄 Touch Gestures
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Componente de Reordenação */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-600" />
                      Componente Interativo
                    </h3>
                    <MobileItemReorder
                      itens={demoItems}
                      onReorder={setDemoItems}
                      onSave={() => {
                        console.log('Ordem salva:', demoItems)
                      }}
                    />
                  </div>

                  {/* Explicação das Features */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Features Mobile-First
                    </h3>
                    <div className="space-y-4">
                      
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">✅</div>
                            <div>
                              <h4 className="font-medium text-green-900">Botões Grandes</h4>
                              <p className="text-sm text-green-800">
                                Botões ⬆️⬇️ com toque fácil e área generosa
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">📱</div>
                            <div>
                              <h4 className="font-medium text-blue-900">Touch-Friendly</h4>
                              <p className="text-sm text-blue-800">
                                Classe <code>touch-manipulation</code> para melhor resposta
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🎯</div>
                            <div>
                              <h4 className="font-medium text-purple-900">Feedback Visual</h4>
                              <p className="text-sm text-purple-800">
                                Animações e estados visuais claros durante a interação
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🔄</div>
                            <div>
                              <h4 className="font-medium text-orange-900">Controle Simples</h4>
                              <p className="text-sm text-orange-800">
                                Modo de edição separado com botões Cancelar/Salvar
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Preview Mobile */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-green-600" />
                      Preview Mobile em Tempo Real
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Visualize como o checklist ficará no dispositivo móvel
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    📱 Real-time Preview
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Botões de Ação */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => {
                        updatePreviewData()
                        togglePreview(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Abrir Preview Mobile
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={updatePreviewData}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Atualizar Dados
                    </Button>
                  </div>

                  {/* Recursos do Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <h4 className="font-medium text-blue-900">Multi-Device</h4>
                        <p className="text-sm text-blue-800">
                          Mobile, Tablet, Desktop
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">🔍</div>
                        <h4 className="font-medium text-green-900">Zoom</h4>
                        <p className="text-sm text-green-800">
                          50% até 200%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">🌙</div>
                        <h4 className="font-medium text-purple-900">Dark Mode</h4>
                        <p className="text-sm text-purple-800">
                          Teste em modo escuro
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Demonstração dos Dados */}
                  <div>
                    <h4 className="font-medium mb-2">Dados do Preview:</h4>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify({
                          titulo: 'Checklist de Fechamento',
                          descricao: 'Verificações obrigatórias para fechamento do restaurante',
                          itens: demoItems.length,
                          secoes: [...new Set(demoItems.map(item => item.secao))]
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Comparação Antes vs Depois */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Antes vs Depois: Mobile-First Design
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Antes */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600">
                  ❌ Antes (Desktop-First)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Drag & Drop complexo (difícil no mobile)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Botões pequenos e próximos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Sem preview mobile</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Interface não otimizada para touch</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>Gestos complicados</span>
                  </div>
                </div>
              </div>

              {/* Depois */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">
                  ✅ Depois (Mobile-First)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Botões ⬆️⬇️ grandes e simples</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Touch zones generosas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Preview em tempo real</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Classe <code>touch-manipulation</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Interações intuitivas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componente de Preview */}
      <MobilePreview
        titulo={previewData.titulo}
        descricao={previewData.descricao}
        itens={previewData.itens}
        showPreview={showPreview}
        onTogglePreview={togglePreview}
      />
    </div>
  )
} 