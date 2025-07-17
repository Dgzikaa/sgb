import { getSupabaseClient } from '@/lib/supabase'

// ========================================
// ðŸ“± WHATSAPP NOTIFICATION SERVICE
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
  // ðŸ”§ CONFIGURAÃ‡ÃƒO E INICIALIZAÃ‡ÃƒO
  // ========================================

  /**
   * Inicializa o serviÃ§o carregando configuraÃ§Ãµes
   */
  async initialize(): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient()
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
   * Verifica se WhatsApp estÃ¡ ativo
   */
  isActive(): boolean {
    return this.config !== null;
  }

  // ========================================
  // ðŸ“ž GERENCIAMENTO DE CONTATOS
  // ========================================

  /**
   * Busca contato WhatsApp por usuÃ¡rio
   */
  async getContactByUserId(usuarioId: number): Promise<WhatsAppContact | null> {
    try {
      const supabase = await getSupabaseClient()
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
   * Busca contato WhatsApp por nÃºmero
   */
  async getContactByPhone(numeroWhatsapp: string): Promise<WhatsAppContact | null> {
    try {
      const supabase = await getSupabaseClient()
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
      const supabase = await getSupabaseClient()
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
  // ðŸ“ GERENCIAMENTO DE TEMPLATES
  // ========================================

  /**
   * Busca template por nome
   */
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const supabase = await getSupabaseClient()
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
   * Lista templates por mÃ³dulo
   */
  async getTemplatesByModule(modulo: string): Promise<WhatsAppTemplate[]> {
    try {
      const supabase = await getSupabaseClient()
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
  // ðŸ’¬ ENVIO DE MENSAGENS
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
      return { success: false, error: 'WhatsApp nÃ£o configurado' };
    }

    try {
      // Buscar contato
      const contato = await this.getContactByPhone(options.destinatario);
      if (!contato) {
        return { success: false, error: 'Contato nÃ£o encontrado' };
      }

      // Verificar permissÃµes de notificaÃ§Ã£o
      if (!this.canSendNotification(contato, options.modulo)) {
        return { success: false, error: 'Contato nÃ£o aceita este tipo de notificaÃ§Ã£o' };
      }

      // Verificar horÃ¡rio permitido
      if (!this.isWithinAllowedHours(contato)) {
        return { success: false, error: 'Fora do horÃ¡rio permitido' };
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
      const supabase = await getSupabaseClient()
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
      return { success: false, error: 'Erro interno do serviÃ§o' };
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
      return { success: false, error: 'Template nÃ£o encontrado' };
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
  // ðŸ”— INTEGRAÃ‡ÃƒO COM NOTIFICAÃ‡Ã•ES
  // ========================================

  /**
   * Processa notificaÃ§Ã£o para envio via WhatsApp
   */
  async processNotificationForWhatsApp(notificacao: any): Promise<boolean> {
    if (!this.isActive()) {
      return false;
    }

    try {
      // Buscar dados do usuÃ¡rio destinatÃ¡rio
      const supabase = await getSupabaseClient()
      const { data: usuario } = await supabase
        .from('usuarios_bar')
        .select('id, nome')
        .eq('id', notificacao.usuario_id)
        .single();

      if (!usuario) {
        return false;
      }

      // Buscar contato WhatsApp do usuÃ¡rio
      const contato = await this.getContactByUserId(usuario.id);
      if (!contato) {
        return false;
      }

      // Determinar template baseado no tipo de notificaÃ§Ã£o
      const templateResult = await this.selectTemplateForNotification(notificacao);
      
      if (!templateResult) {
        return false;
      }

      // Preparar parÃ¢metros do template
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
      console.error('Erro ao processar notificaÃ§Ã£o para WhatsApp:', error);
      return false;
    }
  }

  // ========================================
  // ðŸ”§ MÃ‰TODOS PRIVADOS
  // ========================================

  /**
   * Verifica se pode enviar notificaÃ§Ã£o
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
   * Verifica horÃ¡rio permitido
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
      return { success: false, errorMessage: 'ConfiguraÃ§Ã£o nÃ£o encontrada' };
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
        errorMessage: 'Erro de conexÃ£o com WhatsApp API'
      };
    }
  }

  /**
   * Seleciona template baseado na notificaÃ§Ã£o
   */
  private async selectTemplateForNotification(notificacao: any): Promise<{
    templateName: string;
    template: WhatsAppTemplate;
  } | null> {
    const moduleTemplates = await this.getTemplatesByModule(notificacao.modulo);
    
    // Mapear tipos de notificaÃ§Ã£o para templates
    const templateMap: { [key: string]: string } = {
      'lembrete_agendamento': 'sgb_lembrete_checklist',
      'checklist_atrasado': 'sgb_checklist_atrasado',
      'checklist_concluido': 'sgb_checklist_concluido'
    };

    const templateName = templateMap[notificacao.tipo] || 'sgb_lembrete_checklist';
    const template = moduleTemplates.find((t: any) => t.name === templateName);

    if (!template) {
      return null;
    }

    return { templateName, template };
  }

  /**
   * Prepara parÃ¢metros do template
   */
  private prepareTemplateParameters(
    notificacao: any, 
    usuario: any, 
    template: WhatsAppTemplate
  ): string[] {
    const params: string[] = [];
    
    // ParÃ¢metros padrÃ£o baseados no tipo de notificaÃ§Ã£o
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
          '95', // pontuaÃ§Ã£o
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
    }

    return params.slice(0, template.variables_count);
  }
}

// ========================================
// ðŸš€ FACTORY FUNCTION
// ========================================

/**
 * Cria instÃ¢ncia do WhatsApp Service
 */
export async function createWhatsAppService(barId: number): Promise<WhatsAppNotificationService | null> {
  const service = new WhatsAppNotificationService(barId);
  const initialized = await service.initialize();
  
  return initialized ? service : null;
} 

// =====================================================
// ðŸ“± SERVIÃ‡O WHATSAPP - LEMBRETES E COMPARTILHAMENTO
// =====================================================

interface ChecklistAlert {
  id: string
  checklistId: string
  titulo: string
  categoria: string
  nivel: 'baixo' | 'medio' | 'alto' | 'critico'
  tempoAtraso: number
  horaEsperada: string
  responsavel?: string
  setor?: string
}

interface ChecklistExecution {
  id: string
  checklist_id: string
  titulo: string
  responsavel: string
  setor: string
  tempo_execucao: number
  total_itens: number
  itens_ok: number
  itens_problema: number
  status: string
  observacoes_gerais?: string
  concluido_em: string
}

interface WhatsAppMessageTemplates {
  reminder: string
  alert: string
  completion: string
  share: string
}

// =====================================================
// ðŸ”” SISTEMA DE LEMBRETES AUTOMÃTICOS
// =====================================================

export class WhatsAppService {
  
  // Templates padrÃ£o de mensagens
  private static templates: WhatsAppMessageTemplates = {
    reminder: `ðŸ”” *Lembrete SGB*

OlÃ¡ {FUNCIONARIO}! VocÃª tem um checklist pendente:

ðŸ“‹ *{CHECKLIST_NOME}*
â° HorÃ¡rio: {HORARIO}
ðŸ“ Setor: {SETOR}
âš¡ Prioridade: {PRIORIDADE}

Por favor, execute o checklist no horÃ¡rio programado.

_Sistema de GestÃ£o de Bares_`,

    alert: `ðŸš¨ *ALERTA - Checklist Atrasado*

âš ï¸ O checklist estÃ¡ atrasado!

ðŸ“‹ *{CHECKLIST_NOME}*
ðŸ‘¤ ResponsÃ¡vel: {FUNCIONARIO}
â° Era para: {HORARIO}
â±ï¸ Atraso: {TEMPO_ATRASO}
ðŸŽ¯ NÃ­vel: {NIVEL_URGENCIA}

Por favor, execute URGENTEMENTE!

_Sistema de GestÃ£o de Bares_`,

    completion: `âœ… *Checklist ConcluÃ­do*

ðŸ“‹ *{CHECKLIST_NOME}*
ðŸ‘¤ ResponsÃ¡vel: {FUNCIONARIO}
ðŸ“ Setor: {SETOR}
â±ï¸ Tempo: {TEMPO_EXECUCAO}min
ðŸ“Š Status: {STATUS}

{RESUMO_RESULTADOS}

_Sistema de GestÃ£o de Bares_`,

    share: `ðŸ“‹ *RelatÃ³rio de Checklist*

âœ… *{CHECKLIST_NOME}*
ðŸ“… Data: {DATA}
ðŸ‘¤ ResponsÃ¡vel: {FUNCIONARIO}
ðŸ“ Setor: {SETOR}

ðŸ“Š *Resultados:*
â€¢ âœ… Itens OK: {ITENS_OK}
â€¢ âŒ Problemas: {ITENS_PROBLEMA}
â€¢ ðŸ“Š Total: {TOTAL_ITENS}
â€¢ â±ï¸ Tempo: {TEMPO_EXECUCAO}min

{OBSERVACOES}

_Sistema de GestÃ£o de Bares_`
  }

  // =====================================================
  // ðŸ“¤ ENVIAR MENSAGEM
  // =====================================================
  
  static async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: to.replace(/\D/g, ''), // Remove tudo que nÃ£o Ã© nÃºmero
          message
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
      return false
    }
  }

  // =====================================================
  // ðŸ”” LEMBRETE DE CHECKLIST
  // =====================================================
  
  static async sendReminder(
    phoneNumber: string,
    checklistNome: string,
    horario: string,
    setor: string,
    funcionario: string,
    prioridade: string
  ): Promise<boolean> {
    
    const message = this.templates.reminder
      .replace('{FUNCIONARIO}', funcionario)
      .replace('{CHECKLIST_NOME}', checklistNome)
      .replace('{HORARIO}', horario)
      .replace('{SETOR}', setor)
      .replace('{PRIORIDADE}', this.formatPrioridade(prioridade))

    return this.sendMessage(phoneNumber, message)
  }

  // =====================================================
  // ðŸš¨ ALERTA DE ATRASO
  // =====================================================
  
  static async sendAlert(phoneNumber: string, alert: ChecklistAlert): Promise<boolean> {
    
    const tempoAtraso = this.formatTempoAtraso(alert.tempoAtraso)
    const nivelUrgencia = this.formatNivelUrgencia(alert.nivel)
    
    const message = this.templates.alert
      .replace('{CHECKLIST_NOME}', alert.titulo)
      .replace('{FUNCIONARIO}', alert.responsavel || 'ResponsÃ¡vel')
      .replace('{HORARIO}', alert.horaEsperada)
      .replace('{TEMPO_ATRASO}', tempoAtraso)
      .replace('{NIVEL_URGENCIA}', nivelUrgencia)

    return this.sendMessage(phoneNumber, message)
  }

  // =====================================================
  // âœ… CONFIRMAÃ‡ÃƒO DE CONCLUSÃƒO
  // =====================================================
  
  static async sendCompletion(
    phoneNumber: string,
    execution: ChecklistExecution
  ): Promise<boolean> {
    
    const resumoResultados = this.generateResultSummary(execution)
    const status = this.formatStatus(execution.status)
    
    const message = this.templates.completion
      .replace('{CHECKLIST_NOME}', execution.titulo)
      .replace('{FUNCIONARIO}', execution.responsavel)
      .replace('{SETOR}', execution.setor)
      .replace('{TEMPO_EXECUCAO}', execution.tempo_execucao.toString())
      .replace('{STATUS}', status)
      .replace('{RESUMO_RESULTADOS}', resumoResultados)

    return this.sendMessage(phoneNumber, message)
  }

  // =====================================================
  // ðŸ“¤ COMPARTILHAR CHECKLIST
  // =====================================================
  
  static async shareChecklist(
    phoneNumbers: string[],
    execution: ChecklistExecution
  ): Promise<{ success: number; failed: number }> {
    
    const data = new Date(execution.concluido_em).toLocaleDateString('pt-BR')
    const observacoes = execution.observacoes_gerais 
      ? `ðŸ’¬ *ObservaÃ§Ãµes:*\n${execution.observacoes_gerais}`
      : ''
    
    const message = this.templates.share
      .replace('{CHECKLIST_NOME}', execution.titulo)
      .replace('{DATA}', data)
      .replace('{FUNCIONARIO}', execution.responsavel)
      .replace('{SETOR}', execution.setor)
      .replace('{ITENS_OK}', execution.itens_ok.toString())
      .replace('{ITENS_PROBLEMA}', execution.itens_problema.toString())
      .replace('{TOTAL_ITENS}', execution.total_itens.toString())
      .replace('{TEMPO_EXECUCAO}', execution.tempo_execucao.toString())
      .replace('{OBSERVACOES}', observacoes)

    let success = 0
    let failed = 0

    // Enviar para cada nÃºmero com delay para nÃ£o sobrecarregar
    for (const phoneNumber of phoneNumbers) {
      const sent = await this.sendMessage(phoneNumber, message)
      
      if (sent) {
        success++
      } else {
        failed++
      }
      
      // Delay de 1 segundo entre envios
      if (phoneNumbers.indexOf(phoneNumber) < phoneNumbers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { success, failed }
  }

  // =====================================================
  // ðŸ§ª TESTE DE CONEXÃƒO
  // =====================================================
  
  static async testConnection(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/whatsapp/send?to=${phoneNumber}`)
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Erro no teste de conexÃ£o WhatsApp:', error)
      return false
    }
  }

  // =====================================================
  // ðŸ”§ FUNÃ‡Ã•ES AUXILIARES
  // =====================================================
  
  private static formatPrioridade(prioridade: string): string {
    const prioridades: Record<string, string> = {
      'baixa': 'ðŸŸ¢ Baixa',
      'media': 'ðŸŸ¡ MÃ©dia',
      'alta': 'ðŸŸ  Alta',
      'critica': 'ðŸ”´ CrÃ­tica'
    }
    return prioridades[prioridade] || prioridade
  }

  private static formatNivelUrgencia(nivel: string): string {
    const niveis: Record<string, string> = {
      'baixo': 'ðŸ”µ BAIXO',
      'medio': 'ðŸŸ¡ MÃ‰DIO',
      'alto': 'ðŸŸ  ALTO',
      'critico': 'ðŸ”´ CRÃTICO'
    }
    return niveis[nivel] || nivel.toUpperCase()
  }

  private static formatTempoAtraso(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} minutos`
    }
    
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    
    if (mins === 0) {
      return `${horas} hora${horas > 1 ? 's' : ''}`
    }
    
    return `${horas}h ${mins}min`
  }

  private static formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'completed': 'âœ… ConcluÃ­do',
      'completed_with_issues': 'âš ï¸ ConcluÃ­do com Problemas',
      'partial': 'ðŸ”¶ Parcialmente ConcluÃ­do',
      'failed': 'âŒ Falhou'
    }
    return statusMap[status] || status
  }

  private static generateResultSummary(execution: ChecklistExecution): string {
    const total = execution.total_itens
    const ok = execution.itens_ok
    const problemas = execution.itens_problema
    const percentualOk = total > 0 ? Math.round((ok / total) * 100) : 0

    let summary = `ðŸ“Š *${percentualOk}% ConcluÃ­do*\n`
    summary += `â€¢ âœ… ${ok} itens OK\n`
    
    if (problemas > 0) {
      summary += `â€¢ âŒ ${problemas} problemas\n`
    }
    
    summary += `â€¢ ðŸ“‹ ${total} itens total`

    // Adicionar emoji baseado na performance
    if (percentualOk >= 95) {
      summary += '\n\nðŸŽ‰ Excelente trabalho!'
    } else if (percentualOk >= 80) {
      summary += '\n\nðŸ‘ Bom trabalho!'
    } else if (percentualOk >= 60) {
      summary += '\n\nâš ï¸ Precisa melhorar'
    } else {
      summary += '\n\nðŸš¨ AtenÃ§Ã£o necessÃ¡ria'
    }

    return summary
  }

  // =====================================================
  // ðŸ“ TEMPLATES CUSTOMIZADOS
  // =====================================================
  
  static setCustomTemplates(customTemplates: Partial<WhatsAppMessageTemplates>): void {
    this.templates = { ...this.templates, ...customTemplates }
  }

  static getTemplates(): WhatsAppMessageTemplates {
    return { ...this.templates }
  }

  // =====================================================
  // ðŸ“Š ESTATÃSTICAS DE ENVIO
  // =====================================================
  
  static async getMessageStats(userId: string): Promise<{
    total: number
    sent: number
    failed: number
    lastSent?: string
  }> {
    try {
      const response = await fetch(`/api/whatsapp/stats?user_id=${userId}`)
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erro ao buscar estatÃ­sticas WhatsApp:', error)
      return { total: 0, sent: 0, failed: 0 }
    }
  }

  // =====================================================
  // ðŸ”„ PROCESSAMENTO DE LEMBRETES AUTOMÃTICOS
  // =====================================================
  
  static async processScheduledReminders(): Promise<void> {
    try {
      await fetch('/api/whatsapp/process-reminders', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Erro ao processar lembretes automÃ¡ticos:', error)
    }
  }

  // =====================================================
  // ðŸ“± VALIDAÃ‡ÃƒO DE NÃšMERO
  // =====================================================
  
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove tudo que nÃ£o Ã© nÃºmero
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Verifica se tem pelo menos 10 dÃ­gitos (considerando nÃºmeros brasileiros)
    if (cleaned.length < 10) return false
    
    // Se comeÃ§ar com 55 (cÃ³digo do Brasil), deve ter 13 dÃ­gitos
    if (cleaned.startsWith('55') && cleaned.length !== 13) return false
    
    // Se nÃ£o comeÃ§ar com 55, deve ter 11 dÃ­gitos (com DDD)
    if (!cleaned.startsWith('55') && cleaned.length !== 11) return false
    
    return true
  }

  static formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Se nÃ£o comeÃ§ar com 55, adiciona
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`
    }
    
    return cleaned
  }
}

// =====================================================
// ðŸŽ¯ HOOK PARA WHATSAPP
// =====================================================

export function useWhatsApp() {
  const sendMessage = async (to: string, message: string) => {
    return WhatsAppService.sendMessage(to, message)
  }

  const sendReminder = async (
    phoneNumber: string,
    checklistNome: string,
    horario: string,
    setor: string,
    funcionario: string,
    prioridade: string
  ) => {
    return WhatsAppService.sendReminder(
      phoneNumber, checklistNome, horario, setor, funcionario, prioridade
    )
  }

  const sendAlert = async (phoneNumber: string, alert: ChecklistAlert) => {
    return WhatsAppService.sendAlert(phoneNumber, alert)
  }

  const sendCompletion = async (phoneNumber: string, execution: ChecklistExecution) => {
    return WhatsAppService.sendCompletion(phoneNumber, execution)
  }

  const shareChecklist = async (phoneNumbers: string[], execution: ChecklistExecution) => {
    return WhatsAppService.shareChecklist(phoneNumbers, execution)
  }

  const testConnection = async (phoneNumber: string) => {
    return WhatsAppService.testConnection(phoneNumber)
  }

  const validatePhone = (phoneNumber: string) => {
    return WhatsAppService.validatePhoneNumber(phoneNumber)
  }

  const formatPhone = (phoneNumber: string) => {
    return WhatsAppService.formatPhoneNumber(phoneNumber)
  }

  return {
    sendMessage,
    sendReminder,
    sendAlert,
    sendCompletion,
    shareChecklist,
    testConnection,
    validatePhone,
    formatPhone
  }
} 
