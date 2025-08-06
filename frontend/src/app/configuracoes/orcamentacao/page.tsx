'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Upload,
  RefreshCw,
  Edit,
  Save,
  X,
  Check,
  AlertCircle,
  FileText,
  PlusCircle,
  Target
} from 'lucide-react';

interface DadosOrcamento {
  id?: number;
  bar_id: number;
  ano: number;
  mes: number;
  categoria: string;
  subcategoria?: string;
  valor_previsto: number;
  valor_realizado?: number;
  percentual_realizado?: number;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

interface CategoriaOrcamento {
  nome: string;
  subcategorias?: string[];
  total_previsto: number;
  total_realizado: number;
}

export default function OrcamentacaoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();

  const [anoSelecionado, setAnoSelecionado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dados, setDados] = useState<DadosOrcamento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaOrcamento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [editMode, setEditMode] = useState<Record<number, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<number, number>>({});

  useEffect(() => {
    setPageTitle('💰 Orçamentação');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const iniciarOrcamento = async (ano: string) => {
    setAnoSelecionado(ano);
    await carregarDados(ano);
  };

  const carregarDados = async (ano?: string) => {
    if (!selectedBar) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString(),
        ano: ano || anoSelecionado,
      });

      if (mesSelecionado !== 'todos') {
        params.append('mes', mesSelecionado);
      }

      const response = await fetch(`/api/configuracoes/orcamentacao?${params}`);
      const result = await response.json();

      if (result.success) {
        setDados(result.data || []);
        processarCategorias(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do orçamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sincronizarNibo = async () => {
    if (!selectedBar || !anoSelecionado) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/configuracoes/orcamentacao/sync-nibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ano: parseInt(anoSelecionado),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sincronização concluída',
          description: `${result.importados} registros importados, ${result.atualizados} atualizados`,
        });
        await carregarDados();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sincronizar com o Nibo',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const processarCategorias = (dadosOrcamento: DadosOrcamento[]) => {
    const categoriasMap = new Map<string, CategoriaOrcamento>();

    dadosOrcamento.forEach(item => {
      if (!categoriasMap.has(item.categoria)) {
        categoriasMap.set(item.categoria, {
          nome: item.categoria,
          subcategorias: [],
          total_previsto: 0,
          total_realizado: 0,
        });
      }

      const categoria = categoriasMap.get(item.categoria)!;
      categoria.total_previsto += item.valor_previsto;
      categoria.total_realizado += item.valor_realizado || 0;

      if (item.subcategoria && !categoria.subcategorias?.includes(item.subcategoria)) {
        categoria.subcategorias?.push(item.subcategoria);
      }
    });

    setCategorias(Array.from(categoriasMap.values()));
  };

  const handleEdit = (id: number) => {
    setEditMode(prev => ({ ...prev, [id]: true }));
    const item = dados.find(d => d.id === id);
    if (item) {
      setEditedValues(prev => ({ ...prev, [id]: item.valor_previsto }));
    }
  };

  const handleSave = async (id: number) => {
    const novoValor = editedValues[id];
    if (novoValor === undefined) return;

    try {
      const response = await fetch('/api/configuracoes/orcamentacao', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          valor_previsto: novoValor,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Valor atualizado com sucesso',
        });
        setEditMode(prev => ({ ...prev, [id]: false }));
        await carregarDados();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a alteração',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = (id: number) => {
    setEditMode(prev => ({ ...prev, [id]: false }));
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const meses = [
    { value: 'todos', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  // Se não tiver ano selecionado, mostrar cards de seleção
  if (!anoSelecionado) {
    return (
      <ProtectedRoute requiredModule="configuracoes">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Orçamentação
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gerencie o orçamento anual do seu estabelecimento
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => iniciarOrcamento('2024')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Histórico
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                    Orçamento 2024
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Visualize e analise o orçamento realizado em 2024
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Acessar 2024
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => iniciarOrcamento('2025')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Target className="w-12 h-12 text-green-600 dark:text-green-400" />
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      Atual
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                    Orçamento 2025
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Planeje e acompanhe o orçamento do ano atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Acessar 2025
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Página principal com dados
  return (
    <ProtectedRoute requiredModule="configuracoes">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setAnoSelecionado('')}
                className="mr-2"
              >
                ← Voltar
              </Button>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Orçamento {anoSelecionado}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gestão orçamentária integrada com Nibo
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => carregarDados()}
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={sincronizarNibo}
                disabled={syncing}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sincronizar Nibo
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mês
                  </label>
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map(mes => (
                        <SelectItem key={mes.value} value={mes.value}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map(categoria => (
              <Card key={categoria.nome} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-gray-900 dark:text-white">
                      {categoria.nome}
                    </CardTitle>
                    <Badge variant="outline">
                      {((categoria.total_realizado / categoria.total_previsto) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Previsto:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatarMoeda(categoria.total_previsto)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatarMoeda(categoria.total_realizado)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((categoria.total_realizado / categoria.total_previsto) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabela Detalhada */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhamento do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Subcategoria
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Previsto
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Realizado
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        %
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          {item.categoria}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {item.subcategoria || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editMode[item.id!] ? (
                            <Input
                              type="number"
                              value={editedValues[item.id!] || 0}
                              onChange={(e) => setEditedValues(prev => ({
                                ...prev,
                                [item.id!]: parseFloat(e.target.value) || 0
                              }))}
                              className="w-32 ml-auto bg-white dark:bg-gray-700"
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatarMoeda(item.valor_previsto)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatarMoeda(item.valor_realizado || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={item.percentual_realizado! > 100 ? 'destructive' : 'default'}
                            className="min-w-[60px]"
                          >
                            {item.percentual_realizado?.toFixed(0) || 0}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {editMode[item.id!] ? (
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(item.id!)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(item.id!)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
