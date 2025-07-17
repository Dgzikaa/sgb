import { getSupabaseClient } from '@/lib/supabase'

// 🟦 WHATSAPP NOTIFICATION SERVICE
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
  parameters: unknown[];
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

// Interfaces para dados do Supabase
interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface WhatsAppConfigData {
  phone_number_id: string;
  access_token: string;
  api_version: string;
  rate_limit_per_minute: number;
  template_prefix: string;
  idioma: string;
  bar_id: number;
  ativo: boolean;
}

interface WhatsAppContactData {
  id: number;
  bar_id: number;
  usuario_id: number;
  numero_whatsapp: string;
  nome_contato: string;
  verificado: boolean;
  aceita_notificacoes: boolean;
  aceita_lembretes: boolean;
  aceita_relatorios: boolean;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: number[];
}

interface WhatsAppTemplateData {
  name: string;
  body_text: string;
  parameters: unknown[];
  variables_count: number;
  bar_id: number;
  modulo: string;
  status: string;
}

export interface NotificacaoData {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  modulo: string;
  usuario_id: number;
  checklist_id?: number;
  checklist_execucao_id?: number;
  prioridade: string;
  status: string;
  created_at: string;
}

interface UsuarioData {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

interface WhatsAppAPIMessage {
  messaging_product: string;
  to: string;
  type: string;
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  text?: {
    body: string;
  };
}

interface WhatsAppAPIResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WhatsAppAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
  };
}

export class WhatsAppNotificationService {
  private barId: number;
  private config: WhatsAppConfig | null = null;

  constructor(barId: number) {
    this.barId = barId;
  }

  // 🛠️ CONFIGURAÇÃO E INICIALIZAÇÃO
  // ========================================

  /**
   * Inicializa o serviço carregando configurações
   */
  async initialize(): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient();
      const { data: config } = await supabase
        .from('whatsapp_configuracoes')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('ativo', true)
        .single() as SupabaseResponse<WhatsAppConfigData>;

