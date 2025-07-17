// ========================================
// ðŸ“± DISCORD MARKETING SERVICE - SGB
// ========================================
// ServiÃ§o especializado para notificaÃ§Ãµes de marketing
// Facebook, Instagram, campanhas e mÃ©tricas sociais

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
// ðŸ“± DISCORD MARKETING SERVICE CLASS
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
  // ðŸ“¤ ENVIAR EMBED MARKETING
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
  // ðŸ“Š RELATÃ“RIO DIÃRIO DE MÃ‰TRICAS
  // ========================================
  async enviarRelatorioMetricas(metrics: MarketingMetrics): Promise<boolean> {
    const totalGrowth = (metrics.facebook.growth_rate + metrics.instagram.growth_rate) / 2
    
    // Determinar cor baseada na performance
    let cor = 0x10B981 // Verde
    if (totalGrowth < 0) cor = 0xEF4444 // Vermelho
    else if (totalGrowth < 2) cor = 0xF59E0B // Amarelo

    const bestPlatform = metrics.overall.best_performing_platform
    const bestPlatformIcon = bestPlatform === 'facebook' ? 'ðŸ“˜' : 'ðŸ“¸'
    const bestPlatformName = bestPlatform === 'facebook' ? 'Facebook' : 'Instagram'

    const embed: DiscordMarketingEmbed = {
      title: `ðŸ“± RelatÃ³rio DiÃ¡rio de Marketing - ${new Date().toLocaleDateString('pt-BR')}`,
      description: `**OrdinÃ¡rio Bar** - MÃ©tricas de Redes Sociais\n\nðŸ† **Melhor Performance:** ${bestPlatformIcon} ${bestPlatformName}`,
      color: cor,
      fields: [
        {
          name: 'ðŸ“˜ Facebook',
          value: `**Seguidores:** ${metrics.facebook.followers.toLocaleString()} (${metrics.facebook.growth_rate > 0 ? '+' : ''}${metrics.facebook.growth_rate}%)
**Alcance:** ${metrics.facebook.reach.toLocaleString()}
**Engajamento:** ${metrics.facebook.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.facebook.posts_today}`,
          inline: true
        },
        {
          name: 'ðŸ“¸ Instagram',
          value: `**Seguidores:** ${metrics.instagram.followers.toLocaleString()} (${metrics.instagram.growth_rate > 0 ? '+' : ''}${metrics.instagram.growth_rate}%)
**Alcance:** ${metrics.instagram.reach.toLocaleString()}
**Engajamento:** ${metrics.instagram.engagement.toLocaleString()}
**Posts Hoje:** ${metrics.instagram.posts_today}`,
          inline: true
        },
        {
          name: 'ðŸ“Š Resumo Geral',
          value: `**Total Seguidores:** ${metrics.overall.total_followers.toLocaleString()}
**Alcance Total:** ${metrics.overall.total_reach.toLocaleString()}
**Taxa Engajamento:** ${metrics.overall.engagement_rate.toFixed(1)}%
**Crescimento MÃ©dio:** ${totalGrowth > 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Analytics â€¢ OrdinÃ¡rio Bar',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // ðŸš€ NOTIFICAÃ‡ÃƒO DE COLETA INICIADA
  // ========================================
  async notificarColetaIniciada(tipo: 'manual' | 'automatica'): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'ðŸš€ Coleta de MÃ©tricas Iniciada',
      description: `Iniciando coleta ${tipo} de dados do Facebook e Instagram`,
      color: 0x3B82F6, // Azul
      fields: [
        {
          name: 'ðŸ“± Plataformas',
          value: 'â€¢ Facebook Page Insights\nâ€¢ Instagram Business Account\nâ€¢ Posts e Stories recentes',
          inline: true
        },
        {
          name: 'â° Tipo de Coleta',
          value: tipo === 'automatica' ? 'AutomÃ¡tica (2x/dia: 8h e 20h)' : 'Manual (solicitada)',
          inline: true
        },
        {
          name: 'ðŸ“Š Dados Coletados',
          value: 'â€¢ MÃ©tricas de alcance\nâ€¢ Engagement rates\nâ€¢ Crescimento de seguidores\nâ€¢ Performance de posts',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot â€¢ OrdinÃ¡rio Bar',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // âœ… NOTIFICAÃ‡ÃƒO DE COLETA CONCLUÃDA
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
      2: 'âœ…',
      1: 'âš ï¸',
      0: 'âŒ'
    }

    const embed: DiscordMarketingEmbed = {
      title: `${statusEmoji[sucessos as keyof typeof statusEmoji]} Coleta de MÃ©tricas ConcluÃ­da`,
      description: `Coleta finalizada em ${resultado.tempo_execucao}s com **${sucessos}/2** sucessos`,
      color: cor,
      fields: [
        {
          name: 'ðŸ“Š Status das Coletas',
          value: `${resultado.facebook_metricas ? 'âœ…' : 'âŒ'} **Facebook:** ${resultado.facebook_metricas ? 'Sucesso' : 'Falha'}
${resultado.instagram_metricas ? 'âœ…' : 'âŒ'} **Instagram:** ${resultado.instagram_metricas ? 'Sucesso' : 'Falha'}`,
          inline: true
        },
        {
          name: 'ðŸ“ Posts Processados',
          value: `**Facebook:** ${resultado.facebook_posts} posts
**Instagram:** ${resultado.instagram_posts} posts
**Total:** ${resultado.facebook_posts + resultado.instagram_posts} posts`,
          inline: true
        },
        {
          name: 'ðŸ’¾ Dados Salvos',
          value: `**Registros Novos:** ${resultado.registros_novos}
**Tempo ExecuÃ§Ã£o:** ${resultado.tempo_execucao}s
**PrÃ³xima Coleta:** ${this.getProximaColeta()}`,
          inline: false
        },
        {
          name: 'ðŸ“Š Rate Limits (Otimizado)',
          value: this.formatRateLimitInfo(resultado.rate_limit_info),
          inline: true
        }
      ],
      footer: {
        text: 'SGB Marketing Bot â€¢ Dados atualizados',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // ðŸŽ¯ ALERTA DE MARCOS IMPORTANTES
  // ========================================
  async alertarMarcoImportante(tipo: 'seguidores' | 'engajamento' | 'alcance', dados: {
    plataforma: 'facebook' | 'instagram'
    valor_atual: number
    marco_atingido: number
    crescimento: number
  }): Promise<boolean> {
    const emojis = {
      seguidores: 'ðŸ‘¥',
      engajamento: 'â¤ï¸',
      alcance: 'ðŸ‘€'
    }

    const plataformaEmoji = dados.plataforma === 'facebook' ? 'ðŸ“˜' : 'ðŸ“¸'
    const plataformaNome = dados.plataforma === 'facebook' ? 'Facebook' : 'Instagram'

    const embed: DiscordMarketingEmbed = {
      title: `ðŸŽ‰ Marco Importante Atingido!`,
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
          name: 'ðŸš€ Progresso',
          value: `ParabÃ©ns! O ${plataformaNome} do OrdinÃ¡rio Bar continua crescendo!`,
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot â€¢ Celebrando o crescimento!',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // âŒ NOTIFICAÃ‡ÃƒO DE ERRO
  // ========================================
  async notificarErro(erro: {
    tipo: string
    mensagem: string
    detalhes?: string
    acao_sugerida?: string
  }): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'âŒ Erro na Coleta de MÃ©tricas',
      description: `**${erro.tipo}:** ${erro.mensagem}`,
      color: 0xEF4444, // Vermelho
      fields: [
        {
          name: 'ðŸ” Detalhes',
          value: erro.detalhes || 'Nenhum detalhe adicional disponÃ­vel',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot â€¢ Erro reportado',
      },
      timestamp: new Date().toISOString()
    }

    if (erro.acao_sugerida) {
      embed.fields?.push({
        name: 'âš¡ AÃ§Ã£o Sugerida',
        value: erro.acao_sugerida,
        inline: false
      })
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // ðŸ§ª TESTE DE CONEXÃƒO
  // ========================================
  async testarConexao(): Promise<boolean> {
    const embed: DiscordMarketingEmbed = {
      title: 'ðŸ§ª Teste de ConexÃ£o - Marketing Bot',
      description: 'Webhook de marketing funcionando perfeitamente! âœ…',
      color: 0x10B981, // Verde
      fields: [
        {
          name: 'ðŸ“± Canal Dedicado',
          value: 'Meta/Marketing Analytics',
          inline: true
        },
        {
          name: 'â° Status',
          value: 'Online e Pronto',
          inline: true
        },
        {
          name: 'ðŸŽ¯ Funcionalidades',
          value: 'â€¢ RelatÃ³rios diÃ¡rios\nâ€¢ Alertas de marcos\nâ€¢ NotificaÃ§Ãµes de coleta\nâ€¢ AnÃ¡lises de performance',
          inline: false
        }
      ],
      footer: {
        text: 'SGB Marketing Bot â€¢ Sistema Funcionando',
      },
      timestamp: new Date().toISOString()
    }

    return await this.sendMarketingEmbed(embed)
  }

  // ========================================
  // ðŸ”§ MÃ‰TODOS AUXILIARES
  // ========================================
  private formatRateLimitInfo(rateLimitInfo?: {
    business_usage?: { call_count: number; type: string }
    platform_usage?: { call_count: number }
  }): string {
    if (!rateLimitInfo) {
      return '**Instagram Graph:** N/A\n**Platform:** N/A\nðŸŽ¯ **Uso Otimizado:** ~10 calls/dia'
    }

    const businessUsage = rateLimitInfo.business_usage?.call_count || 0
    const platformUsage = rateLimitInfo.platform_usage?.call_count || 0
    
    const businessStatus = businessUsage < 30 ? 'ðŸŸ¢' : businessUsage < 70 ? 'ðŸŸ¡' : 'ðŸ”´'
    const platformStatus = platformUsage < 30 ? 'ðŸŸ¢' : platformUsage < 70 ? 'ðŸŸ¡' : 'ðŸ”´'

    return `${businessStatus} **Instagram Graph:** ${businessUsage}%
${platformStatus} **Platform:** ${platformUsage}%
ðŸŽ¯ **FrequÃªncia:** 2x/dia (otimizado)`
  }

  private getProximaColeta(): string {
    const agora = new Date()
    const proximasHoras = [8, 20] // FrequÃªncia otimizada: 8h (manhÃ£) e 20h (noite)
    
    for (let hora of proximasHoras) {
      const proxima = new Date(agora)
      proxima.setHours(hora, 0, 0, 0)
      
      if (proxima > agora) {
        return proxima.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    }
    
    // Se nenhuma hora hoje, prÃ³xima Ã© 08:00 de amanhÃ£
    const amanha = new Date(agora)
    amanha.setDate(amanha.getDate() + 1)
    amanha.setHours(8, 0, 0, 0) // Sempre comeÃ§ar Ã s 8h da manhÃ£
    return amanha.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
}

// ========================================
// ðŸ­ INSTÃ‚NCIA SINGLETON
// ========================================
export const sgbMarketingBot = new DiscordMarketingService()

// ========================================
// ðŸŽ¯ FUNÃ‡ÃƒO DE CONVENIÃŠNCIA
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
    console.error('Erro ao enviar notificaÃ§Ã£o marketing:', error)
    return false
  }
} 
