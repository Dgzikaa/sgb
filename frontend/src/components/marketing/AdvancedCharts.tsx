'use client'

// ========================================
// üìä ADVANCED MARKETING CHARTS
// ========================================
// Componente de gr·°ficos avan·ßados para an·°lise de tend·™ncias
// e insights de marketing social

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Heart, 
  Share2, 
  Eye,
  Target,
  Zap,
  BarChart3,
  Instagram,
  Facebook,
  MessageCircle
} from 'lucide-react'
import Image from 'next/image'
import React from 'react'

// ========================================
// üé® CORES E TEMAS
// ========================================
const CHART_COLORS = {
  primary: '#3B82F6',      // Azul
  secondary: '#8B5CF6',    // Roxo
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarelo
  danger: '#EF4444',       // Vermelho
  info: '#06B6D4',         // Ciano
  instagram: '#E1306C',    // Rosa Instagram
  facebook: '#1877F2',     // Azul Facebook
  gradient: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
}

// ========================================
// üìä DADOS SIMULADOS PARA DEMONSTRA·á·ÉO
// ========================================
const generateTrendData = () => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  return months.map((month, index) => ({
    mes: month,
    instagram_seguidores: 800 + (index * 120) + Math.random() * 100,
    facebook_seguidores: 400 + (index * 80) + Math.random() * 50,
    instagram_engajamento: 4.5 + Math.random() * 2,
    facebook_engajamento: 3.2 + Math.random() * 1.5,
    alcance_total: 5000 + (index * 800) + Math.random() * 1000,
    impressoes: 8000 + (index * 1200) + Math.random() * 1500,
    clicks: 150 + (index * 25) + Math.random() * 30,
    saves: 45 + (index * 8) + Math.random() * 12,
    shares: 28 + (index * 5) + Math.random() * 8,
    comentarios: 35 + (index * 6) + Math.random() * 10
  }))
}

const generateWeeklyData = () => {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S·°b', 'Dom']
  
  return days.map((day: any) => ({
    dia: day,
    alcance: Math.floor(Math.random() * 2000) + 500,
    engajamento: Math.floor(Math.random() * 300) + 50,
    posts: Math.floor(Math.random() * 3) + 1,
    stories: Math.floor(Math.random() * 5) + 2
  }))
}

const generateEngagementBreakdown = () => [
  { tipo: 'Curtidas', valor: 2340, cor: CHART_COLORS.success },
  { tipo: 'Coment·°rios', valor: 456, cor: CHART_COLORS.primary },
  { tipo: 'Compartilhamentos', valor: 234, cor: CHART_COLORS.secondary },
  { tipo: 'Salvamentos', valor: 189, cor: CHART_COLORS.warning },
  { tipo: 'Cliques no Link', valor: 123, cor: CHART_COLORS.danger }
]

const generatePerformanceRadar = () => [
  { metrica: 'Alcance', instagram: 85, facebook: 70, fullMark: 100 },
  { metrica: 'Engajamento', instagram: 78, facebook: 65, fullMark: 100 },
  { metrica: 'Crescimento', instagram: 92, facebook: 58, fullMark: 100 },
  { metrica: 'Qualidade do Conte·∫do', instagram: 88, facebook: 75, fullMark: 100 },
  { metrica: 'Frequ·™ncia de Posts', instagram: 75, facebook: 60, fullMark: 100 },
  { metrica: 'Intera·ß·£o', instagram: 82, facebook: 68, fullMark: 100 }
]

// ========================================
// üìä COMPONENTES DE GR·ÅFICOS
// ========================================
interface AdvancedChartsProps {
  trendData?: any[] // [{ data_coleta, instagram_followers, facebook_fans, total_impressions, total_spend, total_clicks }]
  campaignData?: any[] // [{ status, objective, spend, impressions, clicks }]
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
}

