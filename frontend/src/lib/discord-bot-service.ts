import { sgbDiscordService, DiscordEmbed } from './discord-service';
import {
  getScoreSaudeGeral,
  getDashboardExecutivo,
  getVisao360,
  getStatusChecklists,
  getPerformanceFuncionarios,
  getWhatsAppStats,
  getTempoProducao,
} from './analytics-service';

// ========================================
// 🤖 DISCORD BOT INTELIGENTE - SGB
// ========================================

export interface BotCommand {
  user: string;
  message: string;
  bar_id: number;
  timestamp: Date;
}

export interface BotResponse {
  success: boolean;
  embed?: DiscordEmbed;
  text?: string;
  error?: string;
}

interface QueryParams {
  periodo_inicio?: string;
  periodo_fim?: string;
  limite?: number;
  categoria?: string;
  status?: string;
}

interface DashboardData {
  bar_id?: number;
  mensagem?: string;
  kpis_principais?: {
    faturamento_total?: number;
    total_transacoes?: number;
    ticket_medio?: number;
  };
  maior_venda?: {
    valor?: number;
    data?: string;
    meio_pagamento?: string;
  };
  faturamento_total_dia?: number;
  score_saude?: number | { score_saude: number; status: string; fatores: any };
  estatisticas?: {
    total_checklists?: number;
    taxa_completude?: number;
    total_funcionarios?: number;
    melhor_score?: number;
    melhor_funcionario?: string;
    total_mensagens?: number;
    taxa_entrega?: number;
    taxa_leitura?: number;
    taxa_falha?: number;
    engagement?: number;
  };
  resumo?: {
    total_funcionarios?: number;
    melhor_score?: number;
    total_execucoes?: number;
    concluidos?: number;
    pendentes?: number;
    atrasados?: number;
    taxa_conclusao?: number;
  };
  visao_geral?: {
    kpis_principais?: {
      faturamento_total?: number;
      total_transacoes?: number;
    };
  };
  resumo_inteligencia?: {
    total_anomalias_ativas?: number;
    insights_criticos?: number;
    recomendacoes_altas?: number;
  };
  equipe?: {
    ranking_funcionarios?: Array<{ nome?: string }>;
    estatisticas?: {
      total_funcionarios?: number;
    };
  };
  periodo?: {
    inicio?: string;
    fim?: string;
  };
  por_tipo?: Record<string, number>;
  erro?: string;
}

// ========================================
// 🧠 PROCESSADOR DE COMANDOS INTELIGENTE
// ========================================
export class DiscordBotService {
  private readonly API_BASE = '/api/ai/query';

