'use client';

import { useState, useEffect } from 'react';
import { useBar } from '@/contexts/BarContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Save,
  Search,
  TrendingUp,
  Calendar,
  AlertCircle,
  Check,
  Download,
} from 'lucide-react';

interface Insumo {
  id: number;
  codigo: string;
  nome: string;
  tipo_local: string;
  categoria: string;
  unidade_medida: string;
  custo_unitario: number;
}

interface ContagemEstoque {
  id?: number;
  insumo_id: number;
  insumo_codigo: string;
  insumo_nome: string;
  estoque_inicial: number | null;
  estoque_final: number;
  quantidade_pedido: number;
  consumo_periodo: number | null;
  valor_consumo: number | null;
  unidade_medida: string;
  tipo_local: string;
  editado?: boolean;
}

export default function ContagemEstoquePage() {
  const { selectedBar } = useBar();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState('cozinha');
  
  // Data de contagem
  const [dataContagem, setDataContagem] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Insumos disponíveis
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumosFiltrados, setInsumosFiltrados] = useState<Insumo[]>([]);
  const [busca, setBusca] = useState('');

  // Contagens (objeto indexado por insumo_id)
  const [contagens, setContagens] = useState<Record<number, ContagemEstoque>>({});

  // Estatísticas
  const [stats, setStats] = useState({
    total_itens: 0,
    itens_contados: 0,
    valor_total_consumo: 0,
  });

  // Carregar insumos
  useEffect(() => {
    carregarInsumos();
  }, []);

  // Carregar contagens quando mudar a data ou aba
  useEffect(() => {
    if (dataContagem) {
      carregarContagens();
    }
  }, [dataContagem, selectedBar]);

  // Filtrar insumos por aba e busca
  useEffect(() => {
    let filtrados = insumos.filter((i) => i.tipo_local === activeTab);

    if (busca) {
      filtrados = filtrados.filter(
        (i) =>
          i.nome.toLowerCase().includes(busca.toLowerCase()) ||
          i.codigo.toLowerCase().includes(busca.toLowerCase())
      );
    }

    setInsumosFiltrados(filtrados);
  }, [insumos, activeTab, busca]);

  // Atualizar estatísticas
  useEffect(() => {
    const contagensArray = Object.values(contagens);
    const contagensFiltradas = contagensArray.filter(
      (c) => c.tipo_local === activeTab
    );

    setStats({
      total_itens: insumosFiltrados.length,
      itens_contados: contagensFiltradas.filter((c) => c.estoque_final !== undefined && c.estoque_final !== null).length,
      valor_total_consumo: contagensFiltradas.reduce(
        (sum, c) => sum + (c.valor_consumo || 0),
        0
      ),
    });
  }, [contagens, insumosFiltrados, activeTab]);

  const carregarInsumos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operacional/receitas/insumos?ativo=true');
      if (response.ok) {
        const data = await response.json();
        setInsumos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarContagens = async () => {
    try {
      const response = await fetch(
        `/api/estoque/contagem-insumos?bar_id=${selectedBar?.id || 3}&data_contagem=${dataContagem}`
      );

      if (response.ok) {
        const data = await response.json();
        const contagensMap: Record<number, ContagemEstoque> = {};

        (data.data || []).forEach((contagem: any) => {
          contagensMap[contagem.insumo_id] = {
            id: contagem.id,
            insumo_id: contagem.insumo_id,
            insumo_codigo: contagem.insumo_codigo,
            insumo_nome: contagem.insumo_nome,
            estoque_inicial: contagem.estoque_inicial,
            estoque_final: contagem.estoque_final,
            quantidade_pedido: contagem.quantidade_pedido || 0,
            consumo_periodo: contagem.consumo_periodo,
            valor_consumo: contagem.valor_consumo,
            unidade_medida: contagem.unidade_medida,
            tipo_local: contagem.tipo_local,
          };
        });

        setContagens(contagensMap);
      }
    } catch (error) {
      console.error('Erro ao carregar contagens:', error);
    }
  };

  const handleContagemChange = (
    insumoId: number,
    field: 'estoque_final' | 'quantidade_pedido',
    value: string
  ) => {
    const insumo = insumos.find((i) => i.id === insumoId);
    if (!insumo) return;

    const valorNumerico = parseFloat(value) || 0;

    setContagens((prev) => {
      const contagemAtual = prev[insumoId] || {
        insumo_id: insumoId,
        insumo_codigo: insumo.codigo,
        insumo_nome: insumo.nome,
        estoque_inicial: null,
        estoque_final: 0,
        quantidade_pedido: 0,
        consumo_periodo: null,
        valor_consumo: null,
        unidade_medida: insumo.unidade_medida,
        tipo_local: insumo.tipo_local,
      };

      const novaContagem = {
        ...contagemAtual,
        [field]: valorNumerico,
        editado: true,
      };

      return {
        ...prev,
        [insumoId]: novaContagem,
      };
    });
  };

  const salvarContagem = async (insumoId: number) => {
    const contagem = contagens[insumoId];
    if (!contagem || contagem.estoque_final === undefined) {
      alert('⚠️ Preencha o estoque final antes de salvar');
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        bar_id: selectedBar?.id || 3,
        data_contagem: dataContagem,
        insumo_id: contagem.insumo_id,
        estoque_final: contagem.estoque_final,
        quantidade_pedido: contagem.quantidade_pedido || 0,
        usuario_contagem: 'Sistema', // Pode ser substituído por usuário logado
      };

      const response = await fetch('/api/estoque/contagem-insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar contagem com dados retornados
        setContagens((prev) => ({
          ...prev,
          [insumoId]: {
            ...prev[insumoId],
            id: data.data.id,
            estoque_inicial: data.data.estoque_inicial,
            consumo_periodo: data.data.consumo_periodo,
            valor_consumo: data.data.valor_consumo,
            editado: false,
          },
        }));

        // Feedback visual
        const elemento = document.getElementById(`row-${insumoId}`);
        if (elemento) {
          elemento.classList.add('bg-green-50', 'dark:bg-green-900/20');
          setTimeout(() => {
            elemento.classList.remove('bg-green-50', 'dark:bg-green-900/20');
          }, 1000);
        }
      } else {
        const error = await response.json();
        alert(`❌ Erro: ${error.error || 'Erro ao salvar'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar contagem:', error);
      alert('❌ Erro ao salvar contagem');
    } finally {
      setSalvando(false);
    }
  };

  const salvarTodas = async () => {
    const contagensParaSalvar = Object.values(contagens).filter(
      (c) => c.editado && c.tipo_local === activeTab && c.estoque_final !== undefined
    );

    if (contagensParaSalvar.length === 0) {
      alert('⚠️ Nenhuma alteração para salvar');
      return;
    }

    if (!confirm(`Deseja salvar ${contagensParaSalvar.length} contagens?`)) {
      return;
    }

    setSalvando(true);
    let salvos = 0;
    let erros = 0;

    for (const contagem of contagensParaSalvar) {
      try {
        const payload = {
          bar_id: selectedBar?.id || 3,
          data_contagem: dataContagem,
          insumo_id: contagem.insumo_id,
          estoque_final: contagem.estoque_final,
          quantidade_pedido: contagem.quantidade_pedido || 0,
          usuario_contagem: 'Sistema',
        };

        const response = await fetch('/api/estoque/contagem-insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          salvos++;
        } else {
          erros++;
        }
      } catch (error) {
        erros++;
      }
    }

    setSalvando(false);
    
    if (erros === 0) {
      alert(`✅ ${salvos} contagens salvas com sucesso!`);
      await carregarContagens();
    } else {
      alert(`⚠️ Salvas: ${salvos}, Erros: ${erros}`);
      await carregarContagens();
    }
  };

  const exportarParaExcel = () => {
    const contagensArray = Object.values(contagens).filter(
      (c) => c.tipo_local === activeTab
    );

    if (contagensArray.length === 0) {
      alert('⚠️ Nenhuma contagem para exportar');
      return;
    }

    // Criar CSV
    const headers = [
      'Código',
      'Insumo',
      'Estoque Inicial',
      'Pedido',
      'Estoque Final',
      'Consumo',
      'Valor Consumo',
      'Unidade',
    ];

    const rows = contagensArray.map((c) => [
      c.insumo_codigo,
      c.insumo_nome,
      c.estoque_inicial || '',
      c.quantidade_pedido || '',
      c.estoque_final || '',
      c.consumo_periodo || '',
      c.valor_consumo ? `R$ ${c.valor_consumo.toFixed(2)}` : '',
      c.unidade_medida,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contagem_${activeTab}_${dataContagem}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Contagem de Estoque
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Registro diário de estoque de insumos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Input
                  type="date"
                  value={dataContagem}
                  onChange={(e) => setDataContagem(e.target.value)}
                  className="w-auto bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <Badge variant="outline" className="text-sm">
                {selectedBar?.nome || 'Bar Principal'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-dark">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Itens
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total_itens}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Itens Contados
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.itens_contados} / {stats.total_itens}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Consumo Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {stats.valor_total_consumo.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs e Tabela */}
        <Card className="card-dark">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Registro de Contagem</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={exportarParaExcel}
                  variant="outline"
                  size="sm"
                  disabled={stats.itens_contados === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  onClick={salvarTodas}
                  disabled={salvando || stats.itens_contados === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvando ? 'Salvando...' : `Salvar Todas (${stats.itens_contados})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                <TabsTrigger value="cozinha">
                  Cozinha ({insumos.filter((i) => i.tipo_local === 'cozinha').length})
                </TabsTrigger>
                <TabsTrigger value="bar">
                  Bar ({insumos.filter((i) => i.tipo_local === 'bar').length})
                </TabsTrigger>
              </TabsList>

              {/* Busca */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar insumo por nome ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <TabsContent value={activeTab}>
                {insumosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Nenhum insumo encontrado
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead className="w-[100px]">Código</TableHead>
                          <TableHead>Insumo</TableHead>
                          <TableHead className="text-center w-[100px]">Est. Inicial</TableHead>
                          <TableHead className="text-center w-[100px]">Pedido</TableHead>
                          <TableHead className="text-center w-[100px]">Est. Final</TableHead>
                          <TableHead className="text-center w-[100px]">Consumo</TableHead>
                          <TableHead className="text-right w-[120px]">Valor</TableHead>
                          <TableHead className="text-center w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insumosFiltrados.map((insumo) => {
                          const contagem = contagens[insumo.id];
                          const isEditado = contagem?.editado;

                          return (
                            <TableRow
                              key={insumo.id}
                              id={`row-${insumo.id}`}
                              className={`transition-colors ${
                                isEditado ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                              }`}
                            >
                              <TableCell className="font-medium text-gray-900 dark:text-white">
                                {insumo.codigo}
                              </TableCell>
                              <TableCell className="text-gray-900 dark:text-white">
                                <div>
                                  <div className="font-medium">{insumo.nome}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {insumo.categoria}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-gray-600 dark:text-gray-400">
                                {contagem?.estoque_inicial !== null && contagem?.estoque_inicial !== undefined
                                  ? `${contagem.estoque_inicial} ${insumo.unidade_medida}`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={contagem?.quantidade_pedido || ''}
                                  onChange={(e) =>
                                    handleContagemChange(
                                      insumo.id,
                                      'quantidade_pedido',
                                      e.target.value
                                    )
                                  }
                                  className="w-20 text-center bg-white dark:bg-gray-700"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={contagem?.estoque_final !== undefined ? contagem.estoque_final : ''}
                                  onChange={(e) =>
                                    handleContagemChange(
                                      insumo.id,
                                      'estoque_final',
                                      e.target.value
                                    )
                                  }
                                  className="w-20 text-center bg-white dark:bg-gray-700"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-center text-gray-900 dark:text-white font-medium">
                                {contagem?.consumo_periodo !== null && contagem?.consumo_periodo !== undefined
                                  ? `${contagem.consumo_periodo.toFixed(2)} ${insumo.unidade_medida}`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right text-gray-900 dark:text-white font-medium">
                                {contagem?.valor_consumo !== null && contagem?.valor_consumo !== undefined
                                  ? `R$ ${contagem.valor_consumo.toFixed(2)}`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  onClick={() => salvarContagem(insumo.id)}
                                  size="sm"
                                  disabled={salvando || !isEditado}
                                  className={`${
                                    isEditado
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-gray-400'
                                  } text-white`}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

