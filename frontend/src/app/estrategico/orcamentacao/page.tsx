'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import { useGlobalLoading } from '@/components/ui/global-loading';
import {
  DollarSign,
  Edit,
  Check,
  X,
  RefreshCw,
  Calendar,
  Plus,
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
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaOrcamento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>('8'); // Agosto pré-selecionado
  const [anoSelecionado, setAnoSelecionado] = useState<string>('2025');
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  
  // Estados para campos editáveis específicos
  const [despesasVariaveis, setDespesasVariaveis] = useState({ planejado: 11.5, projecao: 11.5, realizado: 0 });
  const [cmv, setCmv] = useState({ planejado: 27, projecao: 27, realizado: 0 });

  useEffect(() => {
    setPageTitle('💰 Orçamentação');
    return () => setPageTitle('');
  }, [setPageTitle]);

  // Função para obter estrutura base das categorias (sem useCallback para evitar loops)
  const getCategoriasEstruturadas = (): CategoriaOrcamento[] => [
    {
      nome: 'Despesas Variáveis (%)',
      cor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      subcategorias: [
        { nome: 'IMPOSTO/TX MAQ/COMISSÃO', planejado: despesasVariaveis.planejado, projecao: despesasVariaveis.projecao, realizado: despesasVariaveis.realizado, editavel: true, isPercentage: true }
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
      nome: 'Receitas',
      cor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      subcategorias: [
        { nome: 'RECEITA BRUTA', planejado: 195000, projecao: 195000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Pessoal',
      cor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      subcategorias: [
        { nome: 'SALÁRIOS', planejado: 45000, projecao: 45000, realizado: 0, editavel: true },
        { nome: 'ENCARGOS', planejado: 15000, projecao: 15000, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Operacionais',
      cor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      subcategorias: [
        { nome: 'ALUGUEL', planejado: 12000, projecao: 12000, realizado: 0, editavel: true },
        { nome: 'ENERGIA', planejado: 3500, projecao: 3500, realizado: 0, editavel: true },
        { nome: 'ÁGUA', planejado: 800, projecao: 800, realizado: 0, editavel: true },
        { nome: 'TELEFONE/INTERNET', planejado: 500, projecao: 500, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Marketing',
      cor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      subcategorias: [
        { nome: 'PUBLICIDADE', planejado: 5000, projecao: 5000, realizado: 0, editavel: true },
        { nome: 'MARKETING DIGITAL', planejado: 2000, projecao: 2000, realizado: 0, editavel: true }
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

  const carregarDados = useCallback(async () => {
    if (!selectedBar) return;

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
    }
  }, [selectedBar, anoSelecionado, mesSelecionado, toast, showLoading, hideLoading]);

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, carregarDados]);

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

  if (loading) {
    return <GlobalLoadingComponent />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <GlobalLoadingComponent />
        <div className="container mx-auto px-4 py-6">
          {/* Cabeçalho */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                💰 Orçamentação
              </h1>
              <div className="flex items-center gap-4">
                {ultimaAtualizacao && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
                  </span>
                )}
                <Button
                  onClick={sincronizarManualmente}
                  disabled={sincronizando}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
                  Sincronizar NIBO
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4 mb-6">
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger className="w-[120px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger className="w-[150px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Receita Planejada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatarMoeda(valoresCalculados.totalReceitaPlanejado)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Despesas Planejadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatarMoeda(valoresCalculados.totalDespesasPlanejado)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Lucro Planejado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${valoresCalculados.lucroPlanejado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(valoresCalculados.lucroPlanejado)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Margem Planejada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${valoresCalculados.margemPlanejada >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarPorcentagem(valoresCalculados.margemPlanejada)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Orçamento */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Detalhamento Orçamentário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-900 dark:text-white">Categoria</TableHead>
                    <TableHead className="text-gray-900 dark:text-white text-right">Planejado</TableHead>
                    <TableHead className="text-gray-900 dark:text-white text-right">Projeção</TableHead>
                    <TableHead className="text-gray-900 dark:text-white text-right">Realizado</TableHead>
                    <TableHead className="text-gray-900 dark:text-white text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria, catIndex) => (
                    <>
                      {/* Cabeçalho da Categoria */}
                      <TableRow key={`cat-${catIndex}`} className="border-gray-200 dark:border-gray-700">
                        <TableCell colSpan={5} className={`font-semibold ${categoria.cor} p-3`}>
                          {categoria.nome}
                        </TableCell>
                      </TableRow>
                      
                      {/* Subcategorias */}
                      {categoria.subcategorias.map((sub, subIndex) => {
                        const key = `${catIndex}-${subIndex}`;
                        const isEditing = editMode[key];
                        
                        return (
                          <TableRow key={key} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell className="text-gray-900 dark:text-white pl-8">
                              {sub.nome}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  value={editedValues[key] || ''}
                                  onChange={(e) => setEditedValues(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-24 text-right bg-white dark:bg-gray-700"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">
                                  {sub.isPercentage ? formatarPorcentagem(sub.planejado) : formatarMoeda(sub.planejado)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-gray-900 dark:text-white">
                              {sub.isPercentage ? formatarPorcentagem(sub.projecao) : formatarMoeda(sub.projecao)}
                            </TableCell>
                            <TableCell className="text-right text-gray-900 dark:text-white">
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
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancel(catIndex, subIndex)}
                                        className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(catIndex, subIndex, sub.planejado)}
                                      className="h-8 w-8 p-0 border-gray-300 dark:border-gray-600"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}