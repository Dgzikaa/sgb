import { createClient } from '@supabase/supabase-js';
import { createWhatsAppService } from './whatsapp-service';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// 📱 ENHANCED NOTIFICATION SERVICE
// ========================================

export interface NotificationChannel {
  browser: boolean;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
}

export interface EnhancedNotificationOptions {
  usuario_id: number;
  bar_id: number;
  titulo: string;
  conteudo: string;
  tipo: string;
  modulo: string;
  prioridade: 'baixa' | 'normal' | 'alta';
  canais: NotificationChannel;

  // Contexto adicional
  checklist_id?: number;
  checklist_execucao_id?: number;
  url_acao?: string;
  dados_extras?: Record<string, any>;

  // Agendamento
  agendado_para?: Date;
  expirar_em?: Date;

  // WhatsApp específico
  whatsapp_template?: string;
  whatsapp_parameters?: string[];
}

// Interfaces para tipagem adequada
interface Notificacao {
  id: number;
  usuario_id: number;
  bar_id: number;
  titulo: string;
  conteudo: string;
  tipo: string;
  modulo: string;
  prioridade: string;
  url_acao?: string;
  dados_extras?: Record<string, any>;
  agendado_para?: string;
  expirar_em?: string;
  lida: boolean;
  canais_tentados?: number;
  canais_enviados?: number;
  erros_envio?: string[];
  enviado_em?: string;
}

interface Checklist {
  id: number;
  nome: string;
  descricao?: string;
}

interface NotificationResult {
  success: boolean;
  channels: {
    browser: boolean;
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
  };
  errors: string[];
}

interface WhatsAppNotificationData {
  id: number;
  usuario_id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  modulo: string;
  checklist_id?: number;
  checklist_execucao_id?: number;
}

interface BulkNotificationResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ usuario_id: number; success: boolean; error?: string }>;
}

export class EnhancedNotificationService {
  private barId: number;

  constructor(barId: number) {
    this.barId = barId;
  }

  // ========================================
  // 🚀 ENVIO MULTI-CANAL
  // ========================================

