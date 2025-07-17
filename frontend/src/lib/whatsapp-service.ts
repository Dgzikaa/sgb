import { getSupabaseClient } from '@/lib/supabase'

// ========================================
// üì± WHATSAPP NOTIFICATION SERVICE
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
  parameters[];
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
  // üîß CONFIGURA·á·ÉO E INICIALIZA·á·ÉO
  // ========================================

  /**
   * Inicializa o servi·ßo carregando configura·ß·µes
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
   * Verifica se WhatsApp est·° ativo
   */
  isActive(): boolean {
    return this.config !== null;
  }

  // ========================================
  // üìû GERENCIAMENTO DE CONTATOS
  // ========================================

  /**
   * Busca contato WhatsApp por usu·°rio
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
   * Busca contato WhatsApp por n·∫mero
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
  // üìù GERENCIAMENTO DE TEMPLATES
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
   * Lista templates por m·≥dulo
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
  // üí¨ ENVIO DE MENSAGENS
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
      return { success: false, error: 'WhatsApp n·£o configurado' };
    }

    try {
      // Buscar contato
      const contato = await this.getContactByPhone(options.destinatario);
      if (!contato) {
        return { success: false, error: 'Contato n·£o encontrado' };
      }

      // Verificar permiss·µes de notifica·ß·£o
      if (!this.canSendNotification(contato, options.modulo)) {
        return { success: false, error: 'Contato n·£o aceita este tipo de notifica·ß·£o' };
      }

      // Verificar hor·°rio permitido
      if (!this.isWithinAllowedHours(contato)) {
        return { success: false, error: 'Fora do hor·°rio permitido' };
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
      return { success: false, error: 'Erro interno do servi·ßo' };
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
      return { success: false, error: 'Template n·£o encontrado' };
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
  // üîó INTEGRA·á·ÉO COM NOTIFICA·á·ïES
  // ========================================

  /**
   * Processa notifica·ß·£o para envio via WhatsApp
   */
  async processNotificationForWhatsApp(notificacao): Promise<boolean> {
    if (!this.isActive()) {
      return false;
    }

    try {
      // Buscar dados do usu·°rio destinat·°rio
      const supabase = await getSupabaseClient()
      const { data: usuario } = await supabase
        .from('usuarios_bar')
        .select('id, nome')
        .eq('id', notificacao.usuario_id)
        .single();

      if (!usuario) {
        return false;
      }

      // Buscar contato WhatsApp do usu·°rio
      const contato = await this.getContactByUserId(usuario.id);
      if (!contato) {
        return false;
      }

      // Determinar template baseado no tipo de notifica·ß·£o
      const templateResult = await this.selectTemplateForNotification(notificacao);
      
      if (!templateResult) {
        return false;
      }

      // Preparar par·¢metros do template
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
      console.error('Erro ao processar notifica·ß·£o para WhatsApp:', error);
      return false;
    }
  }

  // ========================================
  // üîß M·âTODOS PRIVADOS
  // ========================================

  /**
   * Verifica se pode enviar notifica·ß·£o
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
   * Verifica hor·°rio permitido
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
  private async sendToWhatsAppAPI(contato: WhatsAppContact, mensagem): Promise<{
    success: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (!this.config) {
      return { success: false, errorMessage: 'Configura·ß·£o n·£o encontrada' };
    }

    try {
      const url = `https://graph.facebook.com/${this.config.api_version}/${this.config.phone_number_id}/messages`;
      
      let payload = {
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
        errorMessage: 'Erro de conex·£o com WhatsApp API'
      };
    }
  }

  /**
   * Seleciona template baseado na notifica·ß·£o
   */
  private async selectTemplateForNotification(notificacao): Promise<{
    templateName: string;
    template: WhatsAppTemplate;
  } | null> {
    const moduleTemplates = await this.getTemplatesByModule(notificacao.modulo);
    
    // Mapear tipos de notifica·ß·£o para templates
    const templateMap: { [key: string]: string } = {
      'lembrete_agendamento': 'sgb_lembrete_checklist',
      'checklist_atrasado': 'sgb_checklist_atrasado',
      'checklist_concluido': 'sgb_checklist_concluido'
    };

    const templateName = templateMap[notificacao.tipo] || 'sgb_lembrete_checklist';
    const template = moduleTemplates.find((t) => t.name === templateName);

    if (!template) {
      return null;
    }

    return { templateName, template };
  }

  /**
   * Prepara par·¢metros do template
   */
  private prepareTemplateParameters(
    notificacao, 
    usuario, 
    template: WhatsAppTemplate
  ): string[] {
    const params: string[] = [];
    
    // Par·¢metros padr·£o baseados no tipo de notifica·ß·£o
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
          '95', // pontua·ß·£o
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
        break;
    }

    return params.slice(0, template.variables_count);
  }
}

