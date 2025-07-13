'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageText } from '@/components/ui/page-base'
import { 
  CalendarDays, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  ShoppingCart, 
  BarChart3, 
  Target,
  Utensils,
  Music,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface MetricasDiarias {
  faturamento_atual: number
  faturamento_ontem: number
  faturamento_semana_passada: number
  clientes_atual: number
  clientes_ontem: number
  ticket_medio: number
  ticket_meta: number
  horario_pico: string
  ultima_venda: string
  vendas_por_hora: { hora: string; valor: number; clientes: number }[]
  reservas_hoje: {
    total: number
    confirmadas: number
    canceladas: number
    checkin: number
  }
  evento_hoje: {
    nome: string
    artista: string
    horario: string
    capacidade: number
    publico_esperado: number
  } | null
  producao_hoje: {
    pratos_produzidos: number
    tempo_medio_preparo: string
    estoque_critico: string[]
  }
  alertas: {
    tipo: 'info' | 'warning' | 'error'
    mensagem: string
    timestamp: string
  }[]
}

function DashboardDiarioContent() {
  const { selectedBar } = useBar()
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<MetricasDiarias>({
    faturamento_atual: 0,
    faturamento_ontem: 0,
    faturamento_semana_passada: 0,
    clientes_atual: 0,
    clientes_ontem: 0,
    ticket_medio: 0,
    ticket_meta: 45,
    horario_pico: '21:00',
    ultima_venda: 'Há 2 minutos',
    vendas_por_hora: [],
    reservas_hoje: { total: 0, confirmadas: 0, canceladas: 0, checkin: 0 },
    evento_hoje: null,
    producao_hoje: { pratos_produzidos: 0, tempo_medio_preparo: '15min', estoque_critico: [] },
    alertas: []
  })

  const carregarMetricas = async () => {
    if (!selectedBar?.id) return
    
    setLoading(true)
    try {
      // Simular dados para desenvolvimento
      // TODO: Implementar API real de métricas diárias
      const mockMetricas: MetricasDiarias = {
        faturamento_atual: 3420.50,
        faturamento_ontem: 4150.30,
        faturamento_semana_passada: 3890.20,
        clientes_atual: 78,
        clientes_ontem: 92,
        ticket_medio: 43.85,
        ticket_meta: 45,
        horario_pico: '21:30',
        ultima_venda: 'Há 1 minuto',
        vendas_por_hora: [
          { hora: '18:00', valor: 250, clientes: 8 },
          { hora: '19:00', valor: 420, clientes: 12 },
          { hora: '20:00', valor: 680, clientes: 18 },
          { hora: '21:00', valor: 890, clientes: 24 },
          { hora: '22:00', valor: 1200, clientes: 28 },
          { hora: '23:00', valor: 980, clientes: 22 }
        ],
        reservas_hoje: {
          total: 45,
          confirmadas: 38,
          canceladas: 3,
          checkin: 25
        },
        evento_hoje: {
          nome: 'Samba das Dez',
          artista: 'Grupo Samba Raiz',
          horario: '22:00',
          capacidade: 200,
          publico_esperado: 180
        },
        producao_hoje: {
          pratos_produzidos: 156,
          tempo_medio_preparo: '12min',
          estoque_critico: ['Cerveja Pilsen', 'Frango']
        },
        alertas: [
          { tipo: 'warning', mensagem: 'Estoque de Cerveja Pilsen baixo', timestamp: 'há 15min' },
          { tipo: 'info', mensagem: 'Pico de movimento detectado', timestamp: 'há 30min' }
        ]
      }
      
      setMetricas(mockMetricas)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarMetricas()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarMetricas, 30000)
    return () => clearInterval(interval)
  }, [selectedBar?.id])

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const calcularVariacao = (atual: number, anterior: number) => {
    const variacao = ((atual - anterior) / anterior) * 100
    return variacao.toFixed(1)
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (loading) {
    return (
      <div className="space-y-6">
        
        
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <PageText className="text-gray-600">Carregando métricas diárias...</PageText>
            </div>
          </div>
        
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <PageText className="text-gray-600 capitalize">{dataAtual}</PageText>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {selectedBar?.nome || 'Bar Selecionado'}
            </Badge>
            <span className="text-sm text-gray-500">• Última atualização: {metricas.ultima_venda}</span>
          </div>
        </div>
        <Button onClick={carregarMetricas} variant="outline" size="sm" className="minimal-button-secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
      
      
        {/* Alertas */}
        {metricas.alertas.length > 0 && (
          <div className="mb-6 space-y-2">
            {metricas.alertas.map((alerta, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border flex items-center space-x-3 ${
                  alerta.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  alerta.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="flex-1">{alerta.mensagem}</span>
                <span className="text-sm opacity-75">{alerta.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cards de Métricas Principais */}
        <div className="card-grid-stats mb-8">
          <Card className="summary-card dashboard-gradient-green">
            <CardContent className="stat-card text-white">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-white" />
                <div className="ml-4">
                  <p className="stat-label text-white/90">Faturamento Hoje</p>
                  <p className="stat-value">{formatarMoeda(metricas.faturamento_atual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="summary-card dashboard-gradient-blue">
            <CardContent className="stat-card text-white">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-white" />
                <div className="ml-4">
                  <p className="stat-label text-white/90">Clientes</p>
                  <p className="stat-value">{metricas.clientes_atual}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="summary-card dashboard-gradient-purple">
            <CardContent className="stat-card text-white">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-white" />
                <div className="ml-4">
                  <p className="stat-label text-white/90">Ticket Médio</p>
                  <p className="stat-value">{formatarMoeda(metricas.ticket_medio)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="summary-card">
            <CardContent className="stat-card">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="stat-label">Meta do Dia</p>
                  <p className="stat-value">{formatarMoeda(metricas.ticket_meta)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="summary-card">
            <CardContent className="stat-card">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="stat-label">Atingimento</p>
                  <p className={`stat-value ${
                    metricas.ticket_medio >= metricas.ticket_meta ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {((metricas.ticket_medio / metricas.ticket_meta) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="summary-card">
            <CardContent className="stat-card">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-gray-600" />
                <div className="ml-4">
                  <p className="stat-label">Última Atualização</p>
                  <p className="text-sm text-gray-600">
                    {metricas.ultima_venda}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Vendas por Hora */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="minimal-card">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Vendas por Hora</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end space-x-2">
                {metricas.vendas_por_hora.map((venda, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-600 rounded-t transition-all duration-500 min-h-1"
                      style={{ 
                        height: `${(venda.valor / Math.max(...metricas.vendas_por_hora.map(v => v.valor))) * 120}px` 
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2 font-medium">{venda.hora}</div>
                    <div className="text-xs text-gray-500">{formatarMoeda(venda.valor)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="minimal-card">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Reservas Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total de Reservas</span>
                  <span className="font-bold text-gray-900">{metricas.reservas_hoje.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full relative"
                    style={{ width: `${(metricas.reservas_hoje.confirmadas / metricas.reservas_hoje.total) * 100}%` }}
                  >
                    <div 
                      className="bg-blue-600 h-3 rounded-r-full absolute right-0"
                      style={{ width: `${(metricas.reservas_hoje.checkin / metricas.reservas_hoje.confirmadas) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-green-700">Confirmadas</div>
                    <div className="font-bold text-green-900">{metricas.reservas_hoje.confirmadas}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-700">Check-in</div>
                    <div className="font-bold text-blue-900">{metricas.reservas_hoje.checkin}</div>
                  </div>
                  <div>
                    <div className="text-sm text-red-700">Canceladas</div>
                    <div className="font-bold text-red-900">{metricas.reservas_hoje.canceladas}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evento e Produção */}
        <div className="card-grid-2 gap-mobile mb-8">
          {metricas.evento_hoje && (
            <Card className="card-responsive border border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900 stack-mobile">
                  <Music className="w-5 h-5" />
                  <span>Evento Hoje</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-mobile">
                  <div>
                    <h3 className="text-responsive-lg font-bold text-yellow-900">{metricas.evento_hoje.nome}</h3>
                    <p className="text-responsive-sm text-yellow-800">{metricas.evento_hoje.artista}</p>
                  </div>
                  <div className="card-grid-2 gap-4 text-responsive-sm">
                    <div>
                      <span className="text-yellow-700">Horário:</span>
                      <div className="font-medium text-yellow-900">{metricas.evento_hoje.horario}</div>
                    </div>
                    <div>
                      <span className="text-yellow-700">Capacidade:</span>
                      <div className="font-medium text-yellow-900">{metricas.evento_hoje.capacidade}</div>
                    </div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <div className="text-responsive-sm text-yellow-800">Público Esperado</div>
                    <div className="text-responsive-lg font-bold text-yellow-900">{metricas.evento_hoje.publico_esperado} pessoas</div>
                    <div className="text-responsive-xs text-yellow-700">
                      {((metricas.evento_hoje.publico_esperado / metricas.evento_hoje.capacidade) * 100).toFixed(0)}% da capacidade
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análise do Movimento */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="stack-mobile">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Análise do Movimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-mobile">
                <div className="stat-card">
                  <div className="text-responsive-sm text-gray-600">Horário de Pico</div>
                  <div className="text-responsive-lg font-bold text-blue-600">
                    {metricas.horario_pico || '20:00 - 22:00'}
                  </div>
                </div>
                
                <div className="card-grid-2 gap-4 text-responsive-sm">
                  <div>
                    <span className="text-gray-600">Mesa Mais Ativa:</span>
                    <div className="font-medium text-gray-900">{metricas.mesa_mais_ativa || 'Mesa 5'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Forma Pagamento:</span>
                    <div className="font-medium text-gray-900">{metricas.forma_pagamento_principal || 'PIX'}</div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-responsive-sm text-blue-800">Previsão para hoje</div>
                  <div className="text-responsive-lg font-bold text-blue-900">
                    {formatarMoeda(metricas.previsao_dia || 0)}
                  </div>
                  <div className="text-responsive-xs text-blue-700">
                    Baseado no histórico
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objetivos do Dia */}
        <Card className="minimal-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Objetivos do Dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Faturamento</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Meta: {formatarMoeda(metricas.ticket_meta)}</span>
                    <span>Atual: {formatarMoeda(metricas.faturamento_atual)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((metricas.faturamento_atual / metricas.ticket_meta) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {((metricas.faturamento_atual / metricas.ticket_meta) * 100).toFixed(1)}% atingido
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Clientes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Meta: 120</span>
                    <span>Atual: {metricas.clientes_atual}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min((metricas.clientes_atual / 120) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {((metricas.clientes_atual / 120) * 100).toFixed(1)}% atingido
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Ticket Médio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Meta: {formatarMoeda(metricas.ticket_meta)}</span>
                    <span>Atual: {formatarMoeda(metricas.ticket_medio)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min((metricas.ticket_medio / metricas.ticket_meta) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {((metricas.ticket_medio / metricas.ticket_meta) * 100).toFixed(1)}% atingido
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      
    </div>
  )
}

export default function DashboardDiarioPage() {
  return <ProtectedRoute requiredModule="dashboard_diario"><DashboardDiarioContent /></ProtectedRoute>
} 