'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useBar } from '@/contexts/BarContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

export default function OrcamentacaoPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  const { showLoading, hideLoading, GlobalLoadingComponent } = useGlobalLoading();

  const [loading, setLoading] = useState(false);

  const [categorias, setCategorias] = useState<CategoriaOrcamento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>('8'); // Agosto pré-selecionado
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, { planejado: number; projecao: number }>>({});
  
  // Novos estados para campos editáveis
  const [despesasVariaveis, setDespesasVariaveis] = useState({ planejado: 11.5, projecao: 11.5, realizado: 0 });
  const [cmv, setCmv] = useState({ planejado: 27, projecao: 27, realizado: 0 });
  const [lucroMeta, setLucroMeta] = useState(45000);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    setPageTitle('💰 Orçamentação');
    return () => setPageTitle('');
  }, [setPageTitle]);

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
          ano: anoAtual
        })
      });

      if (!syncResponse.ok) {
        console.warn('⚠️ Falha na sincronização NIBO, continuando com dados existentes...');
      }

      // 2. Buscar dados orçamentários
      console.log('📊 Buscando dados orçamentários...');
      const response = await fetch(`/api/estrategico/orcamentacao?bar_id=${selectedBar.id}&mes=${mesSelecionado}&ano=${anoAtual}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        // Processar dados realizados do NIBO
        const dadosRealizados = new Map();
        
        data.dados_realizados?.forEach((item: any) => {
          const key = item.categoria_nome || 'Outros';
          if (!dadosRealizados.has(key)) {
            dadosRealizados.set(key, {
              realizado: 0,
              planejado: 0,
              projecao: 0
            });
          }
          const existing = dadosRealizados.get(key);
          existing.realizado += item.valor_realizado || 0;
          existing.planejado += item.valor_previsto || 0;
          existing.projecao += item.valor_previsto || 0;
        });
        
        // Atualizar estrutura base com dados reais
        const categoriasBase = getCategoriasEstruturadas();
        const categoriasAtualizadas = categoriasBase.map(categoria => ({
          ...categoria,
          subcategorias: categoria.subcategorias.map(sub => {
            const dadosReais = dadosRealizados.get(sub.nome);
            
            // Para CMV, agrupar todos os custos
            let realizadoCMV = 0;
            if (sub.nome === 'CMV') {
              for (const [key, data] of dadosRealizados) {
                if (key.includes('CUSTO') || key.includes('CMV') || key.includes('PRODUTO')) {
                  realizadoCMV += data.realizado;
                }
              }
              return {
                ...sub,
                realizado: realizadoCMV
              };
            }
            
            return dadosReais ? {
              ...sub,
              realizado: dadosReais.realizado,
              planejado: dadosReais.planejado || sub.planejado,
              projecao: dadosReais.projecao || sub.projecao
            } : sub;
          })
        }));
        
        setCategorias(categoriasAtualizadas);
        
        toast({
          title: '✅ Dados carregados',
          description: `Orçamento de ${mesSelecionado}/${anoAtual} atualizado com dados do NIBO`,
        });
      } else {
        // Fallback para dados base se API não retornar dados
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
  }, [selectedBar, toast, showLoading, hideLoading, getCategoriasEstruturadas]);

  useEffect(() => {
    if (selectedBar) {
      carregarDados();
    }
  }, [selectedBar, mesSelecionado, carregarDados]);

  // Dados baseados na estrutura do Excel
  const getCategoriasEstruturadas = useCallback((): CategoriaOrcamento[] => [
    {
      nome: 'Despesas Variáveis (%)',
      cor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      subcategorias: [
        { nome: 'IMPOSTO/TX MAQ/COMISSÃO', planejado: despesasVariaveis.planejado, projecao: despesasVariaveis.projecao, realizado: despesasVariaveis.realizado, editavel: true, isPercentage: true }
      ]
    },
    {
      nome: 'Custo Insumos (CMV) vs BP (%)',
      cor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      subcategorias: [
        { nome: 'CMV', planejado: cmv.planejado, projecao: cmv.projecao, realizado: cmv.realizado, editavel: true, isPercentage: true }
      ]
    },
    {
      nome: 'Mão-de-Obra',
      cor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      subcategorias: [
        { nome: 'CUSTO-EMPRESA FUNCIONÁRIOS', planejado: 120000, projecao: 128200, realizado: 0, editavel: true },
        { nome: 'SALÁRIOS', planejado: 2000, projecao: 1000, realizado: 0, editavel: true },
        { nome: 'ALIMENTAÇÃO', planejado: 58000, projecao: 58000, realizado: 27509.60, editavel: true },
        { nome: 'PROVISÃO TRABALHISTA', planejado: 0, projecao: 0, realizado: 3380.00, editavel: true },
        { nome: 'VALE TRANSPORTE', planejado: 0, projecao: 0, realizado: 5820.00, editavel: true },
        { nome: 'ADICIONAIS', planejado: 0, projecao: 0, realizado: 2780.00, editavel: true },
        { nome: 'FREELA ATENDIMENTO', planejado: 0, projecao: 0, realizado: 21030.00, editavel: true },
        { nome: 'FREELA BAR', planejado: 27500, projecao: 27500, realizado: 0, editavel: true },
        { nome: 'FREELA COZINHA', planejado: 0, projecao: 0, realizado: 0, editavel: true },
        { nome: 'FREELA LIMPEZA', planejado: 0, projecao: 0, realizado: 0, editavel: true },
        { nome: 'FREELA SEGURANÇA', planejado: 0, projecao: 0, realizado: 0, editavel: true },
        { nome: 'PRO LABORE', planejado: 0, projecao: 0, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Despesas Administrativas',
      cor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      subcategorias: [
        { nome: 'Escritório Central', planejado: 24000, projecao: 31500, realizado: 0, editavel: true },
        { nome: 'Administrativo Ordinário', planejado: 4000, projecao: 9500, realizado: 0, editavel: true }
      ]
    },
    {
      nome: 'Despesas Comerciais',
      cor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      subcategorias: [
        { nome: 'Marketing', planejado: 24000, projecao: 25300, realizado: 22979.95, editavel: true },
        { nome: 'Atrações Programação', planejado: 188500, projecao: 199150, realizado: 200230.86, editavel: true },
        { nome: 'Produção Eventos', planejado: 18500, projecao: 45212.86, realizado: 151120.82, editavel: true }
      ]
    },
    {
      nome: 'Despesas Operacionais',
      cor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      subcategorias: [
        { nome: 'Estorno', planejado: 500, projecao: 500, realizado: 797.06, editavel: true },
        { nome: 'Materiais Operação', planejado: 5000, projecao: 11000, realizado: 11387.50, editavel: true },
        { nome: 'Equipamentos Operação', planejado: 0, projecao: 4000, realizado: 0, editavel: true },
        { nome: 'Materiais de Limpeza e Descartáveis', planejado: 9000, projecao: 11000, realizado: 12925.80, editavel: true },
        { nome: 'Utensílios', planejado: 3000, projecao: 7300, realizado: 7823.36, editavel: true },
        { nome: 'Outros Operação', planejado: 1000, projecao: 1000, realizado: 967.63, editavel: true }
      ]
    },
    {
      nome: 'Despesas de Ocupação (Contas)',
      cor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      subcategorias: [
        { nome: 'ALUGUEL/CONDOMÍNIO/IPTU', planejado: 30000, projecao: 30000, realizado: 0, editavel: true },
        { nome: 'ÁGUA', planejado: 6500, projecao: 4900, realizado: 4881.50, editavel: true },
        { nome: 'GÁS', planejado: 2000, projecao: 2000, realizado: 0, editavel: true },
        { nome: 'INTERNET', planejado: 800, projecao: 800, realizado: 0, editavel: true },
        { nome: 'Manutenção', planejado: 6000, projecao: 6000, realizado: 7294.48, editavel: true },
        { nome: 'LUZ', planejado: 7000, projecao: 5550, realizado: 2162.08, editavel: true }
      ]
    },
    {
      nome: 'Não Operacionais',
      cor: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
      subcategorias: [
        { nome: 'CONTRATOS', planejado: 0, projecao: 15700, realizado: 0, editavel: true }
      ]
    }
  ], [despesasVariaveis, cmv]);
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
      // Usar dados disponíveis: julho/2025 para bar_id=3
      const anoDisponivel = 2025;
      const mesDisponivel = 7;
      const response = await fetch(
        `/api/estrategico/orcamentacao?bar_id=${selectedBar.id}&ano=${anoDisponivel}&mes=${mesDisponivel}`
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('📊 Dados orçamentários recebidos:', result.data);
        
        // Criar mapa de dados realizados por subcategoria
        const dadosRealizados = new Map();
        result.data.forEach(item => {
          const key = item.subcategoria || item.categoria;
          if (!dadosRealizados.has(key)) {
            dadosRealizados.set(key, {
              realizado: 0,
              planejado: 0,
              projecao: 0
            });
          }
          const existing = dadosRealizados.get(key);
          existing.realizado += item.valor_realizado || 0;
          existing.planejado += item.valor_previsto || 0;
          existing.projecao += item.valor_previsto || 0;
        });
        
        // Atualizar estrutura base com dados reais
        const categoriasBase = getCategoriasEstruturadas();
        const categoriasAtualizadas = categoriasBase.map(categoria => ({
          ...categoria,
          subcategorias: categoria.subcategorias.map(sub => {
            const dadosReais = dadosRealizados.get(sub.nome);
            
            // Para CMV, agrupar todos os custos
            let realizadoCMV = 0;
            if (sub.nome === 'CMV') {
              for (const [key, data] of dadosRealizados) {
                if (key.includes('Custo ') || key.includes('CMV')) {
                  realizadoCMV += data.realizado;
                }
              }
            }
            
            return {
              ...sub,
              realizado: sub.nome === 'CMV' ? realizadoCMV : (dadosReais?.realizado || sub.realizado),
              // Manter planejado e projeção do estado local (editáveis)
            };
          })
        }));
        
        setCategorias(categoriasAtualizadas);
        setUltimaAtualizacao(new Date());
        
        toast({
          title: 'Dados atualizados',
          description: `${result.data.length} registros carregados (Julho/2025)`,
        });
      } else {
        // Fallback para dados base se API não retornar dados
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

    const handleEdit = (categoriaIndex: number, subIndex: number) => {
    const key = `${categoriaIndex}-${subIndex}`;
    const subcategoria = categorias[categoriaIndex].subcategorias[subIndex];
    
    // Se for despesas variáveis ou CMV, editar diretamente no estado
    if (subcategoria.nome === 'IMPOSTO/TX MAQ/COMISSÃO') {
      setEditMode(prev => ({ ...prev, [key]: true }));
      setEditedValues(prev => ({
        ...prev,
        [key]: {
          planejado: despesasVariaveis.planejado,
          projecao: despesasVariaveis.projecao
        }
      }));
    } else if (subcategoria.nome === 'CMV') {
      setEditMode(prev => ({ ...prev, [key]: true }));
      setEditedValues(prev => ({
        ...prev,
        [key]: {
          planejado: cmv.planejado,
          projecao: cmv.projecao
        }
      }));
    } else {
      setEditMode(prev => ({ ...prev, [key]: true }));
      setEditedValues(prev => ({
        ...prev,
        [key]: {
          planejado: subcategoria.planejado,
          projecao: subcategoria.projecao
        }
      }));
    }
  };

  const handleSave = async (categoriaIndex: number, subIndex: number) => {
    const key = `${categoriaIndex}-${subIndex}`;
    const novoValor = editedValues[key];
    if (!novoValor) return;

    try {
      const subcategoria = categorias[categoriaIndex].subcategorias[subIndex];

      // Se for despesas variáveis ou CMV, salvar no estado específico
      if (subcategoria.nome === 'IMPOSTO/TX MAQ/COMISSÃO') {
        setDespesasVariaveis(prev => ({
          ...prev,
          planejado: novoValor.planejado,
          projecao: novoValor.projecao
        }));
      } else if (subcategoria.nome === 'CMV') {
        setCmv(prev => ({
          ...prev,
          planejado: novoValor.planejado,
          projecao: novoValor.projecao
        }));
      } else {
        // Atualizar no estado das categorias para outros itens
        const novasCategorias = [...categorias];
        novasCategorias[categoriaIndex].subcategorias[subIndex].planejado = novoValor.planejado;
        novasCategorias[categoriaIndex].subcategorias[subIndex].projecao = novoValor.projecao;
        setCategorias(novasCategorias);
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
    setEditMode(prev => ({ ...prev, [key]: false }));
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  // Cálculos automáticos
  const calcularValores = () => {
    // Real Fixo - Planejado, Projeção e Realizado
    const totalRealFixoPlanejado = categorias.reduce((acc, cat) => {
      if (cat.nome.includes('Variáveis') || cat.nome.includes('CMV')) return acc;
      return acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.planejado, 0);
    }, 0);

    const totalRealFixoProjecao = categorias.reduce((acc, cat) => {
      if (cat.nome.includes('Variáveis') || cat.nome.includes('CMV')) return acc;
      return acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.projecao, 0);
    }, 0);

    const totalRealFixoRealizado = categorias.reduce((acc, cat) => {
      if (cat.nome.includes('Variáveis') || cat.nome.includes('CMV')) return acc;
      return acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.realizado, 0);
    }, 0);

    // % Contrib para cada tipo
    const percentualContribPlanejado = 1 - (despesasVariaveis.planejado + cmv.planejado) / 100;
    const percentualContribProjecao = 1 - (despesasVariaveis.projecao + cmv.projecao) / 100;
    const percentualContribRealizado = 1 - (despesasVariaveis.realizado + cmv.realizado) / 100;

    // BreakEven para cada tipo
    const breakEvenPlanejado = totalRealFixoPlanejado / percentualContribPlanejado;
    const breakEvenProjecao = totalRealFixoProjecao / percentualContribProjecao;
    const breakEvenRealizado = totalRealFixoRealizado / percentualContribRealizado;

    // Faturamento Meta para cada tipo
    const faturamentoMetaPlanejado = (totalRealFixoPlanejado + lucroMeta) / percentualContribPlanejado;
    const faturamentoMetaProjecao = (totalRealFixoProjecao + lucroMeta) / percentualContribProjecao;
    const faturamentoMetaRealizado = (totalRealFixoRealizado + lucroMeta) / percentualContribRealizado;

    return {
      totalRealFixoPlanejado,
      totalRealFixoProjecao,
      totalRealFixoRealizado,
      percentualContribPlanejado: percentualContribPlanejado * 100,
      percentualContribProjecao: percentualContribProjecao * 100,
      percentualContribRealizado: percentualContribRealizado * 100,
      breakEvenPlanejado,
      breakEvenProjecao,
      breakEvenRealizado,
      faturamentoMetaPlanejado,
      faturamentoMetaProjecao,
      faturamentoMetaRealizado
    };
  };

  const valores = calcularValores();

  const meses = [
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

  return (
    <div className="flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      <GlobalLoadingComponent />
      
      {/* Sidebar Lateral de Controles (similar ao planejamento comercial) */}
      <aside className="flex flex-col w-80 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="space-y-4 w-full">
          {/* Controles e Filtros */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📅 Controles
            </h3>
            
            {/* Informação sobre dados disponíveis */}
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                📊 Dados disponíveis: <strong>Julho/2025</strong>
              </p>
              {ultimaAtualizacao && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Última atualização: {ultimaAtualizacao.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            {/* Filtro de Mês */}
            <div className="mb-3">
              <label htmlFor="mes-selecionado" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mês
              </label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-8 text-sm">
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

            {/* Botão de Sincronização */}
            <div className="mb-3">
              <Button
                onClick={sincronizarManualmente}
                disabled={sincronizando || !selectedBar}
                size="sm"
                className="w-full h-8 text-xs"
                variant="outline"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${sincronizando ? 'animate-spin' : ''}`} />
                {sincronizando ? 'Sincronizando...' : 'Atualizar NIBO'}
              </Button>
            </div>

            {/* Última Atualização */}
            {ultimaAtualizacao && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <Calendar className="h-3 w-3 inline mr-1" />
                Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📊 Resumo
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Planejado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatarMoeda(categorias.reduce((acc, cat) => acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.planejado, 0), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Projeção:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarMoeda(categorias.reduce((acc, cat) => acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.projecao, 0), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Realizado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatarMoeda(categorias.reduce((acc, cat) => acc + cat.subcategorias.reduce((subAcc, sub) => subAcc + sub.realizado, 0), 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Real Fixo */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              🏗️ Real Fixo
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Planejado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatarMoeda(valores.totalRealFixoPlanejado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Projeção:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarMoeda(valores.totalRealFixoProjecao)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatarMoeda(valores.totalRealFixoRealizado)}
                </span>
              </div>
            </div>
          </div>

          {/* % Contrib */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              📈 % Contrib
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Planejado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatarPorcentagem(valores.percentualContribPlanejado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Projeção:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarPorcentagem(valores.percentualContribProjecao)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatarPorcentagem(valores.percentualContribRealizado)}
                </span>
              </div>
            </div>
          </div>

          {/* BreakEven */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              ⚖️ BreakEven
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Planejado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatarMoeda(valores.breakEvenPlanejado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Projeção:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarMoeda(valores.breakEvenProjecao)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatarMoeda(valores.breakEvenRealizado)}
                </span>
              </div>
            </div>
          </div>

          {/* Lucro Meta (editável) */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              💰 Lucro Meta
            </h3>
            <div className="text-center">
              <Input
                type="number"
                value={lucroMeta}
                onChange={(e) => setLucroMeta(parseFloat(e.target.value) || 0)}
                className="w-full text-center font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-700 h-8 text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Editável
              </p>
            </div>
          </div>

          {/* Faturamento Meta */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Faturamento Meta
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Planejado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatarMoeda(valores.faturamentoMetaPlanejado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Projeção:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatarMoeda(valores.faturamentoMetaProjecao)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatarMoeda(valores.faturamentoMetaRealizado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal da Tabela */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Orçamento {meses.find(m => m.value === mesSelecionado)?.label} 2025
                  </h2>
                </div>
            
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Categoria
                        </th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Subcategoria
                        </th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Planejado
                        </th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Projeção
                        </th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Realizado
                        </th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((categoria, categoriaIndex) => (
                        categoria.subcategorias.map((sub, subIndex) => {
                          const key = `${categoriaIndex}-${subIndex}`;
                          const isFirstOfCategory = subIndex === 0;
                          
                          return (
                            <tr key={key} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                              <td className={`py-2 px-3 text-xs ${isFirstOfCategory ? `${categoria.cor} font-medium` : 'text-gray-600 dark:text-gray-400'}`}>
                                {isFirstOfCategory ? categoria.nome : ''}
                              </td>
                              <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium text-xs">
                                {sub.nome}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {editMode[key] ? (
                                  <Input
                                    type="number"
                                    value={editedValues[key]?.planejado || sub.planejado}
                                    onChange={(e) => setEditedValues(prev => ({
                                      ...prev,
                                      [key]: { 
                                        ...prev[key], 
                                        planejado: parseFloat(e.target.value) || 0 
                                      }
                                    }))}
                                    className="w-24 ml-auto bg-white dark:bg-gray-700 text-right h-6 text-xs"
                                  />
                                ) : (
                                  <span className="font-medium text-gray-900 dark:text-white text-xs">
                                    {sub.isPercentage ? formatarPorcentagem(sub.planejado) : formatarMoeda(sub.planejado)}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {editMode[key] ? (
                                  <Input
                                    type="number"
                                    value={editedValues[key]?.projecao || sub.projecao}
                                    onChange={(e) => setEditedValues(prev => ({
                                      ...prev,
                                      [key]: { 
                                        ...prev[key], 
                                        projecao: parseFloat(e.target.value) || 0 
                                      }
                                    }))}
                                    className="w-24 ml-auto bg-white dark:bg-gray-700 text-right h-6 text-xs"
                                  />
                                ) : (
                                  <span className="font-medium text-blue-600 dark:text-blue-400 text-xs">
                                    {sub.isPercentage ? formatarPorcentagem(sub.projecao) : formatarMoeda(sub.projecao)}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="font-medium text-green-600 dark:text-green-400 text-xs">
                                  {sub.isPercentage ? formatarPorcentagem(sub.realizado) : formatarMoeda(sub.realizado)}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {editMode[key] ? (
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSave(categoriaIndex, subIndex)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCancel(categoriaIndex, subIndex)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(categoriaIndex, subIndex)}
                                    className="h-6 w-6 p-0"
                                    disabled={!sub.editavel}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
      </div>
    </div>
  );
}