'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarIcon,
  TrendingUpIcon,
  PackageIcon,
  ClockIcon,
  DollarSignIcon,
  RefreshCwIcon
} from 'lucide-react';

interface ResumoSemanalItem {
  dia_semana: string;
  data_exemplo: string;
  horario_pico: number;
  produto_mais_vendido: string;
  grupo_produto: string;
  quantidade_pico: number;
  faturamento_total: number;
  total_produtos_vendidos: number;
  produtos_unicos: number;
}

interface SemanaReferencia {
  semana: number;
  data_inicio: string;
  data_fim: string;
  periodo_formatado: string;
}

const diasSemana = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const coresDias = {
  'Domingo': '#ef4444',
  'Segunda': '#3b82f6', 
  'Terça': '#10b981',
  'Quarta': '#f59e0b',
  'Quinta': '#8b5cf6',
  'Sexta': '#ec4899',
  'Sábado': '#f97316'
};

export default function ResumoSemanalProdutos() {
  const [dados, setDados] = useState<ResumoSemanalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semanas, setSemanas] = useState<SemanaReferencia[]>([]);
  const [semanaSelecionada, setSemanaSelecionada] = useState<string>(''); // semana_id ou 'ultima_completa'
  const [loadingSemanas, setLoadingSemanas] = useState(false);

  // Buscar semanas disponíveis
  const buscarSemanas = async () => {
    setLoadingSemanas(true);
    try {
      const response = await fetch('/api/semanas/listar');
      if (!response.ok) throw new Error('Erro ao buscar semanas');
      
      const result = await response.json();
      setSemanas(result.semanas || []);
      
      // Define última semana completa como padrão se não há seleção
      if (!semanaSelecionada && result.semanas?.length > 0) {
        // Encontra a última semana completa (data_fim < hoje)
        const hoje = new Date().toISOString().split('T')[0];
        const ultimaCompleta = result.semanas.find((s: SemanaReferencia) => s.data_fim < hoje);
        if (ultimaCompleta) {
          setSemanaSelecionada(ultimaCompleta.semana.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao buscar semanas:', error);
    } finally {
      setLoadingSemanas(false);
    }
  };

  const buscarDados = async () => {
    if (!semanaSelecionada) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Encontra os dados da semana selecionada
      const semanaData = semanas.find(s => s.semana.toString() === semanaSelecionada);
      if (!semanaData) {
        throw new Error('Semana não encontrada');
      }

      const response = await fetch('/api/ferramentas/resumo-semanal-produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_inicio: semanaData.data_inicio,
          data_fim: semanaData.data_fim,
          bar_id: 3
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      setDados(result.dados || []);
    } catch (error) {
      console.error('Erro ao buscar resumo semanal:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carrega semanas na inicialização
  useEffect(() => {
    buscarSemanas();
  }, []);

  // Busca dados quando semana muda
  useEffect(() => {
    if (semanaSelecionada && semanas.length > 0) {
      buscarDados();
    }
  }, [semanaSelecionada, semanas]);

  const formatarHora = (hora: number) => `${hora.toString().padStart(2, '0')}:00`;
  
  const formatarMoeda = (valor: number) => 
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando resumo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>Erro ao carregar dados: {error}</p>
            <Button onClick={buscarDados} className="mt-4" variant="outline">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Resumo Semanal de Produtos
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Visão geral dos produtos mais vendidos por dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button onClick={buscarDados} variant="outline" size="sm">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Semana:
              </label>
              <Select 
                value={semanaSelecionada} 
                onValueChange={setSemanaSelecionada}
                disabled={loadingSemanas}
              >
                <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Selecione uma semana" className="text-gray-900 dark:text-white" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {semanas.map((semana) => (
                    <SelectItem 
                      key={semana.semana} 
                      value={semana.semana.toString()}
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Semana {semana.semana} • {semana.periodo_formatado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Resumo por Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {diasSemana.map(dia => {
          const dadosDia = dados.find(d => d.dia_semana === dia);
          const corDia = coresDias[dia as keyof typeof coresDias];
          
          return (
            <Card 
              key={dia} 
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: corDia }}
                    ></div>
                    {dia}
                  </CardTitle>
                  {dadosDia && (
                    <Badge variant="outline" className="text-xs">
                      {dadosDia.data_exemplo}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {dadosDia ? (
                  <>
                    {/* Horário de Pico */}
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Horário Pico</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatarHora(dadosDia.horario_pico)}
                        </p>
                      </div>
                    </div>

                    {/* Produto Mais Vendido */}
                    <div className="flex items-start gap-2">
                      <PackageIcon className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Produto Top</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                          {dadosDia.produto_mais_vendido}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {dadosDia.grupo_produto} • {dadosDia.quantidade_pico} unidades
                        </p>
                      </div>
                    </div>

                    {/* Faturamento */}
                    <div className="flex items-center gap-2">
                      <DollarSignIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Faturamento</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(dadosDia.faturamento_total)}
                        </p>
                      </div>
                    </div>

                    {/* Estatísticas Extras */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {dadosDia.total_produtos_vendidos.toLocaleString()} produtos
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {dadosDia.produtos_unicos} únicos
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      Sem dados para este dia
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo Geral */}
      {dados.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Insights da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dados.reduce((sum, d) => sum + d.faturamento_total, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Faturamento Total</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dados.reduce((sum, d) => sum + d.total_produtos_vendidos, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Produtos Vendidos</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.max(...dados.map(d => d.produtos_unicos))}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Produtos Únicos (máx)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