export default function AdvancedCharts({ trendData, campaignData, timeRange = 'month' }: AdvancedChartsProps) {
  const [activeTab, setActiveTab] = useState('trends')

  // Dados processados
  const trends = useMemo(() => trendData && trendData.length > 0 ? trendData : generateTrendData(), [trendData])
  const campaigns = useMemo(() => campaignData && campaignData.length > 0 ? campaignData : [], [campaignData])
  const weeklyData = useMemo(() => generateWeeklyData(), [])
  const engagementData = useMemo(() => generateEngagementBreakdown(), [])
  const radarData = useMemo(() => generatePerformanceRadar(), [])

  // ========================================
  // üìà GR·ÅFICO DE TEND·äNCIAS
  // ========================================
  const TrendsChart = () => (
    <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="card-title-dark flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Evolu·ß·£o de Seguidores e M·©tricas
        </CardTitle>
        <CardDescription className="card-description-dark">
          Evolu·ß·£o di·°ria de seguidores, impress·µes, gasto e cliques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="igGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.instagram} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.instagram} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="fbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.facebook} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.facebook} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2226" />
            <XAxis dataKey="data_coleta" tick={{ fontSize: 12 }} stroke="#888" />
            <YAxis tick={{ fontSize: 12 }} stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 4px 6px -1px #0002' }} labelStyle={{ color: '#fff' }} />
            <Legend />
            <Area type="monotone" dataKey="instagram_followers" stroke={CHART_COLORS.instagram} fillOpacity={1} fill="url(#igGradient)" name="Instagram" strokeWidth={2} />
            <Area type="monotone" dataKey="facebook_fans" stroke={CHART_COLORS.facebook} fillOpacity={1} fill="url(#fbGradient)" name="Facebook" strokeWidth={2} />
            <Area type="monotone" dataKey="total_impressions" stroke={CHART_COLORS.info} fillOpacity={0.2} fill={CHART_COLORS.info} name="Impress·µes" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="total_spend" stroke={CHART_COLORS.warning} fillOpacity={0.2} fill={CHART_COLORS.warning} name="Gasto" strokeDasharray="2 2" />
            <Area type="monotone" dataKey="total_clicks" stroke={CHART_COLORS.success} fillOpacity={0.2} fill={CHART_COLORS.success} name="Cliques" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  // ========================================
  // üìä GR·ÅFICO DE ENGAJAMENTO
  // ========================================
  const EngagementChart = () => (
    <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Taxa de Engajamento
        </CardTitle>
        <CardDescription>
          Comparativo de engajamento entre plataformas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? `${value.toFixed(2)}%` : value,
                name
              ]}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="instagram_engajamento"
              fill={CHART_COLORS.instagram}
              name="Instagram (%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="facebook_engajamento"
              fill={CHART_COLORS.facebook}
              name="Facebook (%)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="alcance_total"
              stroke={CHART_COLORS.success}
              strokeWidth={3}
              name="Alcance Total"
              dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  // ========================================
  // ü•ß BREAKDOWN DE ENGAJAMENTO
  // ========================================
  const EngagementBreakdown = () => (
    <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-purple-600" />
          Tipos de Intera·ß·£o
        </CardTitle>
        <CardDescription>
          Distribui·ß·£o das formas de engajamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={engagementData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="valor"
            >
              {engagementData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Intera·ß·µes']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legenda personalizada */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {engagementData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.cor }}
              />
              <span className="text-sm text-gray-600">{item.tipo}</span>
              <Badge variant="outline" className="ml-auto">
                {item.valor.toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // ========================================
  // üéØ RADAR DE PERFORMANCE
  // ========================================
  const PerformanceRadar = () => (
    <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Performance por Categoria
        </CardTitle>
        <CardDescription>
          An·°lise multidimensional das m·©tricas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              className="text-sm"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#888' }}
            />
            <Radar
              name="Instagram"
              dataKey="instagram"
              stroke={CHART_COLORS.instagram}
              fill={CHART_COLORS.instagram}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Facebook"
              dataKey="facebook"
              stroke={CHART_COLORS.facebook}
              fill={CHART_COLORS.facebook}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend />
            <Tooltip 
              formatter={(value) => [`${value}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  // ========================================
  // üìÖ ATIVIDADE SEMANAL
  // ========================================
  const WeeklyActivity = () => (
    <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          Atividade Semanal
        </CardTitle>
        <CardDescription>
          Padr·µes de engajamento por dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dia" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="alcance" 
              fill={CHART_COLORS.primary}
              name="Alcance"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="engajamento" 
              fill={CHART_COLORS.secondary}
              name="Engajamento"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  // ========================================
  // üìä RENDER PRINCIPAL
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            üìä An·°lise Avan·ßada de Marketing
          </h2>
          <p className="text-gray-600">
            Insights detalhados e tend·™ncias das redes sociais
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            ·öltimos 30 dias
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes an·°lises */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 grid w-full grid-cols-4">
          <TabsTrigger value="trends">üìà Tend·™ncias</TabsTrigger>
          <TabsTrigger value="engagement">ù§Ô∏è Engajamento</TabsTrigger>
          <TabsTrigger value="breakdown">ü•ß Distribui·ß·£o</TabsTrigger>
          <TabsTrigger value="performance">üéØ Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendsChart />
            <WeeklyActivity />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <EngagementChart />
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementBreakdown />
            <WeeklyActivity />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceRadar />
        </TabsContent>
      </Tabs>

      {/* Insights Autom·°ticos */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Insights Autom·°ticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Crescimento Positivo</span>
              </div>
              <p className="text-sm text-green-700">
                Instagram cresceu 23% este m·™s, superando a meta de 15%
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Melhor Dia</span>
              </div>
              <p className="text-sm text-blue-700">
                Sexta-feira tem o maior engajamento (34% acima da m·©dia)
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Conte·∫do Popular</span>
              </div>
              <p className="text-sm text-purple-700">
                Posts com drinks especiais t·™m 45% mais curtidas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 

// NOVO COMPONENTE: PostHighlightsCard
export interface PostHighlight {
  id: string
  platform: 'instagram' | 'facebook'
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  caption?: string
  message?: string
  created_time?: string
  timestamp?: string
  metrics: {
    likes: number
    comments: number
    impressions?: number
    reach?: number
    engagement?: number
    engagement_rate?: number
  }
}

interface PostHighlightsCardProps {
  posts: PostHighlight[]
  loading?: boolean
  max?: number
}

export const PostHighlightsCard: React.FC<PostHighlightsCardProps> = ({ posts, loading, max = 5 }) => {
  if (loading) {
    return (
      <Card className="card-dark p-6 flex flex-col items-center justify-center min-h-[200px]">
        <BarChart3 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-gray-600 dark:text-gray-400">Carregando destaques...</span>
      </Card>
    )
  }
  if (!posts || posts.length === 0) {
    return (
      <Card className="card-dark bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-gray-600 dark:text-gray-400">Nenhum post de destaque encontrado</span>
      </Card>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.slice(0, max).map((post, idx) => (
        <Card key={post.id} className="card-dark p-0 overflow-hidden shadow-lg hover:scale-[1.02] transition-transform">
          {post.media_url && (
            <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                <Image src={post.media_url} alt={post.caption || post.message || 'Post'} fill className="object-cover w-full h-full" />
              </a>
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge className="bg-pink-600 text-white flex items-center gap-1">
                  {post.platform === 'instagram' ? <Instagram className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
                  {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                </Badge>
                {post.media_type && (
                  <Badge className="bg-gray-900/80 text-white capitalize">{post.media_type}</Badge>
                )}
              </div>
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.created_time || post.timestamp || '').toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="font-semibold card-title-dark text-base mb-2 line-clamp-2">
              {post.caption || post.message || 'Post sem descri·ß·£o'}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                <Heart className="w-4 h-4" /> {post.metrics.likes}
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <MessageCircle className="w-4 h-4" /> {post.metrics.comments}
              </span>
              {typeof post.metrics.impressions === 'number' && (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                  <Eye className="w-4 h-4" /> {post.metrics.impressions}
                </span>
              )}
              {typeof post.metrics.engagement_rate === 'number' && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <BarChart3 className="w-4 h-4" /> {post.metrics.engagement_rate.toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
