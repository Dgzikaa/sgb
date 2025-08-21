import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';

// =====================================================
// TIPOS
// =====================================================

interface ItemResposta {
  item_id: string;
  titulo: string;
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
  valor: string | number | boolean | Date | null;
  anexos: {
    url: string;
    nome: string;
    tipo: string;
    tamanho?: number;
  }[];
  respondido: boolean;
  respondido_em?: string;
}

interface SecaoResposta {
  secao_id: string;
  nome: string;
  itens: ItemResposta[];
}

interface RespostasExecucao {
  secoes: SecaoResposta[];
}

interface ProgressoExecucao {
  total_itens: number;
  itens_respondidos: number;
  percentual_completo: number;
  campos_obrigatorios_total: number;
  campos_obrigatorios_respondidos: number;
  percentual_obrigatorios: number;
  pode_ser_finalizado: boolean;
  tempo_estimado: number;
  tempo_decorrido: number;
}

interface ExecucaoData {
  id: string;
  checklist_id: string;
  funcionario_id: string;
  status: 'em_andamento' | 'pausado' | 'completado' | 'cancelado';
  iniciado_em: string;
  finalizado_em?: string;
  observacoes?: string;
  observacoes_finais?: string;
  score_final?: number;
  tempo_total_minutos?: number;
  versao_checklist: number;
  estrutura_checklist: Record<string, any>;
  respostas: RespostasExecucao;
  progresso: ProgressoExecucao;
  checklist: {
    id: string;
    nome: string;
    setor: string;
    tipo: string;
    tempo_estimado: number;
  };
  funcionario: {
    id: string;
    nome: string;
    email: string;
  };
}

interface ValidacaoExecucao {
  valido: boolean;
  erros: string[];
  campos_obrigatorios_vazios: number;
  pode_continuar: boolean;
  pode_finalizar: boolean;
}

interface Anexo {
  url: string;
  nome: string;
  tipo: string;
  tamanho?: number;
}

interface Assinatura {
  url: string;
  nome: string;
  tipo: string;
  data_criacao: string;
}

interface UseChecklistExecutionResult {
  // Estados
  execucao: ExecucaoData | null;
  loading: boolean;
  saving: boolean;
  finalizing: boolean;
  error: string | null;
  autoSaveEnabled: boolean;

  // Ações principais
  iniciarExecucao: (
    checklistId: string,
    observacoesIniciais?: string
  ) => Promise<boolean>;
  carregarExecucao: (execucaoId: string) => Promise<void>;
  salvarRespostas: (autoSave?: boolean) => Promise<boolean>;
  finalizarExecucao: (
    observacoesFinais?: string,
    assinatura?: Assinatura
  ) => Promise<boolean>;
  cancelarExecucao: (motivo?: string) => Promise<boolean>;

  // Edição de respostas
  atualizarResposta: (
    secaoIndex: number,
    itemIndex: number,
    valor: string | number | boolean | Date | null,
    anexos?: Anexo[]
  ) => void;
  adicionarAnexo: (secaoIndex: number, itemIndex: number, anexo: Anexo) => void;
  removerAnexo: (
    secaoIndex: number,
    itemIndex: number,
    anexoIndex: number
  ) => void;

  // Utilitários
  validacao: ValidacaoExecucao | null;
  podeSerFinalizada: boolean;
  temAlteracoesPendentes: boolean;
  proximoItemPendente: { secaoIndex: number; itemIndex: number } | null;

  // Auto-save
  toggleAutoSave: () => void;

  // Navegação
  irParaProximoItem: () => void;
  irParaItemAnterior: () => void;
  irParaSecao: (secaoIndex: number) => void;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useChecklistExecution(): UseChecklistExecutionResult {
  const [execucao, setExecucao] = useState<ExecucaoData | null>(null);
  const [execucaoOriginal, setExecucaoOriginal] = useState<ExecucaoData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validacao, setValidacao] = useState<ValidacaoExecucao | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // =====================================================
  // EFEITOS
  // =====================================================

