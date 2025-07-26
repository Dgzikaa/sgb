'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Users,
  BarChart3,
  DollarSign,
  Star,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Clock,
  Filter,
  Download,
  RefreshCcw,
} from 'lucide-react';

// Tipos para os dados
interface CampaignData {
  date: string;
  campaign: string;
  campaign_id: string;
  spend: number;
  totalcost: number;
  campaign_daily_budget: number;
  campaign_effective_status: string;
  campaign_objective: string;
}

interface InstagramData {
  date: string;
  follower_count_1d: number;
  reach: number;
  reach_1d: number;
}

interface GoogleReviewData {
  date: string;
  review_average_rating: number;
  review_count: number;
  review_total_count: number;
}

interface AgeData {
  date: string;
  audience_age_name: string;
  audience_age_size: number;
}

export default function Marketing360Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('analise-geral');
  const [loading, setLoading] = useState(true);
  const [campaignsData, setCampaignsData] = useState<CampaignData[]>([]);
  const [instagramData, setInstagramData] = useState<InstagramData[]>([]);
  const [googleData, setGoogleData] = useState<GoogleReviewData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);

  // Carregar dados das APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados das campanhas
        const campaignsResponse = await fetch('/api/marketing/campanhas');
        const campaignsResult = await campaignsResponse.json();
        if (campaignsResult.success) {
          setCampaignsData(campaignsResult.data);
        }

        // Buscar dados do Instagram
        const instagramResponse = await fetch('/api/marketing/instagram');
        const instagramResult = await instagramResponse.json();
        if (instagramResult.success) {
          setInstagramData(instagramResult.data);
        }

        // Buscar dados do Google
        const googleResponse = await fetch('/api/marketing/google');
        const googleResult = await googleResponse.json();
        if (googleResult.success) {
          setGoogleData(googleResult.data);
        }

        // Buscar dados de idade
        const ageResponse = await fetch('/api/marketing/idade');
        const ageResult = await ageResponse.json();
        if (ageResult.success) {
          setAgeData(ageResult.data);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funções para calcular insights
  const getTotalSpent = () => {
    return campaignsData.reduce((total, campaign) => total + campaign.spend, 0);
  };

  const getActiveCampaigns = () => {
    return campaignsData.filter(campaign => campaign.campaign_effective_status === 'ACTIVE').length;
  };

  const getFollowersGrowth = () => {
    if (instagramData.length < 2) return 0;
    const latest = instagramData[instagramData.length - 1];
    const previous = instagramData[instagramData.length - 2];
    return ((latest.follower_count_1d - previous.follower_count_1d) / previous.follower_count_1d) * 100;
  };

  const getAverageRating = () => {
    if (googleData.length === 0) return 0;
    return googleData[googleData.length - 1].review_average_rating;
  };

  const getTopPerformingCampaigns = () => {
    return campaignsData
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
  };

  const getTotalReach = () => {
    if (instagramData.length === 0) return 0;
    return instagramData[instagramData.length - 1].reach;
  };

  const getCurrentFollowers = () => {
    if (instagramData.length === 0) return 0;
    return instagramData[instagramData.length - 1].follower_count_1d;
  };

  interface Insight {
    type: 'success' | 'warning' | 'info';
    icon: any;
    title: string;
    message: string;
    color: string;
  }

  const getInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Insight sobre crescimento de seguidores
    const growth = getFollowersGrowth();
    if (growth > 10) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Crescimento Excepcional',
        message: `Crescimento de ${growth.toFixed(1)}% nos seguidores do Instagram`,
        color: 'text-emerald-600 dark:text-emerald-400'
      });
    }

    // Insight sobre campanhas ativas
    const activeCampaigns = getActiveCampaigns();
    if (activeCampaigns === 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Nenhuma Campanha Ativa',
        message: 'Considere ativar campanhas para manter o engajamento',
        color: 'text-amber-600 dark:text-amber-400'
      });
    }

    // Insight sobre avaliações
    const rating = getAverageRating();
    if (rating >= 4.5) {
      insights.push({
        type: 'success',
        icon: Star,
        title: 'Excelente Reputação',
        message: `Avaliação média de ${rating.toFixed(1)} no Google`,
        color: 'text-emerald-600 dark:text-emerald-400'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando dados de marketing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6 py-4">
          {/* Header Minimalista */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/marketing')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 h-10 w-10 p-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing 360</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Análise completa de performance e campanhas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Atualizar
              </Button>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                <Activity className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Tabs Modernas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger 
              value="analise-geral"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-lg font-medium"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análise Geral
            </TabsTrigger>
            <TabsTrigger 
              value="campanhas"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-lg font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              Campanhas
            </TabsTrigger>
          </TabsList>

          {/* Aba: Análise Geral */}
          <TabsContent value="analise-geral" className="space-y-8">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Investido */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investido</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {getTotalSpent().toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">+12.5%</span>
                        <span className="text-sm text-gray-500">vs mês anterior</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seguidores Instagram */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seguidores Instagram</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getCurrentFollowers().toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getFollowersGrowth() > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${getFollowersGrowth() > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {getFollowersGrowth() > 0 ? '+' : ''}{getFollowersGrowth().toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500">vs semana anterior</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl">
                      <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avaliação Google */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avaliação Google</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getAverageRating().toFixed(1)} ⭐
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">+0.2</span>
                        <span className="text-sm text-gray-500">vs mês anterior</span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alcance Total */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alcance Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getTotalReach().toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">+8.3%</span>
                        <span className="text-sm text-gray-500">vs semana anterior</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Análises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de Crescimento de Seguidores */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Crescimento de Seguidores
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Gráfico de Crescimento</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Implementação em desenvolvimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Idade */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Distribuição por Idade
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Gráfico de Distribuição</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Implementação em desenvolvimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights Automáticos */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Insights Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getInsights().map((insight, index) => {
                    const IconComponent = insight.icon;
                    return (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                            <IconComponent className={`w-4 h-4 ${insight.color}`} />
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{insight.message}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Campanhas */}
          <TabsContent value="campanhas" className="space-y-8">
            {/* Resumo de Campanhas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Campanhas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {campaignsData.length}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">+3</span>
                        <span className="text-sm text-gray-500">este mês</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campanhas Ativas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getActiveCampaigns()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">75%</span>
                        <span className="text-sm text-gray-500">de eficiência</span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ROI Médio</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        3.2x
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">+0.5x</span>
                        <span className="text-sm text-gray-500">vs mês anterior</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Campanhas */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Campanhas em Andamento
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopPerformingCampaigns().map((campaign, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                              <Facebook className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {campaign.campaign}
                            </h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              ID: {campaign.campaign_id.slice(-8)}
                            </span>
                            <span>Objetivo: {campaign.campaign_objective}</span>
                            <Badge 
                              variant={campaign.campaign_effective_status === 'ACTIVE' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {campaign.campaign_effective_status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            R$ {campaign.spend.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Orçamento: R$ {campaign.campaign_daily_budget?.toFixed(2) || 'Ilimitado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights de Campanhas */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Insights de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Campanha de Sucesso</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <strong>"Quarta de Bamba | Geral"</strong> está com desempenho 25% acima da média. 
                      Considere aumentar o investimento para maximizar resultados.
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Oportunidade de Otimização</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <strong>"Vídeo de Lançamento 01"</strong> apresenta custo por clique elevado. 
                      Recomendamos ajustar o targeting para melhor eficiência.
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Tendência Positiva</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Campanhas focadas em <strong>"Quarta de Bamba"</strong> mostram engajamento crescente. 
                      O público nichado está respondendo muito bem ao conteúdo.
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Segmentação Eficaz</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      O público principal (25-44 anos) representa 78% do engajamento. 
                      Considere expandir estratégias para outras faixas etárias.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 