'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Construction,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function VisaoGeralEstrategica() {
  const [dadosCarregando, setDadosCarregando] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setDadosCarregando(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Visão Geral Estratégica
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Painel executivo com indicadores estratégicos do negócio
          </p>
        </div>

        {/* Alertas de Desenvolvimento */}
        <Card className="card-dark mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Construction className="h-5 w-5" />
              Indicadores em Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                <Clock className="h-3 w-3 mr-1" />
                EBITDA 2025
              </Badge>
              <Badge variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                <Clock className="h-3 w-3 mr-1" />
                CMV Limpo
              </Badge>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              Estes indicadores estão sendo desenvolvidos e estarão disponíveis em breve.
            </p>
          </CardContent>
        </Card>

        {/* Correção Necessária */}
        <Card className="card-dark mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Correção Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="destructive">
                Cálculo Artístico
              </Badge>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              O cálculo do indicador artístico precisa ser corrigido.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="kpis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="kpis">KPIs Principais</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="operacional">Operacional</TabsTrigger>
            <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Receita Total */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Receita Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dadosCarregando ? '---' : 'R$ 125.430'}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +12.5% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              {/* Ticket Médio */}
              <Card className="card-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ticket Médio
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dadosCarregando ? '---' : 'R$ 78,50'}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +5.2% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              {/* EBITDA (Em Desenvolvimento) */}
              <Card className="card-dark opacity-60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    EBITDA 2025
                  </CardTitle>
                  <Construction className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    Em desenvolvimento
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Disponível em breve
                  </p>
                </CardContent>
              </Card>

              {/* CMV Limpo (Em Desenvolvimento) */}
              <Card className="card-dark opacity-60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    CMV Limpo
                  </CardTitle>
                  <Construction className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    Em desenvolvimento
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Disponível em breve
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Indicadores Financeiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Gráficos e análises financeiras detalhadas serão implementados aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operacional" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Métricas Operacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Métricas operacionais detalhadas serão implementadas aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tendencias" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Análise de Tendências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Análise de tendências e projeções serão implementadas aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