      if (config) {
        this.config = {
          phone_number_id: config.phone_number_id,
          access_token: config.access_token,
          api_version: config.api_version,
          rate_limit_per_minute: config.rate_limit_per_minute,
          template_prefix: config.template_prefix,
          idioma: config.idioma
        };
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

  // 🟦 GERENCIAMENTO DE CONTATOS
  // ========================================

  /**
   * Busca contato WhatsApp por usuário
   */
  async getContactByUserId(usuarioId: number): Promise<WhatsAppContact | null> {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('whatsapp_contatos')
        .select<WhatsAppContactData>('*')
        .eq('bar_id', this.barId)
        .eq('usuario_id', usuarioId)
        .single();
      if (error || !data || typeof data !== 'object') return null;
      const contatoData = data as WhatsAppContactData;
      return {
        id: contatoData.id,
        numero_whatsapp: contatoData.numero_whatsapp,
        nome_contato: contatoData.nome_contato,
        aceita_notificacoes: contatoData.aceita_notificacoes,
        aceita_lembretes: contatoData.aceita_lembretes,
        aceita_relatorios: contatoData.aceita_relatorios,
        horario_inicio: contatoData.horario_inicio,
        horario_fim: contatoData.horario_fim,
        dias_semana: contatoData.dias_semana
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca contato WhatsApp por número
   */
  async getContactByPhone(numeroWhatsapp: string): Promise<WhatsAppContact | null> {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('whatsapp_contatos')
        .select<WhatsAppContactData>('*')
        .eq('bar_id', this.barId)
        .eq('numero_whatsapp', numeroWhatsapp)
        .single();
      if (error || !data || typeof data !== 'object') return null;
      const contatoData = data as WhatsAppContactData;
      return {
        id: contatoData.id,
        numero_whatsapp: contatoData.numero_whatsapp,
        nome_contato: contatoData.nome_contato,
        aceita_notificacoes: contatoData.aceita_notificacoes,
        aceita_lembretes: contatoData.aceita_lembretes,
        aceita_relatorios: contatoData.aceita_relatorios,
        horario_inicio: contatoData.horario_inicio,
        horario_fim: contatoData.horario_fim,
        dias_semana: contatoData.dias_semana
      };
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
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('whatsapp_contatos')
        .insert({
          bar_id: this.barId,
          usuario_id: usuarioId,
          numero_whatsapp: numeroWhatsapp,
          nome_contato: nomeContato,
          verificado: false
        })
        .select<WhatsAppContactData>()
        .single();
      if (error || !data || typeof data !== 'object') return null;
      const contatoData = data as WhatsAppContactData;
      return {
        id: contatoData.id,
        numero_whatsapp: contatoData.numero_whatsapp,
        nome_contato: contatoData.nome_contato,
        aceita_notificacoes: contatoData.aceita_notificacoes,
        aceita_lembretes: contatoData.aceita_lembretes,
        aceita_relatorios: contatoData.aceita_relatorios,
        horario_inicio: contatoData.horario_inicio,
        horario_fim: contatoData.horario_fim,
        dias_semana: contatoData.dias_semana
      };
    } catch (error) {
      console.error('Erro ao criar contato WhatsApp:', error);
      return null;
    }
  }

  // 🟦 GERENCIAMENTO DE TEMPLATES
  // ========================================

  /**
   * Busca template por nome
   */
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const supabase = await getSupabaseClient();
      const { data: template, error } = await supabase
        .from('whatsapp_templates')
        .select<WhatsAppTemplateData>('*')
        .eq('bar_id', this.barId)
        .eq('name', templateName)
        .eq('status', 'APPROVED')
        .single();
      if (error || !template || typeof template !== 'object') return null;
      const templateData = template as WhatsAppTemplateData;
      return {
        name: templateData.name,
        body_text: templateData.body_text,
        parameters: templateData.parameters,
        variables_count: templateData.variables_count
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Lista templates por módulo
   */
  async getTemplatesByModule(modulo: string): Promise<WhatsAppTemplate[]> {
    try {
      const supabase = await getSupabaseClient();
      const { data: templates, error } = await supabase
        .from('whatsapp_templates')
        .select<WhatsAppTemplateData>('*')
        .eq('bar_id', this.barId)
        .eq('modulo', modulo)
        .eq('status', 'APPROVED')
        .order('name');
      if (error || !Array.isArray(templates)) return [];
      return templates.filter((t): t is WhatsAppTemplateData => typeof t === 'object' && t !== null).map((template) => ({
        name: template.name,
        body_text: template.body_text,
        parameters: template.parameters,
        variables_count: template.variables_count
      }));
    } catch (error) {
      return [];
    }
  }

  // 🟦 ENVIO DE MENSAGENS
  // ========================================

  /**
   * Envia mensagem WhatsApp
   */
  async sendMessage(options: SendMessageOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.config) {
        return { success: false, error: 'WhatsApp não configurado' };
      }

      const contato = await this.getContactByPhone(options.destinatario);
      if (!contato) {
        return { success: false, error: 'Contato não encontrado' };
      }

      if (!this.canSendNotification(contato, options.modulo)) {
        return { success: false, error: 'Contato não aceita notificações' };
      }

      let mensagem: WhatsAppAPIMessage;

      if (options.template_name) {
        const template = await this.getTemplate(options.template_name);
        if (!template) {
          return { success: false, error: 'Template não encontrado' };
        }

        mensagem = {
          messaging_product: 'whatsapp',
          to: options.destinatario,
          type: 'template',
          template: {
            name: template.name,
            language: {
              code: this.config.idioma
            },
            components: options.template_parameters && options.template_parameters.length > 0 ? [
              {
                type: 'body',
                parameters: options.template_parameters.map(param => ({
                  type: 'text',
                  text: param
                }))
              }
            ] : undefined
          }
        };
      } else if (options.conteudo) {
        mensagem = {
          messaging_product: 'whatsapp',
          to: options.destinatario,
          type: 'text',
          text: {
            body: options.conteudo
          }
        };
      } else {
        return { success: false, error: 'Conteúdo ou template não especificado' };
      }

      const resultado = await this.sendToWhatsAppAPI(contato, mensagem);
      
      if (resultado.success) {
        // Registrar envio no banco
        await this.registrarEnvio(contato, options, resultado.messageId);
      }

      return {
        success: resultado.success,
        messageId: resultado.messageId,
        error: resultado.errorMessage
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return { success: false, error: 'Erro interno' };
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
    return this.sendMessage({
      destinatario,
      template_name: templateName,
      template_parameters: parameters,
      modulo: context?.modulo || 'geral',
      checklist_id: context?.checklist_id,
      checklist_execucao_id: context?.checklist_execucao_id,
      notificacao_id: context?.notificacao_id
    });
  }

  /**
   * Processa notificação para WhatsApp
   */
  async processNotificationForWhatsApp(notificacao: NotificacaoData): Promise<boolean> {
    try {
      if (!this.config) return false;
      const supabase = await getSupabaseClient();
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select<UsuarioData>('*')
        .eq('id', notificacao.usuario_id)
        .single();
      if (error || !usuario || typeof usuario !== 'object') return false;
      const usuarioData = usuario as UsuarioData;
      // Buscar contato WhatsApp
      const contato = await this.getContactByUserId(usuarioData.id);
      if (!contato) return false;
      if (!this.canSendNotification(contato, notificacao.modulo)) {
        return false;
      }
      // Selecionar template
      const templateInfo = await this.selectTemplateForNotification(notificacao);
      if (!templateInfo) return false;
      // Preparar parâmetros
      const parametros = this.prepareTemplateParameters(notificacao, usuarioData, templateInfo.template);
      // Enviar mensagem
      const resultado = await this.sendTemplateMessage(
        contato.numero_whatsapp,
        templateInfo.templateName,
        parametros,
        {
          modulo: notificacao.modulo,
          checklist_id: notificacao.checklist_id,
          checklist_execucao_id: notificacao.checklist_execucao_id,
          notificacao_id: notificacao.id
        }
      );
      return resultado.success;
    } catch (error) {
      console.error('Erro ao processar notificação WhatsApp:', error);
      return false;
    }
  }

  // 🟦 MÉTODOS PRIVADOS
  // ========================================

  /**
   * Verifica se pode enviar notificação
   */
  private canSendNotification(contato: WhatsAppContact, modulo: string): boolean {
    // Verificar se aceita notificações do módulo
    if (modulo === 'lembretes' && !contato.aceita_lembretes) return false;
    if (modulo === 'relatorios' && !contato.aceita_relatorios) return false;
    if (!contato.aceita_notificacoes) return false;

    // Verificar horário
    return this.isWithinAllowedHours(contato);
  }

  /**
   * Verifica se está dentro do horário permitido
   */
  private isWithinAllowedHours(contato: WhatsAppContact): boolean {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    
    const [horaInicio, minInicio] = contato.horario_inicio.split(':').map(Number);
    const [horaFim, minFim] = contato.horario_fim.split(':').map(Number);
    
    const inicioMinutos = horaInicio * 60 + minInicio;
    const fimMinutos = horaFim * 60 + minFim;
    
    return horaAtual >= inicioMinutos && horaAtual <= fimMinutos;
  }

  /**
   * Envia mensagem para API do WhatsApp
   */
  private async sendToWhatsAppAPI(contato: WhatsAppContact, mensagem: WhatsAppAPIMessage): Promise<{
    success: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    try {
      if (!this.config) {
        return { success: false, errorMessage: 'Configuração não encontrada' };
      }

      const url = `https://graph.facebook.com/v${this.config.api_version}/${this.config.phone_number_id}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mensagem)
      });

      const data = await response.json() as WhatsAppAPIResponse | WhatsAppAPIError;

      if (!response.ok) {
        const errorData = data as WhatsAppAPIError;
        return {
          success: false,
          errorCode: errorData.error.type,
          errorMessage: errorData.error.message
        };
      }

      const successData = data as WhatsAppAPIResponse;
      return {
        success: true,
        messageId: successData.messages?.[0]?.id
      };

    } catch (error) {
      console.error('Erro na API do WhatsApp:', error);
      return {
        success: false,
        errorMessage: 'Erro de conexão com WhatsApp'
      };
    }
  }

  /**
   * Seleciona template para notificação
   */
  private async selectTemplateForNotification(notificacao: NotificacaoData): Promise<{
    templateName: string;
    template: WhatsAppTemplate;
  } | null> {
    // Lógica para selecionar template baseado no tipo de notificação
    const templateName = `${this.config?.template_prefix || 'sgb'}_${notificacao.tipo}`;
    const template = await this.getTemplate(templateName);
    
    if (!template) return null;
    
    return { templateName, template };
  }

  /**
   * Prepara parâmetros do template
   */
  private prepareTemplateParameters(
    notificacao: NotificacaoData, 
    usuario: UsuarioData, 
    template: WhatsAppTemplate
  ): string[] {
    const parametros: string[] = [];
    
    // Adicionar parâmetros baseados no template
    if (template.variables_count > 0) {
      parametros.push(usuario.nome);
      if (template.variables_count > 1) {
        parametros.push(notificacao.titulo);
      }
      if (template.variables_count > 2) {
        parametros.push(new Date().toLocaleDateString('pt-BR'));
      }
    }
    
    return parametros;
  }

  /**
   * Registra envio no banco de dados
   */
  private async registrarEnvio(
    contato: WhatsAppContact,
    options: SendMessageOptions,
    messageId?: string
  ): Promise<void> {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('whatsapp_envios')
        .insert({
          bar_id: this.barId,
          contato_id: contato.id,
          message_id: messageId,
          template_name: options.template_name,
          modulo: options.modulo,
          checklist_id: options.checklist_id,
          checklist_execucao_id: options.checklist_execucao_id,
          notificacao_id: options.notificacao_id,
          status: 'enviado',
          created_at: new Date().toISOString()
        });
      if (error) {
        console.error('Erro ao registrar envio:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar envio:', error);
    }
  }
}

// 🟦 FUNÇÃO DE CRIAÇÃO DO SERVIÇO
// ========================================

export async function createWhatsAppService(barId: number): Promise<WhatsAppNotificationService | null> {
  const service = new WhatsAppNotificationService(barId);
  const initialized = await service.initialize();
  return initialized ? service : null;
}

// 🟦 INTERFACES PARA CHECKLIST ALERTS
// ========================================

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

// 🟦 SERVIÇO WHATSAPP LEGADO (MANTIDO PARA COMPATIBILIDADE)
// ========================================

export class WhatsAppService {
  private static templates: WhatsAppMessageTemplates = {
    reminder: `🔔 *LEMBRETE DE CHECKLIST*

📋 *{checklist}*
⏰ *Horário:* {horario}
🏢 *Setor:* {setor}
👤 *Responsável:* {funcionario}
⚡ *Prioridade:* {prioridade}

_Por favor, execute o checklist no horário programado._

---
Sistema de Gestão de Bares (SGB)`,
    
    alert: `🚨 *ALERTA DE CHECKLIST*

⚠️ *{titulo}*
📊 *Categoria:* {categoria}
🔴 *Nível:* {nivel}
⏰ *Atraso:* {tempoAtraso}
👤 *Responsável:* {responsavel}
🏢 *Setor:* {setor}

_Checklist em atraso! Ação imediata necessária._

---
Sistema de Gestão de Bares (SGB)`,
    
    completion: `✅ *CHECKLIST CONCLUÍDO*

📋 *{titulo}*
👤 *Responsável:* {responsavel}
🏢 *Setor:* {setor}
⏱️ *Tempo de Execução:* {tempoExecucao} min
📊 *Resultado:* {resultado}
📝 *Observações:* {observacoes}

_Parabéns! Checklist executado com sucesso._

---
Sistema de Gestão de Bares (SGB)`,
    
    share: `📋 *CHECKLIST COMPARTILHADO*

{execucao}

_Checklist compartilhado via WhatsApp._

---
Sistema de Gestão de Bares (SGB)`
  };

  static sendMessage(to: string, message: string): Promise<boolean> {
    try {
      // Implementação básica - pode ser expandida
      console.log(`Enviando mensagem para ${to}: ${message}`);
      return Promise.resolve(true); // Simula sucesso
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return Promise.resolve(false);
    }
  }

  static async sendReminder(
    phoneNumber: string,
    checklistNome: string,
    horario: string,
    setor: string,
    funcionario: string,
    prioridade: string
  ): Promise<boolean> {
    try {
      const message = this.templates.reminder
        .replace('{checklist}', checklistNome)
        .replace('{horario}', horario)
        .replace('{setor}', setor)
        .replace('{funcionario}', funcionario)
        .replace('{prioridade}', this.formatPrioridade(prioridade));

      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      return false;
    }
  }

  static async sendAlert(phoneNumber: string, alert: ChecklistAlert): Promise<boolean> {
    try {
      const message = this.templates.alert
        .replace('{titulo}', alert.titulo)
        .replace('{categoria}', alert.categoria)
        .replace('{nivel}', this.formatNivelUrgencia(alert.nivel))
        .replace('{tempoAtraso}', this.formatTempoAtraso(alert.tempoAtraso))
        .replace('{responsavel}', alert.responsavel || 'Não definido')
        .replace('{setor}', alert.setor || 'Não definido');

      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
      return false;
    }
  }

  static async sendCompletion(
    phoneNumber: string,
    execution: ChecklistExecution
  ): Promise<boolean> {
    try {
      const resultado = this.generateResultSummary(execution);
      const observacoes = execution.observacoes_gerais || 'Nenhuma observação';

      const message = this.templates.completion
        .replace('{titulo}', execution.titulo)
        .replace('{responsavel}', execution.responsavel)
        .replace('{setor}', execution.setor)
        .replace('{tempoExecucao}', execution.tempo_execucao.toString())
        .replace('{resultado}', resultado)
        .replace('{observacoes}', observacoes);

      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Erro ao enviar conclusão:', error);
      return false;
    }
  }

  static async shareChecklist(
    phoneNumbers: string[],
    execution: ChecklistExecution
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const message = this.templates.share.replace('{execucao}', this.generateResultSummary(execution));

    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendMessage(phoneNumber, message);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Erro ao compartilhar com ${phoneNumber}:`, error);
      }
    }

    return { success, failed };
  }

  static async testConnection(phoneNumber: string): Promise<boolean> {
    try {
      const testMessage = "🔧 *TESTE DE CONEXÃO*\n\n_Conexão WhatsApp funcionando corretamente._\n\n---\nSistema de Gestão de Bares (SGB)";
      return await this.sendMessage(phoneNumber, testMessage);
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return false;
    }
  }

  // 🟦 MÉTODOS AUXILIARES
  // ========================================

  private static formatPrioridade(prioridade: string): string {
    const prioridades: Record<string, string> = {
      'baixa': '🟢 Baixa',
      'normal': '🟡 Normal',
      'alta': '🔴 Alta',
      'urgente': '🚨 Urgente'
    };
    return prioridades[prioridade.toLowerCase()] || '🟡 Normal';
  }

  private static formatNivelUrgencia(nivel: string): string {
    const niveis: Record<string, string> = {
      'baixo': '🟢 Baixo',
      'medio': '🟡 Médio',
      'alto': '🔴 Alto',
      'critico': '🚨 Crítico'
    };
    return niveis[nivel.toLowerCase()] || '🟡 Médio';
  }

  private static formatTempoAtraso(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    } else if (minutos < 1440) {
      const horas = Math.floor(minutos / 60);
      return `${horas}h ${minutos % 60}min`;
    } else {
      const dias = Math.floor(minutos / 1440);
      const horas = Math.floor((minutos % 1440) / 60);
      return `${dias}d ${horas}h`;
    }
  }

