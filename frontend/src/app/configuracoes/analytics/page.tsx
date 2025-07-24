'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardCard from '@/components/ui/dashboard-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Users, 
  Clock, 
  Smartphone, 
  Target, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface AnalyticsData {
  periodo_consultado: string
  data_ultima_atualizacao: string
  metricas_resumo: {
    usuarios_ativos_hoje: number
    sessoes_hoje: number
    tempo_medio_sessao: number
    taxa_mobile: number
  }
  kpis_resumo: {
    total_kpis: number
    kpis_atingidos: number
    kpis_criticos: number
    percentual_sucesso: number
  }
  performance_resumo: {
    tempo_resposta_medio: number
    total_requests: number
    taxa_erro: number
    endpoints_mais_lentos: Array<{
      endpoint: string
      tempo_ms: number
      componente: string
    }>
  }
  alertas_resumo: {
    total_ativos: number
    criticos: number
    warnings: number
    errors: number
  }
  kpis: Array<{
    id: number
    categoria: string
    nome: string
    valor_atual: number
    valor_meta: number
    percentual_atingido: number
    status: string
    unidade: string
    descricao: string
  }>
  eventos_por_tipo: Record<string, number>
  top_paginas: Array<{
    pagina: string
    visitas: number
  }>
  alertas_criticos: Array<{
    id: number
    titulo: string
    descricao: string
    severidade: string
    criado_em: string
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('7')

  const fetchAnalytics = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      else setRefreshing(true)

      const response = await fetch(`/api/analytics/dashboard?bar_id=3&periodo=${selectedPeriod}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        console.error('Erro ao carregar analytics:', result.error)
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedPeriod]);

  const refreshMetrics = async () => {
    try {
      setRefreshing(true)
      
      // Primeiro atualizar métricas via POST
      await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: 3 })
      })
      
      // Depois buscar dados atualizados
      await fetchAnalytics(false)
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'atingido': return 'text-green-600 bg-green-100'
      case 'perto': return 'text-yellow-600 bg-yellow-100'
      case 'distante': return 'text-orange-600 bg-orange-100'
      case 'critico': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'atingido': return <CheckCircle className="w-4 h-4" />
      case 'critico': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitoramento completo do sistema - {data?.periodo_consultado}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Seletor de período */}
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="1">Último dia</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            
            <Button 
              onClick={refreshMetrics}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Usuários Ativos Hoje"
            value={data?.metricas_resumo.usuarios_ativos_hoje || 0}
            icon={<Users className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            variant="gradient"
          />
          
          <DashboardCard
            title="Sessões Hoje"
            value={data?.metricas_resumo.sessoes_hoje || 0}
            icon={<Activity className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
            variant="gradient"
          />
          
          <DashboardCard
            title="Tempo Médio/Sessão"
            value={`${Math.floor((data?.metricas_resumo.tempo_medio_sessao || 0) / 60)}min`}
            icon={<Clock className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
            variant="gradient"
          />
          
          <DashboardCard
            title="Taxa Mobile"
            value={`${data?.metricas_resumo.taxa_mobile || 0}%`}
            icon={<Smartphone className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-pink-500 to-rose-600"
            variant="gradient"
          />
        </div>

        {/* Cards de Performance e KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="KPIs Atingidos"
            value={`${data?.kpis_resumo.kpis_atingidos || 0}/${data?.kpis_resumo.total_kpis || 0}`}
            subtitle={`${data?.kpis_resumo.percentual_sucesso || 0}% de sucesso`}
            icon={<Target className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-cyan-500 to-blue-600"
            variant="gradient"
            changeType={data?.kpis_resumo.percentual_sucesso && data.kpis_resumo.percentual_sucesso >= 80 ? 'positive' : 'negative'}
          />
          
          <DashboardCard
            title="Tempo Resposta Médio"
            value={`${data?.performance_resumo.tempo_resposta_medio || 0}ms`}
            subtitle={`${data?.performance_resumo.total_requests || 0} requests`}
            icon={<Zap className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-yellow-500 to-orange-600"
            variant="gradient"
            changeType={data?.performance_resumo.tempo_resposta_medio && data.performance_resumo.tempo_resposta_medio < 1000 ? 'positive' : 'negative'}
          />
          
          <DashboardCard
            title="Taxa de Erro"
            value={`${data?.performance_resumo.taxa_erro || 0}%`}
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-red-500 to-pink-600"
            variant="gradient"
            changeType={data?.performance_resumo.taxa_erro && data.performance_resumo.taxa_erro < 5 ? 'positive' : 'negative'}
          />
          
          <DashboardCard
            title="Alertas Ativos"
            value={data?.alertas_resumo.total_ativos || 0}
            subtitle={`${data?.alertas_resumo.criticos || 0} críticos`}
            icon={<AlertCircle className="w-6 h-6" />}
            iconBg="bg-gradient-to-br from-red-500 to-rose-600"
            variant="gradient"
            changeType={data?.alertas_resumo.criticos === 0 ? 'positive' : 'negative'}
          />
        </div>

        {/* Seção de KPIs Detalhados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              KPIs e Metas
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.kpis.map((kpi) => (
              <div key={kpi.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {kpi.nome}
                  </span>
                  <Badge className={getStatusColor(kpi.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(kpi.status)}
                      {kpi.status}
                    </div>
                  </Badge>
                </div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {kpi.valor_atual}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {kpi.valor_meta} {kpi.unidade}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      kpi.percentual_atingido >= 100 ? 'bg-green-500' :
                      kpi.percentual_atingido >= 80 ? 'bg-yellow-500' :
                      kpi.percentual_atingido >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(kpi.percentual_atingido, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {kpi.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Páginas e Eventos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Páginas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Páginas Mais Visitadas
              </h2>
            </div>
            
            <div className="space-y-3">
              {data?.top_paginas.slice(0, 5).map((pagina, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {pagina.pagina}
                  </span>
                  <Badge variant="secondary">
                    {pagina.visitas} visitas
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos por Tipo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Eventos por Tipo
              </h2>
            </div>
            
            <div className="space-y-3">
              {Object.entries(data?.eventos_por_tipo || {}).map(([tipo, count]) => (
                <div key={tipo} className="flex items-center justify-between p-2">
                  <span className="text-sm text-gray-900 dark:text-white capitalize">
                    {tipo.replace('_', ' ')}
                  </span>
                  <Badge variant="outline">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {data?.alertas_criticos && data.alertas_criticos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alertas Críticos
              </h2>
            </div>
            
            <div className="space-y-3">
              {data.alertas_criticos.map((alerta) => (
                <div key={alerta.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-red-900 dark:text-red-100">
                        {alerta.titulo}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {alerta.descricao}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {alerta.severidade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer com última atualização */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Última atualização: {data?.data_ultima_atualizacao ? 
            new Date(data.data_ultima_atualizacao).toLocaleString('pt-BR') : 'Nunca'
          }
        </div>
      </div>
    </div>
  )
} 
