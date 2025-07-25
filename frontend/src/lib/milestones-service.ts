// ========================================
// 🎯 MILESTONES SERVICE - MARCOS IMPORTANTES
// ========================================
// Serviço para detectar marcos importantes em métricas sociais
// e enviar notificações automáticas via Discord

import {
  DiscordMarketingService,
  DiscordMarketingEmbed,
} from './discord-marketing-service';

const discordMarketingService = new DiscordMarketingService();

// ========================================
// 🏆 TIPOS DE MARCOS IMPORTANTES
// ========================================
export interface Milestone {
  id: string;
  type: 'followers' | 'engagement' | 'reach' | 'posts' | 'revenue';
  platform: 'facebook' | 'instagram' | 'combined';
  threshold: number;
  achieved_at?: string;
  current_value?: number;
  description: string;
  icon: string;
  celebration_message: string;
}

// ========================================
// 🎯 CONFIGURAÇÃO DE MARCOS PADRÃO
// ========================================
export const DEFAULT_MILESTONES: Milestone[] = [
  // 📱 Instagram Followers
  {
    id: 'ig_followers_1000',
    type: 'followers',
    platform: 'instagram',
    threshold: 1000,
    description: '1K seguidores no Instagram',
    icon: '🎉',
    celebration_message:
      'Ordinário Bar chegou aos 1.000 seguidores no Instagram!',
  },
  {
    id: 'ig_followers_5000',
    type: 'followers',
    platform: 'instagram',
    threshold: 5000,
    description: '5K seguidores no Instagram',
    icon: '🚀',
    celebration_message:
      'MARCO INCRÍVEL! 5.000 seguidores no Instagram do Ordinário!',
  },
  {
    id: 'ig_followers_10000',
    type: 'followers',
    platform: 'instagram',
    threshold: 10000,
    description: '10K seguidores no Instagram',
    icon: '💎',
    celebration_message:
      'DIAMANTE! 10.000 seguidores no Instagram - Ordinário Bar é referência!',
  },

  // 📘 Facebook Followers
  {
    id: 'fb_followers_500',
    type: 'followers',
    platform: 'facebook',
    threshold: 500,
    description: '500 seguidores no Facebook',
    icon: '📘',
    celebration_message: 'Meio milhar de fãs no Facebook do Ordinário Bar!',
  },
  {
    id: 'fb_followers_2000',
    type: 'followers',
    platform: 'facebook',
    threshold: 2000,
    description: '2K seguidores no Facebook',
    icon: '🔥',
    celebration_message:
      '2.000 pessoas curtem a página do Ordinário no Facebook!',
  },

  // 📊 Engagement Mensal
  {
    id: 'engagement_rate_5',
    type: 'engagement',
    platform: 'combined',
    threshold: 5.0,
    description: '5% de taxa de engajamento mensal',
    icon: '⚡',
    celebration_message:
      'Taxa de engajamento do Ordinário atingiu 5% - Audiência super ativa!',
  },
  {
    id: 'engagement_rate_10',
    type: 'engagement',
    platform: 'combined',
    threshold: 10.0,
    description: '10% de taxa de engajamento mensal',
    icon: '🔥',
    celebration_message:
      'ENGAJAMENTO EXPLOSIVO! 10% - Ordinário Bar viralizado!',
  },

  // 📈 Alcance Mensal
  {
    id: 'reach_monthly_10k',
    type: 'reach',
    platform: 'combined',
    threshold: 10000,
    description: '10K pessoas alcançadas no mês',
    icon: '📢',
    celebration_message: 'Ordinário Bar alcançou 10.000 pessoas este mês!',
  },
  {
    id: 'reach_monthly_50k',
    type: 'reach',
    platform: 'combined',
    threshold: 50000,
    description: '50K pessoas alcançadas no mês',
    icon: '🌟',
    celebration_message:
      'ALCANCE INCRÍVEL! 50.000 pessoas conheceram o Ordinário este mês!',
  },

  // 🎯 Posts Performance
  {
    id: 'viral_post_1k_likes',
    type: 'posts',
    platform: 'combined',
    threshold: 1000,
    description: 'Post com 1K curtidas',
    icon: '❤️',
    celebration_message:
      'Post do Ordinário viralizou com mais de 1.000 curtidas!',
  },
  {
    id: 'viral_post_5k_likes',
    type: 'posts',
    platform: 'combined',
    threshold: 5000,
    description: 'Post com 5K curtidas',
    icon: '💥',
    celebration_message:
      'POST VIRAL! Mais de 5.000 curtidas - Ordinário Bar bombando!',
  },
];

