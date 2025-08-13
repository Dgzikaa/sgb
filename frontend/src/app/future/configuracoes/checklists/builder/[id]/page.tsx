'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Hash,
  CheckSquare,
  Calendar,
  PenTool,
  Camera,
  Upload,
  Star,
  Coffee,
  ChefHat,
  Utensils,
  Truck,
  Shield,
  FileText,
  Save,
  Smartphone,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  titulo: string;
  descricao?: string;
  tipo:
    | 'texto'
    | 'numero'
    | 'sim_nao'
    | 'data'
    | 'assinatura'
    | 'foto_camera'
    | 'foto_upload'
    | 'avaliacao';
  obrigatorio: boolean;
  condicional?: {
    dependeDe: string;
    valor: string | number | boolean | Date;
  };
  opcoes?: {
    placeholder?: string;
    min?: number;
    max?: number;
    formato?: string;
  };
  ordem: number;
}

interface ChecklistSection {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  itens: ChecklistItem[];
  ordem: number;
}

interface ChecklistBuilderData {
  id: string;
  nome: string;
  setor: string;
  descricao: string;
  tipo: string;
  frequencia: string;
  tempo_estimado: number;
  responsavel_padrao: string;
  secoes: ChecklistSection[];
}

const tiposCampo = [
  { id: 'texto', nome: 'Texto', icon: Type, desc: 'Campo de texto livre' },
  { id: 'numero', nome: 'Número', icon: Hash, desc: 'Campo numérico' },
  { id: 'sim_nao', nome: 'Sim/Não', icon: CheckSquare, desc: 'Campo booleano' },
  { id: 'data', nome: 'Data', icon: Calendar, desc: 'Seletor de data' },
  {
    id: 'assinatura',
    nome: 'Assinatura',
    icon: PenTool,
    desc: 'Campo de assinatura digital',
  },
  {
    id: 'foto_camera',
    nome: 'Foto (Câmera)',
    icon: Camera,
    desc: 'Captura de foto pela câmera',
  },
  {
    id: 'foto_upload',
    nome: 'Foto (Upload)',
    icon: Upload,
    desc: 'Upload de imagem',
  },
  {
    id: 'avaliacao',
    nome: 'Avaliação',
    icon: Star,
    desc: 'Escala de avaliação com carinhas',
  },
];

const setoresConfig = [
  { id: 'cozinha', nome: 'Cozinha', icon: ChefHat, cor: 'bg-orange-500' },
  { id: 'bar', nome: 'Bar', icon: Coffee, cor: 'bg-blue-500' },
  { id: 'salao', nome: 'Salão', icon: Utensils, cor: 'bg-green-500' },
  { id: 'recebimento', nome: 'Recebimento', icon: Truck, cor: 'bg-purple-500' },
  { id: 'seguranca', nome: 'Segurança', icon: Shield, cor: 'bg-red-500' },
  {
    id: 'administrativo',
    nome: 'Administrativo',
    icon: FileText,
    cor: 'bg-gray-500',
  },
];

