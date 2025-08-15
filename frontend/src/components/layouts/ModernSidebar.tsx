'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useMenuBadges } from '@/hooks/useMenuBadges';
import {
  Home,
  CheckSquare,
  Settings,
  BarChart3,
  Calendar,
  Users,
  Database,
  Zap,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Shield,
  Target,
  Smartphone,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Wrench,
} from 'lucide-react';

interface SubMenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  description?: string;
  permission?: string;
}

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  badge?: number;
  color?: string;
  permission?: string;
  subItems?: SubMenuItem[];
}

// Permission mapping para cada item do sidebar
const PERMISSION_MAPPINGS: Record<string, string[]> = {
  // Permissões principais - 'todos' só é checado pelo hook hasPermission
  home: ['home'],
  operacoes: ['operacoes', 'checklists', 'terminal_producao', 'receitas_insumos', 'operacoes_checklists', 'operacoes_receitas', 'operacoes_meus_checklists', 'operacoes_terminal'],
  gestao: ['gestao', 'tempo', 'planejamento'],
  marketing: ['marketing', 'marketing_360'],
  financeiro: ['financeiro', 'financeiro_agendamento', 'dashboard_financeiro_mensal'],
  relatorios: ['relatorios', 'dashboard_financeiro_mensal', 'marketing_360'],
  configuracoes: ['configuracoes'],
  
  // Submenu mappings específicos - SEM 'todos' para testar permissões granulares
  checklists: ['checklists', 'operacoes_checklists', 'operacoes_meus_checklists'],
  terminal_producao: ['terminal_producao', 'operacoes_terminal'],
  receitas_insumos: ['receitas_insumos', 'operacoes_receitas'],
  tempo: ['tempo'],
  planejamento: ['planejamento'],
  marketing_360: ['marketing_360'],
  financeiro_agendamento: ['financeiro_agendamento'],
  dashboard_financeiro_mensal: ['dashboard_financeiro_mensal'],
  configuracoes_checklists: ['configuracoes_checklists'],
  configuracoes_metas: ['configuracoes_metas'],
  configuracoes_integracoes: ['configuracoes_integracoes'],
  configuracoes_seguranca: ['configuracoes_seguranca'],
  configuracoes_whatsapp: ['configuracoes_whatsapp'],
  configuracoes_contahub: ['configuracoes_contahub'],
  configuracoes_meta_config: ['configuracoes_meta_config'],
  configuracoes_templates: ['configuracoes_templates'],
  configuracoes_analytics: ['configuracoes_analytics'],
  configuracoes_pwa: ['configuracoes_pwa'],
};

