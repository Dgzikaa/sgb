'use client'

import { useMenuBadgesMock } from '@/hooks/useMenuBadgesMock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  CheckSquare, 
  ChefHat, 
  Calculator, 
  TrendingUp, 
  Settings,
  Users,
  Utensils,
  Zap,
  FileText,
  Target,
  Database,
  Shield,
  MessageSquare,
  Clock,
  BarChart3,
  Smartphone
} from 'lucide-react'

export function DemoMenuBadges() {
  const { badges } = useMenuBadgesMock()

  const menuStructure = [
    {
      icon: Home,
      label: 'Home',
      badge: badges.home,
      color: 'text-blue-600'
    },
    {
      icon: CheckSquare,
      label: 'Checklist',
      badge: badges.checklist,
      color: 'text-green-600',
      subItems: [
        { icon: CheckSquare, label: 'Checklists', badge: badges.checklistAbertura },

      ]
    },
    {
      icon: ChefHat,
      label: 'Produção',
      badge: badges.producao,
      color: 'text-orange-600',
      subItems: [
        { icon: Utensils, label: 'Receitas', badge: badges.producaoReceitas },
        { icon: Zap, label: 'Terminal', badge: badges.producaoTerminal }
      ]
    },
    {
      icon: Calculator,
      label: 'Windsor.ai',
badge: badges.windsor,
      color: 'text-blue-500',
      subItems: [
        { icon: FileText, label: 'Analytics', badge: badges.windsor }
      ]
    },
    {
      icon: TrendingUp,
      label: 'Marketing',
      badge: badges.marketing,
      color: 'text-pink-600',
      subItems: [
        { icon: BarChart3, label: 'Marketing 360', badge: badges.marketingWindsor }
      ]
    },
    {
      icon: Settings,
      label: 'Configurações',
      badge: badges.configuracoes,
      color: 'text-gray-600',
      subItems: [
        { icon: CheckSquare, label: 'Checklists', badge: badges.configChecklists },
        { icon: Target, label: 'Metas', badge: badges.configMetas },
        { icon: Database, label: 'Integrações', badge: badges.configIntegracoes },
        { icon: Shield, label: 'Segurança', badge: badges.configSeguranca },
        { icon: MessageSquare, label: 'WhatsApp', badge: badges.configWhatsapp },
        { icon: Zap, label: 'ContaHub Auto', badge: badges.configContahub },
        { icon: Clock, label: 'Meta Config', badge: badges.configMeta },
        { icon: FileText, label: 'Templates', badge: badges.configTemplates },
        { icon: BarChart3, label: 'Analytics', badge: badges.configAnalytics },
        { icon: Database, label: 'Cache', badge: badges.configCache },
        { icon: Smartphone, label: 'PWA', badge: badges.configPwa },
        { icon: CheckSquare, label: 'Bulk Actions', badge: badges.configBulkActions }
      ]
    }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🏷️ Sistema de Badges - Menu Lateral
          </CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Demonstração dos badges implementados em todos os itens do menu
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {menuStructure.map((item) => (
              <Card key={item.label} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {item.subItems && (
                    <div className="ml-8 space-y-2">
                      {item.subItems.map((subItem) => (
                        <div key={subItem.label} className="flex items-center gap-2 text-sm">
                          <subItem.icon className="w-4 h-4 text-gray-500" />
                          <span>{subItem.label}</span>
                          {subItem.badge && subItem.badge > 0 && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              {subItem.badge}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📊 Resumo dos Badges
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Total Home: <Badge variant="secondary">{badges.home}</Badge></div>
              <div>Total Checklist: <Badge variant="secondary">{badges.checklist}</Badge></div>
              <div>Total Produção: <Badge variant="secondary">{badges.producao}</Badge></div>
              <div>Total Windsor.ai: <Badge variant="secondary">{badges.windsor}</Badge></div>
              <div>Total Marketing: <Badge variant="secondary">{badges.marketing}</Badge></div>
              <div>Total Configurações: <Badge variant="secondary">{badges.configuracoes}</Badge></div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Recursos Implementados
            </h4>
            <ul className="text-sm space-y-1">
              <li>• Badges dinâmicos em todos os itens do menu</li>
              <li>• Badges compostos (soma dos subitens)</li>
              <li>• Hook centralizado para gerenciar badges</li>
              <li>• Sistema de permissões integrado</li>
              <li>• Atualização em tempo real</li>
              <li>• Suporte a dark mode</li>
              <li>• Performance otimizada com batching</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
