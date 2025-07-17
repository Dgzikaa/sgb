// ========================================
// ðŸŽ¯ MILESTONES SERVICE - MARCOS IMPORTANTES
// ========================================
// Serviá§o para detectar marcos importantes em má©tricas sociais
// e enviar notificaá§áµes automá¡ticas via Discord

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
// ðŸŽ¯ CONFIGURAá‡áƒO DE MARCOS PADRáƒO
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
    celebration_message: 'Ordiná¡rio Bar chegou aos 1.000 seguidores no Instagram!'
  },
  {
    id: 'ig_followers_5000',
    type: 'followers', 
    platform: 'instagram',
    threshold: 5000,
    description: '5K seguidores no Instagram',
    icon: 'ðŸš€',
    celebration_message: 'MARCO INCRáVEL! 5.000 seguidores no Instagram do Ordiná¡rio!'
  },
  {
    id: 'ig_followers_10000',
    type: 'followers',
    platform: 'instagram', 
    threshold: 10000,
    description: '10K seguidores no Instagram',
    icon: 'ðŸ’Ž',
    celebration_message: 'DIAMANTE! 10.000 seguidores no Instagram - Ordiná¡rio Bar á© referáªncia!'
  },

  // ðŸ“˜ Facebook Followers
  {
    id: 'fb_followers_500',
    type: 'followers',
    platform: 'facebook',
    threshold: 500,
    description: '500 seguidores no Facebook',
    icon: 'ðŸ“˜',
    celebration_message: 'Meio milhar de fá£s no Facebook do Ordiná¡rio Bar!'
  },
  {
    id: 'fb_followers_2000',
    type: 'followers',
    platform: 'facebook', 
    threshold: 2000,
    description: '2K seguidores no Facebook',
    icon: 'ðŸ”¥',
    celebration_message: '2.000 pessoas curtem a pá¡gina do Ordiná¡rio no Facebook!'
  },

  // ðŸ“Š Engagement Mensal
  {
    id: 'engagement_rate_5',
    type: 'engagement',
    platform: 'combined',
    threshold: 5.0,
    description: '5% de taxa de engajamento mensal',
    icon: 'š¡',
    celebration_message: 'Taxa de engajamento do Ordiná¡rio atingiu 5% - Audiáªncia super ativa!'
  },
  {
    id: 'engagement_rate_10',
    type: 'engagement',
    platform: 'combined', 
    threshold: 10.0,
    description: '10% de taxa de engajamento mensal',
    icon: 'ðŸ”¥',
    celebration_message: 'ENGAJAMENTO EXPLOSIVO! 10% - Ordiná¡rio Bar viralizado!'
  },

  // ðŸ“ˆ Alcance Mensal
  {
    id: 'reach_monthly_10k',
    type: 'reach',
    platform: 'combined',
    threshold: 10000,
    description: '10K pessoas alcaná§adas no máªs',
    icon: 'ðŸ“¢',
    celebration_message: 'Ordiná¡rio Bar alcaná§ou 10.000 pessoas este máªs!'
  },
  {
    id: 'reach_monthly_50k',
    type: 'reach',
    platform: 'combined',
    threshold: 50000,
    description: '50K pessoas alcaná§adas no máªs', 
    icon: 'ðŸŒŸ',
    celebration_message: 'ALCANCE INCRáVEL! 50.000 pessoas conheceram o Ordiná¡rio este máªs!'
  },

  // ðŸŽ¯ Posts Performance
  {
    id: 'viral_post_1k_likes',
    type: 'posts',
    platform: 'combined',
    threshold: 1000,
    description: 'Post com 1K curtidas',
    icon: '¤ï¸',
    celebration_message: 'Post do Ordiná¡rio viralizou com mais de 1.000 curtidas!'
  },
  {
    id: 'viral_post_5k_likes',
    type: 'posts',
    platform: 'combined', 
    threshold: 5000,
    description: 'Post com 5K curtidas',
    icon: 'ðŸ’¥',
    celebration_message: 'POST VIRAL! Mais de 5.000 curtidas - Ordiná¡rio Bar bombando!'
  }
]

// ========================================
// ðŸŽ¯ CLASSE PRINCIPAL DO SERVIá‡O
// ========================================
export class MilestonesService {
  private achieved_milestones: Set<string> = new Set()

  constructor() {
    this.loadAchievedMilestones()
  }