  private static formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'concluido': '✅ Concluído',
      'pendente': '⏳ Pendente',
      'atrasado': '🚨 Atrasado',
      'cancelado': '❌ Cancelado'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  private static generateResultSummary(execution: ChecklistExecution): string {
    const percentual = Math.round((execution.itens_ok / execution.total_itens) * 100);
    const status = this.formatStatus(execution.status);
    
    return `📋 *${execution.titulo}*
👤 *Responsável:* ${execution.responsavel}
🏢 *Setor:* ${execution.setor}
⏱️ *Tempo:* ${execution.tempo_execucao} min
📊 *Resultado:* ${execution.itens_ok}/${execution.total_itens} (${percentual}%)
✅ *Status:* ${status}
📅 *Concluído em:* ${new Date(execution.concluido_em).toLocaleString('pt-BR')}`;
  }

  // 🟦 CONFIGURAÇÃO DE TEMPLATES
  // ========================================

  static setCustomTemplates(customTemplates: Partial<WhatsAppMessageTemplates>): void {
    this.templates = { ...this.templates, ...customTemplates };
  }

  static getTemplates(): WhatsAppMessageTemplates {
    return { ...this.templates };
  }

  // 🟦 ESTATÍSTICAS E MÉTRICAS
  // ========================================

  static getMessageStats(userId: string): Promise<{
    total: number
    sent: number
    failed: number
    lastSent?: string
  }> {
    try {
      // Implementação básica - pode ser expandida com dados reais
      return Promise.resolve({
        total: 0,
        sent: 0,
        failed: 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return Promise.resolve({ total: 0, sent: 0, failed: 0 });
    }
  }

  static processScheduledReminders(): Promise<void> {
    try {
      // Implementação para processar lembretes agendados
      console.log('Processando lembretes agendados...');
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
      return Promise.resolve();
    }
  }

  // 🟦 VALIDAÇÃO E FORMATAÇÃO
  // ========================================

  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove todos os caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 15 dígitos (incluindo código do país)
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return false;
    }
    
    // Verifica se começa com código de país válido
    const validCountryCodes = ['55', '1', '44', '33', '49', '39', '34', '81', '86', '91'];
    const countryCode = cleanNumber.substring(0, 2);
    
    return validCountryCodes.includes(countryCode);
  }

