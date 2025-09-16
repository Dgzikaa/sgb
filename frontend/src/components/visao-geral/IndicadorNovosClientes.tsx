'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useToast } from '@/hooks/use-toast';

interface DadosNovosClientes {
  mesAtual: {
    mes: string;
    novosClientes: number;
    nome: string;
  };
  mesAnterior: {
    mes: string;
    novosClientes: number;
    nome: string;
  };
  variacao: {
    absoluta: number;
    percentual: number;
  };
  meta: number;
  detalhes?: {
    totalClientesUnicos?: number;
    novos?: number;
    recorrentes?: number;
    metodo?: string;
  };
}

interface IndicadorNovosClientesProps {
  mesInicial?: string; // Formato: YYYY-MM
}

export function IndicadorNovosClientes({ mesInicial }: IndicadorNovosClientesProps) {
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [dados, setDados] = useState<DadosNovosClientes | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState<string>(
    mesInicial || new Date().toISOString().slice(0, 7)
  );

  const carregarDados = async () => {
    if (!selectedBar?.id) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/visao-geral/novos-clientes?barId=${selectedBar.id}&mes=${mesAtual}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDados(result.data);
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao carregar dados de novos clientes',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar novos clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de novos clientes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [selectedBar?.id, mesAtual]);

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const dataAtual = new Date(ano, mes - 1, 1);
    
    if (direcao === 'anterior') {
      dataAtual.setMonth(dataAtual.getMonth() - 1);
    } else {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    }
    
    const novoMes = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}`;
    setMesAtual(novoMes);
  };

  const formatarNumero = (num: number) => num.toLocaleString('pt-BR');
  
  const getVariacaoIcon = () => {
    if (!dados) return <Minus className="w-4 h-4" />;
    
    if (dados.variacao.percentual > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    } else if (dados.variacao.percentual < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVariacaoColor = () => {
    if (!dados) return 'text-gray-500';
    
    if (dados.variacao.percentual > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (dados.variacao.percentual < 0) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getProgressoMeta = () => {
    if (!dados || dados.meta <= 0) return 0;
    return Math.min((dados.mesAtual.novosClientes / dados.meta) * 100, 100);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (!dados) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Erro ao carregar dados de novos clientes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Novos Clientes
            </CardTitle>
          </div>
          
          {/* Navegação de Mês */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navegarMes('anterior')}
              className="p-1 h-7 w-7"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {dados.mesAtual.nome.split(' ')[0].slice(0, 3)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navegarMes('proximo')}
              className="p-1 h-7 w-7"
              disabled={mesAtual >= new Date().toISOString().slice(0, 7)}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Valor Principal */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatarNumero(dados.mesAtual.novosClientes)}
          </span>
          
          {/* Variação */}
          <div className={`flex items-center gap-1 ${getVariacaoColor()}`}>
            {getVariacaoIcon()}
            <span className="text-sm font-medium">
              {dados.variacao.absoluta > 0 ? '+' : ''}
              {formatarNumero(dados.variacao.absoluta)}
            </span>
            <span className="text-xs">
              ({dados.variacao.percentual > 0 ? '+' : ''}{dados.variacao.percentual.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Barra de Progresso da Meta */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Meta: {formatarNumero(dados.meta)}</span>
            <span>{getProgressoMeta().toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressoMeta()}%` }}
            />
          </div>
        </div>

        {/* Comparação com Mês Anterior */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>
              {dados.mesAnterior.nome.split(' ')[0]}: {formatarNumero(dados.mesAnterior.novosClientes)}
            </span>
          </div>
          
          {dados.detalhes?.totalClientesUnicos && (
            <Badge variant="secondary" className="text-xs">
              {formatarNumero(dados.detalhes.totalClientesUnicos)} total
            </Badge>
          )}
        </div>

        {/* Detalhes Adicionais */}
        {dados.detalhes && (dados.detalhes.novos || dados.detalhes.recorrentes) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarNumero(dados.detalhes.novos || 0)}
                </div>
                <div className="text-gray-500">Novos</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">
                  {formatarNumero(dados.detalhes.recorrentes || 0)}
                </div>
                <div className="text-gray-500">Recorrentes</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