export default function ChecklistBuilder() {
  const params = useParams();
  const { setPageTitle } = usePageTitle();

  const [checklist, setChecklist] = useState<ChecklistBuilderData | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [modalNovaSecao, setModalNovaSecao] = useState(false);
  const [secaoSelecionada, setSecaoSelecionada] = useState<string>('');

  const [novoItem, setNovoItem] = useState<Partial<ChecklistItem>>({
    titulo: '',
    descricao: '',
    tipo: 'texto',
    obrigatorio: false,
  });

  const [novaSecao, setNovaSecao] = useState({
    nome: '',
    descricao: '',
    cor: 'bg-blue-500',
  });

  const carregarChecklist = useCallback(async () => {
    // TODO: Carregar do banco
    // Mock data para demonstração
    if (params.id === 'novo') {
      setChecklist({
        id: 'novo',
        nome: 'Novo Checklist',
        setor: 'cozinha',
        descricao: '',
        tipo: 'abertura',
        frequencia: 'diaria',
        tempo_estimado: 30,
        responsavel_padrao: '',
        secoes: [
          {
            id: 'secao1',
            nome: 'Preparação Inicial',
            descricao: 'Verificações antes de iniciar o trabalho',
            cor: 'bg-blue-500',
            ordem: 1,
            itens: [],
          },
        ],
      });
    } else {
      // Carregar checklist existente
      setChecklist({
        id: params.id as string,
        nome: 'Checklist de Abertura Cozinha',
        setor: 'cozinha',
        descricao: 'Verificações necessárias para abertura da cozinha',
        tipo: 'abertura',
        frequencia: 'diaria',
        tempo_estimado: 45,
        responsavel_padrao: 'Chef',
        secoes: [
          {
            id: 'secao1',
            nome: 'Equipamentos',
            descricao: 'Verificação dos equipamentos',
            cor: 'bg-orange-500',
            ordem: 1,
            itens: [
              {
                id: 'item1',
                titulo: 'Temperatura do freezer',
                descricao: 'Verificar se está entre -18°C e -15°C',
                tipo: 'numero',
                obrigatorio: true,
                opcoes: { min: -25, max: 0, placeholder: 'Temperatura em °C' },
                ordem: 1,
              },
              {
                id: 'item2',
                titulo: 'Fogão funcionando',
                descricao: 'Verificar se todas as bocas estão funcionando',
                tipo: 'sim_nao',
                obrigatorio: true,
                ordem: 2,
              },
            ],
          },
          {
            id: 'secao2',
            nome: 'Limpeza',
            descricao: 'Verificações de limpeza e sanitização',
            cor: 'bg-green-500',
            ordem: 2,
            itens: [
              {
                id: 'item3',
                titulo: 'Bancadas sanitizadas',
                tipo: 'sim_nao',
                obrigatorio: true,
                ordem: 1,
              },
              {
                id: 'item4',
                titulo: 'Foto da bancada limpa',
                tipo: 'foto_camera',
                obrigatorio: false,
                condicional: { dependeDe: 'item3', valor: true },
                ordem: 2,
              },
            ],
          },
        ],
      });
    }
  }, [params.id]);

  useEffect(() => {
    setPageTitle('🏗️ Builder de Checklist');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    if (params.id !== 'novo') {
      carregarChecklist();
    }
  }, [params.id, carregarChecklist]);

  const adicionarSecao = () => {
    if (!checklist) return;

    const novaSecaoObj: ChecklistSection = {
      id: `secao_${Date.now()}`,
      nome: novaSecao.nome,
      descricao: novaSecao.descricao,
      cor: novaSecao.cor,
      itens: [],
      ordem: checklist.secoes.length + 1,
    };

    setChecklist({
      ...checklist,
      secoes: [...checklist.secoes, novaSecaoObj],
    });

    setNovaSecao({ nome: '', descricao: '', cor: 'bg-blue-500' });
    setModalNovaSecao(false);
  };

  const adicionarItem = () => {
    if (!checklist || !secaoSelecionada) return;

    const secaoIndex = checklist.secoes.findIndex(
      s => s.id === secaoSelecionada
    );
    if (secaoIndex === -1) return;

    const novoItemObj: ChecklistItem = {
      id: `item_${Date.now()}`,
      titulo: novoItem.titulo || '',
      descricao: novoItem.descricao,
      tipo: novoItem.tipo || 'texto',
      obrigatorio: novoItem.obrigatorio || false,
      opcoes: novoItem.opcoes,
      ordem: checklist.secoes[secaoIndex].itens.length + 1,
    };

    const novasSecoes = [...checklist.secoes];
    novasSecoes[secaoIndex].itens.push(novoItemObj);

    setChecklist({
      ...checklist,
      secoes: novasSecoes,
    });

    setNovoItem({
      titulo: '',
      descricao: '',
      tipo: 'texto',
      obrigatorio: false,
    });
    setModalNovoItem(false);
  };

  const moverItem = (
    secaoId: string,
    itemId: string,
    direcao: 'up' | 'down'
  ) => {
    if (!checklist) return;

    const secaoIndex = checklist.secoes.findIndex(s => s.id === secaoId);
    if (secaoIndex === -1) return;

    const itens = [...checklist.secoes[secaoIndex].itens];
    const itemIndex = itens.findIndex(i => i.id === itemId);

    if (itemIndex === -1) return;
    if (direcao === 'up' && itemIndex === 0) return;
    if (direcao === 'down' && itemIndex === itens.length - 1) return;

    const newIndex = direcao === 'up' ? itemIndex - 1 : itemIndex + 1;
    const [movedItem] = itens.splice(itemIndex, 1);
    itens.splice(newIndex, 0, movedItem);

    // Reordenar
    itens.forEach((item, index) => {
      item.ordem = index + 1;
    });

    const novasSecoes = [...checklist.secoes];
    novasSecoes[secaoIndex].itens = itens;

    setChecklist({
      ...checklist,
      secoes: novasSecoes,
    });
  };

  const duplicarItem = (secaoId: string, itemId: string) => {
    if (!checklist) return;

    const secaoIndex = checklist.secoes.findIndex(s => s.id === secaoId);
    if (secaoIndex === -1) return;

    const item = checklist.secoes[secaoIndex].itens.find(i => i.id === itemId);
    if (!item) return;

    const itemDuplicado: ChecklistItem = {
      ...item,
      id: `item_${Date.now()}`,
      titulo: `${item.titulo} (Cópia)`,
      ordem: checklist.secoes[secaoIndex].itens.length + 1,
    };

    const novasSecoes = [...checklist.secoes];
    novasSecoes[secaoIndex].itens.push(itemDuplicado);

    setChecklist({
      ...checklist,
      secoes: novasSecoes,
    });
  };

  const excluirItem = (secaoId: string, itemId: string) => {
    if (!checklist) return;

    const secaoIndex = checklist.secoes.findIndex(s => s.id === secaoId);
    if (secaoIndex === -1) return;

    const novasSecoes = [...checklist.secoes];
    novasSecoes[secaoIndex].itens = novasSecoes[secaoIndex].itens.filter(
      i => i.id !== itemId
    );

    setChecklist({
      ...checklist,
      secoes: novasSecoes,
    });
  };

  const salvarChecklist = async () => {
    if (!checklist) return;

    try {
      // TODO: Implementar salvamento no banco
      console.log('Salvando checklist:', checklist);
      alert('✅ Checklist salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar checklist');
    }
  };

  const renderPreviewMobile = () => {
    if (!checklist) return null;

    return (
      <div className="max-w-sm mx-auto bg-white border rounded-lg shadow-lg">
        <div className="bg-gray-50 p-4 rounded-t-lg">
          <h3 className="font-semibold text-black">{checklist.nome}</h3>
          <p className="text-sm text-gray-600">{checklist.descricao}</p>
        </div>

        <div className="p-4 space-y-6">
          {checklist.secoes.map(secao => (
            <div key={secao.id}>
              <div
                className={`p-2 rounded text-white text-sm font-medium mb-3 ${secao.cor}`}
              >
                {secao.nome}
              </div>

              <div className="space-y-3">
                {secao.itens.map(item => (
                  <div key={item.id} className="border-b pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{item.titulo}</span>
                      {item.obrigatorio && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </div>

                    {item.descricao && (
                      <p className="text-xs text-gray-600 mb-2">
                        {item.descricao}
                      </p>
                    )}

                    {/* Render different field types */}
                    <div className="mt-2">
                      {item.tipo === 'texto' && (
                        <input
                          type="text"
                          placeholder={
                            item.opcoes?.placeholder || 'Digite aqui...'
                          }
                          className="w-full p-2 border rounded text-sm"
                          disabled
                        />
                      )}
                      {item.tipo === 'numero' && (
                        <input
                          type="number"
                          placeholder={item.opcoes?.placeholder || '0'}
                          min={item.opcoes?.min}
                          max={item.opcoes?.max}
                          className="w-full p-2 border rounded text-sm"
                          disabled
                        />
                      )}
                      {item.tipo === 'sim_nao' && (
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.id}
                              className="mr-2"
                              disabled
                            />
                            Sim
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={item.id}
                              className="mr-2"
                              disabled
                            />
                            Não
                          </label>
                        </div>
                      )}
                      {item.tipo === 'avaliacao' && (
                        <div className="flex gap-2 justify-center">
                          {['😞', '😐', '🙂', '😊', '😍'].map(
                            (emoji, index) => (
                              <button
                                key={index}
                                className="text-2xl p-1 hover:bg-gray-100 rounded"
                                disabled
                              >
                                {emoji}
                              </button>
                            )
                          )}
                        </div>
                      )}
                      {item.tipo === 'foto_camera' && (
                        <button
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500"
                          disabled
                        >
                          📷 Tirar Foto
                        </button>
                      )}
                      {item.tipo === 'assinatura' && (
                        <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-gray-500">
                          ✍️ Área de Assinatura
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!checklist) {
    return <div>Carregando...</div>;
  }

  return (
    <ProtectedRoute requiredModule="admin">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-700">
              Construa seu checklist personalizado
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className={previewMode ? 'bg-blue-50' : ''}
            >
              {previewMode ? (
                <Edit className="w-4 h-4 mr-2" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {previewMode ? 'Editar' : 'Preview'}
            </Button>

            <Button
              onClick={salvarChecklist}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Checklist
            </Button>
          </div>
        </div>

        {previewMode ? (
          <div className="bg-gray-100 p-8 rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">📱 Preview Mobile</h2>
              <p className="text-gray-600">
                Como o checklist aparecerá no celular dos funcionários
              </p>
            </div>
            {renderPreviewMobile()}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Configurações do Checklist */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚙️ Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome do Checklist</Label>
                    <Input
                      value={checklist.nome}
                      onChange={e =>
                        setChecklist({ ...checklist, nome: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={checklist.descricao}
                      onChange={e =>
                        setChecklist({
                          ...checklist,
                          descricao: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Setor</Label>
                    <Select
                      value={checklist.setor}
                      onValueChange={value =>
                        setChecklist({ ...checklist, setor: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {setoresConfig.map(setor => (
                          <SelectItem key={setor.id} value={setor.id}>
                            {setor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">➕ Adicionar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setModalNovaSecao(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Seção
                  </Button>

                  <Button
                    onClick={adicionarItem}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={checklist.secoes.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Item
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Editor Principal */}
            <div className="lg:col-span-3 space-y-6">
              {checklist.secoes.map(secao => (
                <Card key={secao.id}>
                  <CardHeader
                    className={`${secao.cor} text-white rounded-t-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{secao.nome}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {secao.descricao && (
                      <p className="text-sm opacity-90">{secao.descricao}</p>
                    )}
                  </CardHeader>

                  <CardContent className="p-0">
                    {secao.itens.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum item nesta seção</p>
                        <Button
                          onClick={() => {
                            setSecaoSelecionada(secao.id);
                            adicionarItem(); // Adiciona um item vazio na seção selecionada
                          }}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Adicionar Primeiro Item
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {secao.itens.map((item, index) => {
                          const TipoIcon =
                            tiposCampo.find(t => t.id === item.tipo)?.icon ||
                            Type;

                          return (
                            <div key={item.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <TipoIcon className="w-5 h-5 text-gray-500 mt-0.5" />

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-black">
                                        {item.titulo}
                                      </h4>
                                      {item.obrigatorio && (
                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                          Obrigatório
                                        </Badge>
                                      )}
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {
                                          tiposCampo.find(
                                            t => t.id === item.tipo
                                          )?.nome
                                        }
                                      </Badge>
                                    </div>

                                    {item.descricao && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {item.descricao}
                                      </p>
                                    )}

                                    {item.condicional && (
                                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                        Condicional
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      moverItem(secao.id, item.id, 'up')
                                    }
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      moverItem(secao.id, item.id, 'down')
                                    }
                                    disabled={index === secao.itens.length - 1}
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      duplicarItem(secao.id, item.id)
                                    }
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // setItemEditando(item) // Não precisa de itemEditando aqui
                                      setSecaoSelecionada(secao.id);
                                      adicionarItem(); // Adiciona um item vazio na seção selecionada para edição
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      excluirItem(secao.id, item.id)
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {checklist.secoes.length === 0 && (
                <div className="text-center py-12">
                  <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma seção criada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Comece criando sua primeira seção
                  </p>
                  <Button
                    onClick={() => setModalNovaSecao(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Seção
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Nova Seção */}
        <Dialog open={modalNovaSecao} onOpenChange={setModalNovaSecao}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📋 Nova Seção</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome da Seção</Label>
                <Input
                  value={novaSecao.nome}
                  onChange={e =>
                    setNovaSecao({ ...novaSecao, nome: e.target.value })
                  }
                  placeholder="Ex: Equipamentos, Limpeza, Segurança"
                />
              </div>

              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  value={novaSecao.descricao}
                  onChange={e =>
                    setNovaSecao({ ...novaSecao, descricao: e.target.value })
                  }
                  placeholder="Breve descrição da seção"
                />
              </div>

              <div>
                <Label>Cor da Seção</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {[
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-red-500',
                    'bg-gray-500',
                  ].map(cor => (
                    <button
                      key={cor}
                      onClick={() => setNovaSecao({ ...novaSecao, cor })}
                      className={`w-8 h-8 rounded ${cor} ${novaSecao.cor === cor ? 'ring-2 ring-black' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModalNovaSecao(false)}
              >
                Cancelar
              </Button>
              <Button onClick={adicionarSecao} disabled={!novaSecao.nome}>
                Criar Seção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Item */}
        <Dialog open={modalNovoItem} onOpenChange={setModalNovoItem}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {/* {itemEditando ? '✏️ Editar Item' : '➕ Novo Item'} */}
                Novo Item
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* {!itemEditando && ( */}
              <div>
                <Label>Seção</Label>
                <Select
                  value={secaoSelecionada}
                  onValueChange={setSecaoSelecionada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a seção" />
                  </SelectTrigger>
                  <SelectContent>
                    {checklist.secoes.map(secao => (
                      <SelectItem key={secao.id} value={secao.id}>
                        {secao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* )} */}

              <div>
                <Label>Título do Item</Label>
                <Input
                  value={novoItem.titulo || ''} // Temporário, será preenchido no modal
                  onChange={e =>
                    setNovoItem({ ...novoItem, titulo: e.target.value })
                  }
                  placeholder="Ex: Verificar temperatura do freezer"
                />
              </div>

              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={novoItem.descricao || ''} // Temporário, será preenchido no modal
                  onChange={e =>
                    setNovoItem({ ...novoItem, descricao: e.target.value })
                  }
                  placeholder="Instruções detalhadas para o funcionário"
                  rows={2}
                />
              </div>

              <div>
                <Label>Tipo de Campo</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {tiposCampo.map(tipo => {
                    const TipoIcon = tipo.icon;
                    return (
                      <button
                        key={tipo.id}
                        onClick={() =>
                          setNovoItem({
                            ...novoItem,
                            tipo: tipo.id as
                              | 'texto'
                              | 'numero'
                              | 'sim_nao'
                              | 'data'
                              | 'assinatura'
                              | 'foto_camera'
                              | 'foto_upload'
                              | 'avaliacao',
                          })
                        }
                        className={`p-3 border rounded-lg text-left hover:bg-gray-50 ${
                          novoItem.tipo === tipo.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <TipoIcon className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            {tipo.nome}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{tipo.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={novoItem.obrigatorio || false} // Temporário, será preenchido no modal
                  onCheckedChange={checked =>
                    setNovoItem({ ...novoItem, obrigatorio: checked })
                  }
                />
                <Label>Campo obrigatório</Label>
              </div>

              {/* Opções específicas por tipo de campo */}
              {novoItem.tipo === 'numero' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Valor Mínimo</Label>
                    <Input
                      type="number"
                      value={novoItem.opcoes?.min || ''} // Temporário, será preenchido no modal
                      onChange={e =>
                        setNovoItem({
                          ...novoItem,
                          opcoes: {
                            ...novoItem.opcoes,
                            min: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Valor Máximo</Label>
                    <Input
                      type="number"
                      value={novoItem.opcoes?.max || ''} // Temporário, será preenchido no modal
                      onChange={e =>
                        setNovoItem({
                          ...novoItem,
                          opcoes: {
                            ...novoItem.opcoes,
                            max: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={novoItem.opcoes?.placeholder || ''} // Temporário, será preenchido no modal
                      onChange={e =>
                        setNovoItem({
                          ...novoItem,
                          opcoes: {
                            ...novoItem.opcoes,
                            placeholder: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalNovoItem(false)}>
                Cancelar
              </Button>
              <Button
                onClick={adicionarItem} // Adiciona o item na seção selecionada
                disabled={!novoItem.titulo || !secaoSelecionada}
              >
                Adicionar Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
