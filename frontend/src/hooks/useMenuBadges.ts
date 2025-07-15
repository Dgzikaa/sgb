'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useBar } from '@/contexts/BarContext'

interface MenuBadges {
  home: number
  checklist: number
  producao: number
  contaazul: number
  marketing: number
  visaoGeral: number
  configuracoes: number
  notifications: number
  // Subitems
  checklistAbertura: number
  checklistFuncionario: number
  producaoReceitas: number
  producaoTerminal: number
  contaazulCompetencia: number
  marketingInstagram: number
  // Configurações subitems
  configChecklists: number
  configMetas: number
  configIntegracoes: number
  configSeguranca: number
  configWhatsapp: number
  configContahub: number
  configMeta: number
  configTemplates: number
  configAnalytics: number
  configCache: number
  configPwa: number
  configBulkActions: number
}

interface BadgeData {
  endpoint: string
  transform?: (data: any) => number
  permission?: string
  enabled?: boolean
}

export function useMenuBadges() {
  const { user } = useUser()
  const { selectedBar } = useBar()
  const [badges, setBadges] = useState<MenuBadges>({
    home: 0,
    checklist: 0,
    producao: 0,
    contaazul: 0,
    marketing: 0,
    visaoGeral: 0,
    configuracoes: 0,
    notifications: 0,
    checklistAbertura: 0,
    checklistFuncionario: 0,
    producaoReceitas: 0,
    producaoTerminal: 0,
    contaazulCompetencia: 0,
    marketingInstagram: 0,
    configChecklists: 0,
    configMetas: 0,
    configIntegracoes: 0,
    configSeguranca: 0,
    configWhatsapp: 0,
    configContahub: 0,
    configMeta: 0,
    configTemplates: 0,
    configAnalytics: 0,
    configCache: 0,
    configPwa: 0,
    configBulkActions: 0
  })

  // Configuração dos badges
  const badgeConfigs: Record<keyof MenuBadges, BadgeData> = {
    home: {
      endpoint: '/api/dashboard/resumo',
      transform: (data) => data.pendencias_gerais || 0,
      enabled: true
    },
    checklist: {
      endpoint: '/api/checklists/pendentes',
      transform: (data) => data.total_pendentes || 0,
      enabled: true
    },
    producao: {
      endpoint: '/api/producoes/pendentes',
      transform: (data) => data.receitas_pendentes || 0,
      enabled: true
    },
    contaazul: {
      endpoint: '/api/contaazul/status',
      transform: (data) => data.sync_pendentes || 0,
      enabled: true
    },
    marketing: {
      endpoint: '/api/meta/campanhas/ativas',
      transform: (data) => data.campanhas_ativas || 0,
      enabled: true
    },
    visaoGeral: {
      endpoint: '/api/dashboard/alertas',
      transform: (data) => data.alertas_pendentes || 0,
      enabled: true
    },
    configuracoes: {
      endpoint: '/api/configuracoes/pendencias',
      transform: (data) => data.total_configuracoes_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    notifications: {
      endpoint: '/api/notifications',
      transform: (data) => data.filter((n: any) => !n.lida).length || 0,
      enabled: true
    },
    // Subitems
    checklistAbertura: {
      endpoint: '/api/checklists/abertura/pendentes',
      transform: (data) => data.pendentes || 0,
      enabled: true
    },
    checklistFuncionario: {
      endpoint: '/api/checklists/funcionario/pendentes',
      transform: (data) => data.meus_pendentes || 0,
      enabled: true
    },
    producaoReceitas: {
      endpoint: '/api/producoes/receitas/pendentes',
      transform: (data) => data.receitas_pendentes || 0,
      enabled: true
    },
    producaoTerminal: {
      endpoint: '/api/producoes/terminal/pendentes',
      transform: (data) => data.terminal_pendentes || 0,
      enabled: true
    },
    contaazulCompetencia: {
      endpoint: '/api/contaazul/competencia/pendentes',
      transform: (data) => data.competencia_pendentes || 0,
      enabled: true
    },
    marketingInstagram: {
      endpoint: '/api/meta/instagram/pendentes',
      transform: (data) => data.posts_pendentes || 0,
      enabled: true
    },
    // Configurações subitems
    configChecklists: {
      endpoint: '/api/checklists/configuracao/pendentes',
      transform: (data) => data.config_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configMetas: {
      endpoint: '/api/metas/configuracao/pendentes',
      transform: (data) => data.metas_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configIntegracoes: {
      endpoint: '/api/configuracoes/integracoes/status',
      transform: (data) => data.integracoes_com_erro || 0,
      permission: 'admin',
      enabled: true
    },
    configSeguranca: {
      endpoint: '/api/security/alerts',
      transform: (data) => data.alertas_seguranca || 0,
      permission: 'admin',
      enabled: true
    },
    configWhatsapp: {
      endpoint: '/api/whatsapp/status',
      transform: (data) => data.desconectados || 0,
      permission: 'admin',
      enabled: true
    },
    configContahub: {
      endpoint: '/api/contahub/status',
      transform: (data) => data.sync_falhas || 0,
      permission: 'admin',
      enabled: true
    },
    configMeta: {
      endpoint: '/api/meta/configuracao/status',
      transform: (data) => data.config_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configTemplates: {
      endpoint: '/api/templates/pendentes',
      transform: (data) => data.templates_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configAnalytics: {
      endpoint: '/api/analytics/status',
      transform: (data) => data.dados_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configCache: {
      endpoint: '/api/cache/status',
      transform: (data) => data.cache_invalido || 0,
      permission: 'admin',
      enabled: true
    },
    configPwa: {
      endpoint: '/api/configuracoes/pwa/status',
      transform: (data) => data.atualizacoes_pendentes || 0,
      permission: 'admin',
      enabled: true
    },
    configBulkActions: {
      endpoint: '/api/configuracoes/bulk-actions/pendentes',
      transform: (data) => data.acoes_pendentes || 0,
      permission: 'admin',
      enabled: true
    }
  }

  // Função para buscar dados de um badge específico
  const fetchBadgeData = async (key: keyof MenuBadges, config: BadgeData) => {
    try {
      // Verificar permissão
      if (config.permission && user?.role !== config.permission) {
        return 0
      }

      // Verificar se está habilitado
      if (!config.enabled) {
        return 0
      }

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: selectedBar?.id,
          user_id: user?.id
        })
      })

      if (!response.ok) {
        console.warn(`Erro ao buscar badge ${key}:`, response.status)
        return 0
      }

      const data = await response.json()
      return config.transform ? config.transform(data) : 0
    } catch (error) {
      console.error(`Erro ao buscar badge ${key}:`, error)
      return 0
    }
  }

  // Função para atualizar todos os badges
  const updateAllBadges = async () => {
    if (!user?.id || !selectedBar?.id) return

    const newBadges = { ...badges }
    
    // Processar badges em lotes para evitar muitas requisições simultâneas
    const batchSize = 5
    const entries = Object.entries(badgeConfigs)
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async ([key, config]) => {
        const count = await fetchBadgeData(key as keyof MenuBadges, config)
        return { key, count }
      })
      
      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(({ key, count }) => {
        newBadges[key as keyof MenuBadges] = count
      })
    }
    
    setBadges(newBadges)
  }

  // Função para calcular badges compostos
  const calculateCompoundBadges = () => {
    const newBadges = { ...badges }
    
    // Checklist total = abertura + funcionário
    newBadges.checklist = newBadges.checklistAbertura + newBadges.checklistFuncionario
    
    // Produção total = receitas + terminal
    newBadges.producao = newBadges.producaoReceitas + newBadges.producaoTerminal
    
    // ContaAzul total = competência + outros
    newBadges.contaazul = newBadges.contaazulCompetencia
    
    // Marketing total = instagram + outros
    newBadges.marketing = newBadges.marketingInstagram
    
    // Configurações total = soma de todas as configs
    newBadges.configuracoes = newBadges.configChecklists + 
                             newBadges.configMetas + 
                             newBadges.configIntegracoes + 
                             newBadges.configSeguranca + 
                             newBadges.configWhatsapp + 
                             newBadges.configContahub + 
                             newBadges.configMeta + 
                             newBadges.configTemplates + 
                             newBadges.configAnalytics + 
                             newBadges.configCache + 
                             newBadges.configPwa + 
                             newBadges.configBulkActions
    
    setBadges(newBadges)
  }

  // Atualizar badges quando dependências mudarem
  useEffect(() => {
    if (user?.id && selectedBar?.id) {
      updateAllBadges()
    }
  }, [user?.id, selectedBar?.id])

  // Recalcular badges compostos quando badges individuais mudarem
  useEffect(() => {
    calculateCompoundBadges()
  }, [badges.checklistAbertura, badges.checklistFuncionario, badges.producaoReceitas, badges.producaoTerminal])

  // Função para forçar atualização de um badge específico
  const refreshBadge = async (key: keyof MenuBadges) => {
    const config = badgeConfigs[key]
    if (config) {
      const count = await fetchBadgeData(key, config)
      setBadges(prev => ({ ...prev, [key]: count }))
    }
  }

  // Função para forçar atualização de todos os badges
  const refreshAllBadges = () => {
    updateAllBadges()
  }

  return {
    badges,
    refreshBadge,
    refreshAllBadges,
    isLoading: !user?.id || !selectedBar?.id
  }
} 