  /**
   * Envia notificação em múltiplos canais
   */
  async sendMultiChannelNotification(
    options: EnhancedNotificationOptions
  ): Promise<NotificationResult> {
    const results: NotificationResult = {
      success: false,
      channels: {
        browser: false,
        whatsapp: false,
        email: false,
        sms: false,
      },
      errors: [],
    };

    // 1. Criar notificação base no banco
    const notificacao = await this.createBaseNotification(options);
    if (!notificacao) {
      results.errors.push('Falha ao criar notificação base');
      return results;
    }

    // 2. Enviar por browser (sistema existente)
    if (options.canais.browser) {
      try {
        results.channels.browser =
          await this.sendBrowserNotification(notificacao);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push(`Browser: ${errorMessage}`);
      }
    }

    // 3. Enviar por WhatsApp
    if (options.canais.whatsapp) {
      try {
        results.channels.whatsapp = await this.sendWhatsAppNotification(
          notificacao,
          options
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push(`WhatsApp: ${errorMessage}`);
      }
    }

    // 4. Enviar por Email (placeholder)
    if (options.canais.email) {
      try {
        results.channels.email = await this.sendEmailNotification(notificacao);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push(`Email: ${errorMessage}`);
      }
    }

    // 5. Enviar por SMS (placeholder)
    if (options.canais.sms) {
      try {
        results.channels.sms = await this.sendSMSNotification(notificacao);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push(`SMS: ${errorMessage}`);
      }
    }

    // Atualizar estatísticas
    await this.updateNotificationStats(notificacao.id, results);

    results.success = Object.values(results.channels).some(Boolean);
    return results;
  }

  // ========================================
  // 📋 MÉTODOS ESPECÍFICOS PARA CHECKLISTS
  // ========================================

  /**
   * Envia lembrete de checklist
   */
  async sendChecklistReminder(
    usuarioId: number,
    checklistId: number,
    minutosAntes: number = 15
  ): Promise<boolean> {
    // Buscar dados do checklist
    const { data: checklist } = await supabase
      .from('checklists')
      .select('nome, descricao')
      .eq('id', checklistId)
      .single();

    if (!checklist) {
      return false;
    }

    const options: EnhancedNotificationOptions = {
      usuario_id: usuarioId,
      bar_id: this.barId,
      titulo: `Lembrete: ${checklist.nome}`,
      conteudo: `Seu checklist precisa ser executado em ${minutosAntes} minutos.`,
      tipo: 'lembrete_agendamento',
      modulo: 'checklists',
      prioridade: 'normal',
      canais: {
        browser: true,
        whatsapp: true,
        email: false,
        sms: false,
      },
      checklist_id: checklistId,
      url_acao: `/funcionario/checklists/execucao/${checklistId}`,
      whatsapp_template: 'sgb_lembrete_checklist',
      whatsapp_parameters: [
        usuarioId.toString(), // Nome será resolvido no service
        minutosAntes.toString(),
        checklist.nome,
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        'Geral', // Setor padrão
      ],
    };

    const result = await this.sendMultiChannelNotification(options);
    return result.success;
  }

  /**
   * Envia alerta de checklist atrasado
   */
  async sendChecklistDelayAlert(
    usuarioId: number,
    checklistId: number,
    horasAtraso: number
  ): Promise<boolean> {
    const { data: checklist } = await supabase
      .from('checklists')
      .select('nome')
      .eq('id', checklistId)
      .single();

    if (!checklist) {
      return false;
    }

    const options: EnhancedNotificationOptions = {
      usuario_id: usuarioId,
      bar_id: this.barId,
      titulo: `Checklist Atrasado: ${checklist.nome}`,
      conteudo: `Este checklist está atrasado há ${horasAtraso} horas. Execute agora!`,
      tipo: 'checklist_atrasado',
      modulo: 'checklists',
      prioridade: 'alta',
      canais: {
        browser: true,
        whatsapp: true,
        email: false,
        sms: false,
      },
      checklist_id: checklistId,
      url_acao: `/funcionario/checklists/execucao/${checklistId}`,
      whatsapp_template: 'sgb_checklist_atrasado',
      whatsapp_parameters: [
        checklist.nome,
        horasAtraso.toString(),
        usuarioId.toString(), // Nome será resolvido
        'Geral',
      ],
    };

    const result = await this.sendMultiChannelNotification(options);
    return result.success;
  }

  /**
   * Envia confirmação de checklist concluído
   */
  async sendChecklistCompletionConfirmation(
    usuarioId: number,
    checklistId: number,
    execucaoId: number,
    pontuacao: number
  ): Promise<boolean> {
    const { data: checklist } = await supabase
      .from('checklists')
      .select('nome')
      .eq('id', checklistId)
      .single();

    if (!checklist) {
      return false;
    }

    const options: EnhancedNotificationOptions = {
      usuario_id: usuarioId,
      bar_id: this.barId,
      titulo: `Checklist Concluído: ${checklist.nome}`,
      conteudo: `Parabéns! Checklist executado com ${pontuacao}% de aproveitamento.`,
      tipo: 'checklist_concluido',
      modulo: 'checklists',
      prioridade: 'baixa',
      canais: {
        browser: true,
        whatsapp: pontuacao >= 80, // Só envia WhatsApp se pontuação boa
        email: false,
        sms: false,
      },
      checklist_id: checklistId,
      checklist_execucao_id: execucaoId,
      whatsapp_template: 'sgb_checklist_concluido',
      whatsapp_parameters: [
        checklist.nome,
        usuarioId.toString(), // Nome será resolvido
        pontuacao.toString(),
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      ],
    };

    const result = await this.sendMultiChannelNotification(options);
    return result.success;
  }

  // ========================================
  // 🔧 MÉTODOS PRIVADOS
  // ========================================

  /**
   * Cria notificação base no banco
   */
  private async createBaseNotification(
    options: EnhancedNotificationOptions
  ): Promise<Notificacao | null> {
    try {
      const { data: notificacao } = await supabase
        .from('notificacoes')
        .insert({
          usuario_id: options.usuario_id,
          bar_id: options.bar_id,
          titulo: options.titulo,
          conteudo: options.conteudo,
          tipo: options.tipo,
          modulo: options.modulo,
          prioridade: options.prioridade,
          url_acao: options.url_acao,
          dados_extras: options.dados_extras,
          agendado_para: options.agendado_para?.toISOString(),
          expirar_em: options.expirar_em?.toISOString(),
          lida: false,
        })
        .select()
        .single();

      return notificacao as Notificacao;
    } catch (error) {
      console.error('Erro ao criar notificação base:', error);
      return null;
    }
  }

  /**
   * Envia notificação browser (sistema existente)
   */
  private async sendBrowserNotification(
    notificacao: Notificacao
  ): Promise<boolean> {
    try {
      // Usar API existente de notificações browser
      const response = await fetch('/api/configuracoes/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: notificacao.usuario_id,
          titulo: notificacao.titulo,
          conteudo: notificacao.conteudo,
          tipo: notificacao.tipo,
          modulo: notificacao.modulo,
          prioridade: notificacao.prioridade,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar notificação browser:', error);
      return false;
    }
  }

  /**
   * Envia notificação WhatsApp
   */
  private async sendWhatsAppNotification(
    notificacao: Notificacao,
    options: EnhancedNotificationOptions
  ): Promise<boolean> {
    try {
      const whatsappService = await createWhatsAppService(this.barId);
      if (!whatsappService) {
        return false;
      }

      // Processar notificação via WhatsApp Service
      const whatsappData: WhatsAppNotificationData = {
        id: notificacao.id,
        usuario_id: notificacao.usuario_id,
        titulo: notificacao.titulo,
        mensagem: notificacao.conteudo,
        tipo: notificacao.tipo,
        modulo: notificacao.modulo,
        checklist_id: options.checklist_id,
        checklist_execucao_id: options.checklist_execucao_id,
      };

      const success = await whatsappService.processNotificationForWhatsApp(whatsappData);

      return success;
    } catch (error) {
      console.error('Erro ao enviar notificação WhatsApp:', error);
      return false;
    }
  }

  /**
   * Envia notificação por email (placeholder)
   */
  private async sendEmailNotification(notificacao: Notificacao): Promise<boolean> {
    // TODO: Implementar quando necessário
    console.log('Email notification (placeholder):', notificacao.titulo);
    return false;
  }

  /**
   * Envia notificação por SMS (placeholder)
   */
  private async sendSMSNotification(notificacao: Notificacao): Promise<boolean> {
    // TODO: Implementar quando necessário
    console.log('SMS notification (placeholder):', notificacao.titulo);
    return false;
  }

  /**
   * Atualiza estatísticas da notificação
   */
  private async updateNotificationStats(
    notificacaoId: number,
    results: NotificationResult
  ): Promise<void> {
    try {
      const channelsUsed = Object.values(results.channels).filter(
        Boolean
      ).length;
      const channelsSuccess = Object.values(results.channels).filter(
        v => v === true
      ).length;

      await supabase
        .from('notificacoes')
        .update({
          canais_tentados: channelsUsed,
          canais_enviados: channelsSuccess,
          erros_envio: results.errors,
          enviado_em: new Date().toISOString(),
        })
        .eq('id', notificacaoId);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas da notificação:', error);
    }
  }
}

// ========================================
// 🚀 FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Cria instância do Enhanced Notification Service
 */
export function createEnhancedNotificationService(
  barId: number
): EnhancedNotificationService {
  return new EnhancedNotificationService(barId);
}

/**
 * Envia notificação para usuários múltiplos
 */
export async function sendBulkNotifications(
  barId: number,
  usuarioIds: number[],
  notificationOptions: Omit<
    EnhancedNotificationOptions,
    'usuario_id' | 'bar_id'
  >
): Promise<BulkNotificationResult> {
  const service = createEnhancedNotificationService(barId);
  const results: Array<{ usuario_id: number; success: boolean; error?: string }> = [];
  let successCount = 0;

  for (const usuarioId of usuarioIds) {
    try {
      const result = await service.sendMultiChannelNotification({
        ...notificationOptions,
        usuario_id: usuarioId,
        bar_id: barId,
      });

      results.push({
        usuario_id: usuarioId,
        success: result.success,
        error: result.errors.join(', '),
      });

      if (result.success) {
        successCount++;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      results.push({
        usuario_id: usuarioId,
        success: false,
        error: errorMessage,
      });
    }
  }

  return {
    total: usuarioIds.length,
    success: successCount,
    failed: usuarioIds.length - successCount,
    results,
  };
}

/**
 * Configurações padrão de canais por tipo de notificação
 */
export const DEFAULT_CHANNELS = {
  lembrete_agendamento: {
    browser: true,
    whatsapp: true,
    email: false,
    sms: false,
  },
  checklist_atrasado: {
    browser: true,
    whatsapp: true,
    email: false,
    sms: false,
  },
  checklist_concluido: {
    browser: true,
    whatsapp: false,
    email: false,
    sms: false,
  },
  meta_atingida: { browser: true, whatsapp: false, email: true, sms: false },
  relatorio_pronto: { browser: true, whatsapp: false, email: true, sms: false },
  sistema_manutencao: { browser: true, whatsapp: true, email: true, sms: true },
} as const;
