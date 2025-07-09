import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// 📱 WHATSAPP NOTIFICATION SERVICE
// ========================================

export interface WhatsAppConfig {
  phone_number_id: string;
  access_token: string;
  api_version: string;
  rate_limit_per_minute: number;
  template_prefix: string;
  idioma: string;
}

export interface WhatsAppContact {
  id: number;
  numero_whatsapp: string;
  nome_contato: string;
  aceita_notificacoes: boolean;
  aceita_lembretes: boolean;
  aceita_relatorios: boolean;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: number[];
}

export interface WhatsAppTemplate {
  name: string;
  body_text: string;
  parameters: any[];
  variables_count: number;
}

export interface SendMessageOptions {
  destinatario: string;
  template_name?: string;
  template_parameters?: string[];
  conteudo?: string;
  modulo: string;
  checklist_id?: number;
  checklist_execucao_id?: number;
  notificacao_id?: number;
  prioridade?: 'baixa' | 'normal' | 'alta';
}

export class WhatsAppNotificationService {
  private barId: number;
  private config: WhatsAppConfig | null = null;

  constructor(barId: number) {
    this.barId = barId;
  }

  // ========================================
  // 🔧 CONFIGURAÇÃO E INICIALIZAÇÃO
  // ========================================

  /**
   * Inicializa o serviço carregando configurações
   */
  async initialize(): Promise<boolean> {
    try {
      const { data: config } = await supabase
        .from('whatsapp_configuracoes')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('ativo', true)
        .single();

      if (config) {
        this.config = config;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp Service:', error);
      return false;
    }
  }

  /**
   * Verifica se WhatsApp está ativo
   */
  isActive(): boolean {
    return this.config !== null;
  }

  // ========================================
  // 📞 GERENCIAMENTO DE CONTATOS
  // ========================================

  /**
   * Busca contato WhatsApp por usuário
   */
  async getContactByUserId(usuarioId: number): Promise<WhatsAppContact | null> {
    try {
      const { data: contato } = await supabase
        .from('whatsapp_contatos')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('usuario_id', usuarioId)
        .single();

      return contato;
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca contato WhatsApp por número
   */
  async getContactByPhone(numeroWhatsapp: string): Promise<WhatsAppContact | null> {
    try {
      const { data: contato } = await supabase
        .from('whatsapp_contatos')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('numero_whatsapp', numeroWhatsapp)
        .single();

      return contato;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cria novo contato WhatsApp
   */
  async createContact(
    usuarioId: number, 
    numeroWhatsapp: string, 
    nomeContato: string
  ): Promise<WhatsAppContact | null> {
    try {
      const { data: contato } = await supabase
        .from('whatsapp_contatos')
        .insert({
          bar_id: this.barId,
          usuario_id: usuarioId,
          numero_whatsapp: numeroWhatsapp,
          nome_contato: nomeContato,
          verificado: false
        })
        .select()
        .single();

      return contato;
    } catch (error) {
      console.error('Erro ao criar contato WhatsApp:', error);
      return null;
    }
  }

  // ========================================
  // 📝 GERENCIAMENTO DE TEMPLATES
  // ========================================

  /**
   * Busca template por nome
   */
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const { data: template } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('name', templateName)
        .eq('status', 'APPROVED')
        .single();

      return template;
    } catch (error) {
      return null;
    }
  }

  /**
   * Lista templates por módulo
   */
  async getTemplatesByModule(modulo: string): Promise<WhatsAppTemplate[]> {
    try {
      const { data: templates } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('modulo', modulo)
        .eq('status', 'APPROVED')
        .order('name');

      return templates || [];
    } catch (error) {
      return [];
    }
  }

  // ========================================
  // 💬 ENVIO DE MENSAGENS
  // ========================================

  /**
   * Envia mensagem WhatsApp
   */
  async sendMessage(options: SendMessageOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.config) {
      return { success: false, error: 'WhatsApp não configurado' };
    }

    try {
      // Buscar contato
      const contato = await this.getContactByPhone(options.destinatario);
      if (!contato) {
        return { success: false, error: 'Contato não encontrado' };
      }

      // Verificar permissões de notificação
      if (!this.canSendNotification(contato, options.modulo)) {
        return { success: false, error: 'Contato não aceita este tipo de notificação' };
      }

      // Verificar horário permitido
      if (!this.isWithinAllowedHours(contato)) {
        return { success: false, error: 'Fora do horário permitido' };
      }

      // Preparar dados da mensagem
      const messageData = {
        bar_id: this.barId,
        contato_id: contato.id,
        tipo_mensagem: options.template_name ? 'template' : 'text',
        template_name: options.template_name,
        conteudo: options.conteudo || '',
        template_parameters: options.template_parameters || [],
        modulo: options.modulo,
        checklist_id: options.checklist_id,
        checklist_execucao_id: options.checklist_execucao_id,
        notificacao_id: options.notificacao_id,
        status: 'pending'
      };

      // Salvar mensagem no banco
      const { data: mensagem, error: saveError } = await supabase
        .from('whatsapp_mensagens')
        .insert(messageData)
        .select()
        .single();

      if (saveError) {
        return { success: false, error: 'Erro ao salvar mensagem' };
      }

      // Enviar via WhatsApp API
      const sendResult = await this.sendToWhatsAppAPI(contato, mensagem);

      // Atualizar status da mensagem
      await supabase
        .from('whatsapp_mensagens')
        .update({
          status: sendResult.success ? 'sent' : 'failed',
          whatsapp_message_id: sendResult.messageId,
          tentativas: 1,
          enviado_em: sendResult.success ? new Date().toISOString() : null,
          error_code: sendResult.errorCode,
          error_message: sendResult.errorMessage
        })
        .eq('id', mensagem.id);

      return sendResult;

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return { success: false, error: 'Erro interno do serviço' };
    }
  }

  /**
   * Envia mensagem usando template
   */
  async sendTemplateMessage(
    destinatario: string,
    templateName: string,
    parameters: string[] = [],
    context?: {
      modulo: string;
      checklist_id?: number;
      checklist_execucao_id?: number;
      notificacao_id?: number;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = await this.getTemplate(templateName);
    
    if (!template) {
      return { success: false, error: 'Template não encontrado' };
    }

    return this.sendMessage({
      destinatario,
      template_name: templateName,
      template_parameters: parameters,
      modulo: context?.modulo || 'sistema',
      checklist_id: context?.checklist_id,
      checklist_execucao_id: context?.checklist_execucao_id,
      notificacao_id: context?.notificacao_id
    });
  }

  // ========================================
  // 🔗 INTEGRAÇÃO COM NOTIFICAÇÕES
  // ========================================

  /**
   * Processa notificação para envio via WhatsApp
   */
  async processNotificationForWhatsApp(notificacao: any): Promise<boolean> {
    if (!this.isActive()) {
      return false;
    }

    try {
      // Buscar dados do usuário destinatário
      const { data: usuario } = await supabase
        .from('usuarios_bar')
        .select('id, nome')
        .eq('id', notificacao.usuario_id)
        .single();

      if (!usuario) {
        return false;
      }

      // Buscar contato WhatsApp do usuário
      const contato = await this.getContactByUserId(usuario.id);
      if (!contato) {
        return false;
      }

      // Determinar template baseado no tipo de notificação
      const templateResult = await this.selectTemplateForNotification(notificacao);
      
      if (!templateResult) {
        return false;
      }

      // Preparar parâmetros do template
      const parameters = this.prepareTemplateParameters(
        notificacao, 
        usuario, 
        templateResult.template
      );

      // Enviar mensagem
      const result = await this.sendTemplateMessage(
        contato.numero_whatsapp,
        templateResult.templateName,
        parameters,
        {
          modulo: notificacao.modulo,
          notificacao_id: notificacao.id
        }
      );

      return result.success;

    } catch (error) {
      console.error('Erro ao processar notificação para WhatsApp:', error);
      return false;
    }
  }

  // ========================================
  // 🔧 MÉTODOS PRIVADOS
  // ========================================

  /**
   * Verifica se pode enviar notificação
   */
  private canSendNotification(contato: WhatsAppContact, modulo: string): boolean {
    if (!contato.aceita_notificacoes) {
      return false;
    }

    switch (modulo) {
      case 'checklists':
        return contato.aceita_lembretes;
      case 'reports':
        return contato.aceita_relatorios;
      default:
        return true;
    }
  }

  /**
   * Verifica horário permitido
   */
  private isWithinAllowedHours(contato: WhatsAppContact): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.getDay() + 1; // 1=Domingo

    return contato.dias_semana.includes(currentDay) &&
           currentTime >= contato.horario_inicio &&
           currentTime <= contato.horario_fim;
  }

  /**
   * Envia para WhatsApp API
   */
  private async sendToWhatsAppAPI(contato: WhatsAppContact, mensagem: any): Promise<{
    success: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (!this.config) {
      return { success: false, errorMessage: 'Configuração não encontrada' };
    }

    try {
      const url = `https://graph.facebook.com/${this.config.api_version}/${this.config.phone_number_id}/messages`;
      
      let payload: any = {
        messaging_product: 'whatsapp',
        to: contato.numero_whatsapp
      };

      if (mensagem.tipo_mensagem === 'template') {
        payload.type = 'template';
        payload.template = {
          name: mensagem.template_name,
          language: { code: this.config.idioma },
          components: []
        };

        if (mensagem.template_parameters && mensagem.template_parameters.length > 0) {
          payload.template.components.push({
            type: 'body',
            parameters: mensagem.template_parameters.map((param: string) => ({
              type: 'text',
              text: param
            }))
          });
        }
      } else {
        payload.type = 'text';
        payload.text = { body: mensagem.conteudo };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.messages[0].id
        };
      } else {
        return {
          success: false,
          errorCode: result.error?.code?.toString(),
          errorMessage: result.error?.message || 'Erro desconhecido'
        };
      }

    } catch (error) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'Erro de conexão com WhatsApp API'
      };
    }
  }

  /**
   * Seleciona template baseado na notificação
   */
  private async selectTemplateForNotification(notificacao: any): Promise<{
    templateName: string;
    template: WhatsAppTemplate;
  } | null> {
    const moduleTemplates = await this.getTemplatesByModule(notificacao.modulo);
    
    // Mapear tipos de notificação para templates
    const templateMap: { [key: string]: string } = {
      'lembrete_agendamento': 'sgb_lembrete_checklist',
      'checklist_atrasado': 'sgb_checklist_atrasado',
      'checklist_concluido': 'sgb_checklist_concluido'
    };

    const templateName = templateMap[notificacao.tipo] || 'sgb_lembrete_checklist';
    const template = moduleTemplates.find(t => t.name === templateName);

    if (!template) {
      return null;
    }

    return { templateName, template };
  }

  /**
   * Prepara parâmetros do template
   */
  private prepareTemplateParameters(
    notificacao: any, 
    usuario: any, 
    template: WhatsAppTemplate
  ): string[] {
    const params: string[] = [];
    
    // Parâmetros padrão baseados no tipo de notificação
    switch (notificacao.tipo) {
      case 'lembrete_agendamento':
        params.push(
          usuario.nome,
          '15', // minutos
          notificacao.titulo || 'Checklist',
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          'Geral',
          `${process.env.NEXT_PUBLIC_SITE_URL}/funcionario/checklists`
        );
        break;
        
      case 'checklist_atrasado':
        params.push(
          notificacao.titulo || 'Checklist',
          '2', // horas de atraso
          usuario.nome,
          'Geral',
          `${process.env.NEXT_PUBLIC_SITE_URL}/funcionario/checklists`
        );
        break;
        
      case 'checklist_concluido':
        params.push(
          notificacao.titulo || 'Checklist',
          usuario.nome,
          '95', // pontuação
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
    }

    return params.slice(0, template.variables_count);
  }
}

// ========================================
// 🚀 FACTORY FUNCTION
// ========================================

/**
 * Cria instância do WhatsApp Service
 */
export async function createWhatsAppService(barId: number): Promise<WhatsAppNotificationService | null> {
  const service = new WhatsAppNotificationService(barId);
  const initialized = await service.initialize();
  
  return initialized ? service : null;
} 