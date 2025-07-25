'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Star,
} from 'lucide-react';

// =====================================================
// 🎨 COMPONENTE DE SEÇÃO VISUAL MELHORADA (MOBILE-FIRST)
// =====================================================
// Implementa clusterização visual conforme documento:
// "A lógica se separar por áreas da segunda ref é muito boa"
// "Clusterizar as perguntas por área/seção"
// + Otimização completa para mobile

interface ChecklistItem {
  id: string;
  titulo: string;
  tipo: string;
  obrigatorio: boolean;
  opcoes?: string[];
  condicao?: Record<string, unknown>;
  status?: string;
  valor?: string | number | boolean | Date | null;
  observacoes?: string;
  validacao?: {
    valido: boolean;
    erro?: string;
  };
}

interface ChecklistSecao {
  id: string;
  titulo: string;
  nome?: string;
  descricao?: string;
  itens: ChecklistItem[];
  ordem: number;
  visivel: boolean;
  status?: string;
  cor?: string;
  estimativa_tempo?: number;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  icone?: string;
  responsavel?: string;
  iniciadoEm?: string;
}

interface ChecklistSecaoCardProps {
  secao: ChecklistSecao;
  onEdit?: (secao: ChecklistSecao) => void;
  onDelete?: (secaoId: string) => void;
  onToggleVisibility?: (secaoId: string) => void;
  onReorder?: (secaoId: string, direction: 'up' | 'down') => void;
  isEditing?: boolean;
  onSave?: (secao: ChecklistSecao) => void;
  onCancel?: () => void;
  readonly?: boolean;
  variant?: string;
  onStartSection?: () => void;
  onCompleteSection?: () => void;
  onItemChange?: (itemId: string, valor: unknown) => void;
}