// Estrutura base do sidebar
const defaultSidebarItems: SidebarItem[] = [
    {
      icon: Target,
      label: 'Estratégico',
      href: '/estrategico',
      color: 'text-blue-600 dark:text-blue-400',
      permission: 'gestao',
      subItems: [
        {
          icon: TrendingUp,
          label: 'Visão Geral',
          href: '/estrategico/visao-geral',
          description: 'Visão estratégica completa do negócio',
          permission: 'home',
        },
        {
          icon: BarChart3,
          label: 'Desempenho',
          href: '/estrategico/desempenho',
          description: 'Análise semanal de performance',
          permission: 'gestao',
        },
        {
          icon: Calendar,
          label: 'Planejamento Comercial',
          href: '/estrategico/planejamento-comercial',
          description: 'Estratégia comercial e metas',
          permission: 'planejamento',
        },
        {
          icon: DollarSign,
          label: 'Orçamentação',
          href: '/estrategico/orcamentacao',
          description: 'Gestão orçamentária integrada',
          permission: 'configuracoes',
        },
      ],
    },
    {
      icon: Zap,
      label: 'Operacional',
      href: '/operacional',
      color: 'text-orange-600 dark:text-orange-400',
      permission: 'operacoes',
      subItems: [
        {
          icon: BarChart3,
          label: 'DRE',
          href: '/operacional/dre',
          description: 'Demonstrativo de Resultado Operacional',
          permission: 'dashboard_financeiro_mensal',
        },
        {
          icon: Calendar,
          label: 'Agendamentos',
          href: '/operacional/agendamentos',
          description: 'Gestão de agendamentos operacionais',
          permission: 'financeiro_agendamento',
        },
      ],
    },
    {
      icon: Wrench,
      label: 'Ferramentas',
      href: '/ferramentas',
      color: 'text-green-600 dark:text-green-400',
      permission: 'operacoes',
      subItems: [
        {
          icon: Calendar,
          label: 'Agendamento',
          href: '/ferramentas/agendamento',
          description: 'Ferramenta de agendamento avançado',
          permission: 'financeiro_agendamento',
        },
        {
          icon: MessageSquare,
          label: 'Agente',
          href: '/ferramentas/agente',
          description: 'Assistente AI integrado com análise de dados',
          permission: 'operacoes',
        },
      ],
    },
    {
      icon: BarChart3,
      label: 'Analítico',
      href: '/analitico',
      color: 'text-indigo-600 dark:text-indigo-400',
      permission: 'relatorios',
      subItems: [
        {
          icon: Users,
          label: 'Clientes',
          href: '/analitico/clientes',
          description: 'Análise de clientes mais recorrentes',
          permission: 'relatorios',
        },
      ],
    },
    {
      icon: Settings,
      label: 'Configurações',
      href: '/configuracoes',
      color: 'text-gray-600 dark:text-gray-400',
    permission: 'configuracoes',
      subItems: [
        {
          icon: CheckSquare,
          label: 'Checklists',
          href: '/configuracoes/checklists',
          description: 'Configurar checklists',
        permission: 'configuracoes_checklists',
        },
        {
          icon: Target,
          label: 'Metas',
          href: '/configuracoes/metas',
          description: 'Configurar metas',
        permission: 'configuracoes_metas',
        },
        {
          icon: DollarSign,
          label: 'Orçamentação',
          href: '/configuracoes/orcamentacao',
          description: 'Controle de orçamento',
        permission: 'configuracoes',
        },
        {
          icon: Database,
          label: 'Integrações',
          href: '/configuracoes/integracoes',
          description: 'APIs e integrações',
        permission: 'configuracoes_integracoes',
        },
        {
          icon: Shield,
          label: 'Segurança',
          href: '/configuracoes/seguranca',
          description: 'Configurações de segurança',
        permission: 'configuracoes_seguranca',
        },
        {
          icon: MessageSquare,
          label: 'WhatsApp',
          href: '/configuracoes/whatsapp',
          description: 'Configurar WhatsApp',
        permission: 'configuracoes_whatsapp',
        },
        {
          icon: Zap,
          label: 'ContaHub Auto',
          href: '/configuracoes/contahub-automatico',
          description: 'Sincronização automática',
        permission: 'configuracoes_contahub',
        },
        {
          icon: Clock,
          label: 'Meta Config',
          href: '/configuracoes/meta-config',
          description: 'Configuração Meta',
        permission: 'configuracoes_meta_config',
        },
        {
          icon: FileText,
          label: 'Templates',
          href: '/configuracoes/templates',
          description: 'Gerenciar templates',
        permission: 'configuracoes_templates',
        },
        {
          icon: BarChart3,
          label: 'Analytics',
          href: '/configuracoes/analytics',
          description: 'Configurar analytics',
        permission: 'configuracoes_analytics',
        },
        {
          icon: Smartphone,
          label: 'PWA',
          href: '/configuracoes/pwa',
          description: 'Progressive Web App',
        permission: 'configuracoes_pwa',
        },
      ],
    },
  ];

// Loading skeleton para quando estiver carregando
function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 w-16">
      <div className="h-10 bg-gray-700/20 animate-pulse rounded-lg"></div>
      <div className="h-10 bg-gray-700/20 animate-pulse rounded-lg"></div>
      <div className="h-10 bg-gray-700/20 animate-pulse rounded-lg"></div>
    </div>
  );
}

// Componente helper para conteúdo do item
function ItemContent({
  item,
  isItemActive,
  isHovered,
}: {
  item: SidebarItem;
  isItemActive: boolean;
  isHovered: boolean;
}) {
  return (
    <>
      <item.icon
        className={`w-5 h-5 flex-shrink-0 transition-colors ${
          isItemActive
            ? 'text-blue-600 dark:text-blue-400'
            : item.color || 'text-gray-500 dark:text-gray-400'
        }`}
      />
      {isHovered && (
        <span className="ml-3 font-medium animate-slide-in-from-left duration-200 flex-1">
          {item.label}
        </span>
      )}
      {item.badge && isHovered && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-slide-in-from-right duration-200 shadow-sm">
          {item.badge}
        </span>
      )}
    </>
  );
}

