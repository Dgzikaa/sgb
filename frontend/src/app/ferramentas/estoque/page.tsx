'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Save,
  Trash2,
  RefreshCcw,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface EstoqueInsumo {
  id?: number;
  bar_id: number;
  data_contagem: string;
  categoria: string;
  subcategoria?: string;
  produto: string;
  unidade_medida: string;
  estoque_inicial?: number;
  entrada: number;
  saida: number;
  estoque_final: number;
  estoque_teorico?: number;
  diferenca?: number;
  custo_unitario?: number;
  custo_total?: number;
  responsavel_contagem?: string;
  observacoes?: string;
  status: 'pendente' | 'conferido' | 'ajustado';
}

const CATEGORIAS = [
  'Bebidas',
  'Alimentos',
  'Descartáveis',
  'Limpeza',
  'Outros'
];

const UNIDADES_MEDIDA = [
  'UN',   // Unidade
  'KG',   // Quilograma
  'L',    // Litro
  'CX',   // Caixa
  'PCT',  // Pacote
  'FD',   // Fardo
  'G',    // Grama
  'ML'    // Mililitro
];

export default function EstoquePage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [estoque, setEstoque] = useState<EstoqueInsumo[]>([]);
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  
  // Modal de adicionar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<EstoqueInsumo | null>(null);
  const [formData, setFormData] = useState<Partial<EstoqueInsumo>>({
    categoria: 'Bebidas',
    unidade_medida: 'UN',
    entrada: 0,
    saida: 0,
    estoque_final: 0,
    status: 'pendente'
  });

  // Carregar dados
  const carregarEstoque = useCallback(async () => {
    if (!selectedBar || !user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString(),
        data_contagem: dataFiltro
      });

      if (categoriaFiltro !== 'TODAS') {
        params.append('categoria', categoriaFiltro);
      }
      if (statusFiltro !== 'TODOS') {
        params.append('status', statusFiltro);
      }

      const response = await fetch(`/api/estoque-insumos?${params}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar estoque');

      const data = await response.json();
      setEstoque(data.data || []);

    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      toast({
        title: "Erro ao carregar estoque",
        description: "Não foi possível carregar os dados de estoque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, user, dataFiltro, categoriaFiltro, statusFiltro, toast]);

  // Abrir modal para adicionar
  const abrirModalAdicionar = () => {
    setItemEditando(null);
    setFormData({
      categoria: 'Bebidas',
      unidade_medida: 'UN',
      entrada: 0,
      saida: 0,
      estoque_final: 0,
      status: 'pendente',
      data_contagem: dataFiltro,
      responsavel_contagem: user?.nome || ''
    });
    setModalAberto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (item: EstoqueInsumo) => {
    setItemEditando(item);
    setFormData(item);
    setModalAberto(true);
  };

  // Salvar item
  const salvarItem = async () => {
    if (!selectedBar || !formData.produto || !formData.categoria) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha produto e categoria",
        variant: "destructive"
      });
      return;
    }

    try {
      const registro = {
        ...formData,
        bar_id: selectedBar.id,
        data_contagem: dataFiltro,
        responsavel_contagem: user?.nome || ''
      };

      const response = await fetch('/api/estoque-insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          registros: [registro]
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast({
        title: "Sucesso",
        description: "Item salvo com sucesso"
      });

      setModalAberto(false);
      carregarEstoque();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o item",
        variant: "destructive"
      });
    }
  };

  // Excluir item
  const excluirItem = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      const response = await fetch(`/api/estoque-insumos?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso"
      });

      carregarEstoque();

    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o item",
        variant: "destructive"
      });
    }
  };

  // Atualizar status
  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      const response = await fetch('/api/estoque-insumos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({ id, status: novoStatus })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');

      toast({
        title: "Status atualizado",
        description: "Status do item foi atualizado"
      });

      carregarEstoque();

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    setPageTitle('📦 Controle de Estoque');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar && user) {
      carregarEstoque();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBar, user, dataFiltro, categoriaFiltro, statusFiltro]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Controle de Estoque
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie o estoque de insumos do bar
            </p>
          </div>
          <Button
            onClick={abrirModalAdicionar}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data da Contagem</Label>
                <Input
                  type="date"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="conferido">Conferido</SelectItem>
                    <SelectItem value="ajustado">Ajustado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={carregarEstoque}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Estoque */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens do Estoque ({estoque.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Produto</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Unidade</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Estoque Final</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Custo Unit.</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Custo Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {estoque.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          Nenhum item encontrado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Adicione itens ao estoque para começar
                        </p>
                      </td>
                    </tr>
                  ) : (
                    estoque.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {item.categoria}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                          {item.produto}
                          {item.subcategoria && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              {item.subcategoria}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                          {item.unidade_medida}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {item.estoque_final.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {item.custo_unitario
                            ? `R$ ${item.custo_unitario.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {item.custo_total
                            ? `R$ ${item.custo_total.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`cursor-pointer ${
                              item.status === 'conferido'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300'
                                : item.status === 'ajustado'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
                            }`}
                            onClick={() => {
                              const proximoStatus =
                                item.status === 'pendente'
                                  ? 'conferido'
                                  : item.status === 'conferido'
                                  ? 'ajustado'
                                  : 'pendente';
                              atualizarStatus(item.id!, proximoStatus);
                            }}
                          >
                            {item.status === 'conferido' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {item.status === 'ajustado' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModalEditar(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excluirItem(item.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Adicionar/Editar */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {itemEditando ? 'Editar Item' : 'Adicionar Item ao Estoque'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do item de estoque
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subcategoria</Label>
                <Input
                  value={formData.subcategoria || ''}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Ex: Cervejas, Refrigerantes..."
                  className="bg-white dark:bg-gray-700"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Produto *</Label>
                <Input
                  value={formData.produto || ''}
                  onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                  placeholder="Nome do produto"
                  className="bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <Label>Unidade de Medida *</Label>
                <Select
                  value={formData.unidade_medida}
                  onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((un) => (
                      <SelectItem key={un} value={un}>{un}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estoque Final *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.estoque_final || 0}
                  onChange={(e) => setFormData({ ...formData, estoque_final: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <Label>Custo Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_unitario || ''}
                  onChange={(e) => setFormData({ ...formData, custo_unitario: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                  className="bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <Label>Responsável</Label>
                <Input
                  value={formData.responsavel_contagem || user?.nome || ''}
                  onChange={(e) => setFormData({ ...formData, responsavel_contagem: e.target.value })}
                  className="bg-white dark:bg-gray-700"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  className="bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarItem}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