  // ========================================
  // ðŸ’¾ GERENCIAMENTO DE MARCOS ALCANá‡ADOS
  // ========================================
  private loadAchievedMilestones() {
    try {
      const stored = localStorage.getItem('sgb_achieved_milestones')
      if (stored) {
        const milestones = JSON.parse(stored)
        this.achieved_milestones = new Set(milestones)
      }
    } catch (error) {
      console.error('Erro ao carregar marcos alcaná§ados:', error)
    }
  }

  private saveAchievedMilestone(milestoneId: string) {
    try {
      this.achieved_milestones.add(milestoneId)
      const milestonesArray = Array.from(this.achieved_milestones)
      localStorage.setItem('sgb_achieved_milestones', JSON.stringify(milestonesArray))
    } catch (error) {
      console.error('Erro ao salvar marco alcaná§ado:', error)
    }
  }

  // ========================================
  // ðŸ” VERIFICAá‡áƒO DE MARCOS
  // ========================================
  async checkMilestones(metrics: any): Promise<Milestone[]> {
    const newAchievements: Milestone[] = []

    try {
      for (const milestone of DEFAULT_MILESTONES) {
        // Pular se já¡ foi alcaná§ado
        if (this.achieved_milestones.has(milestone.id)) {
          continue
        }

        const currentValue = this.extractCurrentValue(milestone, metrics)
        
        if (currentValue !== null && currentValue >= milestone.threshold) {
          // Marco alcaná§ado!
          const achievedMilestone = {
            ...milestone,
            achieved_at: new Date().toISOString(),
            current_value: currentValue
          }

          newAchievements.push(achievedMilestone)
          this.saveAchievedMilestone(milestone.id)

          // Enviar notificaá§á£o Discord
          await this.sendMilestoneNotification(achievedMilestone)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar marcos:', error)
    }

    return newAchievements
  }

  // ========================================
  // ðŸ“Š EXTRAá‡áƒO DE VALORES DAS Má‰TRICAS  
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
            // Verificar posts mais curtidos do máªs
            const maxLikes = Math.max(
              metrics.instagram?.max_likes_this_month || 0,
              metrics.facebook?.max_likes_this_month || 0
            )
            return maxLikes
          }
          break

        case 'revenue':
          // Futuro: integraá§á£o com dados de revenue
          return null
      }

      return null
    } catch (error) {
      console.error('Erro ao extrair valor da má©trica:', error)
      return null
    }
  }

  // ========================================
  // ðŸ”” NOTIFICAá‡áƒO DISCORD
  // ========================================
  private async sendMilestoneNotification(milestone: Milestone) {
    try {
      const embed: DiscordMarketingEmbed = {
        title: `ðŸ† Marco Alcaná§ado!`,
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
          text: 'SGB Marketing Bot €¢ Parabá©ns pela conquista!'
        },
        timestamp: new Date().toISOString()
      }

      await discordMarketingService.sendMarketingEmbed(embed)

      console.log(`ðŸŽ‰ Marco enviado para Discord: ${milestone.id}`)
    } catch (error) {
      console.error('Erro ao enviar notificaá§á£o de marco:', error)
    }
  }

  // ========================================
  // ðŸ“‹ Má‰TODOS UTILITáRIOS
  // ========================================
  
  // Obter marcos ainda ná£o alcaná§ados
  getPendingMilestones(): Milestone[] {
    return DEFAULT_MILESTONES.filter(
      milestone => !this.achieved_milestones.has(milestone.id)
    )
  }

  // Obter marcos já¡ alcaná§ados
  getAchievedMilestones(): string[] {
    return Array.from(this.achieved_milestones)
  }

  // Resetar marcos (para testes)
  resetMilestones() {
    this.achieved_milestones.clear()
    localStorage.removeItem('sgb_achieved_milestones')
  }

  // Verificar progresso atá© prá³ximo marco
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
// ðŸŽ¯ INSTá‚NCIA GLOBAL DO SERVIá‡O
// ========================================
export const milestonesService = new MilestonesService()

// ========================================
// ðŸ“ DOCUMENTAá‡áƒO E EXEMPLOS
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

INTEGRAá‡áƒO COM COLETA:
- Chamar checkMilestones() apá³s cada coleta de má©tricas
- Notificaá§áµes Discord automá¡ticas
- Storage local para persistir marcos alcaná§ados
- Progress tracking para dashboards
*/ 