export function ModernSidebar() {
  // 1. Estados do componente
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [manuallyToggledItems, setManuallyToggledItems] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 2. Hooks de contexto
  const pathname = usePathname();
  const { hasPermission, user, loading: userLoading } = usePermissions();
  const { badges } = useMenuBadges();

  // 3. Função helper para verificar permissões
  const hasAnyMappedPermission = useCallback((permissionKey: string) => {
    if (!permissionKey) return false;
    
    // Se o usuário tem permissão "todos", dar acesso a tudo
    if (hasPermission('todos')) {
      return true;
    }
    
    const mappedPermissions = PERMISSION_MAPPINGS[permissionKey] || [permissionKey];
    
    // Verifica cada permissão mapeada
    const permissionResults = mappedPermissions.map(perm => ({
      permission: perm,
      hasAccess: hasPermission(perm)
    }));
    
    const hasAccess = permissionResults.some(result => result.hasAccess);
    
    return hasAccess;
  }, [hasPermission]);

  // 4. Items do sidebar filtrados por permissão
  const sidebarItems = useMemo(() => {
    if (!user || userLoading) return [];

    const filterItemsByPermissions = (items: SidebarItem[]): SidebarItem[] => {
      return items.filter(item => {
        // Verifica permissão do item principal
        const hasMainPermission = hasAnyMappedPermission(item.permission || '');

        // Se tem subitems, filtra eles também
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(subItem => {
            const hasSubPermission = hasAnyMappedPermission(subItem.permission || '');
            return hasSubPermission;
          });

          // Mostra o pai se tem pelo menos um subitem visível OU se tem permissão principal
          if (filteredSubItems.length > 0 || hasMainPermission) {
            item.subItems = filteredSubItems;
            return true;
          }
        }

        return hasMainPermission;
      });
    };

    // Aplica badges
    const itemsWithBadges = defaultSidebarItems.map(item => ({
      ...item,
      badge: item.label === 'Home' && badges?.home > 0 ? badges.home : undefined,
    }));

    return filterItemsByPermissions(itemsWithBadges);
  }, [user, userLoading, hasAnyMappedPermission, badges]);

  // 5. Callbacks
  const toggleExpanded = useCallback((label: string) => {
    setExpandedItems(prev => {
      const newState = prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label];
      return newState;
    });

    setManuallyToggledItems(prev =>
      prev.includes(label) ? prev : [...prev, label]
    );
  }, []);

  const isActive = useCallback((href: string) => {
    if (!pathname) return false;
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  }, [pathname]);

  const hasActiveSubItem = useCallback((subItems?: SubMenuItem[]) => {
    if (!subItems || !pathname) return false;
    return subItems.some(subItem => pathname.startsWith(subItem.href));
  }, [pathname]);

  const isExpanded = useCallback((label: string) => {
    if (manuallyToggledItems.includes(label)) {
      return expandedItems.includes(label);
    }

    if (isHovered) {
      const item = sidebarItems.find(item => item.label === label);
      if (item?.subItems && hasActiveSubItem(item.subItems)) {
      return true;
      }
    }

    return false;
  }, [manuallyToggledItems, expandedItems, isHovered, hasActiveSubItem, sidebarItems]);

  // 6. Effects
  useEffect(() => {
    if (pathname?.includes('/analitico/dre') && !expandedItems.includes('Analítico')) {
      setExpandedItems(prev => [...prev, 'Analítico']);
    }
  }, [pathname, expandedItems]);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 7. Loading and error states
  const isLoading = userLoading || !isInitialized;
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  if (!user) {
    return null;
  }

  // 8. Render principal
  return (
    <aside
      className={`
        hidden md:flex flex-col flex-shrink-0 h-full
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-width duration-300 ease-out
        ${isHovered ? 'w-64' : 'w-14'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setTimeout(() => setManuallyToggledItems([]), 3000);
      }}
    >
      <div className="flex flex-col h-full pt-2 pb-2">
        {/* Navigation items */}
        <nav className="flex-1 px-2 overflow-hidden">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const isItemActive = item.href
                ? isActive(item.href)
                : hasActiveSubItem(item.subItems);
              const itemExpanded = isExpanded(item.label);

              return (
                <div key={item.label}>
                  {/* Item principal */}
                  <div
                    className={`group flex items-center h-10 px-3 transition-width transition-colors duration-200 rounded-xl relative cursor-pointer
                      ${ isHovered ? 'justify-start' : 'justify-center'}
                      ${ isItemActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                   `}
                  >
                    {/* Link wrapper */}
                    {item.href ? (
                      <Link href={item.href} className="flex items-center flex-1">
                        <ItemContent
                          item={item}
                          isItemActive={isItemActive}
                          isHovered={isHovered}
                        />
                      </Link>
                    ) : (
                      <ItemContent
                        item={item}
                        isItemActive={isItemActive}
                        isHovered={isHovered}
                      />
                    )}

                    {/* Botão expand/collapse */}
                    {item.subItems && item.subItems.length > 0 && isHovered && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExpanded(item.label);
                        }}
                        className="ml-2 p-1 rounded-[6px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {itemExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    )}

                    {/* Tooltip */}
                    {!isHovered && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                      </div>
                    )}
                  </div>

                  {/* Sub-items */}
                  {item.subItems && item.subItems.length > 0 && isHovered && itemExpanded && (
                    <div className="ml-6 mt-1 space-y-1 animate-slide-in-from-top">
                      {item.subItems.map(subItem => {
                        const isSubActive = isActive(subItem.href);

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`group flex items-center px-3 py-2 rounded-[8px] transition-all duration-200 text-sm ${
                              isSubActive
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="ml-3 font-medium">
                              {subItem.label}
                            </span>
                            {subItem.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div
            className={`flex items-center transition-all duration-300 ${
              isHovered ? 'justify-between px-3' : 'justify-center'
            }`}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
              {isHovered && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 animate-slide-in-from-left">
                  Online
                </span>
              )}
            </div>
            {isHovered && (
              <span className="text-xs text-gray-400 dark:text-gray-500 animate-slide-in-from-right">
                v2.0
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}