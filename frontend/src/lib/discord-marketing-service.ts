// ========================================
// üì± DISCORD MARKETING SERVICE - SGB
// ========================================
// Servi·ßo especializado para notifica·ß·µes de marketing
// Facebook, Instagram: any, campanhas e m·©tricas sociais

export interface MarketingMetrics {
  facebook: {
    followers: number
    reach: number
    engagement: number
    posts_today: number
    growth_rate: number
  }
  instagram: {
    followers: number
    reach: number
    engagement: number
    posts_today: number
    growth_rate: number
  }
  overall: {
    total_followers: number
    total_reach: number
    total_engagement: number
    engagement_rate: number
    best_performing_platform: 'facebook' | 'instagram'
  }
}

export interface DiscordMarketingEmbed {
  title: string
  description: string
  color: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  footer?: {
    text: string
  }
  timestamp?: string
}

// ========================================
// üì± DISCORD MARKETING SERVICE CLASS
// ========================================
export class DiscordMarketingService {
  private webhookUrl: string
  private defaultUsername: string
  private defaultAvatarUrl: string

  constructor() {
    this.webhookUrl = 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
    this.defaultUsername = 'SGB Marketing Bot'
    this.defaultAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/3.png'
  }

  // ========================================
  // üì§ ENVIAR EMBED MARKETING
  // ========================================
  async sendMarketingEmbed(embed: DiscordMarketingEmbed, content?: string): Promise<boolean> {
    try {
      const message = {
        content,
        embeds: [embed],
        username: this.defaultUsername,
        avatar_url: this.defaultAvatarUrl
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        console.error('Erro resposta Discord Marketing:', response.status, await response.text())
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao enviar embed Discord Marketing:', error)
      return false
    }
  }

  // ========================================
  // üìä RELAT·ìRIO DI·ÅRIO DE M·âTRICAS
  // ========================================
  async enviarRelatorioMetricas(metrics: MarketingMetrics): Promise<boolean> {
    const totalGrowth = (metrics.facebook.growth_rate + metrics.instagram.growth_rate) / 2
    
    // Determinar cor baseada na performance
    let cor = 0x10B981 // Verde
    if (totalGrowth < 0) cor = 0xEF4444 // Vermelho
    else if (totalGrowth < 2) cor = 0xF59E0B // Amarelo

    const bestPlatform = metrics.overall.best_performing_platform
    const bestPlatformIcon = bestPlatform === 'facebook' ? 'üìò' : 'üì∏'
    const bestPlatformName = bestPlatform === 'facebook' ? 'Facebook' : 'Instagram'

    const embed: DiscordMarketingEmbed = {
      title: `üì± Relat·≥rio Di·°rio de Marketing - ${new Date().toLocaleDateString('pt-BR')}`,
      description: `**Ordin·°rio Bar** - M·©tricas de Redes Sociais\n\nüèÜ **Melhor Performance:** ${bestPlatformIcon} ${bestPlatformName}`,
      color: cor,
      fields: [
        {
          name: 'üìò Facebook',
          value: `**Seguidores:** ${metrics.facebook.followers.toLocaleString()} (${metrics.facebook.growth_rate > 0 ? '+' : ''}${metrics.facebook.growth_rate}%)
**Alcance:** ${metrics.facebook.reach.toLocaleString()}
**Engajamento:** ${metrics.facebook.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.facebook.posts_today}`,
          inline: true
        },
        {
          name: 'üì∏ Instagram',
          value: `**Seguidores:** ${metrics.instagram.followers.toLocaleString()} (${metrics.instagram.growth_rate > 0 ? '+' : ''}${metrics.instagram.growth_rate}%)
**Alcance:** ${metrics.instagram.reach.toLocaleString()}
**Engajamento:** ${metrics.instagram.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.instagram.posts_today}`,
          inline: true
        },
        {
          name: 'üìä Resumo Geral',
          value: `**Total Seguidores:** ${metrics.overall.total_followers.toLocaleString()}
**Alcance Total:** ${metrics.overall.total_reach.toLocaleString()}
**Taxa Engajamento:** ${metrics.overall.engagement_rate.toFixed(1)}%
**Crescimento M·©dio:** ${totalGrowth > 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Analytics Ä¢ Ordin·°rio Bar',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // üöÄ NOTIFICA·á·ÉO DE COLETA INICIADA
  // ========================================
  async notificarColetaIniciada(tipo: 'manual' | 'automatica'): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'üöÄ Coleta de M·©tricas Iniciada',
      description: `Iniciando coleta ${tipo} de dados do Facebook e Instagram`,
      color: 0x3B82F6, // Azul
      fields: [
        {
          name: 'üì± Plataformas',
          value: 'Ä¢ Facebook Page Insights\nÄ¢ Instagram Business Account\nÄ¢ Posts e Stories recentes',
          inline: true
        },
        {
          name: 'è∞ Tipo de Coleta',
          value: tipo === 'automatica' ? 'Autom·°tica (2x/dia: 8h e 20h)' : 'Manual (solicitada)',
          inline: true
        },
        {
          name: 'üìä Dados Coletados',
          value: 'Ä¢ M·©tricas de alcance\nÄ¢ Engagement rates\nÄ¢ Crescimento de seguidores\nÄ¢ Performance de posts',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot Ä¢ Ordin·°rio Bar',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // úÖ NOTIFICA·á·ÉO DE COLETA CONCLU·çDA
  // ========================================
  async notificarColetaConcluida(resultado: {
    facebook_metricas: boolean
    instagram_metricas: boolean
    facebook_posts: number
    instagram_posts: number
    tempo_execucao: number
    registros_novos: number
    rate_limit_info?: {
      business_usage?: {
        call_count: number
        type: string
      }
      platform_usage?: {
        call_count: number
      }
    }
  }): Promise<boolean> {
    const sucessos = [
      resultado.facebook_metricas,
      resultado.instagram_metricas
    ].filter(Boolean).length

    const cor = sucessos >= 2 ? 0x10B981 : sucessos >= 1 ? 0xF59E0B : 0xEF4444

    const statusEmoji = {
      2: 'úÖ',
      1: 'ö†Ô∏è',
      0: 'ùå'
    }

    const embed: DiscordMarketingEmbed = {
      title: `${statusEmoji[sucessos as keyof typeof statusEmoji]} Coleta de M·©tricas Conclu·≠da`,
      description: `Coleta finalizada em ${resultado.tempo_execucao}s com **${sucessos}/2** sucessos`,
      color: cor,
      fields: [
        {
          name: 'üìä Status das Coletas',
          value: `${resultado.facebook_metricas ? 'úÖ' : 'ùå'} **Facebook:** ${resultado.facebook_metricas ? 'Sucesso' : 'Falha'}
${resultado.instagram_metricas ? 'úÖ' : 'ùå'} **Instagram:** ${resultado.instagram_metricas ? 'Sucesso' : 'Falha'}`,
          inline: true
        },
        {
          name: 'üìù Posts Processados',
          value: `**Facebook:** ${resultado.facebook_posts} posts
**Instagram:** ${resultado.instagram_posts} posts
**Total:** ${resultado.facebook_posts + resultado.instagram_posts} posts`,
          inline: true
        },
        {
          name: 'üíæ Dados Salvos',
          value: `**Registros Novos:** ${resultado.registros_novos}
**Tempo Execu·ß·£o:** ${resultado.tempo_execucao}s
**Pr·≥xima Coleta:** ${this.getProximaColeta()}`,
          inline: false
        },
        {
          name: 'üìä Rate Limits (Otimizado)',
          value: this.formatRateLimitInfo(resultado.rate_limit_info),
          inline: true
        }
      ],
      footer: {
        text: 'SGB Marketing Bot Ä¢ Dados atualizados',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // üéØ ALERTA DE MARCOS IMPORTANTES
  // ========================================
  async alertarMarcoImportante(tipo: 'seguidores' | 'engajamento' | 'alcance', dados: {
    plataforma: 'facebook' | 'instagram'
    valor_atual: number
    marco_atingido: number
    crescimento: number
  }): Promise<boolean> {
    const emojis = {
      seguidores: 'üë•',
      engajamento: 'ù§Ô∏è',
      alcance: 'üëÄ'
    }

    const plataformaEmoji = dados.plataforma === 'facebook' ? 'üìò' : 'üì∏'
    const plataformaNome = dados.plataforma === 'facebook' ? 'Facebook' : 'Instagram'

    const embed: DiscordMarketingEmbed = {
      title: `üéâ Marco Importante Atingido!`,
      description: `${plataformaEmoji} **${plataformaNome}** atingiu um novo marco!`,
      color: 0x10B981, // Verde
      fields: [
        {
          name: `${emojis[tipo]} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
          value: `**Marco:** ${dados.marco_atingido.toLocaleString()}
**Atual:** ${dados.valor_atual.toLocaleString()}
**Crescimento:** +${dados.crescimento}%`,
          inline: true
        },
        {
          name: 'üöÄ Progresso',
          value: `Parab·©ns! O ${plataformaNome} do Ordin·°rio Bar continua crescendo!`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot Ä¢ Celebrando o crescimento!',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // ùå NOTIFICA·á·ÉO DE ERRO
  // ========================================
  async notificarErro(erro: {
    tipo: string
    mensagem: string
    detalhes?: string
    acao_sugerida?: string
  }): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'ùå Erro na Coleta de M·©tricas',
      description: `**${erro.tipo}:** ${erro.mensagem}`,
      color: 0xEF4444, // Vermelho
      fields: [
        {
          name: 'üîç Detalhes',
          value: erro.detalhes || 'Nenhum detalhe adicional dispon·≠vel',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot Ä¢ Erro reportado',
      },
      timestamp: new Date().toISOString()
    }

    if (erro.acao_sugerida) {
      embed.fields?.push({
        name: 'ö° A·ß·£o Sugerida',
        value: erro.acao_sugerida,
        inline: false
      })
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // üß™ TESTE DE CONEX·ÉO
  // ========================================
  async testarConexao(): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'üß™ Teste de Conex·£o - Marketing Bot',
      description: 'Webhook de marketing funcionando perfeitamente! úÖ',
      color: 0x10B981, // Verde
      fields: [
        {
          name: 'üì± Canal Dedicado',
          value: 'Meta/Marketing Analytics',
          inline: true
        },
        {
          name: 'è∞ Status',
          value: 'Online e Pronto',
          inline: true
        },
        {
          name: 'üéØ Funcionalidades',
          value: 'Ä¢ Relat·≥rios di·°rios\nÄ¢ Alertas de marcos\nÄ¢ Notifica·ß·µes de coleta\nÄ¢ An·°lises de performance',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot Ä¢ Sistema Funcionando',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // üîß M·âTODOS AUXILIARES
  // ========================================
  private formatRateLimitInfo(rateLimitInfo?: {
    business_usage?: { call_count: number; type: string }
    platform_usage?: { call_count: number }
  }): string {
    if (!rateLimitInfo) {
      return '**Instagram Graph:** N/A\n**Platform:** N/A\nüéØ **Uso Otimizado:** ~10 calls/dia'
    }

    const businessUsage = rateLimitInfo.business_usage?.call_count || 0
    const platformUsage = rateLimitInfo.platform_usage?.call_count || 0
    
    const businessStatus = businessUsage < 30 ? 'üü¢' : businessUsage < 70 ? 'üü°' : 'üî¥'
    const platformStatus = platformUsage < 30 ? 'üü¢' : platformUsage < 70 ? 'üü°' : 'üî¥'

    return `${businessStatus} **Instagram Graph:** ${businessUsage}%
${platformStatus} **Platform:** ${platformUsage}%
üéØ **Frequ·™ncia:** 2x/dia (otimizado)`
  }

  private getProximaColeta(): string {
    const agora = new Date()
    const proximasHoras = [8, 20] // Frequ·™ncia otimizada: 8h (manh·£) e 20h (noite)
    
    for (let hora of proximasHoras) {
      const proxima = new Date(agora)
      proxima.setHours(hora: any, 0, 0: any, 0)
      
      if (proxima > agora) {
        return proxima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    }
    
    // Se nenhuma hora hoje, pr·≥xima ·© 08:00 de amanh·£
    const amanha = new Date(agora)
    amanha.setDate(amanha.getDate() + 1)
    amanha.setHours(8: any, 0, 0: any, 0) // Sempre come·ßar ·†s 8h da manh·£
    return amanha.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
}

// ========================================
// üè≠ INST·ÇNCIA SINGLETON
// ========================================
export const sgbMarketingBot = new DiscordMarketingService()

// ========================================
// üéØ FUN·á·ÉO DE CONVENI·äNCIA
// ========================================
export async function notifyMarketingUpdate(tipo: 'coleta' | 'erro' | 'marco' | 'relatorio', dados: any): Promise<boolean> {
  try {
    switch (tipo) {
      case 'coleta':
        if (dados.iniciando) {
          return await sgbMarketingBot.notificarColetaIniciada(dados.tipo)
        } else {
          return await sgbMarketingBot.notificarColetaConcluida(dados.resultado)
        }
      
      case 'erro':
        return await sgbMarketingBot.notificarErro(dados)
      
      case 'marco':
        return await sgbMarketingBot.alertarMarcoImportante(dados.tipo, dados)
      
      case 'relatorio':
        return await sgbMarketingBot.enviarRelatorioMetricas(dados.metrics)
      
      default:
        return false
    }
  } catch (error) {
    console.error('Erro ao enviar notifica·ß·£o marketing:', error)
    return false
  }
} 