// ========================================
// üöÄ FACTORY FUNCTION
// ========================================

/**
 * Cria inst·¢ncia do WhatsApp Service
 */
export async function createWhatsAppService(barId: number): Promise<WhatsAppNotificationService | null> {
  const service = new WhatsAppNotificationService(barId);
  const initialized = await service.initialize();
  
  return initialized ? service : null;
} 

// =====================================================
// üì± SERVI·áO WHATSAPP - LEMBRETES E COMPARTILHAMENTO
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
// üîî SISTEMA DE LEMBRETES AUTOM·ÅTICOS
// =====================================================

export class WhatsAppService {
  
  // Templates padr·£o de mensagens
  private static templates: WhatsAppMessageTemplates = {
    reminder: `üîî *Lembrete SGB*

Ol·° {FUNCIONARIO}! Voc·™ tem um checklist pendente:

üìã *{CHECKLIST_NOME}*
è∞ Hor·°rio: {HORARIO}
üìç Setor: {SETOR}
ö° Prioridade: {PRIORIDADE}

Por favor, execute o checklist no hor·°rio programado.

_Sistema de Gest·£o de Bares_`,

    alert: `üö® *ALERTA - Checklist Atrasado*

ö†Ô∏è O checklist est·° atrasado!

üìã *{CHECKLIST_NOME}*
üë§ Respons·°vel: {FUNCIONARIO}
è∞ Era para: {HORARIO}
è±Ô∏è Atraso: {TEMPO_ATRASO}
üéØ N·≠vel: {NIVEL_URGENCIA}

Por favor, execute URGENTEMENTE!

_Sistema de Gest·£o de Bares_`,

    completion: `úÖ *Checklist Conclu·≠do*

üìã *{CHECKLIST_NOME}*
üë§ Respons·°vel: {FUNCIONARIO}
üìç Setor: {SETOR}
è±Ô∏è Tempo: {TEMPO_EXECUCAO}min
üìä Status: {STATUS}

{RESUMO_RESULTADOS}

_Sistema de Gest·£o de Bares_`,

    share: `üìã *Relat·≥rio de Checklist*

úÖ *{CHECKLIST_NOME}*
üìÖ Data: {DATA}
üë§ Respons·°vel: {FUNCIONARIO}
üìç Setor: {SETOR}

üìä *Resultados:*
Ä¢ úÖ Itens OK: {ITENS_OK}
Ä¢ ùå Problemas: {ITENS_PROBLEMA}
Ä¢ üìä Total: {TOTAL_ITENS}
Ä¢ è±Ô∏è Tempo: {TEMPO_EXECUCAO}min

{OBSERVACOES}

_Sistema de Gest·£o de Bares_`
  }

  // =====================================================
  // üì§ ENVIAR MENSAGEM
  // =====================================================
  
  static async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: to.replace(/\D/g, ''), // Remove tudo que n·£o ·© n·∫mero
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
  // üîî LEMBRETE DE CHECKLIST
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
  // üö® ALERTA DE ATRASO
  // =====================================================
  
  static async sendAlert(phoneNumber: string, alert: ChecklistAlert): Promise<boolean> {
    
    const tempoAtraso = this.formatTempoAtraso(alert.tempoAtraso)
    const nivelUrgencia = this.formatNivelUrgencia(alert.nivel)
    
    const message = this.templates.alert
      .replace('{CHECKLIST_NOME}', alert.titulo)
      .replace('{FUNCIONARIO}', alert.responsavel || 'Respons·°vel')
      .replace('{HORARIO}', alert.horaEsperada)
      .replace('{TEMPO_ATRASO}', tempoAtraso)
      .replace('{NIVEL_URGENCIA}', nivelUrgencia)

    return this.sendMessage(phoneNumber, message)
  }

  // =====================================================
  // úÖ CONFIRMA·á·ÉO DE CONCLUS·ÉO
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
  // üì§ COMPARTILHAR CHECKLIST
  // =====================================================
  