  static formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Se não tem código do país, adiciona +55 (Brasil)
    if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
      return `+55${cleanNumber.substring(1)}`;
    }
    
    if (cleanNumber.length === 10) {
      return `+55${cleanNumber}`;
    }
    
    if (cleanNumber.length === 11 && !cleanNumber.startsWith('0')) {
      return `+55${cleanNumber}`;
    }
    
    // Se já tem código do país
    if (cleanNumber.length >= 12) {
      return `+${cleanNumber}`;
    }
    
    return phoneNumber; // Retorna original se não conseguir formatar
  }
}

// 🟦 HOOK PARA USO NO REACT
// ========================================

export function useWhatsApp() {
  const sendMessage = async (to: string, message: string) => {
    return await WhatsAppService.sendMessage(to, message);
  };

  const sendReminder = async (
    phoneNumber: string,
    checklistNome: string,
    horario: string,
    setor: string,
    funcionario: string,
    prioridade: string
  ) => {
    return await WhatsAppService.sendReminder(
      phoneNumber,
      checklistNome,
      horario,
      setor,
      funcionario,
      prioridade
    );
  };

  const sendAlert = async (phoneNumber: string, alert: ChecklistAlert) => {
    return await WhatsAppService.sendAlert(phoneNumber, alert);
  };

  const sendCompletion = async (phoneNumber: string, execution: ChecklistExecution) => {
    return await WhatsAppService.sendCompletion(phoneNumber, execution);
  };

  const shareChecklist = async (phoneNumbers: string[], execution: ChecklistExecution) => {
    return await WhatsAppService.shareChecklist(phoneNumbers, execution);
  };

  const testConnection = async (phoneNumber: string) => {
    return await WhatsAppService.testConnection(phoneNumber);
  };

  const validatePhone = (phoneNumber: string) => {
    return WhatsAppService.validatePhoneNumber(phoneNumber);
  };

  const formatPhone = (phoneNumber: string) => {
    return WhatsAppService.formatPhoneNumber(phoneNumber);
  };

  return {
    sendMessage,
    sendReminder,
    sendAlert,
    sendCompletion,
    shareChecklist,
    testConnection,
    validatePhone,
    formatPhone
  };
} 