  /**
   * Processa comando em linguagem natural
   */
  async processCommand(command: BotCommand): Promise<BotResponse> {
    try {
      console.log(
        `🤖 Bot processando: "${command.message}" do usuário ${command.user}`
      );

      // Detectar tipo de consulta baseado na mensagem
      const queryType = this.detectQueryType(command.message);

      if (!queryType) {
        return this.createHelpResponse();
      }

      // Extrair parâmetros da mensagem
      const params: QueryParams = this.extractParameters(command.message, queryType);

      console.log(
        `🤖 Processando query: ${queryType} para bar ${command.bar_id}`
      );

      // Chamar função diretamente baseado no tipo
      let data: DashboardData;

      switch (queryType) {
        case 'score_saude_geral':
          data = await getScoreSaudeGeral(command.bar_id);
          break;

        case 'dashboard_executivo':
          data = await getDashboardExecutivo(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim
          );
          break;

        case 'visao_360':
          data = await getVisao360(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim
          );
          break;

        case 'status_checklists':
          data = await getStatusChecklists(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim
          );
          break;

        case 'performance_funcionarios':
          data = await getPerformanceFuncionarios(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim,
            params.limite
          );
          break;

        case 'whatsapp_stats':
          data = await getWhatsAppStats(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim
          );
          break;

        case 'tempo_producao':
          data = await getTempoProducao(
            command.bar_id,
            params.periodo_inicio,
            params.periodo_fim
          );
          break;

        default:
          return {
            success: false,
            error: 'Tipo de consulta não suportado',
          };
      }

      // Criar resposta formatada
      const embed = this.createEmbedResponse(queryType, data, command.message);

      return {
        success: true,
        embed,
      };
    } catch (error) {
      console.error('❌ Erro no processamento do comando:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Detecta o tipo de consulta baseado na mensagem
   */
  private detectQueryType(message: string): string | null {
    const msg = message.toLowerCase();

    // 💰 Financeiro & Faturamento
    if (msg.includes('maior faturamento') || msg.includes('maior venda')) {
      return 'maior_faturamento';
    }
    if (
      msg.includes('faturamento') &&
      (msg.includes('período') || msg.includes('periodo'))
    ) {
      return 'faturamento_periodo';
    }
    if (msg.includes('comparativo') && msg.includes('mês')) {
      return 'comparativo_mensal';
    }
    if (msg.includes('top') && msg.includes('clientes')) {
      return 'top_clientes';
    }
    if (
      msg.includes('produtos') &&
      (msg.includes('vendidos') || msg.includes('mais vendidos'))
    ) {
      return 'produtos_vendidos';
    }
    if (msg.includes('resumo') && msg.includes('dia')) {
      return 'resumo_dia';
    }
    if (msg.includes('resumo') && msg.includes('mês')) {
      return 'resumo_mes';
    }

    // ✅ Checklists & Operacional
    if (msg.includes('checklist') || msg.includes('checklists')) {
      return 'status_checklists';
    }
    if (msg.includes('performance') && msg.includes('funcionários')) {
      return 'performance_funcionarios';
    }
    if (msg.includes('qualidade')) {
      return 'qualidade_execucoes';
    }

    // 📱 WhatsApp
    if (msg.includes('whatsapp') || msg.includes('mensagens')) {
      return 'whatsapp_stats';
    }

    // 🍕 Produção
    if (
      msg.includes('tempo') &&
      (msg.includes('produção') || msg.includes('producao'))
    ) {
      return 'tempo_producao';
    }

    // 🤖 IA & Analytics
    if (msg.includes('anomalias')) {
      return 'anomalias_recentes';
    }
    if (msg.includes('insights')) {
      return 'insights_importantes';
    }
    if (msg.includes('saúde') || msg.includes('score')) {
      return 'score_saude_geral';
    }

    // 📊 Dashboards
    if (msg.includes('dashboard') || msg.includes('executivo')) {
      return 'dashboard_executivo';
    }
    if (msg.includes('visão') || msg.includes('360')) {
      return 'visao_360';
    }

    // Comandos gerais
    if (
      msg.includes('como vai') ||
      msg.includes('status') ||
      msg.includes('situação')
    ) {
      return 'dashboard_executivo';
    }

    return null;
  }

  /**
   * Extrai parâmetros da mensagem
   */
  private extractParameters(message: string, queryType: string): QueryParams {
    const params: QueryParams = {};

    // Extrair datas
    const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
    const dates = message.match(dateRegex);

    if (dates) {
      if (dates.length >= 1) params.periodo_inicio = dates[0];
      if (dates.length >= 2) params.periodo_fim = dates[1];
    }

    // Extrair números (limite)
    const numberRegex = /top\s+(\d+)|(\d+)\s+(?:primeiros|melhores|últimos)/gi;
    const numberMatch = message.match(numberRegex);
    if (numberMatch) {
      const num = parseInt(numberMatch[0].replace(/\D/g, ''));
      if (num > 0 && num <= 50) {
        params.limite = num;
      }
    }

    // Períodos relativos
    if (message.includes('ontem')) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      params.periodo_inicio = ontem.toISOString().split('T')[0];
    }

    if (message.includes('última semana')) {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      params.periodo_inicio = semanaAtras.toISOString().split('T')[0];
    }

    if (message.includes('último mês')) {
      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      params.periodo_inicio = mesAtras.toISOString().split('T')[0];
    }

    return params;
  }

  /**
   * Cria embed formatado baseado no tipo de consulta
   */
  private createEmbedResponse(
    queryType: string,
    data: DashboardData,
    originalMessage: string
  ): DiscordEmbed {
    const embed: DiscordEmbed = {
      title: `📊 ${this.getQueryTitle(queryType)}`,
      description: data.mensagem || 'Consulta realizada com sucesso',
      color: 0x00ff00,
      fields: [],
      timestamp: new Date().toISOString(),
    };

    switch (queryType) {
      case 'score_saude_geral':
        const saude = typeof data.score_saude === 'object' ? data.score_saude : { score_saude: data.score_saude || 0 };
        embed.fields = [
          {
            name: '🏥 Score de Saúde',
            value: `${this.getHealthEmoji(saude.score_saude || 0)} ${saude.score_saude || 0}/100`,
            inline: true,
          },
          {
            name: '📈 Status',
            value: typeof saude === 'object' && 'status' in saude ? saude.status : 'N/A',
            inline: true,
          },
        ];
        break;

      case 'dashboard_executivo':
        const kpis = data.kpis_principais;
        if (kpis) {
          embed.fields = [
            {
              name: '💰 Faturamento Total',
              value: `R$ ${kpis.faturamento_total?.toFixed(2) || '0.00'}`,
              inline: true,
            },
            {
              name: '🛒 Total Transações',
              value: kpis.total_transacoes?.toString() || '0',
              inline: true,
            },
            {
              name: '🎫 Ticket Médio',
              value: `R$ ${kpis.ticket_medio?.toFixed(2) || '0.00'}`,
              inline: true,
            },
          ];
        }
        break;

      case 'status_checklists': {
        const resumo = data.resumo;
        if (resumo) {
          embed.fields = [
            {
              name: '📊 Resumo Geral',
              value: `**Total:** ${resumo.total_execucoes || 0}\n**Concluídos:** ${resumo.concluidos || 0}\n**Pendentes:** ${resumo.pendentes || 0}\n**Atrasados:** ${resumo.atrasados || 0}`,
              inline: true,
            },
            {
              name: '📈 Taxa de Conclusão',
              value: `${resumo.taxa_conclusao?.toFixed(1) || '0'}%`,
              inline: true,
            },
          ];
        }
        break;
      }

      case 'whatsapp_stats': {
        const stats = data.estatisticas;
        if (stats) {
          embed.fields = [
            {
              name: '📊 Métricas',
              value: `**Total:** ${stats.total_mensagens || 0}\n**Entrega:** ${stats.taxa_entrega?.toFixed(1) || '0'}%\n**Leitura:** ${stats.taxa_leitura?.toFixed(1) || '0'}%\n**Falhas:** ${stats.taxa_falha?.toFixed(1) || '0'}%`,
              inline: true,
            },
            {
              name: '📱 Engagement',
              value: `${stats.engagement?.toFixed(1) || '0'}%`,
              inline: true,
            },
          ];
        }
        break;
      }

      case 'visao_360':
        embed.fields = [
          {
            name: '💰 Financeiro',
            value: data.visao_geral?.kpis_principais ? 
              `R$ ${data.visao_geral.kpis_principais.faturamento_total?.toFixed(2) || '0.00'} em ${data.visao_geral.kpis_principais.total_transacoes || 0} transações` : 
              'N/A',
            inline: true,
          },
          {
            name: '🧠 Inteligência',
            value: data.resumo_inteligencia ? 
              `**Anomalias:** ${data.resumo_inteligencia.total_anomalias_ativas || 0}\n**Insights Críticos:** ${data.resumo_inteligencia.insights_criticos || 0}\n**Recomendações Altas:** ${data.resumo_inteligencia.recomendacoes_altas || 0}` : 
              'N/A',
            inline: true,
          },
          {
            name: '👥 Equipe',
            value: data.equipe?.ranking_funcionarios ? 
              `**Melhor Funcionário:** ${data.equipe.ranking_funcionarios[0]?.nome || 'N/A'}\n**Total Funcionários:** ${data.equipe.estatisticas?.total_funcionarios || 0}` : 
              'N/A',
            inline: true,
          },
        ];
        break;

      default:
        embed.fields = [
          {
            name: '📊 Dados',
            value:
              JSON.stringify(data).substring(0, 1000) +
              (JSON.stringify(data).length > 1000 ? '...' : ''),
            inline: false,
          },
        ];
        break;
    }

    return embed;
  }

  /**
   * Cria resposta de ajuda
   */
  private createHelpResponse(): BotResponse {
    return {
      success: true,
      embed: {
        title: '🤖 SGB Bot - Comandos Disponíveis',
        description:
          'Use linguagem natural para consultar dados do seu estabelecimento!',
        color: 0x5865f2,
        fields: [
          {
            name: '💰 Financeiro',
            value:
              '• "Qual o maior faturamento?"\n• "Faturamento do último mês"\n• "Top 5 clientes"\n• "Resumo do dia"',
            inline: true,
          },
          {
            name: '✅ Operacional',
            value:
              '• "Status dos checklists"\n• "Performance dos funcionários"\n• "Como está a qualidade?"',
            inline: true,
          },
          {
            name: '📱 Comunicação',
            value: '• "Stats do WhatsApp"\n• "Mensagens pendentes"',
            inline: true,
          },
          {
            name: '🤖 IA & Analytics',
            value:
              '• "Score de saúde"\n• "Anomalias recentes"\n• "Dashboard executivo"\n• "Visão 360"',
            inline: true,
          },
          {
            name: '🍕 Produção',
            value: '• "Tempo de produção"\n• "Produtos mais demorados"',
            inline: true,
          },
          {
            name: '💡 Dicas',
            value:
              '• Use datas: "2024-01-15"\n• Especifique períodos: "última semana"\n• Defina limites: "top 10"',
            inline: true,
          },
        ],
        footer: { text: 'SGB Analytics • Seu assistente inteligente' },
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Emoji baseado no score de saúde
   */
  private getHealthEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 75) return '🔵';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }

  /**
   * Envia resposta para o Discord
   */
  async sendResponse(response: BotResponse): Promise<boolean> {
    try {
      if (response.embed) {
        return await sgbDiscordService.sendEmbed(response.embed);
              } else if (response.text) {
          return await DiscordService.sendMessage(response.text);
      }
      return false;
    } catch (error) {
      console.error('Erro ao enviar resposta Discord:', error);
      return false;
    }
  }

  /**
   * Obtém o título do embed baseado no tipo de consulta
   */
  private getQueryTitle(queryType: string): string {
    switch (queryType) {
      case 'maior_faturamento':
        return 'Maior Faturamento';
      case 'faturamento_periodo':
        return 'Faturamento por Período';
      case 'comparativo_mensal':
        return 'Comparativo Mensal';
      case 'top_clientes':
        return 'Top Clientes';
      case 'produtos_vendidos':
        return 'Produtos Vendidos';
      case 'resumo_dia':
        return 'Resumo do Dia';
      case 'resumo_mes':
        return 'Resumo do Mês';
      case 'status_checklists':
        return 'Status dos Checklists';
      case 'performance_funcionarios':
        return 'Performance dos Funcionários';
      case 'qualidade_execucoes':
        return 'Qualidade das Execuções';
      case 'whatsapp_stats':
        return 'Estatísticas WhatsApp';
      case 'tempo_producao':
        return 'Tempo de Produção';
      case 'anomalias_recentes':
        return 'Anomalias Recentes';
      case 'insights_importantes':
        return 'Insights Importantes';
      case 'dashboard_executivo':
        return 'Dashboard Executivo';
      case 'visao_360':
        return 'Visão 360° Completa';
      default:
        return 'Resultado da Consulta';
    }
  }
}

// ========================================
// 🏭 INSTÂNCIA GLOBAL DO BOT
// ========================================
export const sgbBot = new DiscordBotService();

// ========================================
// 🎯 FUNÇÃO PRINCIPAL - PROCESSAR COMANDO
// ========================================
export async function processDiscordCommand(
  message: string,
  user: string,
  bar_id: number
): Promise<boolean> {
  try {
    const command: BotCommand = {
      message: message.trim(),
      user,
      bar_id,
      timestamp: new Date(),
    };

    console.log(`🤖 Processando comando Discord de ${user}: "${message}"`);

    const response = await sgbBot.processCommand(command);

    if (response.success) {
      return await sgbBot.sendResponse(response);
    } else {
      return await sgbBot.sendResponse({
        success: false,
        text: response.error || 'Erro desconhecido ao processar comando',
      });
    }
  } catch (error) {
    console.error('Erro ao processar comando Discord:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    // Enviar mensagem de erro
    await sgbBot.sendResponse({
      success: false,
      text: `❌ Erro interno: ${errorMessage}`,
    });

    return false;
  }
}