// ========================================
// 🎯 CLASSE PRINCIPAL DO SERVIÇO
// ========================================
export class MilestonesService {
  private achieved_milestones: Set<string> = new Set();

  constructor() {
    this.loadAchievedMilestones();
  }

  // ========================================
  // 💾 GERENCIAMENTO DE MARCOS ALCANÇADOS
  // ========================================
  private loadAchievedMilestones() {
    try {
      const stored = localStorage.getItem('sgb_achieved_milestones');
      if (stored) {
        const milestones = JSON.parse(stored);
        this.achieved_milestones = new Set(milestones);
      }
    } catch (error) {
      console.error('Erro ao carregar marcos alcançados:', error);
    }
  }

  private saveAchievedMilestone(milestoneId: string) {
    try {
      this.achieved_milestones.add(milestoneId);
      const milestonesArray = Array.from(this.achieved_milestones);
      localStorage.setItem(
        'sgb_achieved_milestones',
        JSON.stringify(milestonesArray)
      );
    } catch (error) {
      console.error('Erro ao salvar marco alcançado:', error);
    }
  }

  // ========================================
  // 🔍 VERIFICAÇÃO DE MARCOS
  // ========================================
  async checkMilestones(metrics: unknown): Promise<Milestone[]> {
    const newAchievements: Milestone[] = [];

    try {
      for (const milestone of DEFAULT_MILESTONES) {
        // Pular se já foi alcançado
        if (this.achieved_milestones.has(milestone.id)) {
          continue;
        }

        const currentValue = this.extractCurrentValue(milestone, metrics);

        if (currentValue !== null && currentValue >= milestone.threshold) {
          // Marco alcançado!
          const achievedMilestone = {
            ...milestone,
            achieved_at: new Date().toISOString(),
            current_value: currentValue,
          };

          newAchievements.push(achievedMilestone);
          this.saveAchievedMilestone(milestone.id);

          // Enviar notificação Discord
          await this.sendMilestoneNotification(achievedMilestone);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar marcos:', error);
    }

    return newAchievements;
  }

  // ========================================
  // 📊 EXTRAÇÃO DE VALORES DAS MÉTRICAS
  // ========================================
  private extractCurrentValue(
    milestone: Milestone,
    metrics: unknown
  ): number | null {
    try {
      switch (milestone.type) {
        case 'followers':
          if (milestone.platform === 'instagram') {
            return metrics.instagram?.followers_count || 0;
          } else if (milestone.platform === 'facebook') {
            return metrics.facebook?.page_fans || 0;
          } else if (milestone.platform === 'combined') {
            const ig = metrics.instagram?.followers_count || 0;
            const fb = metrics.facebook?.page_fans || 0;
            return ig + fb;
          }
          break;

        case 'engagement':
          if (milestone.platform === 'combined') {
            return metrics.consolidated?.engagement_rate || 0;
          }
          break;

        case 'reach':
          if (milestone.platform === 'combined') {
            const ig_reach = metrics.instagram?.reach || 0;
            const fb_reach = metrics.facebook?.page_post_engagements || 0;
            return ig_reach + fb_reach;
          }
          break;

        case 'posts':
          if (milestone.platform === 'combined') {
            // Verificar posts mais curtidos do mês
            const maxLikes = Math.max(
              metrics.instagram?.max_likes_this_month || 0,
              metrics.facebook?.max_likes_this_month || 0
            );
            return maxLikes;
          }
          break;

        case 'revenue':
          // Futuro: integração com dados de revenue
          return null;
      }

      return null;
    } catch (error) {
      console.error('Erro ao extrair valor da métrica:', error);
      return null;
    }
  }

  // ========================================
  // 🔔 NOTIFICAÇÃO DISCORD
  // ========================================
  private async sendMilestoneNotification(milestone: Milestone) {
    try {
      const embed: DiscordMarketingEmbed = {
        title: `🏆 Marco Alcançado!`,
        description: milestone.celebration_message,
        color: 16766720, // Dourado
        fields: [
          {
            name: '🎯 Marco',
            value: milestone.description,
            inline: true,
          },
          {
            name: '📊 Valor Atingido',
            value: milestone.current_value?.toLocaleString() || 'N/A',
            inline: true,
          },
          {
            name: '📅 Data',
            value: new Date().toLocaleDateString('pt-BR'),
            inline: true,
          },
          {
            name: '🚀 Plataforma',
            value:
              milestone.platform === 'combined'
                ? 'Facebook + Instagram'
                : milestone.platform === 'instagram'
                  ? 'Instagram'
                  : 'Facebook',
            inline: false,
          },
        ],
        footer: {
          text: 'SGB Marketing Bot • Parabéns pela conquista!',
        },
        timestamp: new Date().toISOString(),
      };

      await discordMarketingService.sendMarketingEmbed(embed);

      console.log(`🎉 Marco enviado para Discord: ${milestone.id}`);
    } catch (error) {
      console.error('Erro ao enviar notificação de marco:', error);
    }
  }

  // ========================================
  // 📋 MÉTODOS UTILITÁRIOS
  // ========================================

  // Obter marcos ainda não alcançados
  getPendingMilestones(): Milestone[] {
    return DEFAULT_MILESTONES.filter(
      milestone => !this.achieved_milestones.has(milestone.id)
    );
  }

  // Obter marcos já alcançados
  getAchievedMilestones(): string[] {
    return Array.from(this.achieved_milestones);
  }

  // Resetar marcos (para testes)
  resetMilestones() {
    this.achieved_milestones.clear();
    localStorage.removeItem('sgb_achieved_milestones');
  }

  // Verificar progresso até próximo marco
  getProgressToNextMilestone(
    type: string,
    platform: string,
    currentValue: number
  ) {
    const relevantMilestones = DEFAULT_MILESTONES.filter(
      m => m.type === type && m.platform === platform
    )
      .filter(m => !this.achieved_milestones.has(m.id))
      .filter(m => m.threshold > currentValue)
      .sort((a, b) => a.threshold - b.threshold);

    if (relevantMilestones.length === 0) return null;

    const nextMilestone = relevantMilestones[0];
    const progress = (currentValue / nextMilestone.threshold) * 100;
    const remaining = nextMilestone.threshold - currentValue;

    return {
      milestone: nextMilestone,
      progress: Math.min(progress, 100),
      remaining,
      percentage: `${progress.toFixed(1)}%`,
    };
  }

  // Simular marco para testes
  async simulateMilestone(milestoneId: string) {
    const milestone = DEFAULT_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone) return false;

    const simulatedMilestone = {
      ...milestone,
      achieved_at: new Date().toISOString(),
      current_value: milestone.threshold,
    };

    await this.sendMilestoneNotification(simulatedMilestone);
    return true;
  }
}

// ========================================
// 🎯 INSTÂNCIA GLOBAL DO SERVIÇO
// ========================================
export const milestonesService = new MilestonesService();

// ========================================
// 📝 DOCUMENTAÇÃO E EXEMPLOS
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

INTEGRAÇÃO COM COLETA:
- Chamar checkMilestones() após cada coleta de métricas
- Notificações Discord automáticas
- Storage local para persistir marcos alcançados
- Progress tracking para dashboards
*/
