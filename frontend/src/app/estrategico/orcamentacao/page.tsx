'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layouts/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/contexts/BarContext';
import { AnimatedCounter, AnimatedCurrency } from '@/components/ui/animated-counter';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Edit,
  Check,
  X,
  RefreshCw,
  Calendar,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  BarChart3,
  Download,
  Upload,
} from 'lucide-react';

interface CategoriaOrcamento {
  nome: string;
  cor: string;
  subcategorias: {
    nome: string;
    planejado: number;
    projecao: number;
    realizado: number;
    editavel: boolean;
    isPercentage?: boolean;
  }[];
}

interface DadosOrcamento {
  id?: number;
  bar_id: number;
  ano: number;
  mes: number;
  categoria: string;
  subcategoria?: string;
  valor_planejado: number;
  valor_projecao: number;
  valor_realizado?: number;
  percentual_realizado?: number;
  observacoes?: string;
}

export default function OrcamentacaoPage() {
  const { selectedBar } = useBar();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaOrcamento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>('8'); // Agosto pré-selecionado
  const [anoSelecionado, setAnoSelecionado] = useState<string>('2025');
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>('planejamento');
  
  // Estados para campos editáveis específicos
  const [despesasVariaveis, setDespesasVariaveis] = useState({ planejado: 11.5, projecao: 11.5, realizado: 0 });
  const [cmv, setCmv] = useState({ planejado: 27, projecao: 27, realizado: 0 });

  // Ref para evitar dependências desnecessárias
  const isLoadingRef = useRef(false);

  // Função para obter estrutura base das categorias baseada no NIBO real
  const getCategoriasEstruturadas = (): CategoriaOrcamento[] => [
    {
      nome: 'Despesas Variáveis (%)',
      cor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      subcategorias: [
        { nome: 'IMPOSTO/TX MAQ/COMISSAO', planejado: despesasVariaveis.planejado, projecao: despesasVariaveis.projecao, realizado: despesasVariaveis.realizado, editavel: true, isPercentage: true }
      ]
    },
    {
      nome: 'CMV (%)',
      cor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      subcategorias: [
        { nome: 'CMV', planejado: cmv.planejado, projecao: cmv.projecao, realizado: cmv.realizado, editavel: true, isPercentage: true }
      ]
    },
    {
      nome: 'Pessoal',
      cor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      subcategorias: [
        { nome: 'CUSTO-EMPRESA FUNCIONÁRIOS', planejado: 45000, projecao: 45000, realizado: 0, editavel: true },
        { nome: 'ADICIONAIS', planejado: 5000, projecao: 5000, realizado: 0, editavel: true },
        { nome: 'FREELA ATENDIMENTO', planejado: 8000, projecao: 8000, realizado: 0, editavel: true },
        { nome: 'FREELA BAR', planejado: 6000, projecao: 6000, realizado: 0, editavel: true },
        { nome: 'FREELA COZINHA', planejado: 4000, projecao: 4000, realizado: 0, editavel: true },
        { nome: 'FREELA LIMPEZA', planejado: 2000, projecao: 2000, realizado: 0, editavel: true },
        { nome: 'FREELA SEGURANÇA', planejado: 3000, projecao: 3000, realizado: 0, editavel: true },
        { nome: 'PRO LABORE', planejado: 15000, projecao: 15000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Administrativas',
      cor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      subcategorias: [
        { nome: 'Escritório Central', planejado: 2000, projecao: 2000, realizado: 0, editavel: true },
        { nome: 'Administrativo Ordinário', planejado: 1500, projecao: 1500, realizado: 0, editavel: true },
        { nome: 'RECURSOS HUMANOS', planejado: 1000, projecao: 1000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Marketing e Eventos',
      cor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      subcategorias: [
        { nome: 'Marketing', planejado: 5000, projecao: 5000, realizado: 0, editavel: true },
        { nome: 'Atrações Programação', planejado: 25000, projecao: 25000, realizado: 0, editavel: true },
        { nome: 'Produção Eventos', planejado: 8000, projecao: 8000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Operacionais',
      cor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      subcategorias: [
        { nome: 'Materiais Operação', planejado: 3000, projecao: 3000, realizado: 0, editavel: true },
        { nome: 'Estorno', planejado: 500, projecao: 500, realizado: 0, editavel: true },
        { nome: 'Equipamentos Operação', planejado: 2000, projecao: 2000, realizado: 0, editavel: true },
        { nome: 'Materiais de Limpeza e Descartáveis', planejado: 1500, projecao: 1500, realizado: 0, editavel: true },
        { nome: 'Utensílios', planejado: 800, projecao: 800, realizado: 0, editavel: true },
        { nome: 'Outros Operação', planejado: 1000, projecao: 1000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Ocupação',
      cor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
      subcategorias: [
        { nome: 'ALUGUEL/CONDOMÍNIO/IPTU', planejado: 12000, projecao: 12000, realizado: 0, editavel: true },
        { nome: 'ÁGUA', planejado: 800, projecao: 800, realizado: 0, editavel: true },
        { nome: 'GÁS', planejado: 600, projecao: 600, realizado: 0, editavel: true },
        { nome: 'INTERNET', planejado: 500, projecao: 500, realizado: 0, editavel: true },
        { nome: 'Manutenção', planejado: 2000, projecao: 2000, realizado: 0, editavel: true },
        { nome: 'LUZ', planejado: 3500, projecao: 3500, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Receitas',
      cor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      subcategorias: [
        { nome: 'RECEITA BRUTA', planejado: 195000, projecao: 195000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Não Operacionais',
      cor: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      subcategorias: [
        { nome: 'CONTRATOS', planejado: 0, projecao: 15700, realizado: 0, editavel: true }
      ]
    }
  ];

  // Função para carregar dados sem useCallback para evitar loops
  const carregarDados = async () => {
    if (!selectedBar || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    showLoading('Carregando dados orçamentários...');
    
    try {
      const anoAtual = new Date().getFullYear();
      
      // 1. Primeiro sincronizar com NIBO para o ano atual
      console.log('🔄 Sincronizando com NIBO...');
      const syncResponse = await fetch('/api/estrategico/orcamentacao/sync-nibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ano: anoAtual,
        }),
      });
      
      const syncResult = await syncResponse.json();
      if (syncResult.success) {
        console.log('✅ Sincronização NIBO concluída:', {
          importados: syncResult.importados,
          atualizados: syncResult.atualizados,
          total: syncResult.total
        });
      }

      // 2. Buscar dados orçamentários da tabela
      const response = await fetch(
        `/api/estrategico/orcamentacao?bar_id=${selectedBar.id}&ano=${anoSelecionado}&mes=${mesSelecionado}`
      );
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('📊 Dados orçamentários recebidos:', result.data);
        
        // Aplicar valores realizados na estrutura
        const categoriasAtualizadas = getCategoriasEstruturadas().map(categoria => ({
          ...categoria,
          subcategorias: categoria.subcategorias.map(sub => {
            // Buscar correspondência nos dados recebidos
            const dadosCorrespondentes = result.data.find((item: any) => 
              item.subcategoria === sub.nome || item.categoria === sub.nome
            );
            
            if (dadosCorrespondentes) {
              return {
                ...sub,
                realizado: dadosCorrespondentes.valor_realizado || 0,
                planejado: dadosCorrespondentes.valor_planejado || sub.planejado
              };
            }
            
            return sub;
          })
        }));

        setCategorias(categoriasAtualizadas);
        setUltimaAtualizacao(new Date());
        console.log('✅ Categorias atualizadas com dados reais');
      } else {
        console.log('⚠️ Sem dados específicos, usando estrutura base');
        setCategorias(getCategoriasEstruturadas());
        toast({
          title: 'Dados base carregados',
          description: 'Usando estrutura padrão. Valores realizados podem estar desatualizados.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Fallback para dados base
      setCategorias(getCategoriasEstruturadas());
      toast({
        title: 'Erro ao carregar',
        description: 'Usando dados base. Verifique conexão.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      hideLoading();
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, anoSelecionado, mesSelecionado]); // Removido carregarDados das dependências

  const sincronizarManualmente = async () => {
    if (!selectedBar) return;

    setSincronizando(true);
    showLoading('Sincronizando com NIBO...');
    
    try {
      const anoAtual = new Date().getFullYear();
      
      const syncResponse = await fetch('/api/estrategico/orcamentacao/sync-nibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ano: anoAtual,
        }),
      });
      
      const syncResult = await syncResponse.json();
      
      if (syncResult.success) {
        // Recarregar dados após sincronização
        await carregarDados();
        
        toast({
          title: 'Sincronização concluída',
          description: `${syncResult.total} registros processados (${syncResult.importados} novos, ${syncResult.atualizados} atualizados)`,
        });
      } else {
        throw new Error(syncResult.error || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar com o NIBO',
        variant: 'destructive',
      });
    } finally {
      setSincronizando(false);
      hideLoading();
    }
  };

  const handleEdit = (categoriaIndex: number, subIndex: number, valorAtual: number) => {
    const key = `${categoriaIndex}-${subIndex}`;
    setEditedValues(prev => ({ ...prev, [key]: valorAtual.toString() }));
    setEditMode(prev => ({ ...prev, [key]: true }));
  };

  const handleSave = async (categoriaIndex: number, subIndex: number) => {
    const key = `${categoriaIndex}-${subIndex}`;
    const novoValor = editedValues[key];
    if (!novoValor) return;

    try {
      const subcategoria = categorias[categoriaIndex].subcategorias[subIndex];

      // Atualizar localmente primeiro
      setCategorias(prev => prev.map((cat, catIndex) => 
        catIndex === categoriaIndex 
          ? {
              ...cat,
              subcategorias: cat.subcategorias.map((sub, subIdx) => 
                subIdx === subIndex 
                  ? { ...sub, planejado: parseFloat(novoValor) }
                  : sub
              )
            }
          : cat
      ));

      // Atualizar estados específicos se necessário
      if (subcategoria.nome === 'IMPOSTO/TX MAQ/COMISSÃO') {
        setDespesasVariaveis(prev => ({
          ...prev,
          planejado: parseFloat(novoValor)
        }));
      } else if (subcategoria.nome === 'CMV') {
        setCmv(prev => ({
          ...prev,
          planejado: parseFloat(novoValor)
        }));
      }

      toast({
        title: 'Sucesso',
        description: 'Valores atualizados com sucesso',
      });
      setEditMode(prev => ({ ...prev, [key]: false }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a alteração',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = (categoriaIndex: number, subIndex: number) => {
    const key = `${categoriaIndex}-${subIndex}`;
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
    setEditMode(prev => ({ ...prev, [key]: false }));
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  // Cálculos automáticos
  const calcularValores = () => {
    const totalReceitaPlanejado = categorias.find(cat => cat.nome === 'Receitas')?.subcategorias.reduce((acc, sub) => acc + sub.planejado, 0) || 0;
    const totalDespesasPlanejado = categorias.reduce((acc, cat) => {
      if (cat.nome === 'Receitas') return acc;
      return acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.planejado, 0);
    }, 0);
    
    const lucroPlanejado = totalReceitaPlanejado - totalDespesasPlanejado;
    const margemPlanejada = totalReceitaPlanejado > 0 ? (lucroPlanejado / totalReceitaPlanejado) * 100 : 0;

    return {
      totalReceitaPlanejado,
      totalDespesasPlanejado,
      lucroPlanejado,
      margemPlanejada,
    };
  };

  const valoresCalculados = calcularValores();

  // Opções de meses com nomes
  const mesesOptions = [
    { value: '1', label: 'Janeiro', icon: '❄️' },
    { value: '2', label: 'Fevereiro', icon: '💝' },
    { value: '3', label: 'Março', icon: '🌸' },
    { value: '4', label: 'Abril', icon: '🌱' },
    { value: '5', label: 'Maio', icon: '🌺' },
    { value: '6', label: 'Junho', icon: '☀️' },
    { value: '7', label: 'Julho', icon: '🎆' },
    { value: '8', label: 'Agosto', icon: '🌻' },
    { value: '9', label: 'Setembro', icon: '🍂' },
    { value: '10', label: 'Outubro', icon: '🎃' },
    { value: '11', label: 'Novembro', icon: '🦃' },
    { value: '12', label: 'Dezembro', icon: '🎄' },
  ];

  const anosOptions = [
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="💰 Orçamentação"
          description="Planejamento e controle orçamentário detalhado"
        />

        {/* Filtros Avançados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
          </div>
          
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosOptions.map((ano) => (
                <SelectItem key={ano.value} value={ano.value} className="text-gray-900 dark:text-white">
                  {ano.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesOptions.map((mes) => (
                <SelectItem key={mes.value} value={mes.value} className="text-gray-900 dark:text-white">
                  <span className="flex items-center gap-2">
                    <span>{mes.icon}</span>
                    <span>{mes.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {ultimaAtualizacao && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CalendarDays className="h-4 w-4" />
              <span>Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}</span>
            </div>
          )}

          <Button
            onClick={sincronizarManualmente}
            disabled={sincronizando}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
            Sincronizar NIBO
          </Button>
        </motion.div>

        {/* Cards de Resumo Animados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receita Planejada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedCurrency
                value={valoresCalculados.totalReceitaPlanejado}
                className="text-2xl font-bold text-green-600 dark:text-green-400"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Despesas Planejadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedCurrency
                value={valoresCalculados.totalDespesasPlanejado}
                className="text-2xl font-bold text-red-600 dark:text-red-400"
              />
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${valoresCalculados.lucroPlanejado >= 0 ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700' : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium flex items-center gap-2 ${valoresCalculados.lucroPlanejado >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                <Target className="h-4 w-4" />
                Lucro Planejado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedCurrency
                value={valoresCalculados.lucroPlanejado}
                className={`text-2xl font-bold ${valoresCalculados.lucroPlanejado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              />
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${valoresCalculados.margemPlanejada >= 0 ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700' : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium flex items-center gap-2 ${valoresCalculados.margemPlanejada >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                <PieChart className="h-4 w-4" />
                Margem Planejada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${valoresCalculados.margemPlanejada >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatarPorcentagem(valoresCalculados.margemPlanejada)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs para diferentes visões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="planejamento" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/50 dark:data-[state=active]:text-blue-300">
                <BarChart3 className="h-4 w-4 mr-2" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger value="comparativo" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/50 dark:data-[state=active]:text-green-300">
                <TrendingUp className="h-4 w-4 mr-2" />
                Comparativo
              </TabsTrigger>
              <TabsTrigger value="analise" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-300">
                <Target className="h-4 w-4 mr-2" />
                Análise
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planejamento">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detalhamento Orçamentário
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Planeje e edite valores para cada categoria de despesa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-900 dark:text-white font-semibold">Categoria</TableHead>
                          <TableHead className="text-gray-900 dark:text-white text-right font-semibold">Planejado</TableHead>
                          <TableHead className="text-gray-900 dark:text-white text-right font-semibold">Projeção</TableHead>
                          <TableHead className="text-gray-900 dark:text-white text-right font-semibold">Realizado</TableHead>
                          <TableHead className="text-gray-900 dark:text-white text-center font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categorias.map((categoria, catIndex) => (
                          <>
                            {/* Cabeçalho da Categoria */}
                            <TableRow key={`cat-${catIndex}`} className="border-gray-200 dark:border-gray-700">
                              <TableCell colSpan={5} className={`font-semibold ${categoria.cor} p-3 rounded-lg`}>
                                {categoria.nome}
                              </TableCell>
                            </TableRow>
                            
                            {/* Subcategorias */}
                            {categoria.subcategorias.map((sub, subIndex) => {
                              const key = `${catIndex}-${subIndex}`;
                              const isEditing = editMode[key];
                              
                              return (
                                <TableRow key={key} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <TableCell className="text-gray-900 dark:text-white pl-8 font-medium">
                                    {sub.nome}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isEditing ? (
                                      <Input
                                        value={editedValues[key] || ''}
                                        onChange={(e) => setEditedValues(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="w-32 text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="text-gray-900 dark:text-white font-mono">
                                        {sub.isPercentage ? formatarPorcentagem(sub.planejado) : formatarMoeda(sub.planejado)}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-900 dark:text-white font-mono">
                                    {sub.isPercentage ? formatarPorcentagem(sub.projecao) : formatarMoeda(sub.projecao)}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-900 dark:text-white font-mono">
                                    {sub.isPercentage ? formatarPorcentagem(sub.realizado) : formatarMoeda(sub.realizado)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {sub.editavel && (
                                      <div className="flex justify-center gap-2">
                                        {isEditing ? (
                                          <>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSave(catIndex, subIndex)}
                                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleCancel(catIndex, subIndex)}
                                              className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(catIndex, subIndex, sub.planejado)}
                                            className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparativo">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Análise Comparativa</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Compare valores planejados vs realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Em desenvolvimento - Gráficos comparativos
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analise">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Análise de Performance</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Insights e recomendações baseadas nos dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Em desenvolvimento - Análises e insights
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}