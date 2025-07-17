// ========================================
// ðŸŽ¯ MILESTONES SERVICE - MARCOS IMPORTANTES
// ========================================
// ServiÃ§o para detectar marcos importantes em mÃ©tricas sociais
// e enviar notificaÃ§Ãµes automÃ¡ticas via Discord

import { DiscordMarketingService, DiscordMarketingEmbed } from './discord-marketing-service'

const discordMarketingService = new DiscordMarketingService()

// ========================================
// ðŸ† TIPOS DE MARCOS IMPORTANTES
// ========================================
export interface Milestone {
  id: string
  type: 'followers' | 'engagement' | 'reach' | 'posts' | 'revenue'
  platform: 'facebook' | 'instagram' | 'combined'
  threshold: number
  achieved_at?: string
  current_value?: number
  description: string
  icon: string
  celebration_message: string
}

// ========================================
// ðŸŽ¯ CONFIGURAÃ‡ÃƒO DE MARCOS PADRÃƒO
// ========================================
export const DEFAULT_MILESTONES: Milestone[] = [
  // ðŸ“± Instagram Followers
  {
    id: 'ig_followers_1000',
    type: 'followers',
    platform: 'instagram',
    threshold: 1000,
    description: '1K seguidores no Instagram',
    icon: 'ðŸŽ‰',
    celebration_message: 'OrdinÃ¡rio Bar chegou aos 1.000 seguidores no Instagram!'
  },
  {
    id: 'ig_followers_5000',
    type: 'followers', 
    platform: 'instagram',
    threshold: 5000,
    description: '5K seguidores no Instagram',
    icon: 'ðŸš€',
    celebration_message: 'MARCO INCRÃVEL! 5.000 seguidores no Instagram do OrdinÃ¡rio!'
  },
  {
    id: 'ig_followers_10000',
    type: 'followers',
    platform: 'instagram', 
    threshold: 10000,
    description: '10K seguidores no Instagram',
    icon: 'ðŸ’Ž',
    celebration_message: 'DIAMANTE! 10.000 seguidores no Instagram - OrdinÃ¡rio Bar Ã© referÃªncia!'
  },

  // ðŸ“˜ Facebook Followers
  {
    id: 'fb_followers_500',
    type: 'followers',
    platform: 'facebook',
    threshold: 500,
    description: '500 seguidores no Facebook',
    icon: 'ðŸ“˜',
    celebration_message: 'Meio milhar de fÃ£s no Facebook do OrdinÃ¡rio Bar!'
  },
  {
    id: 'fb_followers_2000',
    type: 'followers',
    platform: 'facebook', 
    threshold: 2000,
    description: '2K seguidores no Facebook',
    icon: 'ðŸ”¥',
    celebration_message: '2.000 pessoas curtem a pÃ¡gina do OrdinÃ¡rio no Facebook!'
  },

  // ðŸ“Š Engagement Mensal
  {
    id: 'engagement_rate_5',
    type: 'engagement',
    platform: 'combined',
    threshold: 5.0,
    description: '5% de taxa de engajamento mensal',
    icon: 'âš¡',
    celebration_message: 'Taxa de engajamento do OrdinÃ¡rio atingiu 5% - AudiÃªncia super ativa!'
  },
  {
    id: 'engagement_rate_10',
    type: 'engagement',
    platform: 'combined', 
    threshold: 10.0,
    description: '10% de taxa de engajamento mensal',
    icon: 'ðŸ”¥',
    celebration_message: 'ENGAJAMENTO EXPLOSIVO! 10% - OrdinÃ¡rio Bar viralizado!'
  },

  // ðŸ“ˆ Alcance Mensal
  {
    id: 'reach_monthly_10k',
    type: 'reach',
    platform: 'combined',
    threshold: 10000,
    description: '10K pessoas alcanÃ§adas no mÃªs',
    icon: 'ðŸ“¢',
    celebration_message: 'OrdinÃ¡rio Bar alcanÃ§ou 10.000 pessoas este mÃªs!'
  },
  {
    id: 'reach_monthly_50k',
    type: 'reach',
    platform: 'combined',
    threshold: 50000,
    description: '50K pessoas alcanÃ§adas no mÃªs', 
    icon: 'ðŸŒŸ',
    celebration_message: 'ALCANCE INCRÃVEL! 50.000 pessoas conheceram o OrdinÃ¡rio este mÃªs!'
  },

  // ðŸŽ¯ Posts Performance
  {
    id: 'viral_post_1k_likes',
    type: 'posts',
    platform: 'combined',
    threshold: 1000,
    description: 'Post com 1K curtidas',
    icon: 'â¤ï¸',
    celebration_message: 'Post do OrdinÃ¡rio viralizou com mais de 1.000 curtidas!'
  },
  {
    id: 'viral_post_5k_likes',
    type: 'posts',
    platform: 'combined', 
    threshold: 5000,
    description: 'Post com 5K curtidas',
    icon: 'ðŸ’¥',
    celebration_message: 'POST VIRAL! Mais de 5.000 curtidas - OrdinÃ¡rio Bar bombando!'
  }
]

