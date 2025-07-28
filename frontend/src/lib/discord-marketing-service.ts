// ========================================
// 📱 DISCORD MARKETING SERVICE - SGB
// ========================================
// Serviço especializado para notificações de marketing
// Facebook, Instagram, campanhas e métricas sociais

export interface MarketingMetrics {
  facebook: {
    followers: number;
    reach: number;
    engagement: number;
    posts_today: number;
    growth_rate: number;
  };
  instagram: {
    followers: number;
    reach: number;
    engagement: number;
    posts_today: number;
    growth_rate: number;
  };
  overall: {
    total_followers: number;
    total_reach: number;
    total_engagement: number;
    engagement_rate: number;
    best_performing_platform: 'facebook' | 'instagram';
  };
}

export interface DiscordMarketingEmbed {
  title: string;
  description: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

// ========================================
// 📱 DISCORD MARKETING SERVICE CLASS
// ========================================
export class DiscordMarketingService {
  private webhookUrl: string;
  private defaultUsername: string;
  private defaultAvatarUrl: string;

  constructor() {
    this.webhookUrl =
      'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75';
    this.defaultUsername = 'SGB Marketing Bot';
    this.defaultAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/3.png';
  }

  // ========================================
  // 📤 ENVIAR EMBED MARKETING
  // ========================================
  async sendMarketingEmbed(
    embed: DiscordMarketingEmbed,
    content?: string
  ): Promise<boolean> {
    try {
      const message = {
        content,
        embeds: [embed],
        username: this.defaultUsername,
        avatar_url: this.defaultAvatarUrl,
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error(
          'Erro resposta Discord Marketing:',
          response.status,
          await response.text()
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar embed Discord Marketing:', error);
      return false;
    }
  }

  // ========================================
  // 📊 RELATÓRIO DIÁRIO DE MÉTRICAS
  // ========================================
  async enviarRelatorioMetricas(metrics: MarketingMetrics): Promise<boolean> {
    const totalGrowth =
      (metrics.facebook.growth_rate + metrics.instagram.growth_rate) / 2;

    // Determinar cor baseada na performance
    let cor = 0x10b981; // Verde
    if (totalGrowth < 0)
      cor = 0xef4444; // Vermelho
    else if (totalGrowth < 2) cor = 0xf59e0b; // Amarelo

    const bestPlatform = metrics.overall.best_performing_platform;
    const bestPlatformIcon = bestPlatform === 'facebook' ? '📘' : '📸';
    const bestPlatformName =
      bestPlatform === 'facebook' ? 'Facebook' : 'Instagram';

    const embed: DiscordMarketingEmbed = {
      title: `📱 Relatório Diário de Marketing - ${new Date().toLocaleDateString('pt-BR')}`,
      description: `**Ordinário Bar** - Métricas de Redes Sociais\n\n🏆 **Melhor Performance:** ${bestPlatformIcon} ${bestPlatformName}`,
      color: cor,
      fields: [
        {
          name: '📘 Facebook',
          value: `**Seguidores:** ${metrics.facebook.followers.toLocaleString()} (${metrics.facebook.growth_rate > 0 ? '+' : ''}${metrics.facebook.growth_rate}%)
**Alcance:** ${metrics.facebook.reach.toLocaleString()}
**Engajamento:** ${metrics.facebook.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.facebook.posts_today}`,
          inline: true,
        },
        {
          name: '📸 Instagram',
          value: `**Seguidores:** ${metrics.instagram.followers.toLocaleString()} (${metrics.instagram.growth_rate > 0 ? '+' : ''}${metrics.instagram.growth_rate}%)
**Alcance:** ${metrics.instagram.reach.toLocaleString()}
**Engajamento:** ${metrics.instagram.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.instagram.posts_today}`,
          inline: true,
        },
        {
          name: '📊 Resumo Geral',
          value: `**Total Seguidores:** ${metrics.overall.total_followers.toLocaleString()}
**Alcance Total:** ${metrics.overall.total_reach.toLocaleString()}
**Taxa Engajamento:** ${metrics.overall.engagement_rate.toFixed(1)}%
**Crescimento Médio:** ${totalGrowth > 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`,
          inline: false,
        },
      ],
      footer: {
        text: 'SGB Marketing Analytics • Ordinário Bar',
      },
      timestamp: new Date().toISOString(),
    };

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // 🚀 NOTIFICAÇÃO DE COLETA INICIADA
  // ========================================
  async notificarColetaIniciada(
    tipo: 'manual' | 'automatica'
  ): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: '🚀 Coleta de Métricas Iniciada',
      description: `Iniciando coleta ${tipo} de dados do Facebook e Instagram`,
      color: 0x3b82f6, // Azul
      fields: [
        {
          name: '📱 Plataformas',
          value:
            '• Facebook Page Insights\n• Instagram Business Account\n• Posts e Stories recentes',
          inline: true,
        },
        {
          name: '⏰ Tipo de Coleta',
          value:
            tipo === 'automatica'
              ? 'Automática (2x/dia: 8h e 20h)'
              : 'Manual (solicitada)',
          inline: true,
        },
        {
          name: '📊 Dados Coletados',
          value:
            '• Métricas de alcance\n• Engagement rates\n• Crescimento de seguidores\n• Performance de posts',
          inline: false,
        },
      ],
      footer: {
        text: 'SGB Marketing Bot • Ordinário Bar',
      },
      timestamp: new Date().toISOString(),
    };

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // ✅ NOTIFICAÇÃO DE COLETA CONCLUÍDA
  // ========================================
  async notificarColetaConcluida(resultado: {
    facebook_metricas: boolean;
    instagram_metricas: boolean;
    facebook_posts: number;
    instagram_posts: number;
    tempo_execucao: number;
    registros_novos: number;
    rate_limit_info?: {
      business_usage?: {
        call_count: number;
        type: string;
      };
      platform_usage?: {
        call_count: number;
      };
    };
  }): Promise<boolean> {
    const sucessos = [
      resultado.facebook_metricas,
      resultado.instagram_metricas,
    ].filter(Boolean).length;

    const cor = sucessos >= 2 ? 0x10b981 : sucessos >= 1 ? 0xf59e0b : 0xef4444;

    const statusEmoji = {
      2: '✅',
      1: '⚠️',
      0: '❌',
    };

    const embed: DiscordMarketingEmbed = {
      title: `${statusEmoji[sucessos as keyof typeof statusEmoji]} Coleta de Métricas Concluída`,
      description: `Coleta finalizada em ${resultado.tempo_execucao}s com **${sucessos}/2** sucessos`,
      color: cor,
      fields: [
        {
          name: '📊 Status das Coletas',
          value: `${resultado.facebook_metricas ? '✅' : '❌'} **Facebook:** ${resultado.facebook_metricas ? 'Sucesso' : 'Falha'}
${resultado.instagram_metricas ? '✅' : '❌'} **Instagram:** ${resultado.instagram_metricas ? 'Sucesso' : 'Falha'}`,
          inline: true,
        },
        {
          name: '📝 Posts Processados',
          value: `**Facebook:** ${resultado.facebook_posts} posts
**Instagram:** ${resultado.instagram_posts} posts
**Total:** ${resultado.facebook_posts + resultado.instagram_posts} posts`,
          inline: true,
        },
        {
          name: '💾 Dados Salvos',
          value: `**Registros Novos:** ${resultado.registros_novos}
**Tempo Execução:** ${resultado.tempo_execucao}s
**Próxima Coleta:** ${this.getProximaColeta()}`,
          inline: false,
        },
        {
          name: '📊 Rate Limits (Otimizado)',
          value: this.formatRateLimitInfo(resultado.rate_limit_info),
          inline: true,
        },
      ],
      footer: {
        text: 'SGB Marketing Bot • Dados atualizados',
      },
      timestamp: new Date().toISOString(),
    };

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // 🎯 ALERTA DE MARCOS IMPORTANTES
  // ========================================
  async alertarMarcoImportante(
    tipo: 'seguidores' | 'engajamento' | 'alcance',
    dados: {
      plataforma: 'facebook' | 'instagram';
      valor_atual: number;
      marco_atingido: number;
      crescimento: number;
    }
  ): Promise<boolean> {
    const emojis = {
      seguidores: '👥',
      engajamento: '❤️',
      alcance: '👀',
    };

    const plataformaEmoji = dados.plataforma === 'facebook' ? '📘' : '📸';
    const plataformaNome =
      dados.plataforma === 'facebook' ? 'Facebook' : 'Instagram';

    const embed: DiscordMarketingEmbed = {
      title: `🎉 Marco Importante Atingido!`,
      description: `${plataformaEmoji} **${plataformaNome}** atingiu um novo marco!`,
      color: 0x10b981, // Verde
      fields: [
        {
          name: `${emojis[tipo]} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
          value: `**Marco:** ${dados.marco_atingido.toLocaleString()}
**Atual:** ${dados.valor_atual.toLocaleString()}
**Crescimento:** +${dados.crescimento}%`,
          inline: true,
        },
        {
          name: '🚀 Progresso',
          value: `Parabéns! O ${plataformaNome} do Ordinário Bar continua crescendo!`,
          inline: false,
        },
      ],
      footer: {
        text: 'SGB Marketing Bot • Celebrando o crescimento!',
      },
      timestamp: new Date().toISOString(),
    };

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // ❌ NOTIFICAÇÃO DE ERRO
  // ========================================
  async notificarErro(erro: {
    tipo: string;
    mensagem: string;
    detalhes?: string;
    acao_sugerida?: string;
  }): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: '❌ Erro na Coleta de Métricas',
      description: `**${erro.tipo}:** ${erro.mensagem}`,
      color: 0xef4444, // Vermelho
      fields: [
        {
          name: '🔍 Detalhes',
          value: erro.detalhes || 'Nenhum detalhe adicional disponível',
          inline: false,
        },
      ],
      footer: {
        text: 'SGB Marketing Bot • Erro reportado',
      },
      timestamp: new Date().toISOString(),
    };

    if (erro.acao_sugerida) {
      embed.fields?.push({
        name: '⚡ Ação Sugerida',
        value: erro.acao_sugerida,
        inline: false,
      });
    }

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // 🧪 TESTE DE CONEXÃO
  // ========================================
  async testarConexao(): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: '🧪 Teste de Conexão - Marketing Bot',
      description: 'Webhook de marketing funcionando perfeitamente! ✅',
      color: 0x10b981, // Verde
      fields: [
        {
          name: '📱 Canal Dedicado',
          value: 'Windsor.ai/Marketing Analytics',
          inline: true,
        },
        {
          name: '⏰ Status',
          value: 'Online e Pronto',
          inline: true,
        },
        {
          name: '🎯 Funcionalidades',
          value:
            '• Relatórios diários\n• Alertas de marcos\n• Notificações de coleta\n• Análises de performance',
          inline: false,
        },
      ],
      footer: {
        text: 'SGB Marketing Bot • Sistema Funcionando',
      },
      timestamp: new Date().toISOString(),
    };

    return await this.sendMarketingEmbed(embed);
  }

  // ========================================
  // 🔧 MÉTODOS AUXILIARES
  // ========================================
  private formatRateLimitInfo(rateLimitInfo?: {
    business_usage?: { call_count: number; type: string };
    platform_usage?: { call_count: number };
  }): string {
    if (!rateLimitInfo) {
      return '**Instagram Graph:** N/A\n**Platform:** N/A\n🎯 **Uso Otimizado:** ~10 calls/dia';
    }

    const businessUsage = rateLimitInfo.business_usage?.call_count || 0;
    const platformUsage = rateLimitInfo.platform_usage?.call_count || 0;

    const businessStatus =
      businessUsage < 30 ? '🟢' : businessUsage < 70 ? '🟡' : '🔴';
    const platformStatus =
      platformUsage < 30 ? '🟢' : platformUsage < 70 ? '🟡' : '🔴';

    return `${businessStatus} **Instagram Graph:** ${businessUsage}%
${platformStatus} **Platform:** ${platformUsage}%
🎯 **Frequência:** 2x/dia (otimizado)`;
  }

  private getProximaColeta(): string {
    const agora = new Date();
    const proximasHoras = [8, 20]; // Frequência otimizada: 8h (manhã) e 20h (noite)

    for (const hora of proximasHoras) {
      const proxima = new Date(agora);
      proxima.setHours(hora, 0, 0, 0);

      if (proxima > agora) {
        return proxima.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    // Se nenhuma hora hoje, próxima é 08:00 de amanhã
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(8, 0, 0, 0); // Sempre começar às 8h da manhã
    return amanha.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

// ========================================
// 🏭 INSTÂNCIA SINGLETON
// ========================================
export const sgbMarketingBot = new DiscordMarketingService();

// ========================================
// 🎯 FUNÇÃO DE CONVENIÊNCIA
// ========================================
export async function notifyMarketingUpdate(
  tipo: 'coleta' | 'erro' | 'marco' | 'relatorio',
  dados: any
): Promise<boolean> {
  try {
    switch (tipo) {
      case 'coleta':
        if ((dados as any).iniciando) {
          return await sgbMarketingBot.notificarColetaIniciada((dados as any).tipo);
        } else {
          return await sgbMarketingBot.notificarColetaConcluida(
            (dados as any).resultado
          );
        }

      case 'erro':
        return await sgbMarketingBot.notificarErro(dados);

      case 'marco':
        return await sgbMarketingBot.alertarMarcoImportante((dados as any).tipo, dados);

      case 'relatorio':
        return await sgbMarketingBot.enviarRelatorioMetricas((dados as any).metrics);

      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao enviar notificação marketing:', error);
    return false;
  }
}
