'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Smartphone,
  Monitor,
  Settings,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api-client';

// =====================================================
// INTERFACES E TIPOS
// =====================================================

interface TemplateTag {
  template_tags: {
    nome: string;
  };
}

interface OpcoesItem {
  [key: string]: string | number | boolean;
}

interface CondicionalItem {
  dependeDe: string;
  valor: string | number | boolean;
}

interface ValidacaoItem {
  [key: string]: string | number | boolean;
}

interface ItemChecklist {
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
  ordem: number;
  opcoes?: OpcoesItem;
  condicional?: CondicionalItem;
  validacao?: ValidacaoItem;
}

interface SecaoChecklist {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ordem: number;
  itens: ItemChecklist[];
}

interface TemplateData {
  id?: string;
  nome: string;
  descricao?: string;
  categoria: string;
  setor: string;
  tipo: string;
  frequencia: string;
  tempo_estimado: number;
  publico: boolean;
  tags: string[];
  estrutura: {
    secoes: SecaoChecklist[];
  };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const isNew = id === 'novo';
  const { setPageTitle } = usePageTitle();

  const [template, setTemplate] = useState<TemplateData>({
    nome: '',
    descricao: '',
    categoria: 'geral',
    setor: '',
    tipo: 'qualidade',
    frequencia: 'diaria',
    tempo_estimado: 30,
    publico: false,
    tags: [],
    estrutura: {
      secoes: [],
    },
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [newTag, setNewTag] = useState('');

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    setPageTitle('📝 Editor de Template');
    return () => setPageTitle('');
  }, [setPageTitle]);

