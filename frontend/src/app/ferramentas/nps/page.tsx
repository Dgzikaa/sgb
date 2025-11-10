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
import { Smile, TrendingUp, Calendar, Users, BarChart3, Download, Upload, FileSpreadsheet } from 'lucide-react';
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
  
  // Estados para importação
  const [modalImportacao, setModalImportacao] = useState(false);
  const [tipoImportacao, setTipoImportacao] = useState<'nps' | 'felicidade'>('nps');
  const [dadosCSV, setDadosCSV] = useState('');
  const [importando, setImportando] = useState(false);
  
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

  // Função para importar dados do CSV/Google Sheets
  const importarDados = async () => {
    if (!dadosCSV.trim()) {
      toast({
        title: 'Erro',
        description: 'Cole os dados do Google Sheets',
        variant: 'destructive'
      });
      return;
    }

    try {
      setImportando(true);

      // Parse CSV (separado por tabs do Google Sheets)
      const linhas = dadosCSV.trim().split('\n');
      const registros: any[] = [];

      // Pular cabeçalho (primeira linha)
      for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split('\t');
        
        if (colunas.length < 3) continue; // Linha inválida

        if (tipoImportacao === 'nps') {
          // Formato esperado: Data | Setor | Funcionário | Quorum | Q1 | Q2 | Q3 | Q4 | Q5 | Q6
          registros.push({
            bar_id: selectedBar?.id || 3 || 3,
            data_pesquisa: colunas[0] ? new Date(colunas[0]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            setor: colunas[1] || 'Geral',
            funcionario_nome: colunas[2] || 'Anônimo',
            quorum: parseInt(colunas[3]) || 0,
            qual_sua_area_atuacao: parseFloat(colunas[4]) || 0,
            sinto_me_motivado: parseFloat(colunas[5]) || 0,
            empresa_se_preocupa: parseFloat(colunas[6]) || 0,
            conectado_colegas: parseFloat(colunas[7]) || 0,
            relacionamento_positivo: parseFloat(colunas[8]) || 0,
            quando_identifico: parseFloat(colunas[9]) || 0,
          });
        } else {
          // Formato esperado: Data | Setor | Funcionário | Quorum | Q1 | Q2 | Q3 | Q4 | Q5
          registros.push({
            bar_id: selectedBar?.id || 3 || 3,
            data_pesquisa: colunas[0] ? new Date(colunas[0]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            setor: colunas[1] || 'Geral',
            funcionario_nome: colunas[2] || 'Anônimo',
            quorum: parseInt(colunas[3]) || 0,
            eu_comigo_engajamento: parseFloat(colunas[4]) || 0,
            eu_com_empresa_pertencimento: parseFloat(colunas[5]) || 0,
            eu_com_colega_relacionamento: parseFloat(colunas[6]) || 0,
            eu_com_gestor_lideranca: parseFloat(colunas[7]) || 0,
            justica_reconhecimento: parseFloat(colunas[8]) || 0,
          });
        }
      }

      if (registros.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum registro válido encontrado',
          variant: 'destructive'
        });
        return;
      }

      // Enviar para API
      const endpoint = tipoImportacao === 'nps' ? '/api/nps' : '/api/pesquisa-felicidade';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          bar_id: selectedBar?.id || 3 || 3,
          registros
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Sucesso!',
          description: `${registros.length} registros importados com sucesso`
        });
        setModalImportacao(false);
        setDadosCSV('');
        carregarDados();
      } else {
        throw new Error(data.error || 'Erro ao importar');
      }

    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: 'Erro ao importar',
        description: error.message || 'Não foi possível importar os dados',
        variant: 'destructive'
      });
    } finally {
      setImportando(false);
    }
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
        {/* Header com botões de importação */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              NPS & Pesquisa da Felicidade
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie e visualize as pesquisas de satisfação
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setTipoImportacao('nps');
                setModalImportacao(true);
              }}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar NPS Manual
            </Button>
            <Button
              onClick={() => {
                setTipoImportacao('felicidade');
                setModalImportacao(true);
              }}
              variant="outline"
              className="border-pink-600 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Felicidade Manual
            </Button>
          </div>
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

        {/* Modal de Importação */}
        <Dialog open={modalImportacao} onOpenChange={setModalImportacao}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Dados do Google Sheets - {tipoImportacao === 'nps' ? 'NPS' : 'Pesquisa da Felicidade'}
              </DialogTitle>
              <DialogDescription>
                Cole os dados copiados do Google Sheets abaixo. Certifique-se de copiar com o cabeçalho.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Instruções */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📋 Como importar:</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Abra a planilha do Google Sheets</li>
                  <li>Selecione todas as linhas (incluindo cabeçalho)</li>
                  <li>Copie (Ctrl+C ou Cmd+C)</li>
                  <li>Cole no campo abaixo</li>
                  <li>Clique em "Importar"</li>
                </ol>
              </div>

              {/* Formato esperado */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📊 Formato esperado ({tipoImportacao === 'nps' ? 'NPS' : 'Felicidade'}):
                </h4>
                <code className="text-xs text-gray-700 dark:text-gray-300 block whitespace-pre-wrap">
                  {tipoImportacao === 'nps' 
                    ? 'Data | Setor | Funcionário | Quorum | Q1 | Q2 | Q3 | Q4 | Q5 | Q6'
                    : 'Data | Setor | Funcionário | Quorum | Engajamento | Pertencimento | Relacionamento | Liderança | Reconhecimento'}
                </code>
              </div>

              {/* Campo de texto */}
              <div>
                <Label className="text-gray-900 dark:text-white">Dados do Google Sheets</Label>
                <Textarea
                  value={dadosCSV}
                  onChange={(e) => setDadosCSV(e.target.value)}
                  placeholder="Cole aqui os dados copiados do Google Sheets..."
                  className="min-h-[300px] font-mono text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {dadosCSV ? `${dadosCSV.split('\n').length - 1} linhas detectadas` : 'Aguardando dados...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setModalImportacao(false);
                  setDadosCSV('');
                }}
                disabled={importando}
              >
                Cancelar
              </Button>
              <Button
                onClick={importarDados}
                disabled={importando || !dadosCSV.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {importando ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
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


