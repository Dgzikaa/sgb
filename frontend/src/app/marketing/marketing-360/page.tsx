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
  Calendar,
  Star,
  Eye,
  MessageSquare,
  Instagram,
  Facebook,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  LineChart,
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
        color: 'text-green-600 dark:text-green-400'
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
        color: 'text-yellow-600 dark:text-yellow-400'
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
        color: 'text-green-600 dark:text-green-400'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de marketing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/marketing')}
                  className="text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Marketing 360</h1>
                    <p className="text-blue-100 mt-1">
                      Análise completa de marketing e campanhas
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Activity className="w-3 h-3 mr-1" />
                  Dashboard Ativo
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800">
            <TabsTrigger 
              value="analise-geral"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análise Geral
            </TabsTrigger>
            <TabsTrigger 
              value="campanhas"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100"
            >
              <Target className="w-4 h-4 mr-2" />
              Campanhas
            </TabsTrigger>
          </TabsList>

          {/* Aba: Análise Geral */}
          <TabsContent value="analise-geral" className="space-y-6">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Total Investido
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    R$ {getTotalSpent().toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">+12.5%</span> vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Seguidores Instagram
                  </CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    {instagramData.length > 0 ? instagramData[instagramData.length - 1].follower_count_1d : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className={getFollowersGrowth() > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {getFollowersGrowth() > 0 ? "+" : ""}{getFollowersGrowth().toFixed(1)}%
                    </span> vs semana anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Avaliação Google
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    {getAverageRating().toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">+0.2</span> vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Campanhas Ativas
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    {getActiveCampaigns()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-blue-600 dark:text-blue-400">2</span> pausadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Análises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Crescimento de Seguidores */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Crescimento de Seguidores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Gráfico de crescimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Idade */}
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="card-title-dark flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Distribuição por Idade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Gráfico de distribuição</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Insights Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getInsights().map((insight, index) => {
                    const IconComponent = insight.icon;
                    return (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className={`w-5 h-5 ${insight.color}`} />
                          <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Campanhas */}
          <TabsContent value="campanhas" className="space-y-6">
            {/* Resumo de Campanhas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Total de Campanhas
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    {campaignsData.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">+3</span> este mês
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    Campanhas Ativas
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    {getActiveCampaigns()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">75%</span> de eficiência
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium card-description-dark">
                    ROI Médio
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold card-title-dark">
                    3.2x
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">+0.5x</span> vs mês anterior
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Campanhas */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Campanhas em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopPerformingCampaigns().map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {campaign.campaign}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>ID: {campaign.campaign_id}</span>
                          <span>Objetivo: {campaign.campaign_objective}</span>
                          <Badge 
                            variant={campaign.campaign_effective_status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {campaign.campaign_effective_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          R$ {campaign.spend.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Orçamento: R$ {campaign.campaign_daily_budget?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights de Campanhas */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Insights de Campanhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Campanha de Sucesso</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      "[SS] [ORDI] [VV] Quarta de Bamba | Geral" está com desempenho 25% acima da média. 
                      Considere aumentar o investimento.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Oportunidade de Otimização</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      "[SS] [ORDI] [TURB] Vídeo de Lançamento 01" está com custo por clique alto. 
                      Considere ajustar o targeting.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Tendência Positiva</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Campanhas de "Quarta de Bamba" estão gerando engajamento crescente. 
                      Público nichado respondendo bem.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Segmentação Eficaz</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Campanhas estão atingindo principalmente público 25-44 anos. 
                      Considere expandir para outras faixas etárias.
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