export default function ChecklistSecaoCard({
  secao,
  onEdit,
  onDelete,
  onToggleVisibility,
  onReorder,
  isEditing,
  onSave,
  onCancel,
  readonly = false,
  variant = 'default',
  onStartSection,
  onCompleteSection,
  onItemChange,
}: ChecklistSecaoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Calcular estatísticas da seção
  const stats = {
    total: secao.itens.length,
    preenchidos: secao.itens.filter(
      item => item.status === 'preenchido' || item.status === 'ok'
    ).length,
    problemas: secao.itens.filter(item => item.status === 'problema').length,
    obrigatorios: secao.itens.filter(item => item.obrigatorio).length,
    obrigatoriosPreenchidos: secao.itens.filter(
      item =>
        item.obrigatorio &&
        (item.status === 'preenchido' || item.status === 'ok')
    ).length,
  };

  const progresso =
    stats.total > 0 ? Math.round((stats.preenchidos / stats.total) * 100) : 0;
  const progressoObrigatorios =
    stats.obrigatorios > 0
      ? Math.round((stats.obrigatoriosPreenchidos / stats.obrigatorios) * 100)
      : 100;

  // Determinar cor baseada no status e progresso
  const getCorSecao = () => {
    if (secao.status === 'problema' || stats.problemas > 0)
      return 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20';
    if (secao.status === 'completado')
      return 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20';
    if (secao.status === 'em_andamento')
      return 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
  };

  // Determinar ícone do status
  const getIconeStatus = () => {
    switch (secao.status) {
      case 'completado':
        return (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      case 'problema':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'em_andamento':
        return (
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
        );
      default:
        return (
          <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        );
    }
  };

  // Determinar cor do header
  const getHeaderColor = () => {
    if (!secao.cor) return 'bg-blue-500 dark:bg-blue-600 text-white';
    const baseColor = secao.cor.replace('bg-', '').replace('-500', '');
    return `bg-${baseColor}-500 dark:bg-${baseColor}-600 text-white`;
  };

  const renderProgressoBadge = () => {
    if (stats.problemas > 0) {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600">
          {stats.problemas} problema{stats.problemas > 1 ? 's' : ''}
        </Badge>
      );
    }

    if (progresso === 100) {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
          ✅ Completo
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
        {stats.preenchidos}/{stats.total} itens
      </Badge>
    );
  };

  const renderEstimativaTempo = () => {
    if (!secao.estimativa_tempo) return null;

    return (
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        {secao.estimativa_tempo}min
      </div>
    );
  };

  const renderPrioridade = () => {
    if (!secao.prioridade) return null;

    const cores = {
      baixa: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      media:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      alta: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      critica: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    };

    const icones = {
      baixa: '⬇️',
      media: '➡️',
      alta: '⬆️',
      critica: '🚨',
    };

    return (
      <Badge className={cores[secao.prioridade]}>
        {icones[secao.prioridade]} {secao.prioridade}
      </Badge>
    );
  };

  return (
    <Card
      className={`
        transition-all duration-300 hover:shadow-lg touch-manipulation
        ${getCorSecao()}
        ${isHovered ? 'shadow-md scale-[1.02]' : ''}
        ${expanded ? 'ring-2 ring-blue-200 dark:ring-blue-600' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header da Seção - MOBILE OTIMIZADO */}
      <CardHeader
        className={`${getHeaderColor()} cursor-pointer touch-manipulation min-h-[60px] p-4`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Ícone de Expansão - MAIOR PARA MOBILE */}
            <div className="flex items-center gap-2 touch-manipulation">
              {expanded ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}

              {/* Ícone da Seção */}
              {secao.icone && <span className="text-2xl">{secao.icone}</span>}
            </div>

            {/* Informações Principais */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {secao.nome || secao.titulo}
              </h3>
              {secao.descricao && (
                <p className="text-sm opacity-90 mt-1 truncate">
                  {secao.descricao}
                </p>
              )}
            </div>
          </div>

          {/* Lado Direito - MOBILE STACK */}
          <div className="flex flex-col items-end gap-2 ml-2">
            {/* Status Visual */}
            <div className="flex items-center gap-2">
              {getIconeStatus()}
              {renderProgressoBadge()}
            </div>

            {/* Informações Secundárias */}
            <div className="flex items-center gap-2 text-xs">
              {renderEstimativaTempo()}
              {renderPrioridade()}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        {expanded && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-semibold">{progresso}%</span>
            </div>
            <Progress
              value={progresso}
              className="h-3 bg-white/30 dark:bg-black/30 touch-manipulation"
            >
              <div
                className="h-full bg-white dark:bg-white rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </Progress>

            {stats.obrigatorios > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span>Itens Obrigatórios</span>
                  <span className="font-semibold">
                    {progressoObrigatorios}%
                  </span>
                </div>
                <Progress
                  value={progressoObrigatorios}
                  className="h-2 bg-white/30 dark:bg-black/30 touch-manipulation"
                >
                  <div
                    className="h-full bg-yellow-300 dark:bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressoObrigatorios}%` }}
                  />
                </Progress>
              </>
            )}
          </div>
        )}
      </CardHeader>

      {/* Conteúdo Expandido */}
      {expanded && (
        <CardContent className="p-0">
          {/* Barra de Ações - MOBILE OTIMIZADA */}
          {!readonly && variant === 'execution' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-3">
                {/* Botões de Ação */}
                <div className="flex gap-2">
                  {secao.status === 'pendente' && onStartSection && (
                    <Button
                      size="lg"
                      onClick={onStartSection}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 touch-manipulation min-h-[48px]"
                    >
                      ▶️ Iniciar Seção
                    </Button>
                  )}
                  {secao.status === 'em_andamento' && onCompleteSection && (
                    <Button
                      size="lg"
                      onClick={onCompleteSection}
                      className="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 touch-manipulation min-h-[48px]"
                    >
                      ✅ Finalizar Seção
                    </Button>
                  )}
                </div>

                {/* Informações da Seção */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {secao.responsavel && (
                    <Badge
                      variant="outline"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      👤 {secao.responsavel}
                    </Badge>
                  )}
                  {secao.iniciadoEm && (
                    <Badge
                      variant="outline"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      🕐 {new Date(secao.iniciadoEm).toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Itens - MOBILE OTIMIZADA */}
          <div className="p-4 space-y-4">
            {secao.itens.map((item, index) => (
              <div
                key={item.id}
                className={`
                  p-4 rounded-lg border-l-4 transition-all duration-200 touch-manipulation
                  ${
                    item.status === 'ok' || item.status === 'preenchido'
                      ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                      : item.status === 'problema'
                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }
                  hover:shadow-sm
                `}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {index + 1}. {item.titulo}
                        </span>
                        {item.obrigatorio && (
                          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Status do Item */}
                    <div className="ml-3 flex-shrink-0">
                      {item.status === 'ok' || item.status === 'preenchido' ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : item.status === 'problema' ? (
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Renderizar campo baseado no tipo */}
                  <div className="w-full">
                    {renderCampoItem(item, onItemChange, readonly)}
                  </div>

                  {/* Observações */}
                  {item.observacoes && (
                    <div className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                        Observações:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.observacoes}
                      </p>
                    </div>
                  )}

                  {/* Validação */}
                  {item.validacao && !item.validacao.valido && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-600">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        ⚠️ {item.validacao.erro}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// =====================================================
// 🔧 FUNÇÃO PARA RENDERIZAR CAMPOS POR TIPO (MOBILE-FIRST)
// =====================================================

function renderCampoItem(
  item: ChecklistItem,
  onItemChange?: (itemId: string, valor: unknown) => void,
  readonly: boolean = false
): React.ReactNode {
  const handleChange = (valor: unknown) => {
    if (!readonly && onItemChange) {
      onItemChange(item.id, valor);
    }
  };

  switch (item.tipo) {
    case 'sim_nao':
      return (
        <div className="flex gap-3 w-full">
          <Button
            size="lg"
            variant={item.valor === true ? 'default' : 'outline'}
            onClick={() => handleChange(true)}
            disabled={readonly}
            className="flex-1 min-h-[48px] touch-manipulation text-base"
          >
            ✅ Sim
          </Button>
          <Button
            size="lg"
            variant={item.valor === false ? 'default' : 'outline'}
            onClick={() => handleChange(false)}
            disabled={readonly}
            className="flex-1 min-h-[48px] touch-manipulation text-base"
          >
            ❌ Não
          </Button>
        </div>
      );

    case 'avaliacao':
      return (
        <div className="space-y-2">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(nota => (
              <Button
                key={nota}
                size="lg"
                variant="ghost"
                onClick={() => handleChange(nota)}
                disabled={readonly}
                className="p-2 h-12 w-12 touch-manipulation"
              >
                <Star
                  className={`w-6 h-6 ${
                    (item.valor as number) >= nota
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </Button>
            ))}
          </div>
          {item.valor && (
            <div className="text-center">
              <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                {typeof item.valor === 'number'
                  ? `${item.valor}/5 estrelas`
                  : `${String(item.valor)}/5 estrelas`}
              </span>
            </div>
          )}
        </div>
      );

    case 'texto':
      return (
        <textarea
          value={String(item.valor || '')}
          onChange={e => handleChange(e.target.value)}
          disabled={readonly}
          rows={3}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base touch-manipulation resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Digite sua resposta aqui..."
        />
      );

    case 'numero':
      return (
        <input
          type="number"
          value={String(item.valor || '')}
          onChange={e => handleChange(parseFloat(e.target.value))}
          disabled={readonly}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Digite um número"
        />
      );

    case 'data':
      return (
        <input
          type="date"
          value={String(item.valor || '')}
          onChange={e => handleChange(e.target.value)}
          disabled={readonly}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      );

    case 'foto_camera':
    case 'foto_upload':
      return (
        <div className="space-y-3">
          {!readonly && (
            <Button
              size="lg"
              variant="outline"
              className="w-full min-h-[48px] touch-manipulation text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => {
                // Implementar captura/upload de foto
                console.log('Foto:', item.tipo);
              }}
            >
              {item.tipo === 'foto_camera' ? (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  📷 Tirar Foto
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  📁 Escolher Foto
                </>
              )}
            </Button>
          )}
          {item.valor && (
            <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Foto anexada
                </span>
              </div>
            </div>
          )}
        </div>
      );

    case 'assinatura':
      return (
        <div className="space-y-3">
          {!readonly && (
            <Button
              size="lg"
              variant="outline"
              className="w-full min-h-[48px] touch-manipulation text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => {
                // Implementar assinatura digital
                console.log('Assinatura digital');
              }}
            >
              ✏️ Assinar Digitalmente
            </Button>
          )}
          {item.valor && (
            <div className="w-full h-24 bg-gray-200 dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 flex items-center justify-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ✓ Assinado
              </span>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Campo tipo: <span className="font-medium">{item.tipo}</span>
          </div>
          {item.valor && (
            <div className="text-sm text-gray-800 dark:text-gray-200">
              Valor: <span className="font-medium">{String(item.valor)}</span>
            </div>
          )}
        </div>
      );
  }
}
