'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp,
  Users,
  AlertTriangle,
  UserPlus,
  Heart,
  UserMinus,
  Activity
} from 'lucide-react';

interface Cohort {
  cohort: string;
  total_clientes: number;
  retencao_mes_0: number;
  retencao_mes_1: number;
  retencao_mes_2: number;
  retencao_mes_3: number;
  retencao_mes_6: number;
  retencao_mes_12: number;
}

interface JornadaStats {
  total: number;
  novo: number;
  engajado: number;
  fiel: number;
  em_risco: number;
  perdido: number;
}

export default function RetencaoPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [jornadaStats, setJornadaStats] = useState<JornadaStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cohortRes, jornadaRes] = await Promise.all([
        fetch('/api/crm/retencao?tipo=cohort'),
        fetch('/api/crm/retencao?tipo=jornada')
      ]);

      const cohortData = await cohortRes.json();
      const jornadaData = await jornadaRes.json();

      if (cohortData.success) {
        setCohorts(cohortData.data);
      }

      if (jornadaData.success && jornadaData.stats) {
        setJornadaStats(jornadaData.stats);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRetencaoColor = (value: number) => {
    if (value >= 70) return 'bg-green-600 dark:bg-green-500';
    if (value >= 50) return 'bg-blue-600 dark:bg-blue-500';
    if (value >= 30) return 'bg-yellow-600 dark:bg-yellow-500';
    if (value >= 10) return 'bg-orange-600 dark:bg-orange-500';
    return 'bg-red-600 dark:bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Dashboard de Retenção
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cohort Analysis e Funil de Jornada do Cliente
          </p>
        </div>

        <Tabs defaultValue="funil" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800">
            <TabsTrigger value="funil">Funil de Jornada</TabsTrigger>
            <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          </TabsList>

          {/* FUNIL DE JORNADA */}
          <TabsContent value="funil" className="space-y-6">
            {loading ? (
              <Skeleton className="h-96" />
            ) : jornadaStats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{jornadaStats.total}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800">
                    <CardContent className="p-6 text-center">
                      <UserPlus className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{jornadaStats.novo}</div>
                      <div className="text-sm text-cyan-600 dark:text-cyan-400">Novos</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6 text-center">
                      <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{jornadaStats.engajado}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Engajados</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-6 text-center">
                      <Heart className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">{jornadaStats.fiel}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Fiéis</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{jornadaStats.em_risco}</div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Em Risco</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-6 text-center">
                      <UserMinus className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-red-700 dark:text-red-300">{jornadaStats.perdido}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Perdidos</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Funil Visual */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Funil de Jornada do Cliente</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Distribuição de clientes por etapa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Novo */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-cyan-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Novos</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {jornadaStats.novo} ({Math.round((jornadaStats.novo / jornadaStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                          <div
                            className="bg-cyan-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold"
                            style={{ width: `${(jornadaStats.novo / jornadaStats.total) * 100}%` }}
                          >
                            {jornadaStats.novo}
                          </div>
                        </div>
                      </div>

                      {/* Engajado */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Engajados</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {jornadaStats.engajado} ({Math.round((jornadaStats.engajado / jornadaStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                          <div
                            className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold"
                            style={{ width: `${(jornadaStats.engajado / jornadaStats.total) * 100}%` }}
                          >
                            {jornadaStats.engajado}
                          </div>
                        </div>
                      </div>

                      {/* Fiel */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Fiéis</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {jornadaStats.fiel} ({Math.round((jornadaStats.fiel / jornadaStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                          <div
                            className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold"
                            style={{ width: `${(jornadaStats.fiel / jornadaStats.total) * 100}%` }}
                          >
                            {jornadaStats.fiel}
                          </div>
                        </div>
                      </div>

                      {/* Em Risco */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Em Risco</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {jornadaStats.em_risco} ({Math.round((jornadaStats.em_risco / jornadaStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                          <div
                            className="bg-orange-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold"
                            style={{ width: `${(jornadaStats.em_risco / jornadaStats.total) * 100}%` }}
                          >
                            {jornadaStats.em_risco}
                          </div>
                        </div>
                      </div>

                      {/* Perdido */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserMinus className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Perdidos</span>
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {jornadaStats.perdido} ({Math.round((jornadaStats.perdido / jornadaStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                          <div
                            className="bg-red-600 h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold"
                            style={{ width: `${(jornadaStats.perdido / jornadaStats.total) * 100}%` }}
                          >
                            {jornadaStats.perdido}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* COHORT ANALYSIS */}
          <TabsContent value="cohorts">
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Cohort Analysis</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Taxa de retenção por mês de aquisição do cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Cohort
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Clientes
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 0
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 1
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 2
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 3
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 6
                          </th>
                          <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                            Mês 12
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohorts.map((cohort) => (
                          <tr key={cohort.cohort} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                              {cohort.cohort}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {cohort.total_clientes}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_0)}>
                                {cohort.retencao_mes_0}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_1)}>
                                {cohort.retencao_mes_1}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_2)}>
                                {cohort.retencao_mes_2}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_3)}>
                                {cohort.retencao_mes_3}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_6)}>
                                {cohort.retencao_mes_6}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getRetencaoColor(cohort.retencao_mes_12)}>
                                {cohort.retencao_mes_12}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-600"></div>
                      <span>≥70% Excelente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-600"></div>
                      <span>50-69% Bom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-600"></div>
                      <span>30-49% Regular</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-600"></div>
                      <span>10-29% Baixo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-600"></div>
                      <span>&lt;10% Crítico</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

