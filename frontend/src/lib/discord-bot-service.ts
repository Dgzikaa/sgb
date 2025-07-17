import { sgbDiscordService, DiscordEmbed } from './discord-service';
import { 
  getScoreSaudeGeral,
  getDashboardExecutivo,
  getVisao360,
  getStatusChecklists,
  getPerformanceFuncionarios,
  getWhatsAppStats,
  getTempoProducao
} from './analytics-service';

// ========================================
// ü§ñ DISCORD BOT INTELIGENTE - SGB
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

// ========================================
// üß† PROCESSADOR DE COMANDOS INTELIGENTE
// ========================================
export class DiscordBotService {
  private readonly API_BASE = '/api/ai/query';

  /**
   * Processa comando em linguagem natural
   */
  async processCommand(command: BotCommand): Promise<BotResponse> {
    try {
      console.log(`ü§ñ Bot processando: "${command.message}" do usu·°rio ${command.user}`);

      // Detectar tipo de consulta baseado na mensagem
      const queryType = this.detectQueryType(command.message);
      
      if (!queryType) {
        return this.createHelpResponse();
      }

      // Extrair par·¢metros da mensagem
      const params = this.extractParameters(command.message, queryType);

      console.log(`ü§ñ Processando query: ${queryType} para bar ${command.bar_id}`);

      // Chamar fun·ß·£o diretamente baseado no tipo
      let data;
      
      switch (queryType) {
        case 'score_saude_geral':
          data = await getScoreSaudeGeral(command.bar_id);
          break;
          
        case 'dashboard_executivo':
          data = await getDashboardExecutivo(command.bar_id, params.periodo_inicio, params.periodo_fim);
          break;
          
        case 'visao_360':
          data = await getVisao360(command.bar_id, params.periodo_inicio, params.periodo_fim);
          break;
          
        case 'status_checklists':
          data = await getStatusChecklists(command.bar_id, params.periodo_inicio, params.periodo_fim);
          break;
          
        case 'performance_funcionarios':
          data = await getPerformanceFuncionarios(command.bar_id, params.periodo_inicio, params.periodo_fim, params.limite);
          break;
          
        case 'whatsapp_stats':
          data = await getWhatsAppStats(command.bar_id, params.periodo_inicio, params.periodo_fim);
          break;
          
        case 'tempo_producao':
          data = await getTempoProducao(command.bar_id, params.periodo_inicio, params.periodo_fim);
          break;
          
        default:
          // Para outros tipos, usar a API
          try {
            const response = await fetch(`http://localhost:3001/api/ai/query`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query_type: queryType,
                bar_id: command.bar_id,
                ...params
              })
            });
            
            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
            }
            
            const apiResult = await response.json();
            if (!apiResult.success) {
              throw new Error(apiResult.error || 'Erro na API');
            }
            
