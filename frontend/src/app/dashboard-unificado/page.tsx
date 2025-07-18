'use client'

import { useState, useEffect } from 'react'
import { StandardPageLayout } from '@/components/layouts'
import { DashboardGrid } from '@/components/ui/dashboard-grid'
import { WidgetConfig, WIDGET_PRESETS } from '@/components/ui/dashboard-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useBarContext } from '@/contexts/BarContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Settings,
  Bell,
  Search,
  Filter,
  Calendar,
  PieChart,
  Layers,
  Command
} from 'lucide-react'

// Interfaces para tipagem
interface ResumoExecutivo {
  receitas: number
  despesas: number
  margem: number
  clientes: number
  tendencia: {
    receitas: number
    despesas: number
    clientes: number
  }
}

interface OperacoesCriticas {
  checklist: {
    total: number
    concluidos: number
    pendentes: number
    problemas: number
  }
  producao: {
    ativo: boolean
    itens: number
    tempo: string
  }
  alertas: Array<{
    tipo: 'critico' | 'importante' | 'info'
    mensagem: string
    timestamp: string
  }>
}

interface MetricasChave {
  contaazul: {
    status: 'ativo' | 'erro' | 'sync'
    ultima_sync: string
    registros: number
  }
  meta: {
    status: 'ativo' | 'erro' | 'sync'
    engagement: number
    impressoes: number
  }
  discord: {
    status: 'ativo' | 'erro'
    mensagens: number
  }
  ia: {
    insights: number
    anomalias: number
    recomendacoes: number
  }
}

// Componente principal
export default function DashboardUnificado() {
  const { selectedBar } = useBarContext()
  const { toast } = useToast()

  // Estados para dados
  const [loading, setLoading] = useState(true)
  const [resumoExecutivo, setResumoExecutivo] = useState<ResumoExecutivo | null>(null)
  const [operacoesCriticas, setOperacoesCriticas] = useState<OperacoesCriticas | null>(null)
  const [metricasChave, setMetricasChave] = useState<MetricasChave | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estado para widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    // Tentar carregar do localStorage ou usar presets padrÃ¡Â£o
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widgets')
      if (saved) {
        return JSON.parse(saved) as unknown
      }
    }
    return Object.values(WIDGET_PRESETS)
  })

  // FunÃ¡Â§Ã¡Â£o para carregar dados
  const carregarDados = async () => {
    if (!selectedBar?.id) return

    try {
      setLoading(true)
      
      // Buscar dados reais da API
      const response = await fetch(`/api/dashboard-unificado?barId=${selectedBar.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard')
      }
      
      const data = await response.json()
      
      // Atualizar estados com dados reais
      setResumoExecutivo(data.resumoExecutivo)
      setOperacoesCriticas(data.operacoesCriticas)
      setMetricasChave(data.metricasChave)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar as informaÃ¡Â§Ã¡Âµes do dashboard.",
        variant: "destructive"
      })
      
      // Fallback para dados mockados em caso de erro
      setResumoExecutivo({
        receitas: 0,
        despesas: 0,
        margem: 0,
        clientes: 0,
        tendencia: { receitas: 0, despesas: 0, clientes: 0 }
      })
      
      setOperacoesCriticas({
        checklist: { total: 0, concluidos: 0, pendentes: 0, problemas: 0 },
        producao: { ativo: false, itens: 0, tempo: '0h 0m' },
        alertas: []
      })
      
      setMetricasChave({
        contaazul: { status: 'erro', ultima_sync: new Date().toISOString(), registros: 0 },
        meta: { status: 'erro', engagement: 0, impressoes: 0 },
        discord: { status: 'erro', mensagens: 0 },
        ia: { insights: 0, anomalias: 0, recomendacoes: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  // FunÃ¡Â§Ã¡Â£o para refresh manual
  const handleRefresh = async () => {
    setRefreshing(true)
    await carregarDados()
    setRefreshing(false)
    toast({
      title: "Dados atualizados",
      description: "Dashboard atualizado com sucesso!",
      variant: "default"
    })
  }

  // FunÃ¡Â§Ã¡Â£o para salvar widgets no localStorage
  const handleWidgetsChange = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets))
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados()
  }, [selectedBar?.id])

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(carregarDados, 30000)
    return () => clearInterval(interval)
  }, [selectedBar?.id])

  // FunÃ¡Â§Ã¡Â£o para formatar valores monetÃ¡Â¡rios
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // FunÃ¡Â§Ã¡Â£o para formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <StandardPageLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ã°Å¸Å½Â¯ Dashboard Unificado</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Centro de Comando do Sistema</p>
        </div>
        
        <div className="grid gap-6">
          {/* Skeleton loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="card-dark">
                <CardHeader>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </StandardPageLayout>
    )
  }

  return (
    <ProtectedRoute>
      <StandardPageLayout>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ã°Å¸Å½Â¯ Dashboard Unificado</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Centro de Comando do Sistema</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
        {/* Dashboard Grid com Widgets */}
        <DashboardGrid
          widgets={widgets}
          onWidgetsChange={handleWidgetsChange}
        />
      </StandardPageLayout>
    </ProtectedRoute>
  )
} 