// ========================================
// ðŸŽ¯ CLASSE PRINCIPAL DO SERVIÃ‡O
// ========================================
export class MilestonesService {
  private achieved_milestones: Set<string> = new Set()

  constructor() {
    this.loadAchievedMilestones()
  }

  // ========================================
  // ðŸ’¾ GERENCIAMENTO DE MARCOS ALCANÃ‡ADOS
  // ========================================
  private loadAchievedMilestones() {
    try {
      const stored = localStorage.getItem('sgb_achieved_milestones')
      if (stored) {
        const milestones = JSON.parse(stored)
        this.achieved_milestones = new Set(milestones)
      }
    } catch (error) {
      console.error('Erro ao carregar marcos alcanÃ§ados:', error)
    }
  }

  private saveAchievedMilestone(milestoneId: string) {
    try {
      this.achieved_milestones.add(milestoneId)
      const milestonesArray = Array.from(this.achieved_milestones)
      localStorage.setItem('sgb_achieved_milestones', JSON.stringify(milestonesArray))
    } catch (error) {
      console.error('Erro ao salvar marco alcanÃ§ado:', error)
    }
  }

  // ========================================
  // ðŸ” VERIFICAÃ‡ÃƒO DE MARCOS
  // ========================================
  async checkMilestones(metrics: any): Promise<Milestone[]> {
    const newAchievements: Milestone[] = []

    try {
      for (const milestone of DEFAULT_MILESTONES) {
        // Pular se jÃ¡ foi alcanÃ§ado
        if (this.achieved_milestones.has(milestone.id)) {
          continue
        }

        const currentValue = this.extractCurrentValue(milestone, metrics)
        
        if (currentValue !== null && currentValue >= milestone.threshold) {
          // Marco alcanÃ§ado!
          const achievedMilestone = {
            ...milestone,
            achieved_at: new Date().toISOString(),
            current_value: currentValue
          }

          newAchievements.push(achievedMilestone)
          this.saveAchievedMilestone(milestone.id)

          // Enviar notificaÃ§Ã£o Discord
          await this.sendMilestoneNotification(achievedMilestone)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar marcos:', error)
    }

    return newAchievements
  }

  // ========================================
  // ðŸ“Š EXTRAÃ‡ÃƒO DE VALORES DAS MÃ‰TRICAS  
  // ========================================
  private extractCurrentValue(milestone: Milestone, metrics: any): number | null {
    try {
      switch (milestone.type) {
        case 'followers':
          if (milestone.platform === 'instagram') {
            return metrics.instagram?.followers_count || 0
          } else if (milestone.platform === 'facebook') {
            return metrics.facebook?.page_fans || 0
          } else if (milestone.platform === 'combined') {
            const ig = metrics.instagram?.followers_count || 0
            const fb = metrics.facebook?.page_fans || 0
            return ig + fb
          }
          break

        case 'engagement':
          if (milestone.platform === 'combined') {
            return metrics.consolidated?.engagement_rate || 0
          }
          break

        case 'reach':
          if (milestone.platform === 'combined') {
            const ig_reach = metrics.instagram?.reach || 0
            const fb_reach = metrics.facebook?.page_post_engagements || 0
            return ig_reach + fb_reach
          }
          break

        case 'posts':
          if (milestone.platform === 'combined') {
            // Verificar posts mais curtidos do mÃªs
            const maxLikes = Math.max(
              metrics.instagram?.max_likes_this_month || 0,
              metrics.facebook?.max_likes_this_month || 0
            )
            return maxLikes
          }
          break

        case 'revenue':
          // Futuro: integraÃ§Ã£o com dados de revenue
          return null
      }

      return null
    } catch (error) {
      console.error('Erro ao extrair valor da mÃ©trica:', error)
      return null
    }
  }

  // ========================================
  // ðŸ”” NOTIFICAÃ‡ÃƒO DISCORD
  // ========================================
  private async sendMilestoneNotification(milestone: Milestone) {
    try {
      const embed: DiscordMarketingEmbed = {
        title: `ðŸ† Marco AlcanÃ§ado!`,
        description: milestone.celebration_message,
        color: 16766720, // Dourado
        fields: [
          {
            name: 'ðŸŽ¯ Marco',
            value: milestone.description,
            inline: true
          },
          {
            name: 'ðŸ“Š Valor Atingido',
            value: milestone.current_value?.toLocaleString() || 'N/A',
            inline: true
          },
          {
            name: 'ðŸ“… Data',
            value: new Date().toLocaleDateString('pt-BR'),
            inline: true
          },
          {
            name: 'ðŸš€ Plataforma',
            value: milestone.platform === 'combined' ? 'Facebook + Instagram' : 
                   milestone.platform === 'instagram' ? 'Instagram' : 'Facebook',
            inline: false
          }
        ],
        footer: {
          text: 'SGB Marketing Bot â€¢ ParabÃ©ns pela conquista!'
        },
        timestamp: new Date().toISOString()
      }

      await discordMarketingService.sendMarketingEmbed(embed)

      console.log(`ðŸŽ‰ Marco enviado para Discord: ${milestone.id}`)
    } catch (error) {
      console.error('Erro ao enviar notificaÃ§Ã£o de marco:', error)
    }
  }

  // ========================================
  // ðŸ“‹ MÃ‰TODOS UTILITÃRIOS
  // ========================================
  
  // Obter marcos ainda nÃ£o alcanÃ§ados
  getPendingMilestones(): Milestone[] {
    return DEFAULT_MILESTONES.filter(
      milestone => !this.achieved_milestones.has(milestone.id)
    )
  }

  // Obter marcos jÃ¡ alcanÃ§ados
  getAchievedMilestones(): string[] {
    return Array.from(this.achieved_milestones)
  }

  // Resetar marcos (para testes)
  resetMilestones() {
    this.achieved_milestones.clear()
    localStorage.removeItem('sgb_achieved_milestones')
  }

  // Verificar progresso atÃ© prÃ³ximo marco
  getProgressToNextMilestone(type: string, platform: string, currentValue: number) {
    const relevantMilestones = DEFAULT_MILESTONES
      .filter((m: any) => m.type === type && m.platform === platform)
      .filter((m: any) => !this.achieved_milestones.has(m.id))
      .filter((m: any) => m.threshold > currentValue)
      .sort((a, b) => a.threshold - b.threshold)

    if (relevantMilestones.length === 0) return null

    const nextMilestone = relevantMilestones[0]
    const progress = (currentValue / nextMilestone.threshold) * 100
    const remaining = nextMilestone.threshold - currentValue

    return {
      milestone: nextMilestone,
      progress: Math.min(progress, 100),
      remaining,
      percentage: `${progress.toFixed(1)}%`
    }
  }

  // Simular marco para testes
  async simulateMilestone(milestoneId: string) {
    const milestone = DEFAULT_MILESTONES.find((m: any) => m.id === milestoneId)
    if (!milestone) return false

    const simulatedMilestone = {
      ...milestone,
      achieved_at: new Date().toISOString(),
      current_value: milestone.threshold
    }

    await this.sendMilestoneNotification(simulatedMilestone)
    return true
  }
}

// ========================================
// ðŸŽ¯ INSTÃ‚NCIA GLOBAL DO SERVIÃ‡O
// ========================================
export const milestonesService = new MilestonesService()

// ========================================
// ðŸ“ DOCUMENTAÃ‡ÃƒO E EXEMPLOS
// ========================================
/*
MILESTONES SERVICE - COMO USAR:

1. VERIFICAR MARCOS:
const newMilestones = await milestonesService.checkMilestones({
  instagram: { followers_count: 1500 },
  facebook: { page_fans: 800 },
  consolidated: { engagement_rate: 6.2 }
})

2. VER PROGRESSO:
const progress = milestonesService.getProgressToNextMilestone(
  'followers', 'instagram', 1500
)

3. SIMULAR PARA TESTE:
await milestonesService.simulateMilestone('ig_followers_1000')

4. MARCOS PENDENTES:
const pending = milestonesService.getPendingMilestones()

5. RESETAR (DESENVOLVIMENTO):
milestonesService.resetMilestones()

INTEGRAÃ‡ÃƒO COM COLETA:
- Chamar checkMilestones() apÃ³s cada coleta de mÃ©tricas
- NotificaÃ§Ãµes Discord automÃ¡ticas
- Storage local para persistir marcos alcanÃ§ados
- Progress tracking para dashboards
*/ 