  static async shareChecklist(
    phoneNumbers: string[],
    execution: ChecklistExecution
  ): Promise<{ success: number; failed: number }> {
    
    const data = new Date(execution.concluido_em).toLocaleDateString('pt-BR')
    const observacoes = execution.observacoes_gerais 
      ? `üí¨ *Observa·ß·µes:*\n${execution.observacoes_gerais}`
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

    // Enviar para cada n·∫mero com delay para n·£o sobrecarregar
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
  // üß™ TESTE DE CONEX·ÉO
  // =====================================================
  
  static async testConnection(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/whatsapp/send?to=${phoneNumber}`)
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Erro no teste de conex·£o WhatsApp:', error)
      return false
    }
  }

  // =====================================================
  // üîß FUN·á·ïES AUXILIARES
  // =====================================================
  
  private static formatPrioridade(prioridade: string): string {
    const prioridades: Record<string, string> = {
      'baixa': 'üü¢ Baixa',
      'media': 'üü° M·©dia',
      'alta': 'üü† Alta',
      'critica': 'üî¥ Cr·≠tica'
    }
    return prioridades[prioridade] || prioridade
  }

  private static formatNivelUrgencia(nivel: string): string {
    const niveis: Record<string, string> = {
      'baixo': 'üîµ BAIXO',
      'medio': 'üü° M·âDIO',
      'alto': 'üü† ALTO',
      'critico': 'üî¥ CR·çTICO'
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
      'completed': 'úÖ Conclu·≠do',
      'completed_with_issues': 'ö†Ô∏è Conclu·≠do com Problemas',
      'partial': 'üî∂ Parcialmente Conclu·≠do',
      'failed': 'ùå Falhou'
    }
    return statusMap[status] || status
  }

  private static generateResultSummary(execution: ChecklistExecution): string {
    const total = execution.total_itens
    const ok = execution.itens_ok
    const problemas = execution.itens_problema
    const percentualOk = total > 0 ? Math.round((ok / total) * 100) : 0

    let summary = `üìä *${percentualOk}% Conclu·≠do*\n`
    summary += `Ä¢ úÖ ${ok} itens OK\n`
    
    if (problemas > 0) {
      summary += `Ä¢ ùå ${problemas} problemas\n`
    }
    
    summary += `Ä¢ üìã ${total} itens total`

    // Adicionar emoji baseado na performance
    if (percentualOk >= 95) {
      summary += '\n\nüéâ Excelente trabalho!'
    } else if (percentualOk >= 80) {
      summary += '\n\nüëç Bom trabalho!'
    } else if (percentualOk >= 60) {
      summary += '\n\nö†Ô∏è Precisa melhorar'
    } else {
      summary += '\n\nüö® Aten·ß·£o necess·°ria'
    }

    return summary
  }

  // =====================================================
  // üìù TEMPLATES CUSTOMIZADOS
  // =====================================================
  
  static setCustomTemplates(customTemplates: Partial<WhatsAppMessageTemplates>): void {
    this.templates = { ...this.templates, ...customTemplates }
  }

  static getTemplates(): WhatsAppMessageTemplates {
    return { ...this.templates }
  }

  // =====================================================
  // üìä ESTAT·çSTICAS DE ENVIO
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
      console.error('Erro ao buscar estat·≠sticas WhatsApp:', error)
      return { total: 0, sent: 0, failed: 0 }
    }
  }

  // =====================================================
  // üîÑ PROCESSAMENTO DE LEMBRETES AUTOM·ÅTICOS
  // =====================================================
  
  static async processScheduledReminders(): Promise<void> {
    try {
      await fetch('/api/whatsapp/process-reminders', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Erro ao processar lembretes autom·°ticos:', error)
    }
  }

  // =====================================================
  // üì± VALIDA·á·ÉO DE N·öMERO
  // =====================================================
  
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove tudo que n·£o ·© n·∫mero
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Verifica se tem pelo menos 10 d·≠gitos (considerando n·∫meros brasileiros)
    if (cleaned.length < 10) return false
    
    // Se come·ßar com 55 (c·≥digo do Brasil), deve ter 13 d·≠gitos
    if (cleaned.startsWith('55') && cleaned.length !== 13) return false
    
    // Se n·£o come·ßar com 55, deve ter 11 d·≠gitos (com DDD)
    if (!cleaned.startsWith('55') && cleaned.length !== 11) return false
    
    return true
  }

  static formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Se n·£o come·ßar com 55, adiciona
    if (!cleaned.startsWith('55')) {
      return `55${cleaned}`
    }
    
    return cleaned
  }
}

// =====================================================
// üéØ HOOK PARA WHATSAPP
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
