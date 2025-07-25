'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePageTitle } from '@/contexts/PageTitleContext';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Heart,
  MessageSquare,
  RefreshCw,
  Target,
  Award,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface DailyAnalysisData {
  period: {
    start_date: string;
    end_date: string;
    days_analyzed: number;
  };
  daily_variations: {
    daily_changes: Record<string, DailyChange>;
    avg_daily_engagement: number;
    follower_growth_total: number;
    best_day: string | null;
    worst_day: string | null;
  };
  platform_analysis: {
    instagram: unknown;
    facebook: unknown;
    insights: unknown;
  };
  trends_and_insights: Array<{
    type: string;
    category: string;
    title: string;
    description: string;
    value: number;
    recommendation: string;
  }>;
  summary: {
    total_posts_period: number;
    avg_daily_engagement: number;
    follower_growth: number;
    best_performing_day: string | null;
    worst_performing_day: string | null;
  };
}

interface DailyChange {
  total_follower_change: number;
  engagement_rate: number;
  posts_published: number;
  total_interactions: number;
}

export default function DiarioPage() {
  const { setPageTitle } = usePageTitle();
  const [data, setData] = useState<DailyAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState('7');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [filterType, setFilterType] = useState<'preset' | 'custom'>('preset');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inicializar datas padrão
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    setPageTitle('Análise Diária - Meta');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const loadDailyAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Carregando análise diária Meta...');

      let apiUrl = '';
      if (filterType === 'custom' && startDate && endDate) {
        apiUrl = `/api/meta/daily-analysis?start_date=${startDate}&end_date=${endDate}&platform=${selectedPlatform}`;
      } else {
        apiUrl = `/api/meta/daily-analysis?days=${selectedDays}&platform=${selectedPlatform}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ Análise diária carregada:', result.debug);
        setData(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar análise diária:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDays, selectedPlatform, startDate, endDate, filterType]);

  useEffect(() => {
    loadDailyAnalysis();
  }, [loadDailyAnalysis]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDailyAnalysis();
    setRefreshing(false);
  };

  const setQuickRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    setStartDate(pastDate.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setFilterType('custom');
  };

  const calculateDaysDifference = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getTrendIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'negative':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Analisando dados diários...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Análise Diária Meta
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Variações diárias e tendências de Instagram e Facebook
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterType}
                onValueChange={(value: 'preset' | 'custom') =>
                  setFilterType(value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">Presets</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>

              {filterType === 'preset' ? (
                <Select value={selectedDays} onValueChange={setSelectedDays}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-36"
                    placeholder="Data inicial"
                  />
                  <span className="text-gray-400">até</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-36"
                    placeholder="Data final"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({calculateDaysDifference(startDate, endDate)} dias)
                  </span>
                </div>
              )}

              {filterType === 'custom' && (
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setQuickRange(7)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-8"
                  >
                    7d
                  </Button>
                  <Button
                    onClick={() => setQuickRange(30)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-8"
                  >
                    30d
                  </Button>
                  <Button
                    onClick={() => setQuickRange(90)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-8"
                  >
                    90d
                  </Button>
                </div>
              )}

              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            </div>
          </div>

          {data && (
            <>
              {/* Resumo Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Crescimento Seguidores
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data.summary.follower_growth > 0 ? '+' : ''}
                          {data.summary.follower_growth}
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${data.summary.follower_growth >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                      >
                        <Users
                          className={`w-5 h-5 ${data.summary.follower_growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Engagement Médio
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data.summary.avg_daily_engagement.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Posts Publicados
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data.summary.total_posts_period}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Período Analisado
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {data.period.days_analyzed} dias
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tendências e Insights */}
              {data.trends_and_insights &&
                data.trends_and_insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Tendências e Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.trends_and_insights.map((trend, index) => (
                          <div
                            key={index}
                            className={`p-4 border rounded-lg ${getTrendColor(trend.type)}`}
                          >
                            <div className="flex items-start gap-3">
                              {getTrendIcon(trend.type)}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                  {trend.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {trend.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                  💡 {trend.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Variações Diárias */}
              {data.daily_variations.daily_changes &&
                Object.keys(data.daily_variations.daily_changes).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Variações Diárias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(data.daily_variations.daily_changes)
                          .slice(-10) // Mostrar últimos 10 dias
                          .reverse()
                          .map(([date, changes]: [string, DailyChange]) => (
                            <div
                              key={date}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(date)}
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span
                                      className={
                                        changes.total_follower_change >= 0
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }
                                    >
                                      {changes.total_follower_change > 0
                                        ? '+'
                                        : ''}
                                      {changes.total_follower_change}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {changes.engagement_rate.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {changes.posts_published} posts
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {changes.total_interactions} interações
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Melhor e Pior Dia */}
              {(data.summary.best_performing_day ||
                data.summary.worst_performing_day) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.summary.best_performing_day && (
                    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">
                              Melhor Dia
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {formatDate(data.summary.best_performing_day)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {data.summary.worst_performing_day && (
                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium text-orange-900 dark:text-orange-100">
                              Dia Menos Eficaz
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                              {formatDate(data.summary.worst_performing_day)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
