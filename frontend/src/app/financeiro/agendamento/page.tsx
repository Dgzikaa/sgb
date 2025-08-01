'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
  Play,
  Plus,
  Save,
  RotateCcw,
  Search,
  Edit,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PagamentoAgendamento {
  id: string;
  cpf_cnpj: string;
  nome_beneficiario: string;
  chave_pix: string;
  valor: string;
  descricao: string;
  data_pagamento: string;
  data_competencia: string;
  categoria_id: string;
  centro_custo_id: string;
  codigo_solic?: string;
  status:
    | 'pendente'
    | 'agendado'
    | 'aguardando_aprovacao'
    | 'aprovado'
    | 'erro';
  stakeholder_id?: string;
  nibo_agendamento_id?: string;
  inter_aprovacao_id?: string;
  created_at: string;
  updated_at: string;
}

interface Stakeholder {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  type: 'fornecedor' | 'socio' | 'funcionario';
  pixKey?: string; // Adicionado para verificar a chave PIX
}

// Chaves para localStorage
const STORAGE_KEYS = {
  PAGAMENTOS: 'sgb_financeiro_pagamentos',
  BACKUP: 'sgb_financeiro_backup',
  LAST_SAVE: 'sgb_financeiro_last_save',
};

export default function AgendamentoPage() {
  const router = useRouter();
  const { setPageTitle } = usePageTitle();
  const { showToast } = useToast();

  // Helper function para toast
  const toast = useCallback((options: {
    title: string;
    description?: string;
    variant?: 'destructive';
  }) => {
    // Implementação do toast
    console.log('Toast:', options);
  }, []);

  // Estados principais
  const [pagamentos, setPagamentos] = useState<PagamentoAgendamento[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSave, setLastSave] = useState<string>('');

  // Modal de edição
  const [modalEdicao, setModalEdicao] = useState(false);
  const [pagamentoEmEdicao, setPagamentoEmEdicao] =
    useState<PagamentoAgendamento | null>(null);

  // Modal de cadastro de stakeholder
  const [modalStakeholder, setModalStakeholder] = useState(false);
  const [stakeholderEmCadastro, setStakeholderEmCadastro] = useState({
    document: '',
    name: '',
  });
  const [isCadastrandoStakeholder, setIsCadastrandoStakeholder] =
    useState(false);

  // Modal de atualização de chave PIX
  const [modalPixKey, setModalPixKey] = useState(false);
  const [stakeholderParaPix, setStakeholderParaPix] =
    useState<Stakeholder | null>(null);
  const [pixKeyData, setPixKeyData] = useState({
    pixKey: '',
    pixKeyType: 3, // 3 = CPF/CNPJ por padrão
    isSameAsDocument: false,
  });
  const [isAtualizandoPix, setIsAtualizandoPix] = useState(false);

  // Input manual
  const [novoPagamento, setNovoPagamento] = useState({
    cpf_cnpj: '',
    nome_beneficiario: '',
    chave_pix: '',
    valor: '',
    descricao: '',
    data_pagamento: '',
    data_competencia: '',
    categoria_id: '',
    centro_custo_id: '',
  });

  // Estados para categorias e centros de custo
  const [categorias, setCategorias] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Função para carregar categorias e centros de custo
  const loadCategoriasECentrosCusto = useCallback(async () => {
    setIsLoadingOptions(true);
    try {
      // Carregar categorias
      const categoriasResponse = await fetch('/api/financeiro/nibo/categorias');
      const categoriasData = await categoriasResponse.json();
      if (categoriasData.categorias) {
        setCategorias(categoriasData.categorias);
      }

      // Carregar centros de custo
      const centrosCustoResponse = await fetch(
        '/api/financeiro/nibo/centros-custo'
      );
      const centrosCustoData = await centrosCustoResponse.json();
      if (centrosCustoData.centrosCusto) {
        setCentrosCusto(centrosCustoData.centrosCusto);
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
      toast({
        title: 'Erro ao carregar opções',
        description: 'Não foi possível carregar categorias e centros de custo',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOptions(false);
    }
  }, [toast]);

  // Funções de persistência
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        pagamentos,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      localStorage.setItem(STORAGE_KEYS.PAGAMENTOS, JSON.stringify(dataToSave));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
      setLastSave(new Date().toLocaleString('pt-BR'));

      // Criar backup a cada 10 alterações
      const backupCount = localStorage.getItem('sgb_backup_count') || '0';
      if (parseInt(backupCount) % 10 === 0) {
        // TODO: Implementar createBackup quando disponível
      }
      localStorage.setItem(
        'sgb_backup_count',
        (parseInt(backupCount) + 1).toString()
      );
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados localmente',
        variant: 'destructive',
      });
    }
  }, [pagamentos, toast]);

  // Salvar automaticamente quando pagamentos mudarem
  useEffect(() => {
    if (pagamentos.length > 0) {
      saveToLocalStorage();
    }
  }, [pagamentos, saveToLocalStorage]);

  const loadSavedData = useCallback(() => {
    try {
      // Verificar se é primeira vez
      const isFirstLoad = !sessionStorage.getItem('sgb_data_loaded');

      // Primeiro, tentar carregar da chave atual
      let savedData = localStorage.getItem(STORAGE_KEYS.PAGAMENTOS);
      let parsed: any = null;
      let isMigration = false;

      if (savedData) {
        parsed = JSON.parse(savedData);
      } else {
        // Se não encontrar, tentar migrar da chave antiga
        const oldData = localStorage.getItem('pagamentos_agendamento');
        if (oldData) {
          const oldParsed = JSON.parse(oldData);

          // Migrar para o novo formato
          const migratedData = {
            pagamentos: oldParsed.pagamentos || [],
            timestamp: oldParsed.lastSave || new Date().toISOString(),
          };

          // Salvar no novo formato
          localStorage.setItem(
            STORAGE_KEYS.PAGAMENTOS,
            JSON.stringify(migratedData)
          );
          localStorage.setItem(STORAGE_KEYS.LAST_SAVE, migratedData.timestamp);

          // Remover dados antigos
          localStorage.removeItem('pagamentos_agendamento');

          parsed = migratedData;
          isMigration = true;
        }
      }

      if (parsed && parsed.pagamentos && Array.isArray(parsed.pagamentos)) {
        setPagamentos(parsed.pagamentos);
        setLastSave(new Date(parsed.timestamp).toLocaleString('pt-BR'));

        // Mostrar toast se houver pagamentos E for primeira vez
        if (parsed.pagamentos.length > 0 && isFirstLoad) {
          if (isMigration) {
            toast({
              title: '🔄 Dados migrados com sucesso!',
              description: `${parsed.pagamentos.length} pagamento(s) migrado(s) do formato antigo`,
            });
          } else {
            toast({
              title: '📋 Dados carregados!',
              description: `${parsed.pagamentos.length} pagamento(s) restaurado(s)`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
      // Tentar carregar backup se dados principais estiverem corrompidos
      // loadBackup(); // Removido para evitar dependência circular
    }
      }, [toast]);

  // Carregar dados salvos ao inicializar
  useEffect(() => {
    loadCategoriasECentrosCusto();
    loadSavedData();
  }, [loadCategoriasECentrosCusto, loadSavedData]);

  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  const createBackup = useCallback(() => {
    try {
      const backupData = {
        pagamentos,
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'backup',
      };

      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backupData));
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  }, [pagamentos]);

  const loadBackup = useCallback(() => {
    try {
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (backupData) {
        const parsed: any = JSON.parse(backupData);
        if (parsed.pagamentos && Array.isArray(parsed.pagamentos)) {
          setPagamentos(parsed.pagamentos);
          setLastSave(new Date(parsed.timestamp).toLocaleString('pt-BR'));

          toast({
            title: '🔄 Backup restaurado com sucesso!',
            description: `${parsed.pagamentos.length} pagamento(s) carregado(s) do backup`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar backup:', error);
    }
  }, [toast]);

  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PAGAMENTOS);
      localStorage.removeItem(STORAGE_KEYS.BACKUP);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVE);
      localStorage.removeItem('sgb_backup_count');
      sessionStorage.removeItem('sgb_data_loaded');
      setPagamentos([]);
      setLastSave('');

      toast({
        title: '🧹 Dados limpos com sucesso!',
        description: 'Todos os dados locais foram removidos',
      });
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }, [toast]);

  // Métricas
  const getMetricas = () => {
    const total = pagamentos.length;
    const pendentes = pagamentos.filter(p => p.status === 'pendente').length;
    const agendados = pagamentos.filter(p => p.status === 'agendado').length;
    const aguardandoAprovacao = pagamentos.filter(
      p => p.status === 'aguardando_aprovacao'
    ).length;
    const aprovados = pagamentos.filter(p => p.status === 'aprovado').length;
    const erros = pagamentos.filter(p => p.status === 'erro').length;

    return {
      total,
      pendentes,
      agendados,
      aguardandoAprovacao,
      aprovados,
      erros,
    };
  };

  const metricas = getMetricas();

  // Funções de manipulação
  const adicionarPagamento = () => {
    if (
      !novoPagamento.cpf_cnpj ||
      !novoPagamento.nome_beneficiario ||
      !novoPagamento.valor ||
      !novoPagamento.data_pagamento ||
      !novoPagamento.categoria_id ||
      !novoPagamento.centro_custo_id
    ) {
      toast({
        title: '❌ Campos obrigatórios',
        description:
          'Preencha CPF/CNPJ, nome, valor, data de pagamento, categoria e centro de custo',
        variant: 'destructive',
      });
      return;
    }

    // Validar valor (pode ser negativo para categorias de saída no NIBO)
    const valorLimpo = novoPagamento.valor
      .replace('R$', '')
      .replace('.', '')
      .replace(',', '.')
      .trim();
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico === 0) {
      toast({
        title: '❌ Valor inválido',
        description: 'O valor deve ser um número diferente de zero',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    const novo: PagamentoAgendamento = {
      id: Date.now().toString(),
      cpf_cnpj: removerFormatacao(novoPagamento.cpf_cnpj), // Salvar sem formatação
      nome_beneficiario: novoPagamento.nome_beneficiario,
      chave_pix: novoPagamento.chave_pix,
      valor: novoPagamento.valor,
      descricao: novoPagamento.descricao,
      data_pagamento: novoPagamento.data_pagamento,
      data_competencia: novoPagamento.data_competencia,
      categoria_id: novoPagamento.categoria_id,
      centro_custo_id: novoPagamento.centro_custo_id,
      status: 'pendente',
      created_at: now,
      updated_at: now,
    };

    setPagamentos(prev => [...prev, novo]);
    setNovoPagamento({
      cpf_cnpj: '',
      nome_beneficiario: '',
      chave_pix: '',
      valor: '',
      descricao: '',
      data_pagamento: '',
      data_competencia: '',
      categoria_id: '',
      centro_custo_id: '',
    });

    toast({
      title: '✅ Pagamento adicionado com sucesso!',
      description: `${novoPagamento.nome_beneficiario} foi adicionado à lista de pagamentos`,
    });
  };

  const agendarPagamentos = async () => {
    if (pagamentos.length === 0) {
      toast({
        title: '❌ Lista vazia',
        description: 'Adicione pagamentos antes de agendar',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    let sucessos = 0;
    let erros = 0;

    try {
      for (const pagamento of pagamentos) {
        if (pagamento.status === 'pendente') {
          try {
            // 1. Verificar/criar stakeholder no NIBO
            const stakeholder = await verificarStakeholder(pagamento);

            // 2. Agendar no NIBO
            await agendarNoNibo(pagamento, stakeholder);

            // 3. Atualizar status para agendado
            setPagamentos(prev =>
              prev.map(p =>
                p.id === pagamento.id
                  ? {
                      ...p,
                      status: 'agendado',
                      stakeholder_id: stakeholder.id,
                      updated_at: new Date().toISOString(),
                    }
                  : p
              )
            );

            sucessos++;
          } catch (pagamentoError) {
            console.error(
              `Erro no pagamento ${pagamento.nome_beneficiario}:`,
              pagamentoError
            );
            erros++;
            continue;
          }
        }
      }

      // Mostrar resultado final
      if (sucessos > 0 && erros === 0) {
        toast({
          title: '🎯 Agendamento concluído com sucesso!',
          description: `${sucessos} pagamento(s) foram agendados no NIBO`,
        });
      } else if (sucessos > 0 && erros > 0) {
        toast({
          title: '⚠️ Agendamento parcial',
          description: `${sucessos} agendados com sucesso, ${erros} com erro`,
        });
      } else if (erros > 0) {
        toast({
          title: '❌ Erro no agendamento',
          description: `${erros} pagamento(s) falharam no agendamento`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro geral ao agendar pagamentos:', error);
      toast({
        title: '❌ Erro no agendamento',
        description: 'Erro geral ao processar agendamentos no NIBO',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const verificarStakeholder = async (
    pagamento: PagamentoAgendamento
  ): Promise<Stakeholder> => {
    try {
      // Buscar stakeholder existente por CPF/CNPJ
      const cpfCnpj =
        pagamento.cpf_cnpj || pagamento.chave_pix || '00000000000';
      const response = await fetch(
        `/api/financeiro/nibo/stakeholders?q=${cpfCnpj}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        return data.data[0];
      }

      // Criar novo stakeholder
      const novoStakeholder = {
        name: pagamento.nome_beneficiario,
        document: cpfCnpj,
        type: 'fornecedor' as const,
      };

      const createResponse = await fetch('/api/financeiro/nibo/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoStakeholder),
      });

      const createData = await createResponse.json();
      return createData.data;
    } catch (error) {
      console.error('Erro ao verificar stakeholder:', error);
      throw error;
    }
  };

  const agendarNoNibo = async (
    pagamento: PagamentoAgendamento,
    stakeholder: Stakeholder
  ) => {
    try {
      // Formatar valor corretamente
      const valorNumerico = parseFloat(
        pagamento.valor.replace('R$', '').replace(',', '.').trim()
      );

      // Formatar datas no formato ISO
      const dataPagamento = new Date(pagamento.data_pagamento)
        .toISOString()
        .split('T')[0];
      const dataCompetencia = pagamento.data_competencia
        ? new Date(pagamento.data_competencia).toISOString().split('T')[0]
        : dataPagamento;

      const agendamento = {
        stakeholderId: stakeholder.id,
        dueDate: dataPagamento,
        scheduleDate: dataPagamento,
        categoria_id: pagamento.categoria_id || '',
        centro_custo_id: pagamento.centro_custo_id || '',
        categories: [{ description: pagamento.descricao || 'Pagamento PIX' }],
        accrualDate: dataCompetencia,
        value: valorNumerico,
        description:
          pagamento.descricao ||
          `Pagamento PIX para ${pagamento.nome_beneficiario}`,
        reference: pagamento.codigo_solic || undefined,
      };

      const response = await fetch('/api/financeiro/nibo/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendamento),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setPagamentos(prev =>
          prev.map(p =>
            p.id === pagamento.id
              ? {
                  ...p,
                  nibo_agendamento_id: data.data.id,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );

        // Toast individual removido - apenas a mensagem geral será exibida
      } else {
        throw new Error(data.error || 'Erro desconhecido na resposta do NIBO');
      }
    } catch (error) {
      console.error('Erro ao agendar no NIBO:', error);

      // Atualizar status do pagamento para erro
      setPagamentos(prev =>
        prev.map(p =>
          p.id === pagamento.id
            ? {
                ...p,
                status: 'erro',
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      toast({
        title: '❌ Erro no agendamento NIBO',
        description: `Erro ao agendar ${pagamento.nome_beneficiario}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });

      throw error;
    }
  };

  const enviarParaInter = async (pagamento: PagamentoAgendamento) => {
    try {
      // Converter valor para positivo para o Inter (mesmo que seja negativo no NIBO)
      const valorLimpo = pagamento.valor
        .replace('R$', '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      const valorNumerico = parseFloat(valorLimpo);
      const valorParaInter = Math.abs(valorNumerico).toFixed(2); // Sempre positivo para Inter, com 2 casas decimais

      const pagamentoInter = {
        valor: valorParaInter,
        descricao:
          pagamento.descricao ||
          `Pagamento para ${pagamento.nome_beneficiario}`,
        destinatario: pagamento.nome_beneficiario,
        chave: pagamento.chave_pix,
        data_pagamento: pagamento.data_pagamento,
      };

      console.log('🚀 Enviando pagamento para Inter:', {
        valorOriginal: pagamento.valor,
        valorLimpo: valorLimpo,
        valorNumerico: valorNumerico,
        valorParaInter: valorParaInter,
        pagamentoInter: pagamentoInter,
      });

      const response = await fetch('/api/financeiro/inter/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagamentoInter),
      });

      const data = await response.json();

      // Verifica se a resposta tem o formato de sucesso esperado
      if (
        data.success &&
        data.data?.tipoRetorno === 'APROVACAO' &&
        data.data?.codigoSolicitacao
      ) {
        setPagamentos(prev =>
          prev.map(p =>
            p.id === pagamento.id
              ? {
                  ...p,
                  status: 'aguardando_aprovacao',
                  inter_aprovacao_id: data.data.codigoSolicitacao,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );

        // Toast removido para evitar duplicação - apenas a mensagem geral será exibida
        return true; // Indica sucesso
      } else {
        throw new Error(data.error || 'Resposta inválida do Inter');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar para Inter:', error);
      setPagamentos(prev =>
        prev.map(p =>
          p.id === pagamento.id
            ? {
                ...p,
                status: 'erro',
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      // Toast removido para evitar duplicação - apenas a mensagem geral será exibida
      throw error; // Re-lança o erro para ser capturado pela função chamadora
    }
  };

  const enviarTodosParaInter = async () => {
    const agendados = pagamentos.filter(p => p.status === 'agendado');

    if (agendados.length === 0) {
      toast({
        title: '❌ Nenhum pagamento agendado',
        description: 'Agende pagamentos no NIBO antes de enviar para Inter',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      let sucessos = 0;
      let erros = 0;

      for (const pagamento of agendados) {
        try {
          const resultado = await enviarParaInter(pagamento);
          if (resultado === true) {
            sucessos++;
          } else {
            erros++;
          }
        } catch (error) {
          console.error(
            `Erro ao enviar pagamento ${pagamento.nome_beneficiario}:`,
            error
          );
          erros++;
          // Não mostrar toast aqui - apenas contar o erro
        }
        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mostrar resultado baseado no que aconteceu
      if (sucessos > 0 && erros === 0) {
        toast({
          title: '⏳ Pagamentos enviados para aprovação!',
          description: `${sucessos} pagamento(s) foram enviados e aguardam aprovação do gestor`,
        });
      } else if (sucessos > 0 && erros > 0) {
        toast({
          title: '⚠️ Envio parcial',
          description: `${sucessos} enviados com sucesso, ${erros} com erro`,
        });
      } else if (erros > 0) {
        toast({
          title: '❌ Erro no envio para Inter',
          description: `${erros} pagamento(s) falharam no envio`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro geral ao enviar pagamentos para Inter:', error);
      toast({
        title: '❌ Erro no envio para Inter',
        description: 'Erro geral ao enviar pagamentos para o banco Inter',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const editarPagamento = (pagamento: PagamentoAgendamento) => {
    setPagamentoEmEdicao(pagamento);
    setModalEdicao(true);
  };

  const salvarEdicao = () => {
    if (!pagamentoEmEdicao) return;

    // Validação mais detalhada
    const camposObrigatorios: string[] = [];
    if (!pagamentoEmEdicao.categoria_id) camposObrigatorios.push('Categoria');
    if (!pagamentoEmEdicao.centro_custo_id)
      camposObrigatorios.push('Centro de Custo');
    if (!pagamentoEmEdicao.nome_beneficiario)
      camposObrigatorios.push('Nome do Beneficiário');
    if (!pagamentoEmEdicao.valor) camposObrigatorios.push('Valor');
    if (!pagamentoEmEdicao.data_pagamento)
      camposObrigatorios.push('Data de Pagamento');

    if (camposObrigatorios.length > 0) {
      toast({
        title: '❌ Campos obrigatórios',
        description: `Preencha: ${camposObrigatorios.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Validar valor positivo (antes do ajuste automático)
    const valorLimpo = pagamentoEmEdicao.valor
      .replace('R$', '')
      .replace('.', '')
      .replace(',', '.')
      .trim();
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico === 0) {
      toast({
        title: '❌ Valor inválido',
        description: 'O valor deve ser um número diferente de zero',
        variant: 'destructive',
      });
      return;
    }

    // Ajustar valor automaticamente baseado no tipo da categoria
    let valorAjustado = pagamentoEmEdicao.valor;
    const categoria = categorias.find(
      cat => cat.id === pagamentoEmEdicao.categoria_id
    );

    if (categoria) {
      const valorNumerico = parseFloat(pagamentoEmEdicao.valor);

      if (categoria.tipo === 'out' && valorNumerico > 0) {
        // Para categoria de saída, valor deve ser negativo
        valorAjustado = (-valorNumerico).toString();
        toast({
          title: '🔄 Valor ajustado automaticamente',
          description: `Valor alterado para ${valorAjustado} (categoria de saída)`,
        });
      } else if (categoria.tipo === 'in' && valorNumerico < 0) {
        // Para categoria de entrada, valor deve ser positivo
        valorAjustado = Math.abs(valorNumerico).toString();
        toast({
          title: '🔄 Valor ajustado automaticamente',
          description: `Valor alterado para ${valorAjustado} (categoria de entrada)`,
        });
      }
    }

    setPagamentos(prev => {
      const novosPagamentos = prev.map(p =>
        p.id === pagamentoEmEdicao.id
          ? {
              ...pagamentoEmEdicao,
              valor: valorAjustado, // Usar o valor ajustado
              updated_at: new Date().toISOString(),
            }
          : p
      );

      return novosPagamentos;
    });

    setModalEdicao(false);
    setPagamentoEmEdicao(null);

    toast({
      title: '✏️ Pagamento editado com sucesso!',
      description: `${pagamentoEmEdicao.nome_beneficiario} foi atualizado na lista`,
    });
  };

  const cancelarEdicao = () => {
    setModalEdicao(false);
    setPagamentoEmEdicao(null);
  };

  const redefinirStatus = (id: string) => {
    setPagamentos(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              status: 'pendente',
              nibo_agendamento_id: undefined,
              inter_aprovacao_id: undefined,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    toast({
      title: '🔄 Status redefinido!',
      description: "Pagamento voltou para status 'pendente'",
    });
  };

  const removerPagamento = (id: string) => {
    const pagamento = pagamentos.find(p => p.id === id);
    setPagamentos(prev => prev.filter(p => p.id !== id));
    toast({
      title: '🗑️ Pagamento excluído!',
      description: `${pagamento?.nome_beneficiario || 'Pagamento'} foi removido da lista`,
    });
  };

  const limparLista = () => {
    const quantidade = pagamentos.length;
    setPagamentos([]);
    toast({
      title: '🧹 Lista limpa!',
      description: `${quantidade} pagamento(s) foram removidos da lista`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            Pendente
          </Badge>
        );
      case 'agendado':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Agendado
          </Badge>
        );
      case 'aguardando_aprovacao':
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
          >
            Aguardando Aprovação
          </Badge>
        );
      case 'aprovado':
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          >
            Aprovado
          </Badge>
        );
      case 'erro':
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          >
            Erro
          </Badge>
        );
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  // Funções de busca e cadastro de stakeholder
  const buscarStakeholder = async (document: string) => {
    // Remover formatação antes de validar e buscar
    const documentoLimpo = removerFormatacao(document);

    if (!documentoLimpo || documentoLimpo.length < 11) {
      toast({
        title: 'CPF/CNPJ inválido',
        description: 'Digite um CPF ou CNPJ válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/financeiro/nibo/stakeholders?q=${documentoLimpo}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const stakeholder = data.data[0];

        // Verificar se tem chave PIX
        if (!stakeholder.pixKey) {
          // Stakeholder encontrado mas sem chave PIX
          setStakeholderParaPix(stakeholder);
          setModalPixKey(true);
          return;
        }

        // Stakeholder encontrado e com chave PIX
        setNovoPagamento(prev => ({
          ...prev,
          nome_beneficiario: stakeholder.name,
          cpf_cnpj: formatarDocumento(stakeholder.document), // Formatar para exibição
          chave_pix: stakeholder.pixKey,
        }));

        // Toast removido para evitar duplicação - apenas a mensagem geral será exibida
      } else {
        // Stakeholder não encontrado, abrir modal de cadastro
        setStakeholderEmCadastro({
          document: documentoLimpo, // Usar versão sem formatação
          name: '',
        });
        setModalStakeholder(true);
      }
    } catch (error) {
      console.error('Erro ao buscar stakeholder:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao buscar stakeholder',
        variant: 'destructive',
      });
    }
  };

  const cadastrarStakeholder = async () => {
    if (!stakeholderEmCadastro.name.trim()) {
      toast({
        title: '❌ Nome obrigatório',
        description: 'Digite o nome do stakeholder',
        variant: 'destructive',
      });
      return;
    }

    setIsCadastrandoStakeholder(true);

    try {
      const novoStakeholder = {
        name: stakeholderEmCadastro.name,
        document: stakeholderEmCadastro.document,
        type: 'fornecedor' as const,
      };

      const response = await fetch('/api/financeiro/nibo/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoStakeholder),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar o formulário com os dados do stakeholder cadastrado
        setNovoPagamento(prev => ({
          ...prev,
          nome_beneficiario: data.data.name,
          cpf_cnpj: formatarDocumento(data.data.document), // Formatar para exibição
        }));

        setModalStakeholder(false);
        setStakeholderEmCadastro({ document: '', name: '' });

        // Toast removido para evitar duplicação - apenas a mensagem geral será exibida
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao cadastrar stakeholder:', error);
      toast({
        title: '❌ Erro no cadastro',
        description: 'Erro ao cadastrar stakeholder no sistema',
        variant: 'destructive',
      });
    } finally {
      setIsCadastrandoStakeholder(false);
    }
  };

  const cancelarCadastroStakeholder = () => {
    setModalStakeholder(false);
    setStakeholderEmCadastro({ document: '', name: '' });
    setNovoPagamento(prev => ({
      ...prev,
      cpf_cnpj: '',
      nome_beneficiario: '',
    }));
  };

  // Funções para atualização de chave PIX
  const verificarChavePix = async (stakeholder: Stakeholder) => {
    try {
      const response = await fetch(
        `/api/financeiro/nibo/stakeholders/${stakeholder.id}`
      );
      const data = await response.json();

      if (data.success) {
        const stakeholderData = data.data;

        // Verificar se já tem chave PIX
        if (stakeholderData.bankAccountInformation?.pixKey) {
          // Já tem chave PIX, usar ela
          setNovoPagamento(prev => ({
            ...prev,
            chave_pix: stakeholderData.bankAccountInformation.pixKey,
          }));

          // Toast removido para evitar duplicação - apenas a mensagem geral será exibida
        } else {
          // Não tem chave PIX, abrir modal para adicionar
          setStakeholderParaPix(stakeholder);
          setPixKeyData({
            pixKey: '',
            pixKeyType: 3,
            isSameAsDocument: false,
          });
          setModalPixKey(true);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao verificar chave PIX:', error);
      toast({
        title: 'Erro na verificação',
        description: 'Erro ao verificar chave PIX do stakeholder',
        variant: 'destructive',
      });
    }
  };

  const atualizarChavePix = async () => {
    if (!stakeholderParaPix || !pixKeyData.pixKey || !pixKeyData.pixKeyType) {
      toast({
        title: '❌ Dados incompletos',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsAtualizandoPix(true);

    try {
      const chaveLimpa = removerFormatacao(pixKeyData.pixKey);

      const response = await fetch(
        `/api/financeiro/nibo/stakeholders/${stakeholderParaPix.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: stakeholderParaPix.name,
            document: {
              number: removerFormatacao(stakeholderParaPix.document),
              type: stakeholderParaPix.document.length === 11 ? 'CPF' : 'CNPJ',
            },
            bankAccountInformation: {
              pixKey: chaveLimpa,
              pixKeyType: pixKeyData.pixKeyType,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      if (data.success) {
        // Criar stakeholder atualizado com a nova chave PIX
        const updatedStakeholder: Stakeholder = {
          id: stakeholderParaPix.id,
          name: stakeholderParaPix.name,
          document: stakeholderParaPix.document,
          type: stakeholderParaPix.type,
          pixKey: chaveLimpa, // Usar chave limpa
        };

        // Atualizar o formulário com todos os dados
        setNovoPagamento(prev => ({
          ...prev,
          nome_beneficiario: stakeholderParaPix.name,
          cpf_cnpj: formatarDocumento(stakeholderParaPix.document), // Formatar para exibição
          chave_pix: chaveLimpa, // Usar chave limpa
        }));

        setModalPixKey(false);
        setStakeholderParaPix(null);
        setPixKeyData({ pixKey: '', pixKeyType: 3, isSameAsDocument: false });

        toast({
          title: '🔑 Chave PIX atualizada com sucesso!',
          description: `Chave PIX ${pixKeyData.pixKey} adicionada para ${stakeholderParaPix.name}`,
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido na atualização');
      }
    } catch (error) {
      console.error('Erro ao atualizar chave PIX:', error);

      let errorMessage = 'Erro ao atualizar chave PIX';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: '❌ Erro na atualização',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAtualizandoPix(false);
    }
  };

  const cancelarAtualizacaoPix = () => {
    setModalPixKey(false);
    setStakeholderParaPix(null);
    setPixKeyData({ pixKey: '', pixKeyType: 3, isSameAsDocument: false });
  };

  const handlePixKeyTypeChange = (isSameAsDocument: boolean) => {
    if (isSameAsDocument) {
      // Usar CPF/CNPJ como chave PIX e formatar
      const cpfCnpjLimpo = removerFormatacao(novoPagamento.cpf_cnpj);
      setPixKeyData(prev => ({
        ...prev,
        pixKey: formatarDocumento(cpfCnpjLimpo), // Formatar para exibição
        pixKeyType: 3, // CPF/CNPJ
        isSameAsDocument: true,
      }));
    } else {
      setPixKeyData(prev => ({
        ...prev,
        pixKey: '',
        isSameAsDocument: false,
      }));
    }
  };

  // Funções utilitárias
  const formatarDocumento = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, '');

    if (apenasDigitos.length <= 11) {
      return apenasDigitos
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return apenasDigitos
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const removerFormatacao = (valor: string): string => valor.replace(/\D/g, '');

  const formatarPixKey = (valor: string, tipo: number): string => {
    const apenasDigitos = valor.replace(/\D/g, '');

    switch (tipo) {
      case 1: // Telefone
        if (apenasDigitos.length <= 2) return apenasDigitos;
        if (apenasDigitos.length <= 6)
          return `(${apenasDigitos.slice(0, 2)})${apenasDigitos.slice(2)}`;
        return `(${apenasDigitos.slice(0, 2)})${apenasDigitos.slice(2, 7)}-${apenasDigitos.slice(7, 11)}`;
      case 3: // CPF/CNPJ
        return formatarDocumento(apenasDigitos);
      case 4: // Chave Aleatória (UUID)
        if (apenasDigitos.length <= 8) return apenasDigitos;
        if (apenasDigitos.length <= 12)
          return `${apenasDigitos.slice(0, 8)}-${apenasDigitos.slice(8)}`;
        if (apenasDigitos.length <= 16)
          return `${apenasDigitos.slice(0, 8)}-${apenasDigitos.slice(8, 12)}-${apenasDigitos.slice(12)}`;
        if (apenasDigitos.length <= 20)
          return `${apenasDigitos.slice(0, 8)}-${apenasDigitos.slice(8, 12)}-${apenasDigitos.slice(12, 16)}-${apenasDigitos.slice(16)}`;
        return `${apenasDigitos.slice(0, 8)}-${apenasDigitos.slice(8, 12)}-${apenasDigitos.slice(12, 16)}-${apenasDigitos.slice(16, 20)}-${apenasDigitos.slice(20, 32)}`;
      default:
        return valor;
    }
  };

  return (
    <ProtectedRoute requiredModule="financeiro">
      <div className="space-y-6 p-4">
        {/* Header Principal */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Agendamento de Pagamentos
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Gerencie agendamentos de pagamentos PIX com integração NIBO e
                    Inter
                  </p>
                  {lastSave && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Último salvamento: {lastSave}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Sidebar com Métricas */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg lg:sticky lg:top-6">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                      Resumo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                          <FileText className="w-4 w-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {metricas.total}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <Clock className="w-4 w-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Pendentes
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {metricas.pendentes}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Calendar className="w-4 w-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                          Agendados
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                        {metricas.agendados}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Clock className="w-4 w-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
                          Aguardando Aprovação
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                        {metricas.aguardandoAprovacao}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="w-4 w-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                          Aprovados
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                        {metricas.aprovados}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertCircle className="w-4 w-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300">
                          Erros
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                        {metricas.erros}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <Button
                        onClick={agendarPagamentos}
                        disabled={isProcessing || metricas.pendentes === 0}
                        className="w-full btn-primary text-xs sm:text-sm"
                      >
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Agendar no NIBO
                      </Button>

                      <Button
                        onClick={enviarTodosParaInter}
                        disabled={isProcessing || metricas.agendados === 0}
                        className="w-full btn-secondary text-xs sm:text-sm"
                      >
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Enviar para Aprovação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conteúdo Principal */}
              <div className="flex-1">
                {/* Tabs de Funcionalidades */}
                <Tabs defaultValue="manual" className="space-y-4 sm:space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <TabsTrigger
                      value="manual"
                      className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md text-xs sm:text-sm"
                    >
                      Adicionar Manual
                    </TabsTrigger>
                    <TabsTrigger
                      value="lista"
                      className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 rounded-md text-xs sm:text-sm"
                    >
                      Lista de Pagamentos
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Adicionar Manual */}
                  <TabsContent value="manual">
                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                          Adicionar Pagamento Manual
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                          Preencha os dados do pagamento para agendamento
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label
                              htmlFor="cpf_cnpj"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              CPF/CNPJ *
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                id="cpf_cnpj"
                                value={novoPagamento.cpf_cnpj}
                                onChange={e =>
                                  setNovoPagamento(prev => ({
                                    ...prev,
                                    cpf_cnpj: formatarDocumento(e.target.value),
                                  }))
                                }
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                              />
                              <Button
                                onClick={() =>
                                  buscarStakeholder(novoPagamento.cpf_cnpj)
                                }
                                type="button"
                                size="sm"
                                className="btn-primary"
                              >
                                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="nome"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Nome do Beneficiário *
                            </Label>
                            <Input
                              id="nome"
                              value={novoPagamento.nome_beneficiario}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  nome_beneficiario: e.target.value,
                                }))
                              }
                              placeholder="Nome completo"
                              disabled={!!novoPagamento.cpf_cnpj}
                              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="chave_pix"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Chave PIX
                            </Label>
                            <Input
                              id="chave_pix"
                              value={novoPagamento.chave_pix}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  chave_pix: e.target.value,
                                }))
                              }
                              placeholder="CPF, CNPJ, email ou telefone"
                              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="valor"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Valor *
                            </Label>
                            <Input
                              id="valor"
                              value={novoPagamento.valor}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  valor: e.target.value,
                                }))
                              }
                              placeholder="R$ 0,00"
                              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="data_pagamento"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Data de Pagamento *
                            </Label>
                            <Input
                              id="data_pagamento"
                              type="date"
                              value={novoPagamento.data_pagamento}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  data_pagamento: e.target.value,
                                }))
                              }
                              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="data_competencia"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Data de Competência
                            </Label>
                            <Input
                              id="data_competencia"
                              type="date"
                              value={novoPagamento.data_competencia}
                              onChange={e =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  data_competencia: e.target.value,
                                }))
                              }
                              className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="categoria"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Categoria *
                            </Label>
                            <SelectWithSearch
                              options={categorias.map((categoria: any) => ({
                                value: categoria.id,
                                label: categoria.nome,
                              }))}
                              value={novoPagamento.categoria_id || null}
                              onValueChange={value =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  categoria_id: value || '',
                                }))
                              }
                              placeholder="Selecione uma categoria"
                              searchPlaceholder="Buscar categoria..."
                              disabled={isLoadingOptions}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="centro_custo"
                              className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                            >
                              Centro de Custo *
                            </Label>
                            <SelectWithSearch
                              options={centrosCusto.map((centro: any) => ({
                                value: centro.id,
                                label: centro.nome,
                              }))}
                              value={novoPagamento.centro_custo_id || null}
                              onValueChange={value =>
                                setNovoPagamento(prev => ({
                                  ...prev,
                                  centro_custo_id: value || '',
                                }))
                              }
                              placeholder="Selecione um centro de custo"
                              searchPlaceholder="Buscar centro de custo..."
                              disabled={isLoadingOptions}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="descricao"
                            className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                          >
                            Descrição
                          </Label>
                          <Textarea
                            id="descricao"
                            value={novoPagamento.descricao}
                            onChange={e =>
                              setNovoPagamento(prev => ({
                                ...prev,
                                descricao: e.target.value,
                              }))
                            }
                            placeholder="Descrição do pagamento"
                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                          <Button
                            onClick={adicionarPagamento}
                            className="btn-primary text-xs sm:text-sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Adicionar à Lista
                          </Button>
                          <Button onClick={limparLista} className="btn-outline text-xs sm:text-sm">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Limpar Lista
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Lista de Pagamentos */}
                  <TabsContent value="lista">
                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                              Lista de Pagamentos
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {pagamentos.length} pagamento(s) na lista
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {pagamentos.length === 0 ? (
                          <div className="text-center py-8 sm:py-12">
                            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                              Nenhum pagamento na lista
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                              Adicione pagamentos manualmente para começar
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {pagamentos.map(pagamento => (
                              <div
                                key={pagamento.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 gap-3 sm:gap-4"
                              >
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                      {pagamento.nome_beneficiario}
                                    </h3>
                                    {getStatusBadge(pagamento.status)}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    <div>
                                      <span className="font-medium">
                                        CPF/CNPJ:
                                      </span>{' '}
                                      {pagamento.cpf_cnpj
                                        ? formatarDocumento(pagamento.cpf_cnpj)
                                        : 'Não informado'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Valor:</span>{' '}
                                      {pagamento.valor}
                                    </div>
                                    <div>
                                      <span className="font-medium">Data:</span>{' '}
                                      {new Date(
                                        pagamento.data_pagamento
                                      ).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Chave PIX:
                                      </span>{' '}
                                      {pagamento.chave_pix || 'Não informada'}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <div>
                                      <span className="font-medium">
                                        Categoria:
                                      </span>{' '}
                                      {categorias.find(
                                        (c: any) =>
                                          c.id === pagamento.categoria_id
                                      )?.nome || 'Não selecionada'}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Centro de Custo:
                                      </span>{' '}
                                      {centrosCusto.find(
                                        (c: any) =>
                                          c.id === pagamento.centro_custo_id
                                      )?.nome || 'Não selecionado'}
                                    </div>
                                  </div>
                                  {pagamento.descricao && (
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                                      <span className="font-medium">
                                        Descrição:
                                      </span>{' '}
                                      {pagamento.descricao}
                                    </div>
                                  )}
                                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                    Criado:{' '}
                                    {new Date(
                                      pagamento.created_at
                                    ).toLocaleString('pt-BR')}{' '}
                                    | Atualizado:{' '}
                                    {new Date(
                                      pagamento.updated_at
                                    ).toLocaleString('pt-BR')}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 ml-0 sm:ml-4">
                                  <Button
                                    onClick={() => editarPagamento(pagamento)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg shadow-sm"
                                    title="Editar pagamento"
                                  >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  {pagamento.status !== 'pendente' && (
                                    <Button
                                      onClick={() =>
                                        redefinirStatus(pagamento.id)
                                      }
                                      size="sm"
                                      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg shadow-sm"
                                      title="Redefinir status para pendente"
                                    >
                                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  )}
                                  {pagamento.status === 'agendado' && (
                                    <Button
                                      onClick={() => enviarParaInter(pagamento)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg shadow-sm"
                                      title="Enviar para Aprovação"
                                    >
                                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => removerPagamento(pagamento.id)}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg shadow-sm"
                                    title="Remover pagamento"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Cadastro de Stakeholder */}
        <Dialog open={modalStakeholder} onOpenChange={setModalStakeholder}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                Cadastrar Novo Stakeholder
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-4">
              <div>
                <Label
                  htmlFor="modal-document"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  CPF/CNPJ
                </Label>
                <Input
                  id="modal-document"
                  value={formatarDocumento(stakeholderEmCadastro.document)}
                  disabled
                  className="mt-1 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label
                  htmlFor="modal-name"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  Nome *
                </Label>
                <Input
                  id="modal-name"
                  value={stakeholderEmCadastro.name}
                  onChange={e =>
                    setStakeholderEmCadastro(prev => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nome completo do stakeholder"
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={cancelarCadastroStakeholder}
                className="btn-outline text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={cadastrarStakeholder}
                disabled={
                  isCadastrandoStakeholder || !stakeholderEmCadastro.name.trim()
                }
                className="btn-primary text-xs sm:text-sm"
              >
                {isCadastrandoStakeholder ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Atualização de Chave PIX */}
        <Dialog open={modalPixKey} onOpenChange={setModalPixKey}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                Atualizar Chave PIX
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-4">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  <strong>Stakeholder:</strong> {stakeholderParaPix?.name}
                </p>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  <strong>CPF/CNPJ:</strong>{' '}
                  {stakeholderParaPix?.document
                    ? formatarDocumento(stakeholderParaPix.document)
                    : 'Não informado'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="same-as-document"
                  checked={pixKeyData.isSameAsDocument}
                  onChange={e => handlePixKeyTypeChange(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <Label
                  htmlFor="same-as-document"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  Chave PIX é o mesmo CPF/CNPJ?
                </Label>
              </div>

              <div>
                <Label
                  htmlFor="modal-pix-type"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  Tipo de Chave PIX *
                </Label>
                <select
                  id="modal-pix-type"
                  value={pixKeyData.pixKeyType}
                  onChange={e => {
                    const newType = parseInt(e.target.value);
                    setPixKeyData(prev => ({
                      ...prev,
                      pixKeyType: newType,
                      pixKey: '', // Limpar campo ao trocar tipo
                    }));
                  }}
                  className="mt-1 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md text-xs sm:text-sm"
                >
                  <option value={1}>Telefone</option>
                  <option value={2}>Email</option>
                  <option value={3}>CPF/CNPJ</option>
                  <option value={4}>Chave Aleatória</option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor="modal-pix-key"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  Chave PIX *
                </Label>
                <Input
                  id="modal-pix-key"
                  value={pixKeyData.pixKey}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const formattedValue =
                      pixKeyData.pixKeyType === 2
                        ? e.target.value
                        : formatarPixKey(rawValue, pixKeyData.pixKeyType);
                    setPixKeyData(prev => ({
                      ...prev,
                      pixKey: formattedValue,
                    }));
                  }}
                  placeholder={
                    pixKeyData.pixKeyType === 1
                      ? '(61) 99999-9999'
                      : pixKeyData.pixKeyType === 2
                        ? 'email@exemplo.com'
                        : pixKeyData.pixKeyType === 3
                          ? '000.000.000-00'
                          : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                  }
                  className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={cancelarAtualizacaoPix} className="btn-outline text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button
                onClick={atualizarChavePix}
                disabled={isAtualizandoPix || !pixKeyData.pixKey.trim()}
                className="btn-success text-xs sm:text-sm"
              >
                {isAtualizandoPix ? 'Atualizando...' : 'Atualizar Chave PIX'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Pagamento */}
        <Dialog open={modalEdicao} onOpenChange={setModalEdicao}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                Editar Pagamento
              </DialogTitle>
            </DialogHeader>
            {pagamentoEmEdicao && (
              <div className="space-y-3 sm:space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="edit-cpf_cnpj"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      CPF/CNPJ
                    </Label>
                    <Input
                      id="edit-cpf_cnpj"
                      value={formatarDocumento(pagamentoEmEdicao.cpf_cnpj)}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev
                            ? {
                                ...prev,
                                cpf_cnpj: removerFormatacao(e.target.value),
                              }
                            : null
                        )
                      }
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-nome"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Nome do Beneficiário
                    </Label>
                    <Input
                      id="edit-nome"
                      value={pagamentoEmEdicao.nome_beneficiario}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev
                            ? { ...prev, nome_beneficiario: e.target.value }
                            : null
                        )
                      }
                      placeholder="Nome completo"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-chave_pix"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Chave PIX
                    </Label>
                    <Input
                      id="edit-chave_pix"
                      value={pagamentoEmEdicao.chave_pix}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev ? { ...prev, chave_pix: e.target.value } : null
                        )
                      }
                      placeholder="CPF, CNPJ, email ou telefone"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-valor"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Valor
                    </Label>
                    <Input
                      id="edit-valor"
                      value={pagamentoEmEdicao.valor}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev ? { ...prev, valor: e.target.value } : null
                        )
                      }
                      placeholder="R$ 0,00"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-data_pagamento"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Data de Pagamento
                    </Label>
                    <Input
                      id="edit-data_pagamento"
                      type="date"
                      value={pagamentoEmEdicao.data_pagamento}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev
                            ? { ...prev, data_pagamento: e.target.value }
                            : null
                        )
                      }
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-data_competencia"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Data de Competência
                    </Label>
                    <Input
                      id="edit-data_competencia"
                      type="date"
                      value={pagamentoEmEdicao.data_competencia}
                      onChange={e =>
                        setPagamentoEmEdicao(prev =>
                          prev
                            ? { ...prev, data_competencia: e.target.value }
                            : null
                        )
                      }
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-categoria"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Categoria *
                    </Label>
                    <SelectWithSearch
                      options={categorias.map((categoria: any) => ({
                        value: categoria.id,
                        label: categoria.nome,
                      }))}
                      value={pagamentoEmEdicao.categoria_id || null}
                      onValueChange={value =>
                        setPagamentoEmEdicao(prev =>
                          prev ? { ...prev, categoria_id: value || '' } : null
                        )
                      }
                      placeholder="Selecione uma categoria"
                      searchPlaceholder="Buscar categoria..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-centro_custo"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      Centro de Custo *
                    </Label>
                    <SelectWithSearch
                      options={centrosCusto.map((centro: any) => ({
                        value: centro.id,
                        label: centro.nome,
                      }))}
                      value={pagamentoEmEdicao.centro_custo_id || null}
                      onValueChange={value =>
                        setPagamentoEmEdicao(prev =>
                          prev
                            ? { ...prev, centro_custo_id: value || '' }
                            : null
                        )
                      }
                      placeholder="Selecione um centro de custo"
                      searchPlaceholder="Buscar centro de custo..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="edit-descricao"
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-descricao"
                    value={pagamentoEmEdicao.descricao}
                    onChange={e =>
                      setPagamentoEmEdicao(prev =>
                        prev ? { ...prev, descricao: e.target.value } : null
                      )
                    }
                    placeholder="Descrição do pagamento"
                    className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={cancelarEdicao} className="btn-outline text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} className="btn-primary text-xs sm:text-sm">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
