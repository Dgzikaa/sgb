// ========================================
// 🎮 DISCORD WEBHOOK SERVICE - SGB
// ========================================
// Service completo para notificações via Discord
// Integração com agente IA para relatórios automáticos

export interface DiscordWebhookConfig {
  webhook_url: string;
  username?: string;
  avatar_url?: string;
  enabled: boolean;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
}

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

// ========================================
// 🎮 DISCORD SERVICE CLASS
// ========================================
export class DiscordService {
  private webhookUrl: string;
  private defaultUsername: string;
  private defaultAvatarUrl: string;

  constructor(webhookUrl: string, username = 'SGB Bot', avatarUrl?: string) {
    this.webhookUrl = webhookUrl;
    this.defaultUsername = username;
    this.defaultAvatarUrl = avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  // ========================================
  // 📤 ENVIAR MENSAGEM SIMPLES
  // ========================================
  async sendMessage(content: string, username?: string): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          username: username || this.defaultUsername,
          avatar_url: this.defaultAvatarUrl
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar mensagem Discord:', error);
      return false;
    }
  }

  // ========================================
  // 📊 ENVIAR EMBED RICO
  // ========================================
  async sendEmbed(embed: DiscordEmbed, content?: string): Promise<boolean> {
    try {
      const message: DiscordMessage = {
        content,
        embeds: [embed],
        username: this.defaultUsername,
        avatar_url: this.defaultAvatarUrl
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar embed Discord:', error);
      return false;
    }
  }

  // ========================================
  // 🤖 RELATÓRIO DIÁRIO DO AGENTE IA
  // ========================================
  async enviarRelatorioIA(dados: any): Promise<boolean> {
    const { kpis, anomalias, insights, agente_status, resumo_executivo } = dados;

    // Determinar cor baseada no score de saúde
    let cor = 0x10B981; // Verde
    if (resumo_executivo.score_saude_geral < 40) cor = 0xEF4444; // Vermelho
    else if (resumo_executivo.score_saude_geral < 60) cor = 0xF59E0B; // Amarelo
    else if (resumo_executivo.score_saude_geral < 75) cor = 0x3B82F6; // Azul

    // Emojis baseados no status
    const statusEmoji = {
      'excelente': '🟢',
      'bom': '🔵', 
      'regular': '🟡',
      'ruim': '🟠',
      'critico': '🔴'
    };

         const embed: DiscordEmbed = {
       title: `📊 Relatório Diário SGB - ${new Date().toLocaleDateString('pt-BR')}`,
       description: `**Score de Saúde:** ${resumo_executivo.score_saude_geral}% ${statusEmoji[resumo_executivo.status_geral as keyof typeof statusEmoji] || '⚪'}`,
      color: cor,
      fields: [
        {
          name: '📈 KPIs Principais',
          value: `**Taxa Conclusão:** ${kpis.taxa_conclusao.valor.toFixed(1)}% (${kpis.taxa_conclusao.variacao > 0 ? '📈' : '📉'} ${kpis.taxa_conclusao.variacao.toFixed(1)}%)
**Score Qualidade:** ${kpis.score_qualidade.valor.toFixed(1)}% (${kpis.score_qualidade.variacao > 0 ? '📈' : '📉'} ${kpis.score_qualidade.variacao.toFixed(1)}%)
**Tempo Médio:** ${kpis.tempo_execucao.valor.toFixed(1)} min (${kpis.tempo_execucao.variacao > 0 ? '📈' : '📉'} ${kpis.tempo_execucao.variacao.toFixed(1)}%)
**Produtividade:** ${kpis.produtividade.valor.toFixed(1)} pts (${kpis.produtividade.variacao > 0 ? '📈' : '📉'} ${kpis.produtividade.variacao.toFixed(1)}%)`,
          inline: false
        }
      ],
      footer: {
        text: `SGB Analytics • Agente IA ${agente_status.ativo ? '🟢 Ativo' : '🔴 Inativo'}`,
      },
      timestamp: new Date().toISOString()
    };

    // Adicionar campo de anomalias se houver
    if (anomalias && anomalias.criticas_ativas > 0) {
      embed.fields?.push({
        name: '🚨 Anomalias Críticas',
        value: `**${anomalias.criticas_ativas} anomalias** precisam de atenção!\nTotal ativas: ${anomalias.ativas}`,
        inline: true
      });
    }

    // Adicionar campo de insights se houver
    if (insights && insights.criticos_pendentes > 0) {
      embed.fields?.push({
        name: '💡 Insights Pendentes',
        value: `**${insights.criticos_pendentes} insights críticos**\nTotal: ${insights.total}`,
        inline: true
      });
    }

    // Adicionar problemas se houver
    if (resumo_executivo.principais_problemas.length > 0) {
      embed.fields?.push({
        name: '⚠️ Principais Problemas',
        value: resumo_executivo.principais_problemas.slice(0, 3).map((p: string) => `• ${p}`).join('\n'),
        inline: false
      });
    }

    // Adicionar oportunidades se houver
    if (resumo_executivo.oportunidades.length > 0) {
      embed.fields?.push({
        name: '🎯 Oportunidades',
        value: resumo_executivo.oportunidades.slice(0, 3).map((o: string) => `• ${o}`).join('\n'),
        inline: false
      });
    }

    return await this.sendEmbed(embed);
  }

  // ========================================
  // 🚨 ALERTA DE ANOMALIA CRÍTICA
  // ========================================
  async enviarAlertaAnomalia(anomalia: any): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🚨 ANOMALIA CRÍTICA DETECTADA',
      description: `**${anomalia.titulo}**\n${anomalia.descricao}`,
      color: 0xEF4444, // Vermelho
      fields: [
        {
          name: '📊 Detalhes',
          value: `**Severidade:** ${anomalia.severidade.toUpperCase()}
**Tipo:** ${anomalia.tipo_anomalia}
**Confiança:** ${anomalia.confianca_deteccao}%`,
          inline: true
        },
        {
          name: '📈 Valores',
          value: `**Esperado:** ${anomalia.valor_esperado}
**Observado:** ${anomalia.valor_observado}
**Desvio:** ${anomalia.desvio_percentual.toFixed(1)}%`,
          inline: true
        }
      ],
      footer: {
        text: 'SGB Analytics • Agente IA',
      },
      timestamp: new Date().toISOString()
    };

    if (anomalia.possivel_causa) {
      embed.fields?.push({
        name: '🔍 Possível Causa',
        value: anomalia.possivel_causa,
        inline: false
      });
    }

    if (anomalia.acoes_sugeridas && anomalia.acoes_sugeridas.length > 0) {
      embed.fields?.push({
        name: '⚡ Ações Sugeridas',
        value: anomalia.acoes_sugeridas.slice(0, 3).map((acao: string) => `• ${acao}`).join('\n'),
        inline: false
      });
    }

    return await this.sendEmbed(embed);
  }

  // ========================================
  // 💡 INSIGHT IMPORTANTE
  // ========================================
  async enviarInsightImportante(insight: any): Promise<boolean> {
    let cor = 0x10B981; // Verde padrão
    if (insight.impacto === 'critico') cor = 0xEF4444;
    else if (insight.impacto === 'alto') cor = 0xF59E0B;
    else if (insight.impacto === 'medio') cor = 0x3B82F6;

    const embed: DiscordEmbed = {
      title: '💡 INSIGHT IMPORTANTE',
      description: `**${insight.titulo}**\n${insight.descricao}`,
      color: cor,
      fields: [
        {
          name: '📊 Informações',
          value: `**Impacto:** ${insight.impacto.toUpperCase()}
**Urgência:** ${insight.urgencia}
**Confiança:** ${insight.confianca}%
**Categoria:** ${insight.categoria}`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Analytics • Agente IA',
      },
      timestamp: new Date().toISOString()
    };

    if (insight.acoes_sugeridas && insight.acoes_sugeridas.length > 0) {
      embed.fields?.push({
        name: '🎯 Ações Recomendadas',
        value: insight.acoes_sugeridas.slice(0, 3).map((acao: string) => `• ${acao}`).join('\n'),
        inline: false
      });
    }

    return await this.sendEmbed(embed);
  }

  // ========================================
  // 🎯 RECOMENDAÇÃO DE ALTA PRIORIDADE
  // ========================================
  async enviarRecomendacao(recomendacao: any): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🎯 RECOMENDAÇÃO DE ALTA PRIORIDADE',
      description: `**${recomendacao.titulo}**\n${recomendacao.descricao}`,
      color: 0x8B5CF6, // Roxo
      fields: [
        {
          name: '💰 Impacto Financeiro',
          value: `**ROI Estimado:** ${recomendacao.roi_estimado}%
**Esforço:** ${recomendacao.esforco_implementacao}
**Tempo:** ${recomendacao.tempo_implementacao_dias} dias`,
          inline: true
        },
        {
          name: '📊 Priorização',
          value: `**Prioridade:** ${recomendacao.prioridade}/10
**Urgência:** ${recomendacao.urgencia}
**Complexidade:** ${recomendacao.complexidade}`,
          inline: true
        }
      ],
      footer: {
        text: 'SGB Analytics • Agente IA',
      },
      timestamp: new Date().toISOString()
    };

    if (recomendacao.justificativa) {
      embed.fields?.push({
        name: '📝 Justificativa',
        value: recomendacao.justificativa,
        inline: false
      });
    }

    return await this.sendEmbed(embed);
  }

  // ========================================
  // 🧪 TESTE DE CONEXÃO
  // ========================================
  async testarConexao(): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🧪 Teste de Conexão SGB',
      description: 'Webhook Discord funcionando perfeitamente! ✅',
      color: 0x10B981, // Verde
      fields: [
        {
          name: '🤖 Sistema',
          value: 'SGB Analytics IA',
          inline: true
        },
        {
          name: '⏰ Data/Hora',
          value: new Date().toLocaleString('pt-BR'),
          inline: true
        },
        {
          name: '🚀 Status',
          value: 'Pronto para notificações automáticas!',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Analytics • Sistema Funcionando',
      },
      timestamp: new Date().toISOString()
    };

    return await this.sendEmbed(embed);
  }

  // ========================================
  // 🌅 RELATÓRIO MATINAL (8H)
  // ========================================
  async enviarRelatorioMatinal(dados: any): Promise<boolean> {
    const { resumo_executivo, kpis, anomalias, insights } = dados;

    // Saudação baseada no horário
    const agora = new Date();
    const hora = agora.getHours();
    let saudacao = '🌅 Bom dia!';
    if (hora >= 12 && hora < 18) saudacao = '☀️ Boa tarde!';
    else if (hora >= 18) saudacao = '🌙 Boa noite!';

    const embed: DiscordEmbed = {
      title: `${saudacao} Relatório Matinal SGB`,
      description: `📊 **Score de Saúde:** ${resumo_executivo.score_saude_geral}% - Status: **${resumo_executivo.status_geral.toUpperCase()}**`,
      color: resumo_executivo.score_saude_geral >= 75 ? 0x10B981 : 
             resumo_executivo.score_saude_geral >= 50 ? 0xF59E0B : 0xEF4444,
      fields: [
        {
          name: '📈 Performance Ontem',
          value: `🎯 **Taxa de Conclusão:** ${kpis.taxa_conclusao.valor.toFixed(1)}%
⭐ **Score de Qualidade:** ${kpis.score_qualidade.valor.toFixed(1)}%
⏱️ **Tempo Médio:** ${kpis.tempo_execucao.valor.toFixed(1)} min
💪 **Produtividade:** ${kpis.produtividade.valor.toFixed(1)} pts`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Analytics • Relatório Automático das 8h',
      },
      timestamp: new Date().toISOString()
    };

    // Alertas importantes
    const alertas = [];
    if (anomalias && anomalias.criticas_ativas > 0) {
      alertas.push(`🚨 ${anomalias.criticas_ativas} anomalias críticas`);
    }
    if (insights && insights.criticos_pendentes > 0) {
      alertas.push(`💡 ${insights.criticos_pendentes} insights importantes`);
    }

    if (alertas.length > 0) {
      embed.fields?.push({
        name: '⚠️ Requer Atenção',
        value: alertas.join('\n'),
        inline: false
      });
    }

    // Mensagem motivacional
    let motivacao = '💪 Vamos fazer um ótimo dia!';
    if (resumo_executivo.score_saude_geral >= 90) {
      motivacao = '🚀 Performance excelente! Continue assim!';
    } else if (resumo_executivo.score_saude_geral < 50) {
      motivacao = '🎯 Vamos melhorar hoje! Foco nos pontos críticos!';
    }

    embed.fields?.push({
      name: '🎯 Foco do Dia',
      value: motivacao,
      inline: false
    });

    return await this.sendEmbed(embed);
  }
}