  const carregarTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/configuracoes/templates/${id}`);

      if (response.success) {
        const templateData = response.data;
        setTemplate({
          id: templateData.id,
          nome: templateData.nome,
          descricao: templateData.descricao || '',
          categoria: templateData.categoria,
          setor: templateData.setor,
          tipo: templateData.tipo,
          frequencia: templateData.frequencia,
          tempo_estimado: templateData.tempo_estimado,
          publico: templateData.publico,
          tags:
            templateData.template_tags?.map(
              (t: TemplateTag) => t.template_tags.nome
            ) || [],
          estrutura: templateData.estrutura || { secoes: [] },
        });
      } else {
        setError(response.error || 'Erro ao carregar template');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar template:', err);
      setError('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) {
      carregarTemplate();
    }
  }, [carregarTemplate, isNew]);

  // =====================================================
  // FUNÇÕES PRINCIPAIS
  // =====================================================

  const salvarTemplate = async () => {
    try {
      setSaving(true);

      // Validações básicas
      if (!template.nome.trim()) {
        alert('Nome do template é obrigatório');
        return;
      }

      if (!template.setor.trim()) {
        alert('Setor é obrigatório');
        return;
      }

      if (template.estrutura.secoes.length === 0) {
        alert('Adicione pelo menos uma seção ao template');
        return;
      }

      const payload = {
        ...template,
        estrutura: {
          secoes: template.estrutura.secoes.map(secao => ({
            ...secao,
            itens: secao.itens.map(item => ({
              ...item,
              id: undefined, // Remove IDs temporários
            })),
            id: undefined,
          })),
        },
      };

      let response;
      if (isNew) {
        response = await api.post('/api/configuracoes/templates', payload);
      } else {
        response = await api.put(`/api/configuracoes/templates/${id}`, payload);
      }

      if (response.success) {
        alert(
          isNew
            ? 'Template criado com sucesso!'
            : 'Template atualizado com sucesso!'
        );
        router.push('/configuracoes/templates');
      } else {
        alert(response.error || 'Erro ao salvar template');
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar template:', err);
      alert('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // FUNÇÕES DE SEÇÕES
  // =====================================================

  const adicionarSecao = () => {
    const novaSecao: SecaoChecklist = {
      id: `secao_${Date.now()}`,
      nome: `Seção ${template.estrutura.secoes.length + 1}`,
      descricao: '',
      cor: 'bg-blue-500',
      ordem: template.estrutura.secoes.length + 1,
      itens: [],
    };

    setTemplate(prev => ({
      ...prev,
      estrutura: {
        secoes: [...prev.estrutura.secoes, novaSecao],
      },
    }));
  };

  const atualizarSecao = (
    secaoId: string,
    updates: Partial<SecaoChecklist>
  ) => {
    setTemplate(prev => ({
      ...prev,
      estrutura: {
        secoes: prev.estrutura.secoes.map(secao =>
          secao.id === secaoId ? { ...secao, ...updates } : secao
        ),
      },
    }));
  };

  const removerSecao = (secaoId: string) => {
    if (!confirm('Tem certeza que deseja remover esta seção?')) return;

    setTemplate(prev => ({
      ...prev,
      estrutura: {
        secoes: prev.estrutura.secoes.filter(secao => secao.id !== secaoId),
      },
    }));
  };

  // =====================================================
  // FUNÇÕES DE ITENS
  // =====================================================

  const adicionarItem = (secaoId: string) => {
    const secao = template.estrutura.secoes.find(s => s.id === secaoId);
    if (!secao) return;

    const novoItem: ItemChecklist = {
      id: `item_${Date.now()}`,
      titulo: 'Novo item',
      descricao: '',
      tipo: 'sim_nao',
      obrigatorio: false,
      ordem: secao.itens.length + 1,
      opcoes: {},
      validacao: {},
    };

    atualizarSecao(secaoId, {
      itens: [...secao.itens, novoItem],
    });
  };

  const atualizarItem = (
    secaoId: string,
    itemId: string,
    updates: Partial<ItemChecklist>
  ) => {
    const secao = template.estrutura.secoes.find(s => s.id === secaoId);
    if (!secao) return;

    atualizarSecao(secaoId, {
      itens: secao.itens.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removerItem = (secaoId: string, itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;

    const secao = template.estrutura.secoes.find(s => s.id === secaoId);
    if (!secao) return;

    atualizarSecao(secaoId, {
      itens: secao.itens.filter(item => item.id !== itemId),
    });
  };

  // =====================================================
  // FUNÇÕES DE TAGS
  // =====================================================

  const adicionarTag = () => {
    if (!newTag.trim()) return;
    if (template.tags.includes(newTag.trim())) return;

    setTemplate(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag('');
  };

  const removerTag = (tag: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      texto: '📝',
      numero: '🔢',
      sim_nao: '✅',
      data: '📅',
      assinatura: '✍️',
      foto_camera: '📷',
      foto_upload: '🖼️',
      avaliacao: '⭐',
    };
    return icons[tipo] || '📋';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      texto: 'Texto',
      numero: 'Número',
      sim_nao: 'Sim/Não',
      data: 'Data',
      assinatura: 'Assinatura',
      foto_camera: 'Foto (Câmera)',
      foto_upload: 'Foto (Upload)',
      avaliacao: 'Avaliação',
    };
    return labels[tipo] || tipo;
  };

  const cores = [
    { value: 'bg-blue-500', label: 'Azul', color: '#3B82F6' },
    { value: 'bg-green-500', label: 'Verde', color: '#10B981' },
    { value: 'bg-purple-500', label: 'Roxo', color: '#8B5CF6' },
    { value: 'bg-red-500', label: 'Vermelho', color: '#EF4444' },
    { value: 'bg-yellow-500', label: 'Amarelo', color: '#F59E0B' },
    { value: 'bg-orange-500', label: 'Laranja', color: '#F97316' },
    { value: 'bg-pink-500', label: 'Rosa', color: '#EC4899' },
    { value: 'bg-indigo-500', label: 'Índigo', color: '#6366F1' },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => router.push('/configuracoes/templates')}
            className="mt-2"
          >
            Voltar para Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/configuracoes/templates')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <p className="text-gray-600 mt-1">
              Configure as seções e itens do seu checklist
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setMobilePreview(!mobilePreview)}
            variant="outline"
            size="sm"
          >
            {mobilePreview ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={salvarTemplate}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Template *</Label>
                <Input
                  id="nome"
                  value={template.nome}
                  onChange={e =>
                    setTemplate(prev => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Abertura de Cozinha"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={template.descricao}
                  onChange={e =>
                    setTemplate(prev => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Descreva o propósito deste checklist"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="setor">Setor *</Label>
                <Input
                  id="setor"
                  value={template.setor}
                  onChange={e =>
                    setTemplate(prev => ({ ...prev, setor: e.target.value }))
                  }
                  placeholder="Ex: Cozinha, Banheiro, Salão"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={template.categoria}
                    onValueChange={value =>
                      setTemplate(prev => ({ ...prev, categoria: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="seguranca">Segurança</SelectItem>
                      <SelectItem value="qualidade">Qualidade</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="abertura">Abertura</SelectItem>
                      <SelectItem value="fechamento">Fechamento</SelectItem>
                      <SelectItem value="auditoria">Auditoria</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={template.tipo}
                    onValueChange={value =>
                      setTemplate(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abertura">Abertura</SelectItem>
                      <SelectItem value="fechamento">Fechamento</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="qualidade">Qualidade</SelectItem>
                      <SelectItem value="seguranca">Segurança</SelectItem>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="auditoria">Auditoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select
                    value={template.frequencia}
                    onValueChange={value =>
                      setTemplate(prev => ({ ...prev, frequencia: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="conforme_necessario">
                        Conforme necessário
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tempo">Tempo (min)</Label>
                  <Input
                    id="tempo"
                    type="number"
                    min="1"
                    max="480"
                    value={template.tempo_estimado}
                    onChange={e =>
                      setTemplate(prev => ({
                        ...prev,
                        tempo_estimado: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="publico"
                  checked={template.publico}
                  onCheckedChange={checked =>
                    setTemplate(prev => ({
                      ...prev,
                      publico: checked,
                    }))
                  }
                />
                <Label htmlFor="publico">Template público</Label>
              </div>
            </div>

            {/* Tags */}
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>

              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Adicionar tag"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarTag();
                    }
                  }}
                />
                <Button onClick={adicionarTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-red-50"
                      onClick={() => removerTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Ações de Seção */}
            <div className="border-t pt-4">
              <Button
                onClick={adicionarSecao}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Seção
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editor de Conteúdo */}
        <div
          className={`lg:col-span-2 ${mobilePreview ? 'max-w-sm mx-auto' : ''}`}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {mobilePreview ? 'Preview Mobile' : 'Editor de Conteúdo'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.estrutura.secoes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma seção criada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece adicionando uma seção para organizar seus itens
                  </p>
                  <Button onClick={adicionarSecao}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Seção
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {template.estrutura.secoes.map(secao => (
                    <Card
                      key={secao.id}
                      className="border-l-4"
                      style={{
                        borderLeftColor: cores.find(c => c.value === secao.cor)
                          ?.color,
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            {mobilePreview ? (
                              <h3 className="font-semibold text-lg">
                                {secao.nome}
                              </h3>
                            ) : (
                              <Input
                                value={secao.nome}
                                onChange={e =>
                                  atualizarSecao(secao.id, {
                                    nome: e.target.value,
                                  })
                                }
                                className="font-semibold text-lg border-none px-0 focus:border-gray-300"
                              />
                            )}
                          </div>

                          {!mobilePreview && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={secao.cor}
                                onValueChange={value =>
                                  atualizarSecao(secao.id, { cor: value })
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{
                                      backgroundColor: cores.find(
                                        c => c.value === secao.cor
                                      )?.color,
                                    }}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {cores.map(cor => (
                                    <SelectItem
                                      key={cor.value}
                                      value={cor.value}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-4 h-4 rounded"
                                          style={{ backgroundColor: cor.color }}
                                        />
                                        {cor.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                onClick={() => removerSecao(secao.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {secao.descricao && (
                          <p className="text-sm text-gray-600">
                            {secao.descricao}
                          </p>
                        )}

                        {!mobilePreview && (
                          <Textarea
                            value={secao.descricao || ''}
                            onChange={e =>
                              atualizarSecao(secao.id, {
                                descricao: e.target.value,
                              })
                            }
                            placeholder="Descrição da seção (opcional)"
                            rows={2}
                            className="mt-2"
                          />
                        )}
                      </CardHeader>

                      <CardContent>
                        {/* Itens da Seção */}
                        <div className="space-y-3">
                          {secao.itens.map(item => (
                            <div
                              key={item.id}
                              className="border rounded-lg p-3 bg-gray-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-lg">
                                    {getTipoIcon(item.tipo)}
                                  </span>
                                  <div className="flex-1">
                                    {mobilePreview ? (
                                      <div>
                                        <h4 className="font-medium">
                                          {item.titulo}
                                          {item.obrigatorio && (
                                            <span className="text-red-500 ml-1">
                                              *
                                            </span>
                                          )}
                                        </h4>
                                        {item.descricao && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {item.descricao}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Input
                                          value={item.titulo}
                                          onChange={e =>
                                            atualizarItem(secao.id, item.id, {
                                              titulo: e.target.value,
                                            })
                                          }
                                          placeholder="Título do item"
                                          className="font-medium"
                                        />
                                        <Input
                                          value={item.descricao || ''}
                                          onChange={e =>
                                            atualizarItem(secao.id, item.id, {
                                              descricao: e.target.value,
                                            })
                                          }
                                          placeholder="Descrição (opcional)"
                                          className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                          <Select
                                            value={item.tipo}
                                            onValueChange={(value: string) =>
                                              atualizarItem(secao.id, item.id, {
                                                tipo: value as ItemChecklist['tipo'],
                                              })
                                            }
                                          >
                                            <SelectTrigger className="flex-1">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="texto">
                                                📝 Texto
                                              </SelectItem>
                                              <SelectItem value="numero">
                                                🔢 Número
                                              </SelectItem>
                                              <SelectItem value="sim_nao">
                                                ✅ Sim/Não
                                              </SelectItem>
                                              <SelectItem value="data">
                                                📅 Data
                                              </SelectItem>
                                              <SelectItem value="assinatura">
                                                ✍️ Assinatura
                                              </SelectItem>
                                              <SelectItem value="foto_camera">
                                                📷 Foto (Câmera)
                                              </SelectItem>
                                              <SelectItem value="foto_upload">
                                                🖼️ Foto (Upload)
                                              </SelectItem>
                                              <SelectItem value="avaliacao">
                                                ⭐ Avaliação
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>

                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              checked={item.obrigatorio}
                                              onCheckedChange={checked =>
                                                atualizarItem(
                                                  secao.id,
                                                  item.id,
                                                  { obrigatorio: checked }
                                                )
                                              }
                                            />
                                            <Label className="text-sm">
                                              Obrigatório
                                            </Label>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!mobilePreview && (
                                  <Button
                                    onClick={() =>
                                      removerItem(secao.id, item.id)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 ml-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Adicionar Item */}
                        {!mobilePreview && (
                          <Button
                            onClick={() => adicionarItem(secao.id)}
                            variant="outline"
                            className="w-full mt-3"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Item
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