            data = apiResult.data;
                     } catch (error) {
             const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
             throw new Error(`Falha na consulta: ${errorMsg}`);
           }
      }

      // Criar resposta formatada
      const embed = this.createEmbedResponse(queryType, data, command.message);
      
      return {
        success: true,
        embed
      };

    } catch (error) {
      console.error('Erro ao processar comando:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        error: errorMessage,
        text: `ùå Erro ao processar seu comando: ${errorMessage}`
      };
    }
  }

  /**
   * Detecta o tipo de consulta baseado na mensagem
   */
  private detectQueryType(message: string): string | null {
    const msg = message.toLowerCase();

    // üí∞ Financeiro & Faturamento
    if (msg.includes('maior faturamento') || msg.includes('maior venda')) {
      return 'maior_faturamento';
    }
    if (msg.includes('faturamento') && (msg.includes('per·≠odo') || msg.includes('periodo'))) {
      return 'faturamento_periodo';
    }
    if (msg.includes('comparativo') && msg.includes('m·™s')) {
      return 'comparativo_mensal';
    }
    if (msg.includes('top') && msg.includes('clientes')) {
      return 'top_clientes';
    }
    if (msg.includes('produtos') && (msg.includes('vendidos') || msg.includes('mais vendidos'))) {
      return 'produtos_vendidos';
    }
    if (msg.includes('resumo') && msg.includes('dia')) {
      return 'resumo_dia';
    }
    if (msg.includes('resumo') && msg.includes('m·™s')) {
      return 'resumo_mes';
    }

    // úÖ Checklists & Operacional
    if (msg.includes('checklist') || msg.includes('checklists')) {
      return 'status_checklists';
    }
    if (msg.includes('performance') && msg.includes('funcion·°rios')) {
      return 'performance_funcionarios';
    }
    if (msg.includes('qualidade')) {
      return 'qualidade_execucoes';
    }

    // üì± WhatsApp
    if (msg.includes('whatsapp') || msg.includes('mensagens')) {
      return 'whatsapp_stats';
    }

    // üçï Produ·ß·£o
    if (msg.includes('tempo') && (msg.includes('produ·ß·£o') || msg.includes('producao'))) {
      return 'tempo_producao';
    }

    // ü§ñ IA & Analytics
    if (msg.includes('anomalias')) {
      return 'anomalias_recentes';
    }
    if (msg.includes('insights')) {
      return 'insights_importantes';
    }
    if (msg.includes('sa·∫de') || msg.includes('score')) {
      return 'score_saude_geral';
    }

    // üìä Dashboards
    if (msg.includes('dashboard') || msg.includes('executivo')) {
      return 'dashboard_executivo';
    }
    if (msg.includes('vis·£o') || msg.includes('360')) {
      return 'visao_360';
    }

    // Comandos gerais
    if (msg.includes('como vai') || msg.includes('status') || msg.includes('situa·ß·£o')) {
      return 'dashboard_executivo';
    }

    return null;
  }

  /**
   * Extrai par·¢metros da mensagem
   */
  private extractParameters(message: string, queryType: string): any {
    const params = {};

    // Extrair datas
    const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
    const dates = message.match(dateRegex);
    
    if (dates) {
      if (dates.length >= 1) params.periodo_inicio = dates[0];
      if (dates.length >= 2) params.periodo_fim = dates[1];
    }

    // Extrair n·∫meros (limite)
    const numberRegex = /top\s+(\d+)|(\d+)\s+(?:primeiros|melhores|·∫ltimos)/gi;
    const numberMatch = message.match(numberRegex);
    if (numberMatch) {
      const num = parseInt(numberMatch[0].replace(/\D/g, ''));
      if (num > 0 && num <= 50) {
        params.limite = num;
      }
    }

    // Per·≠odos relativos
    if (message.includes('ontem')) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      params.periodo_inicio = ontem.toISOString().split('T')[0];
    }
    
    if (message.includes('·∫ltima semana')) {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      params.periodo_inicio = semanaAtras.toISOString().split('T')[0];
    }

    if (message.includes('·∫ltimo m·™s')) {
      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      params.periodo_inicio = mesAtras.toISOString().split('T')[0];
    }

    return params;
  }

  /**
   * Cria embed formatado baseado no tipo de consulta
   */
  private createEmbedResponse(queryType: string, data, originalMessage: string): DiscordEmbed {
    const timestamp = new Date().toISOString();

    switch (queryType) {
      case 'maior_faturamento':
        return {
          title: 'üí∞ Maior Faturamento',
          description: data.mensagem,
          color: 0x00D084,
          fields: [
            {
              name: 'üèÜ Maior Venda Individual',
              value: `**R$ ${data.maior_venda?.valor?.toFixed(2)}**\nData: ${new Date(data.maior_venda?.data).toLocaleDateString('pt-BR')}\nMeio: ${data.maior_venda?.meio_pagamento || 'N/A'}`,
              inline: true
            },
            {
              name: 'üìä Faturamento Total do Dia',
              value: `**R$ ${data.faturamento_total_dia?.toFixed(2)}**`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ Consulta de faturamento' },
          timestamp
        };

      case 'dashboard_executivo':
        const kpis = data.kpis_principais;
        const saude = data.score_saude;
        return {
          title: 'üìä Dashboard Executivo',
          description: data.mensagem,
          color: saude.score_saude >= 80 ? 0x00D084 : saude.score_saude >= 60 ? 0xF59E0B : 0xEF4444,
          fields: [
            {
              name: 'üí∞ Financeiro',
              value: `**Faturamento:** R$ ${kpis.faturamento_total?.toFixed(2)}\n**Transa·ß·µes:** ${kpis.total_transacoes}\n**Ticket M·©dio:** R$ ${kpis.ticket_medio?.toFixed(2)}`,
              inline: true
            },
            {
              name: 'úÖ Operacional',
              value: `**Checklists:** ${kpis.taxa_conclusao_checklists?.toFixed(1)}%\n**WhatsApp:** ${kpis.engagement_whatsapp?.toFixed(1)}%\n**Produ·ß·£o:** ${kpis.tempo_medio_producao?.toFixed(1)}min`,
              inline: true
            },
            {
              name: 'üéØ Score de Sa·∫de',
              value: `**${saude.score_saude}%** - ${saude.status.toUpperCase()}\n${this.getHealthEmoji(saude.score_saude)} ${saude.mensagem}`,
              inline: false
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ Dashboard Executivo' },
          timestamp
        };

      case 'status_checklists':
        const resumo = data.resumo;
        return {
          title: 'úÖ Status dos Checklists',
          description: data.mensagem,
          color: resumo.taxa_conclusao >= 80 ? 0x00D084 : resumo.taxa_conclusao >= 60 ? 0xF59E0B : 0xEF4444,
          fields: [
            {
              name: 'üìä Resumo Geral',
              value: `**Total:** ${resumo.total_execucoes}\n**Conclu·≠dos:** ${resumo.concluidos}\n**Pendentes:** ${resumo.pendentes}\n**Atrasados:** ${resumo.atrasados}`,
              inline: true
            },
            {
              name: 'üìà Performance',
              value: `**Taxa Conclus·£o:** ${resumo.taxa_conclusao?.toFixed(1)}%\n**Score M·©dio:** ${resumo.score_medio?.toFixed(1)}%`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ Gest·£o de Checklists' },
          timestamp
        };

      case 'whatsapp_stats':
        const stats = data.estatisticas;
        return {
          title: 'üì± Estat·≠sticas WhatsApp',
          description: data.mensagem,
          color: 0x25D366,
          fields: [
            {
              name: 'üìä M·©tricas',
              value: `**Total Mensagens:** ${stats.total_mensagens}\n**Taxa Entrega:** ${stats.taxa_entrega?.toFixed(1)}%\n**Taxa Leitura:** ${stats.taxa_leitura?.toFixed(1)}%`,
              inline: true
            },
            {
              name: 'üéØ Engagement',
              value: `**Score:** ${stats.engagement?.toFixed(1)}%\n**Falhas:** ${stats.taxa_falha?.toFixed(1)}%`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ WhatsApp Business' },
          timestamp
        };

      case 'visao_360':
        return {
          title: 'üéØ Vis·£o 360∞ Completa',
          description: 'An·°lise completa do estabelecimento',
          color: 0x8B5CF6,
          fields: [
            {
              name: 'üí∞ Financeiro',
              value: `R$ ${data.visao_geral.kpis_principais.faturamento_total?.toFixed(2)} em ${data.visao_geral.kpis_principais.total_transacoes} transa·ß·µes`,
              inline: false
            },
            {
              name: 'üö® Alertas Ativos',
              value: `**Anomalias:** ${data.resumo_inteligencia.total_anomalias_ativas}\n**Insights Cr·≠ticos:** ${data.resumo_inteligencia.insights_criticos}\n**Recomenda·ß·µes Altas:** ${data.resumo_inteligencia.recomendacoes_altas}`,
              inline: true
            },
            {
              name: 'üë• Equipe',
              value: `**Melhor Funcion·°rio:** ${data.equipe.ranking_funcionarios[0]?.nome || 'N/A'}\n**Total Funcion·°rios:** ${data.equipe.estatisticas.total_funcionarios}`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ Intelig·™ncia Artificial' },
          timestamp
        };

      default:
        return {
          title: 'üìã Resultado da Consulta',
          description: data.mensagem || 'Consulta realizada com sucesso',
          color: 0x3B82F6,
          fields: [
            {
              name: 'üìä Dados',
              value: JSON.stringify(data).substring(0, 1000) + (JSON.stringify(data).length > 1000 ? '...' : ''),
              inline: false
            }
          ],
          footer: { text: 'SGB Analytics Ä¢ Consulta Geral' },
          timestamp
        };
    }
  }

  /**
   * Cria resposta de ajuda
   */
  private createHelpResponse(): BotResponse {
    return {
      success: true,
      embed: {
        title: 'ü§ñ SGB Bot - Comandos Dispon·≠veis',
        description: 'Use linguagem natural para consultar dados do seu estabelecimento!',
        color: 0x5865F2,
        fields: [
          {
            name: 'üí∞ Financeiro',
            value: 'Ä¢ "Qual o maior faturamento?"\nÄ¢ "Faturamento do ·∫ltimo m·™s"\nÄ¢ "Top 5 clientes"\nÄ¢ "Resumo do dia"',
            inline: true
          },
          {
            name: 'úÖ Operacional',
            value: 'Ä¢ "Status dos checklists"\nÄ¢ "Performance dos funcion·°rios"\nÄ¢ "Como est·° a qualidade?"',
            inline: true
          },
          {
            name: 'üì± Comunica·ß·£o',
            value: 'Ä¢ "Stats do WhatsApp"\nÄ¢ "Mensagens pendentes"',
            inline: true
          },
          {
            name: 'ü§ñ IA & Analytics',
            value: 'Ä¢ "Score de sa·∫de"\nÄ¢ "Anomalias recentes"\nÄ¢ "Dashboard executivo"\nÄ¢ "Vis·£o 360"',
            inline: true
          },
          {
            name: 'üçï Produ·ß·£o',
            value: 'Ä¢ "Tempo de produ·ß·£o"\nÄ¢ "Produtos mais demorados"',
            inline: true
          },
          {
            name: 'üí° Dicas',
            value: 'Ä¢ Use datas: "2024-01-15"\nÄ¢ Especifique per·≠odos: "·∫ltima semana"\nÄ¢ Defina limites: "top 10"',
            inline: true
          }
        ],
        footer: { text: 'SGB Analytics Ä¢ Seu assistente inteligente' },
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Emoji baseado no score de sa·∫de
   */
  private getHealthEmoji(score: number): string {
    if (score >= 90) return 'üü¢';
    if (score >= 75) return 'üîµ';
    if (score >= 60) return 'üü°';
    if (score >= 40) return 'üü†';
    return 'üî¥';
  }

  /**
   * Envia resposta para o Discord
   */
  async sendResponse(response: BotResponse): Promise<boolean> {
    try {
      if (response.embed) {
        return await sgbDiscordService.sendEmbed(response.embed);
      } else if (response.text) {
        return await sgbDiscordService.sendMessage(response.text);
      }
      return false;
    } catch (error) {
      console.error('Erro ao enviar resposta Discord:', error);
      return false;
    }
  }
}

// ========================================
// üè≠ INST·ÇNCIA GLOBAL DO BOT
// ========================================
export const sgbBot = new DiscordBotService();

// ========================================
// üéØ FUN·á·ÉO PRINCIPAL - PROCESSAR COMANDO
// ========================================
export async function processDiscordCommand(message: string, user: string, bar_id: number): Promise<boolean> {
  try {
    const command: BotCommand = {
      message: message.trim(),
      user,
      bar_id,
      timestamp: new Date()
    };

    console.log(`ü§ñ Processando comando Discord de ${user}: "${message}"`);

    const response = await sgbBot.processCommand(command);
    
    if (response.success) {
      return await sgbBot.sendResponse(response);
    } else {
      return await sgbBot.sendResponse({
        success: false,
        text: response.error || 'Erro desconhecido ao processar comando'
      });
    }

  } catch (error) {
    console.error('Erro ao processar comando Discord:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Enviar mensagem de erro
    await sgbBot.sendResponse({
      success: false,
      text: `ùå Erro interno: ${errorMessage}`
    });
    
    return false;
  }
} 