// ========================================
// 🏭 FACTORY E CONFIGURAÇÕES
// ========================================

/**
 * Criar instância do Discord Service
 */
export function createDiscordService(webhookUrl: string): DiscordService {
  return new DiscordService(
    webhookUrl,
    'SGB Analytics Bot',
    'https://cdn.discordapp.com/embed/avatars/5.png'
  );
}

/**
 * Discord Service para SGB (Ordinário)
 */
export const sgbDiscordService = createDiscordService(
  'https://discord.com/api/webhooks/1391182158252609586/YXrYYQJImCOSZj9ZeDoz_jOLcK2CW7rGc-q-xV8BkaegBNNLq0nksg7JaI1y_B0F8Okz'
);

// ========================================
// 🕐 AGENDAMENTO PARA 8H DA MANHÃ
// ========================================

/**
 * Verifica se é hora de enviar relatório matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  
  // 8h da manhã (entre 8:00 e 8:05 para dar margem)
  return hora === 8 && minuto <= 5;
}

/**
 * Agendar próximo relatório matinal
 */
export function calcularProximoRelatorioMatinal(): Date {
  const agora = new Date();
  const proximoRelatorio = new Date();
  
  // Configurar para 8h da manhã
  proximoRelatorio.setHours(8, 0, 0, 0);
  
  // Se já passou das 8h hoje, agendar para amanhã
  if (agora.getHours() >= 8) {
    proximoRelatorio.setDate(proximoRelatorio.getDate() + 1);
  }
  
  return proximoRelatorio;
}

/**
 * Minutos até o próximo relatório matinal
 */
export function minutosAteProximoRelatorio(): number {
  const agora = new Date();
  const proximo = calcularProximoRelatorioMatinal();
  return Math.ceil((proximo.getTime() - agora.getTime()) / (1000 * 60));
} 