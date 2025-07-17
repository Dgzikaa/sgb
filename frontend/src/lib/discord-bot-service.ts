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
// ðŸ¤– DISCORD BOT INTELIGENTE - SGB
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
// ðŸ§  PROCESSADOR DE COMANDOS INTELIGENTE
// ========================================
export class DiscordBotService {
  private readonly API_BASE = '/api/ai/query';

  /**
   * Processa comando em linguagem natural
   */
  async processCommand(command: BotCommand): Promise<BotResponse> {
    try {
      console.log(`ðŸ¤– Bot processando: "${command.message}" do usuÃ¡rio ${command.user}`);

      // Detectar tipo de consulta baseado na mensagem
      const queryType = this.detectQueryType(command.message);
      
      if (!queryType) {
        return this.createHelpResponse();
      }

      // Extrair parÃ¢metros da mensagem
      const params = this.extractParameters(command.message, queryType);

      console.log(`ðŸ¤– Processando query: ${queryType} para bar ${command.bar_id}`);

      // Chamar funÃ§Ã£o diretamente baseado no tipo
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
        text: `âŒ Erro ao processar seu comando: ${errorMessage}`
      };
    }
  }

  /**
   * Detecta o tipo de consulta baseado na mensagem
   */
  private detectQueryType(message: string): string | null {
    const msg = message.toLowerCase();

    // ðŸ’° Financeiro & Faturamento
    if (msg.includes('maior faturamento') || msg.includes('maior venda')) {
      return 'maior_faturamento';
    }
    if (msg.includes('faturamento') && (msg.includes('perÃ­odo') || msg.includes('periodo'))) {
      return 'faturamento_periodo';
    }
    if (msg.includes('comparativo') && msg.includes('mÃªs')) {
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
    if (msg.includes('resumo') && msg.includes('mÃªs')) {
      return 'resumo_mes';
    }

    // âœ… Checklists & Operacional
    if (msg.includes('checklist') || msg.includes('checklists')) {
      return 'status_checklists';
    }
    if (msg.includes('performance') && msg.includes('funcionÃ¡rios')) {
      return 'performance_funcionarios';
    }
    if (msg.includes('qualidade')) {
      return 'qualidade_execucoes';
    }

    // ðŸ“± WhatsApp
    if (msg.includes('whatsapp') || msg.includes('mensagens')) {
      return 'whatsapp_stats';
    }

    // ðŸ• ProduÃ§Ã£o
    if (msg.includes('tempo') && (msg.includes('produÃ§Ã£o') || msg.includes('producao'))) {
      return 'tempo_producao';
    }

    // ðŸ¤– IA & Analytics
    if (msg.includes('anomalias')) {
      return 'anomalias_recentes';
    }
    if (msg.includes('insights')) {
      return 'insights_importantes';
    }
    if (msg.includes('saÃºde') || msg.includes('score')) {
      return 'score_saude_geral';
    }

    // ðŸ“Š Dashboards
    if (msg.includes('dashboard') || msg.includes('executivo')) {
      return 'dashboard_executivo';
    }
    if (msg.includes('visÃ£o') || msg.includes('360')) {
      return 'visao_360';
    }

    // Comandos gerais
    if (msg.includes('como vai') || msg.includes('status') || msg.includes('situaÃ§Ã£o')) {
      return 'dashboard_executivo';
    }

    return null;
  }

  /**
   * Extrai parÃ¢metros da mensagem
   */
  private extractParameters(message: string, queryType: string): any {
    const params: any = {};

    // Extrair datas
    const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
    const dates = message.match(dateRegex);
    
    if (dates) {
      if (dates.length >= 1) params.periodo_inicio = dates[0];
      if (dates.length >= 2) params.periodo_fim = dates[1];
    }

    // Extrair nÃºmeros (limite)
    const numberRegex = /top\s+(\d+)|(\d+)\s+(?:primeiros|melhores|Ãºltimos)/gi;
    const numberMatch = message.match(numberRegex);
    if (numberMatch) {
      const num = parseInt(numberMatch[0].replace(/\D/g, ''));
      if (num > 0 && num <= 50) {
        params.limite = num;
      }
    }

    // PerÃ­odos relativos
    if (message.includes('ontem')) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      params.periodo_inicio = ontem.toISOString().split('T')[0];
    }
    
    if (message.includes('Ãºltima semana')) {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      params.periodo_inicio = semanaAtras.toISOString().split('T')[0];
    }

    if (message.includes('Ãºltimo mÃªs')) {
      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      params.periodo_inicio = mesAtras.toISOString().split('T')[0];
    }

    return params;
  }

  /**
   * Cria embed formatado baseado no tipo de consulta
   */
  private createEmbedResponse(queryType: string, data: any, originalMessage: string): DiscordEmbed {
    const timestamp = new Date().toISOString();

    switch (queryType) {
      case 'maior_faturamento':
        return {
          title: 'ðŸ’° Maior Faturamento',
          description: data.mensagem,
          color: 0x00D084,
          fields: [
            {
              name: 'ðŸ† Maior Venda Individual',
              value: `**R$ ${data.maior_venda?.valor?.toFixed(2)}**\nData: ${new Date(data.maior_venda?.data).toLocaleDateString('pt-BR')}\nMeio: ${data.maior_venda?.meio_pagamento || 'N/A'}`,
              inline: true
            },
            {
              name: 'ðŸ“Š Faturamento Total do Dia',
              value: `**R$ ${data.faturamento_total_dia?.toFixed(2)}**`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics â€¢ Consulta de faturamento' },
          timestamp
        };

      case 'dashboard_executivo':
        const kpis = data.kpis_principais;
        const saude = data.score_saude;
        return {
          title: 'ðŸ“Š Dashboard Executivo',
          description: data.mensagem,
          color: saude.score_saude >= 80 ? 0x00D084 : saude.score_saude >= 60 ? 0xF59E0B : 0xEF4444,
          fields: [
            {
              name: 'ðŸ’° Financeiro',
              value: `**Faturamento:** R$ ${kpis.faturamento_total?.toFixed(2)}\n**TransaÃ§Ãµes:** ${kpis.total_transacoes}\n**Ticket MÃ©dio:** R$ ${kpis.ticket_medio?.toFixed(2)}`,
              inline: true
            },
            {
              name: 'âœ… Operacional',
              value: `**Checklists:** ${kpis.taxa_conclusao_checklists?.toFixed(1)}%\n**WhatsApp:** ${kpis.engagement_whatsapp?.toFixed(1)}%\n**ProduÃ§Ã£o:** ${kpis.tempo_medio_producao?.toFixed(1)}min`,
              inline: true
            },
            {
              name: 'ðŸŽ¯ Score de SaÃºde',
              value: `**${saude.score_saude}%** - ${saude.status.toUpperCase()}\n${this.getHealthEmoji(saude.score_saude)} ${saude.mensagem}`,
              inline: false
            }
          ],
          footer: { text: 'SGB Analytics â€¢ Dashboard Executivo' },
          timestamp
        };

      case 'status_checklists':
        const resumo = data.resumo;
        return {
          title: 'âœ… Status dos Checklists',
          description: data.mensagem,
          color: resumo.taxa_conclusao >= 80 ? 0x00D084 : resumo.taxa_conclusao >= 60 ? 0xF59E0B : 0xEF4444,
          fields: [
            {
              name: 'ðŸ“Š Resumo Geral',
              value: `**Total:** ${resumo.total_execucoes}\n**ConcluÃ­dos:** ${resumo.concluidos}\n**Pendentes:** ${resumo.pendentes}\n**Atrasados:** ${resumo.atrasados}`,
              inline: true
            },
            {
              name: 'ðŸ“ˆ Performance',
              value: `**Taxa ConclusÃ£o:** ${resumo.taxa_conclusao?.toFixed(1)}%\n**Score MÃ©dio:** ${resumo.score_medio?.toFixed(1)}%`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics â€¢ GestÃ£o de Checklists' },
          timestamp
        };

      case 'whatsapp_stats':
        const stats = data.estatisticas;
        return {
          title: 'ðŸ“± EstatÃ­sticas WhatsApp',
          description: data.mensagem,
          color: 0x25D366,
          fields: [
            {
              name: 'ðŸ“Š MÃ©tricas',
              value: `**Total Mensagens:** ${stats.total_mensagens}\n**Taxa Entrega:** ${stats.taxa_entrega?.toFixed(1)}%\n**Taxa Leitura:** ${stats.taxa_leitura?.toFixed(1)}%`,
              inline: true
            },
            {
              name: 'ðŸŽ¯ Engagement',
              value: `**Score:** ${stats.engagement?.toFixed(1)}%\n**Falhas:** ${stats.taxa_falha?.toFixed(1)}%`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics â€¢ WhatsApp Business' },
          timestamp
        };

      case 'visao_360':
        return {
          title: 'ðŸŽ¯ VisÃ£o 360Â° Completa',
          description: 'AnÃ¡lise completa do estabelecimento',
          color: 0x8B5CF6,
          fields: [
            {
              name: 'ðŸ’° Financeiro',
              value: `R$ ${data.visao_geral.kpis_principais.faturamento_total?.toFixed(2)} em ${data.visao_geral.kpis_principais.total_transacoes} transaÃ§Ãµes`,
              inline: false
            },
            {
              name: 'ðŸš¨ Alertas Ativos',
              value: `**Anomalias:** ${data.resumo_inteligencia.total_anomalias_ativas}\n**Insights CrÃ­ticos:** ${data.resumo_inteligencia.insights_criticos}\n**RecomendaÃ§Ãµes Altas:** ${data.resumo_inteligencia.recomendacoes_altas}`,
              inline: true
            },
            {
              name: 'ðŸ‘¥ Equipe',
              value: `**Melhor FuncionÃ¡rio:** ${data.equipe.ranking_funcionarios[0]?.nome || 'N/A'}\n**Total FuncionÃ¡rios:** ${data.equipe.estatisticas.total_funcionarios}`,
              inline: true
            }
          ],
          footer: { text: 'SGB Analytics â€¢ InteligÃªncia Artificial' },
          timestamp
        };

      default:
        return {
          title: 'ðŸ“‹ Resultado da Consulta',
          description: data.mensagem || 'Consulta realizada com sucesso',
          color: 0x3B82F6,
          fields: [
            {
              name: 'ðŸ“Š Dados',
              value: JSON.stringify(data).substring(0, 1000) + (JSON.stringify(data).length > 1000 ? '...' : ''),
              inline: false
            }
          ],
          footer: { text: 'SGB Analytics â€¢ Consulta Geral' },
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
        title: 'ðŸ¤– SGB Bot - Comandos DisponÃ­veis',
        description: 'Use linguagem natural para consultar dados do seu estabelecimento!',
        color: 0x5865F2,
        fields: [
          {
            name: 'ðŸ’° Financeiro',
            value: 'â€¢ "Qual o maior faturamento?"\nâ€¢ "Faturamento do Ãºltimo mÃªs"\nâ€¢ "Top 5 clientes"\nâ€¢ "Resumo do dia"',
            inline: true
          },
          {
            name: 'âœ… Operacional',
            value: 'â€¢ "Status dos checklists"\nâ€¢ "Performance dos funcionÃ¡rios"\nâ€¢ "Como estÃ¡ a qualidade?"',
            inline: true
          },
          {
            name: 'ðŸ“± ComunicaÃ§Ã£o',
            value: 'â€¢ "Stats do WhatsApp"\nâ€¢ "Mensagens pendentes"',
            inline: true
          },
          {
            name: 'ðŸ¤– IA & Analytics',
            value: 'â€¢ "Score de saÃºde"\nâ€¢ "Anomalias recentes"\nâ€¢ "Dashboard executivo"\nâ€¢ "VisÃ£o 360"',
            inline: true
          },
          {
            name: 'ðŸ• ProduÃ§Ã£o',
            value: 'â€¢ "Tempo de produÃ§Ã£o"\nâ€¢ "Produtos mais demorados"',
            inline: true
          },
          {
            name: 'ðŸ’¡ Dicas',
            value: 'â€¢ Use datas: "2024-01-15"\nâ€¢ Especifique perÃ­odos: "Ãºltima semana"\nâ€¢ Defina limites: "top 10"',
            inline: true
          }
        ],
        footer: { text: 'SGB Analytics â€¢ Seu assistente inteligente' },
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Emoji baseado no score de saÃºde
   */
  private getHealthEmoji(score: number): string {
    if (score >= 90) return 'ðŸŸ¢';
    if (score >= 75) return 'ðŸ”µ';
    if (score >= 60) return 'ðŸŸ¡';
    if (score >= 40) return 'ðŸŸ ';
    return 'ðŸ”´';
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
// ðŸ­ INSTÃ‚NCIA GLOBAL DO BOT
// ========================================
export const sgbBot = new DiscordBotService();

// ========================================
// ðŸŽ¯ FUNÃ‡ÃƒO PRINCIPAL - PROCESSAR COMANDO
// ========================================
export async function processDiscordCommand(message: string, user: string, bar_id: number): Promise<boolean> {
  try {
    const command: BotCommand = {
      message: message.trim(),
      user,
      bar_id,
      timestamp: new Date()
    };

    console.log(`ðŸ¤– Processando comando Discord de ${user}: "${message}"`);

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
      text: `âŒ Erro interno: ${errorMessage}`
    });
    
    return false;
  }
} 
