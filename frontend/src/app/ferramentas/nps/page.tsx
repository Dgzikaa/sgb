'use client';

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smile, TrendingUp, Calendar, Users, BarChart3, Download, Upload, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/hooks/useBar';

interface NPSData {
  id: number;
  data_pesquisa: string;
  funcionario_nome: string;
  setor: string;
  quorum: number;
  media_geral: number;
  resultado_percentual: number;
}

interface FelicidadeData {
  id: number;
  data_pesquisa: string;
  funcionario_nome: string;
  setor: string;
  quorum: number;
  eu_comigo_engajamento: number;
  eu_com_empresa_pertencimento: number;
  eu_com_colega_relacionamento: number;
  eu_com_gestor_lideranca: number;
  justica_reconhecimento: number;
  media_geral: number;
  resultado_percentual: number;
}

export default function NPSPage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useUser();
  const { toast } = useToast();
  const { selectedBar } = useBar();

  const [loading, setLoading] = useState(false);
  const [dadosNPS, setDadosNPS] = useState<NPSData[]>([]);
  const [dadosFelicidade, setDadosFelicidade] = useState<FelicidadeData[]>([]);
  
  // Estados para formulário de pesquisa
  const [modalFormulario, setModalFormulario] = useState(false);
  const [tipoPesquisa, setTipoPesquisa] = useState<'nps' | 'felicidade'>('felicidade');
  const [salvando, setSalvando] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    data_pesquisa: new Date().toISOString().split('T')[0],
    setor: '',
    funcionario_nome: '',
    quorum: 0,
    // Campos NPS
    qual_sua_area_atuacao: 0,
    sinto_me_motivado: 0,
    empresa_se_preocupa: 0,
    conectado_colegas: 0,
    relacionamento_positivo: 0,
    quando_identifico: 0,
    // Campos Felicidade
    eu_comigo_engajamento: 0,
    eu_com_empresa_pertencimento: 0,
    eu_com_colega_relacionamento: 0,
    eu_com_gestor_lideranca: 0,
    justica_reconhecimento: 0,
  });
  
  const [dataInicio, setDataInicio] = useState(() => {
    const data = new Date();
    data.setMonth(data.getMonth() - 1);
    return data.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [setorFiltro, setSetorFiltro] = useState('TODOS');

  useEffect(() => {
    setPageTitle('😊 NPS e Pesquisa da Felicidade');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user, dataInicio, dataFim, setorFiltro]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar NPS
      const responseNPS = await fetch(
        `/api/nps?bar_id=${selectedBar?.id || 3}&data_inicio=${dataInicio}&data_fim=${dataFim}&setor=${setorFiltro}`
      );
      const dataNPS = await responseNPS.json();

      // Buscar Felicidade
      const responseFelicidade = await fetch(
        `/api/pesquisa-felicidade?bar_id=${selectedBar?.id || 3}&data_inicio=${dataInicio}&data_fim=${dataFim}&setor=${setorFiltro}`
      );
      const dataFelicidade = await responseFelicidade.json();

      if (dataNPS.success) {
        setDadosNPS(dataNPS.data);
      }
      if (dataFelicidade.success) {
        setDadosFelicidade(dataFelicidade.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar pesquisa
  const salvarPesquisa = async () => {
    // Validações
    if (!formData.setor || !formData.funcionario_nome) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSalvando(true);

      const registro = {
        bar_id: selectedBar?.id || 3,
        data_pesquisa: formData.data_pesquisa,
        setor: formData.setor,
        funcionario_nome: formData.funcionario_nome,
        quorum: formData.quorum,
      };

      // Adicionar campos específicos baseado no tipo
      if (tipoPesquisa === 'nps') {
        Object.assign(registro, {
          qual_sua_area_atuacao: formData.qual_sua_area_atuacao,
          sinto_me_motivado: formData.sinto_me_motivado,
          empresa_se_preocupa: formData.empresa_se_preocupa,
          conectado_colegas: formData.conectado_colegas,
          relacionamento_positivo: formData.relacionamento_positivo,
          quando_identifico: formData.quando_identifico,
        });
      } else {
        Object.assign(registro, {
          eu_comigo_engajamento: formData.eu_comigo_engajamento,
          eu_com_empresa_pertencimento: formData.eu_com_empresa_pertencimento,
          eu_com_colega_relacionamento: formData.eu_com_colega_relacionamento,
          eu_com_gestor_lideranca: formData.eu_com_gestor_lideranca,
          justica_reconhecimento: formData.justica_reconhecimento,
        });
      }

      // Enviar para API
      const endpoint = tipoPesquisa === 'nps' ? '/api/nps' : '/api/pesquisa-felicidade';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          bar_id: selectedBar?.id || 3,
          registros: [registro]
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Sucesso!',
          description: 'Pesquisa registrada com sucesso'
        });
        setModalFormulario(false);
        limparFormulario();
        carregarDados();
      } else {
        throw new Error(data.error || 'Erro ao salvar');
      }

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a pesquisa',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  // Função para limpar formulário
  const limparFormulario = () => {
    setFormData({
      data_pesquisa: new Date().toISOString().split('T')[0],
      setor: '',
      funcionario_nome: '',
      quorum: 0,
      qual_sua_area_atuacao: 0,
      sinto_me_motivado: 0,
      empresa_se_preocupa: 0,
      conectado_colegas: 0,
      relacionamento_positivo: 0,
      quando_identifico: 0,
      eu_comigo_engajamento: 0,
      eu_com_empresa_pertencimento: 0,
      eu_com_colega_relacionamento: 0,
      eu_com_gestor_lideranca: 0,
      justica_reconhecimento: 0,
    });
  };

  const calcularMediaPorSetor = (dados: any[], campo?: string) => {
    const setores = new Map<string, { total: number; count: number }>();
    
    dados.forEach(item => {
      const valor = campo ? item[campo] : item.media_geral;
      if (!setores.has(item.setor)) {
        setores.set(item.setor, { total: 0, count: 0 });
      }
      const stats = setores.get(item.setor)!;
      stats.total += valor || 0;
      stats.count++;
    });

    return Array.from(setores.entries()).map(([setor, stats]) => ({
      setor,
      media: stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00',
      count: stats.count
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header com botão de nova pesquisa */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              NPS & Pesquisa da Felicidade
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie e visualize as pesquisas de satisfação
            </p>
          </div>
          <Button
            onClick={() => {
              limparFormulario();
              setModalFormulario(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Smile className="h-4 w-4 mr-2" />
            Nova Pesquisa
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <BarChart3 className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Setor</Label>
                <Select value={setorFiltro} onValueChange={setSetorFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="Liderança">Liderança</SelectItem>
                    <SelectItem value="Cozinha">Cozinha</SelectItem>
                    <SelectItem value="Bar">Bar</SelectItem>
                    <SelectItem value="Salão">Salão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={carregarDados} disabled={loading} className="w-full">
                  {loading ? 'Carregando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs NPS e Felicidade */}
        <Tabs defaultValue="felicidade" className="space-y-4">
          <TabsList className="bg-gray-200 dark:bg-gray-700">
            <TabsTrigger value="felicidade" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
              <Smile className="w-4 h-4 mr-2" />
              Pesquisa da Felicidade
            </TabsTrigger>
            <TabsTrigger value="nps" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              NPS
            </TabsTrigger>
          </TabsList>

          {/* Pesquisa da Felicidade */}
          <TabsContent value="felicidade" className="space-y-4">
            {/* Resumo por Setor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calcularMediaPorSetor(dadosFelicidade).map((item) => (
                <Card key={item.setor} className="bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.setor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.media}
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 5.0</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.count} respostas
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabela Detalhada */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Respostas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Data</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Setor</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Engajamento</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Pertencimento</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Relacionamento</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Liderança</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Justiça</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosFelicidade.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="p-2 text-gray-900 dark:text-white">{formatDate(item.data_pesquisa)}</td>
                          <td className="p-2">
                            <Badge variant="outline">{item.setor}</Badge>
                          </td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.eu_comigo_engajamento}</td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.eu_com_empresa_pertencimento}</td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.eu_com_colega_relacionamento}</td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.eu_com_gestor_lideranca}</td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.justica_reconhecimento}</td>
                          <td className="text-center p-2 font-semibold text-gray-900 dark:text-white">
                            {item.media_geral?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dadosFelicidade.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Nenhum dado encontrado para o período selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NPS */}
          <TabsContent value="nps" className="space-y-4">
            {/* Resumo por Setor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calcularMediaPorSetor(dadosNPS).map((item) => (
                <Card key={item.setor} className="bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.setor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.media}
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 5.0</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.count} respostas
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabela NPS */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Respostas NPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Data</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Funcionário</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Setor</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Quórum</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Média</th>
                        <th className="text-center p-2 text-gray-700 dark:text-gray-300">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosNPS.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="p-2 text-gray-900 dark:text-white">{formatDate(item.data_pesquisa)}</td>
                          <td className="p-2 text-gray-900 dark:text-white">{item.funcionario_nome}</td>
                          <td className="p-2">
                            <Badge variant="outline">{item.setor}</Badge>
                          </td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">{item.quorum}</td>
                          <td className="text-center p-2 font-semibold text-gray-900 dark:text-white">
                            {item.media_geral?.toFixed(2)}
                          </td>
                          <td className="text-center p-2 text-gray-900 dark:text-white">
                            {item.resultado_percentual?.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dadosNPS.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Nenhum dado encontrado para o período selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Nova Pesquisa */}
        <Dialog open={modalFormulario} onOpenChange={setModalFormulario}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Smile className="h-5 w-5" />
                Nova Pesquisa de Satisfação
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Preencha os dados da pesquisa abaixo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seletor de Tipo de Pesquisa */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <Label className="text-gray-900 dark:text-white mb-2 block">Tipo de Pesquisa</Label>
                <Tabs value={tipoPesquisa} onValueChange={(v) => setTipoPesquisa(v as 'nps' | 'felicidade')}>
                  <TabsList className="bg-gray-200 dark:bg-gray-700 w-full">
                    <TabsTrigger value="felicidade" className="flex-1">
                      <Smile className="w-4 h-4 mr-2" />
                      Pesquisa da Felicidade
                    </TabsTrigger>
                    <TabsTrigger value="nps" className="flex-1">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      NPS
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 dark:text-white">Data da Pesquisa *</Label>
                  <Input
                    type="date"
                    value={formData.data_pesquisa}
                    onChange={(e) => setFormData({ ...formData, data_pesquisa: e.target.value })}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-white">Setor *</Label>
                  <Select value={formData.setor} onValueChange={(v) => setFormData({ ...formData, setor: v })}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liderança">Liderança</SelectItem>
                      <SelectItem value="Cozinha">Cozinha</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="Salão">Salão</SelectItem>
                      <SelectItem value="DUDU">DUDU</SelectItem>
                      <SelectItem value="LUAN">LUAN</SelectItem>
                      <SelectItem value="ANDREIA">ANDREIA</SelectItem>
                      <SelectItem value="TODOS">TODOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-white">Nome do Funcionário *</Label>
                  <Input
                    value={formData.funcionario_nome}
                    onChange={(e) => setFormData({ ...formData, funcionario_nome: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-white">Quórum</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quorum}
                    onChange={(e) => setFormData({ ...formData, quorum: parseInt(e.target.value) || 0 })}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Perguntas - Felicidade */}
              {tipoPesquisa === 'felicidade' && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Smile className="w-5 h-5" />
                    Perguntas da Pesquisa de Felicidade
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avalie de 0 a 5</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-gray-900 dark:text-white">1. Eu comigo - Engajamento</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.eu_comigo_engajamento}
                        onChange={(e) => setFormData({ ...formData, eu_comigo_engajamento: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">2. Eu com empresa - Pertencimento</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.eu_com_empresa_pertencimento}
                        onChange={(e) => setFormData({ ...formData, eu_com_empresa_pertencimento: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">3. Eu com colega - Relacionamento</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.eu_com_colega_relacionamento}
                        onChange={(e) => setFormData({ ...formData, eu_com_colega_relacionamento: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">4. Eu com gestor - Liderança</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.eu_com_gestor_lideranca}
                        onChange={(e) => setFormData({ ...formData, eu_com_gestor_lideranca: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">5. Justiça - Reconhecimento</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.justica_reconhecimento}
                        onChange={(e) => setFormData({ ...formData, justica_reconhecimento: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Perguntas - NPS */}
              {tipoPesquisa === 'nps' && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Perguntas do NPS
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avalie de 0 a 5</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-gray-900 dark:text-white">1. Qual sua área de atuação</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.qual_sua_area_atuacao}
                        onChange={(e) => setFormData({ ...formData, qual_sua_area_atuacao: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">2. Sinto-me motivado</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.sinto_me_motivado}
                        onChange={(e) => setFormData({ ...formData, sinto_me_motivado: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">3. Empresa se preocupa</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.empresa_se_preocupa}
                        onChange={(e) => setFormData({ ...formData, empresa_se_preocupa: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">4. Conectado com colegas</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.conectado_colegas}
                        onChange={(e) => setFormData({ ...formData, conectado_colegas: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">5. Relacionamento positivo</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.relacionamento_positivo}
                        onChange={(e) => setFormData({ ...formData, relacionamento_positivo: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-white">6. Quando identifico</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.quando_identifico}
                        onChange={(e) => setFormData({ ...formData, quando_identifico: parseFloat(e.target.value) || 0 })}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModalFormulario(false);
                  limparFormulario();
                }}
                disabled={salvando}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarPesquisa}
                disabled={salvando || !formData.setor || !formData.funcionario_nome}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {salvando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Smile className="h-4 w-4 mr-2" />
                    Salvar Pesquisa
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