  // Auto-save quando há mudanças
  useEffect(() => {
    if (
      autoSaveEnabled &&
      execucao &&
      execucaoOriginal &&
      temAlteracoesPendentes
    ) {
      // Limpar timer anterior
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Configurar novo timer para salvar em 3 segundos
      const timer = setTimeout(() => {
        salvarRespostas(true); // Auto-save
      }, 3000);

      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [execucao, execucaoOriginal, autoSaveEnabled, temAlteracoesPendentes, salvarRespostas, autoSaveTimer]);

  // Atualizar validação quando execução muda
  useEffect(() => {
    if (execucao) {
      const novaValidacao = validarExecucao(execucao);
      setValidacao(novaValidacao);
    }
  }, [execucao]);



  // =====================================================
  // AÇÕES PRINCIPAIS
  // =====================================================

  const iniciarExecucao = async (
    checklistId: string,
    observacoesIniciais?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(
        `/api/checklists/${checklistId}/execucoes`,
        {
          observacoes_iniciais: observacoesIniciais,
        }
      );

      if (response.success) {
        const novaExecucao = response.data;
        setExecucao(novaExecucao);
        setExecucaoOriginal(deepClone(novaExecucao));
        return true;
      } else {
        setError(response.error || 'Erro ao iniciar execução');
        return false;
      }
    } catch (err: unknown) {
      console.error('Erro ao iniciar execução:', err);
      setError('Erro ao iniciar execução');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const carregarExecucao = async (execucaoId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/operacional/execucoes/${execucaoId}`);

      if (response.success) {
        const execucaoCarregada = response.data;
        setExecucao(execucaoCarregada);
        setExecucaoOriginal(deepClone(execucaoCarregada));
      } else {
        setError(response.error || 'Erro ao carregar execução');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar execução:', err);
      setError('Erro ao carregar execução');
    } finally {
      setLoading(false);
    }
  };

  const salvarRespostas = useCallback(async (
    autoSave: boolean = false
  ): Promise<boolean> => {
    if (!execucao) return false;

    try {
      setSaving(true);

      const response = await api.put(`/api/operacional/execucoes/${execucao.id}`, {
        respostas: execucao.respostas,
        observacoes: execucao.observacoes,
        auto_save: autoSave,
      });

      if (response.success) {
        const execucaoAtualizada = response.data.execucao;
        setExecucao(execucaoAtualizada);
        setExecucaoOriginal(deepClone(execucaoAtualizada));

        if (!autoSave) {
          console.log('💾 Respostas salvas manualmente');
        }

        return true;
      } else {
        setError(response.error || 'Erro ao salvar respostas');
        return false;
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar respostas:', err);
      setError('Erro ao salvar respostas');
      return false;
    } finally {
      setSaving(false);
    }
  }, [execucao]);

  const finalizarExecucao = async (
    observacoesFinais?: string,
    assinatura?: Assinatura
  ): Promise<boolean> => {
    if (!execucao || execucao.status !== 'em_andamento') {
      return false;
    }

    try {
      setFinalizing(true);
      setError(null);

      const response = await api.post(
        `/api/checklists/execucoes/${execucao.id}/finalizar`,
        {
          observacoes_finais: observacoesFinais,
          assinatura: assinatura,
        }
      );

      if (response.success) {
        const execucaoFinalizada = response.data;
        setExecucao(execucaoFinalizada);
        setExecucaoOriginal(deepClone(execucaoFinalizada));
        return true;
      } else {
        setError(response.error || 'Erro ao finalizar execução');
        return false;
      }
    } catch (err: unknown) {
      console.error('Erro ao finalizar execução:', err);
      setError('Erro ao finalizar execução');
      return false;
    } finally {
      setFinalizing(false);
    }
  };

  const cancelarExecucao = async (motivo?: string): Promise<boolean> => {
    if (!execucao) return false;

    try {
      const response = await api.delete(
        `/api/operacional/execucoes/${execucao.id}?motivo=${encodeURIComponent(motivo || 'Cancelado pelo usuário')}`
      );

      if (response.success) {
        console.log('❌ Execução cancelada');
        return true;
      } else {
        setError(response.error || 'Erro ao cancelar execução');
        return false;
      }
    } catch (err: unknown) {
      console.error('Erro ao cancelar execução:', err);
      setError('Erro ao cancelar execução');
      return false;
    }
  };

  // =====================================================
  // EDIÇÃO DE RESPOSTAS
  // =====================================================

  const atualizarResposta = (
    secaoIndex: number,
    itemIndex: number,
    valor: string | number | boolean | Date | null,
    anexos?: Anexo[]
  ): void => {
    if (!execucao) return;

    setExecucao(prev => {
      if (!prev) return prev;

      const newExecucao = deepClone(prev);
      const secao = newExecucao.respostas.secoes[secaoIndex];
      if (!secao) return prev;

      const item = secao.itens[itemIndex];
      if (!item) return prev;

      item.valor = valor;
      item.respondido = true;
      item.respondido_em = new Date().toISOString();

      if (anexos) {
        item.anexos = anexos as Array<{
          url: string;
          nome: string;
          tipo: string;
          tamanho?: number;
        }>;
      }

      return newExecucao;
    });
  };

  const adicionarAnexo = (
    secaoIndex: number,
    itemIndex: number,
    anexo: Anexo
  ): void => {
    if (!execucao) return;

    setExecucao(prev => {
      if (!prev) return prev;

      const newExecucao = deepClone(prev);
      const secao = newExecucao.respostas.secoes[secaoIndex];
      if (!secao) return prev;

      const item = secao.itens[itemIndex];
      if (!item) return prev;

      item.anexos.push(
        anexo as {
          url: string;
          nome: string;
          tipo: string;
          tamanho?: number;
        }
      );

      return newExecucao;
    });
  };

  const removerAnexo = useCallback(
    (secaoIndex: number, itemIndex: number, anexoIndex: number) => {
      if (!execucao) return;

      setExecucao(prev => {
        if (!prev) return prev;

        const novaExecucao = deepClone(prev);
        const item =
          novaExecucao.respostas.secoes[secaoIndex]?.itens[itemIndex];

        if (item?.anexos) {
          item.anexos.splice(anexoIndex, 1);

          // Se não tem mais anexos e é campo de anexo obrigatório, marcar como não respondido
          if (
            item.anexos.length === 0 &&
            ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo) &&
            item.obrigatorio
          ) {
            item.respondido = false;
            item.respondido_em = undefined;
          }

          // Recalcular progresso
          novaExecucao.progresso = calcularProgresso(novaExecucao.respostas);
        }

        return novaExecucao;
      });
    },
    [execucao]
  );

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

  // Calcular se tem alterações pendentes
  const temAlteracoesPendentes = useMemo(() => {
    if (!execucao || !execucaoOriginal) return false;
    return (
      JSON.stringify(execucao.respostas) !==
      JSON.stringify(execucaoOriginal.respostas)
    );
  }, [execucao, execucaoOriginal]);

  // Verificar se pode ser finalizada
  const podeSerFinalizada = useMemo(() => {
    return validacao?.pode_finalizar ?? false;
  }, [validacao]);

  // Encontrar próximo item pendente
  const proximoItemPendente = useMemo(() => {
    if (!execucao) return null;

    for (
      let secaoIndex = 0;
      secaoIndex < execucao.respostas.secoes.length;
      secaoIndex++
    ) {
      const secao = execucao.respostas.secoes[secaoIndex];

      for (let itemIndex = 0; itemIndex < secao.itens.length; itemIndex++) {
        const item = secao.itens[itemIndex];

        if (item.obrigatorio && !item.respondido) {
          return { secaoIndex, itemIndex };
        }
      }
    }

    return null;
  }, [execucao]);

  // Navegação
  const irParaProximoItem = useCallback(() => {
    // Implementar lógica de navegação
    console.log('Ir para próximo item');
  }, []);

  const irParaItemAnterior = useCallback(() => {
    // Implementar lógica de navegação
    console.log('Ir para item anterior');
  }, []);

  const irParaSecao = useCallback((secaoIndex: number) => {
    // Implementar lógica de navegação
    console.log(`Ir para seção ${secaoIndex}`);
  }, []);

  return {
    // Estados
    execucao,
    loading,
    saving,
    finalizing,
    error,
    autoSaveEnabled,

    // Ações principais
    iniciarExecucao,
    carregarExecucao,
    salvarRespostas,
    finalizarExecucao,
    cancelarExecucao,

    // Edição de respostas
    atualizarResposta,
    adicionarAnexo,
    removerAnexo,

    // Utilitários
    validacao,
    podeSerFinalizada,
    temAlteracoesPendentes,
    proximoItemPendente,

    // Auto-save
    toggleAutoSave,

    // Navegação
    irParaProximoItem,
    irParaItemAnterior,
    irParaSecao,
  };
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // Implementação simplificada do useMemo
  return factory();
}

function validarExecucao(execucao: ExecucaoData): ValidacaoExecucao {
  const erros: string[] = [];
  let camposObrigatoriosVazios = 0;

  if (!execucao.respostas?.secoes) {
    return {
      valido: false,
      erros: ['Estrutura de respostas inválida'],
      campos_obrigatorios_vazios: 0,
      pode_continuar: false,
      pode_finalizar: false,
    };
  }

  execucao.respostas.secoes.forEach((secao, secaoIndex) => {
    secao.itens.forEach((item, itemIndex) => {
      if (item.obrigatorio && !item.respondido) {
        erros.push(`Campo obrigatório "${item.titulo}" não foi preenchido`);
        camposObrigatoriosVazios++;
      }

      // Validar anexos obrigatórios
      if (
        item.obrigatorio &&
        ['foto_camera', 'foto_upload', 'assinatura'].includes(item.tipo)
      ) {
        if (!item.anexos || item.anexos.length === 0) {
          erros.push(`Anexo obrigatório "${item.titulo}" não foi fornecido`);
          camposObrigatoriosVazios++;
        }
      }
    });
  });

  return {
    valido: erros.length === 0,
    erros,
    campos_obrigatorios_vazios: camposObrigatoriosVazios,
    pode_continuar: ['em_andamento', 'pausado'].includes(execucao.status),
    pode_finalizar:
      camposObrigatoriosVazios === 0 && execucao.status === 'em_andamento',
  };
}

function calcularProgresso(respostas: RespostasExecucao): ProgressoExecucao {
  let totalItens = 0;
  let itensRespondidos = 0;
  let camposObrigatoriosTotal = 0;
  let camposObrigatoriosRespondidos = 0;

  respostas.secoes.forEach(secao => {
    secao.itens.forEach(item => {
      totalItens++;

      if (item.respondido) {
        itensRespondidos++;
      }

      if (item.obrigatorio) {
        camposObrigatoriosTotal++;
        if (item.respondido) {
          camposObrigatoriosRespondidos++;
        }
      }
    });
  });

  const percentualCompleto =
    totalItens > 0 ? Math.round((itensRespondidos / totalItens) * 100) : 0;
  const percentualObrigatorios =
    camposObrigatoriosTotal > 0
      ? Math.round(
          (camposObrigatoriosRespondidos / camposObrigatoriosTotal) * 100
        )
      : 100;

  return {
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    percentual_completo: percentualCompleto,
    campos_obrigatorios_total: camposObrigatoriosTotal,
    campos_obrigatorios_respondidos: camposObrigatoriosRespondidos,
    percentual_obrigatorios: percentualObrigatorios,
    pode_ser_finalizado: percentualObrigatorios === 100,
    tempo_estimado: 30, // Default
    tempo_decorrido: 0, // Será calculado pelo frontend
  };
}

// =====================================================
// HOOK PARA LISTA DE EXECUÇÕES
// =====================================================

export function useChecklistExecutions() {
  const [execucoes, setExecucoes] = useState<ExecucaoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarExecucoes = async (filtros?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(filtros || {});
      const response = await api.get(`/api/operacional/execucoes?${params.toString()}`);

      if (response.success) {
        setExecucoes(response.data.execucoes || []);
      } else {
        setError(response.error || 'Erro ao carregar execuções');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar execuções:', err);
      setError('Erro ao carregar execuções');
    } finally {
      setLoading(false);
    }
  };

  return {
    execucoes,
    loading,
    error,
    carregarExecucoes,
  };
}
