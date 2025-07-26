'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  BarChart3, 
  Users, 
  Star, 
  Package, 
  ChevronDown, 
  ChevronRight, 
  ShoppingCart, 
  Megaphone,
  Zap,
  Award,
  Activity,
  DollarSign,
  Percent,
  Clock,
  Heart,
  ThumbsUp,
  Eye,
  MessageCircle,
  Share2,
  MousePointer,
  Users2,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface IndicadorDesempenho {
  id: string
  categoria: 'guardrail' | 'ovt' | 'qualidade' | 'produtos' | 'vendas' | 'marketing'
  nome: string
  descricao: string
  unidade: string
  meta?: number
  dados: {
    semanais: DadoSemanal[]
    mensais: DadoMensal[]
  }
}

interface DadoSemanal {
  semana: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface DadoMensal {
  mes: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface RespostaDesempenho {
  indicadores: IndicadorDesempenho[]
}

// Grupos de indicadores conforme o CSV
const gruposIndicadores = {
  'indicadores-estrategicos': {
    nome: 'Indicadores Estratégicos',
    icon: Award,
    subgrupos: {
      'guardrail': {
        nome: 'Guardrail',
        icon: Target,
        categorias: ['guardrail']
      },
      'ovt': {
        nome: 'OVT',
        icon: Users,
        categorias: ['ovt']
      }
    }
  },
  'indicadores-qualidade': {
    nome: 'Indicadores de Qualidade',
    icon: Star,
    categorias: ['qualidade']
  },
  'cockpit-produtos': {
    nome: 'Cockpit Produtos',
    icon: Package,
    categorias: ['produtos']
  },
  'cockpit-vendas': {
    nome: 'Cockpit Vendas',
    icon: ShoppingCart,
    categorias: ['vendas']
  },
  'cockpit-marketing': {
    nome: 'Cockpit Marketing',
    icon: Megaphone,
    categorias: ['marketing']
  },
  'cockpit-financeiro': {
    nome: 'Cockpit Financeiro',
    icon: DollarSign,
    categorias: ['financeiro']
  }
}

export default function DesempenhoPage() {
  const [dados, setDados] = useState<RespostaDesempenho | null>(null)
  const [loading, setLoading] = useState(true)
  const [secoesExpandidas, setSecoesExpandidas] = useState<{[key: string]: boolean}>({
    'indicadores-estrategicos': true,
    'guardrail': true,
    'ovt': true,
    'indicadores-qualidade': true,
    'cockpit-produtos': true,
    'cockpit-vendas': true,
    'cockpit-marketing': true
  })
  
  // Refs para os containers de scroll
  const scrollContainerRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await fetch('/api/gestao/desempenho')
        if (response.ok) {
          const data = await response.json()
          setDados(data)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarDados()
  }, [])



  const toggleSecao = (secaoId: string) => {
    setSecoesExpandidas(prev => ({
      ...prev,
      [secaoId]: !prev[secaoId]
    }))
  }

  const getStatusIcon = (status: string, tendencia: string) => {
    if (status === 'acima') {
      return tendencia === 'crescendo' ? 
        <TrendingUp className="w-4 h-4 text-green-500" /> : 
        <TrendingDown className="w-4 h-4 text-green-500" />
    } else if (status === 'abaixo') {
      return tendencia === 'crescendo' ? 
        <TrendingUp className="w-4 h-4 text-red-500" /> : 
        <TrendingDown className="w-4 h-4 text-red-500" />
    } else {
      return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      acima: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', text: 'Acima' },
      abaixo: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', text: 'Abaixo' },
      dentro: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', text: 'Dentro' }
    }
    
    const configStatus = config[status as keyof typeof config] || config.abaixo
    
    return (
      <Badge className={`text-xs px-2 py-1 ${configStatus.color}`}>
        {configStatus.text}
      </Badge>
    )
  }

  const formatarValor = (valor: number, unidade: string) => {
    if (unidade === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    } else if (unidade === '%') {
      return `${valor.toFixed(1)}%`
    } else if (unidade === 'estrelas') {
      return `${valor.toFixed(1)} ⭐`
    } else {
      return new Intl.NumberFormat('pt-BR').format(valor)
    }
  }

  const renderizarTabela = (indicadores: IndicadorDesempenho[], viewMode: 'semanal' | 'mensal', grupoId: string) => (
    <div 
      ref={(el) => {
        scrollContainerRefs.current[`${grupoId}-${viewMode}`] = el
      }}
      className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#6b7280 #374151'
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 12px;
        }
        div::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 6px;
        }
        div::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 6px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      <div className="min-w-[2000px]">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
              <th className="sticky left-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[250px]">
                Indicador
              </th>
              <th className="sticky left-[250px] z-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[100px]">
                Meta
              </th>
              {dados?.indicadores[0]?.dados[viewMode === 'semanal' ? 'semanais' : 'mensais'].map((item, index) => (
                <th key={index} className={`px-2 py-3 text-center text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 ${
                  viewMode === 'mensal' ? 'min-w-[90px]' : 'min-w-[120px]'
                }`}>
                  {viewMode === 'semanal' ? item.semana : item.mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {indicadores.map((indicador) => (
              <tr key={indicador.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{indicador.nome}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{indicador.unidade}</div>
                  </div>
                </td>
                <td className="sticky left-[250px] z-10 bg-gray-50 dark:bg-gray-800 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {indicador.meta ? formatarValor(indicador.meta, indicador.unidade) : '-'}
                  </div>
                </td>
                {indicador.dados[viewMode === 'semanal' ? 'semanais' : 'mensais'].map((item, index) => (
                  <td key={index} className={`text-center ${viewMode === 'mensal' ? 'px-2 py-3' : 'px-4 py-4'}`}>
                    <div className={`flex flex-col items-center ${viewMode === 'mensal' ? 'gap-1' : 'gap-2'}`}>
                      <div className={`font-semibold text-gray-900 dark:text-white ${viewMode === 'mensal' ? 'text-xs' : 'text-sm'}`}>
                        {formatarValor(item.valor, indicador.unidade)}
                      </div>
                      <div className={`flex items-center ${viewMode === 'mensal' ? 'gap-0.5' : 'gap-1'}`}>
                        {getStatusIcon(item.status, item.tendencia)}
                        {viewMode === 'semanal' && getStatusBadge(item.status)}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderizarGrupo = (grupoId: string, grupo: any) => {
    const indicadores = dados?.indicadores.filter(ind => 
      grupo.categorias ? grupo.categorias.includes(ind.categoria) : 
      grupo.subgrupos && Object.values(grupo.subgrupos).some((sub: any) => 
        sub.categorias.includes(ind.categoria)
      )
    ) || []

    if (indicadores.length === 0) return null

    const IconComponent = grupo.icon

    return (
      <Card key={grupoId} className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSecao(grupoId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {grupo.nome}
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {indicadores.length} indicadores
              </Badge>
            </div>
            {secoesExpandidas[grupoId] ? 
              <ChevronDown className="w-5 h-5 text-gray-500" /> : 
              <ChevronRight className="w-5 h-5 text-gray-500" />
            }
          </div>
        </CardHeader>
        
        {secoesExpandidas[grupoId] && (
          <CardContent className="pt-0">
            {grupo.subgrupos ? (
              // Renderizar subgrupos (para Indicadores Estratégicos)
              Object.entries(grupo.subgrupos).map(([subId, subGrupo]: [string, any]) => {
                const subIndicadores = indicadores.filter(ind => 
                  subGrupo.categorias.includes(ind.categoria)
                )
                
                if (subIndicadores.length === 0) return null
                
                const SubIconComponent = subGrupo.icon
                
                return (
                  <div key={subId} className="mb-6">
                    <div 
                      className="flex items-center gap-2 mb-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => toggleSecao(subId)}
                    >
                      <SubIconComponent className="w-5 h-5" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subGrupo.nome}
                      </h3>
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {subIndicadores.length}
                      </Badge>
                      {secoesExpandidas[subId] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                    
                    {secoesExpandidas[subId] && (
                      <Tabs defaultValue="semanal" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="semanal" className="text-sm font-medium">
                            Visão Semanal
                          </TabsTrigger>
                          <TabsTrigger value="mensal" className="text-sm font-medium">
                            Visão Mensal
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="semanal">
                          {renderizarTabela(subIndicadores, 'semanal', `${grupoId}-${subId}`)}
                        </TabsContent>
                        
                        <TabsContent value="mensal">
                          {renderizarTabela(subIndicadores, 'mensal', `${grupoId}-${subId}`)}
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                )
              })
            ) : (
              // Renderizar grupo simples
              <Tabs defaultValue="semanal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="semanal" className="text-sm font-medium">
                    Visão Semanal
                  </TabsTrigger>
                  <TabsTrigger value="mensal" className="text-sm font-medium">
                    Visão Mensal
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="semanal">
                  {renderizarTabela(indicadores, 'semanal', grupoId)}
                </TabsContent>
                
                <TabsContent value="mensal">
                  {renderizarTabela(indicadores, 'mensal', grupoId)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de desempenho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Compacto */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard de Desempenho
            </h1>
          </div>
        </div>

        {/* Grupos de Indicadores */}
        <div className="space-y-6">
          {Object.entries(gruposIndicadores).map(([grupoId, grupo]) => 
            renderizarGrupo(grupoId, grupo)
          )}
        </div>
      </div>
    </div>
  )
}
