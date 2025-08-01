'use client';

import { useState } from 'react';
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
  TrendingUp,
  Database,
  Zap,
  ChefHat,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  Utensils,
  Calculator,
  Shield,
  RefreshCw,
  CheckCircle,
  Target,
  Smartphone,
  DollarSign,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import React from 'react'; // Added missing import for React

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

export function ModernSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [manuallyToggledItems, setManuallyToggledItems] = useState<string[]>(
    []
  );
  const pathname = usePathname();
  const { isRole, hasPermission, user } = usePermissions();
  
  // Debug: Log das permissões do usuário
  React.useEffect(() => {
    if (user) {
      console.log('🔍 Debug Sidebar - Usuário:', user);
      console.log('🔍 Debug Sidebar - Permissões:', user.modulos_permitidos);
      console.log('🔍 Debug Sidebar - hasPermission("checklists"):', hasPermission('checklists'));
      console.log('🔍 Debug Sidebar - hasPermission("todos"):', hasPermission('todos'));
    }
  }, [user, hasPermission]);
  const { badges } = useMenuBadges();

  // Auto-expandir Financeiro se estiver na página DRE
  React.useEffect(() => {
    if (pathname.includes('/financeiro/dre') && !expandedItems.includes('Financeiro')) {
      setExpandedItems(prev => [...prev, 'Financeiro']);
    }
  }, [pathname, expandedItems]);

  // Função para obter itens da sidebar com badges dinâmicos e filtros de permissão
  const getSidebarItems = (): SidebarItem[] => {
    const allItems: SidebarItem[] = [
      {
        icon: Home,
        label: 'Home',
        href: '/home',
        color: 'text-blue-600 dark:text-blue-400',
        badge: badges.home > 0 ? badges.home : undefined,
        permission: 'home',
      },

      {
        icon: Zap,
        label: 'Operações',
        href: '/operacoes',
        color: 'text-orange-600 dark:text-orange-400',
        permission: 'operacoes',
        subItems: [
          {
            icon: CheckSquare,
            label: 'Gestão de Checklists',
            href: '/operacoes/checklists',
            description: 'Gestão de checklists',
            permission: 'checklists',
          },
          {
            icon: Users,
            label: 'Meus Checklists',
            href: '/operacoes/checklists/checklists-funcionario',
            description: 'Meus checklists pessoais',
            permission: 'checklists',
          },
          {
            icon: FileText,
            label: 'Receitas',
            href: '/operacoes/receitas',
            description: 'Gestão de receitas operacionais',
            permission: 'receitas_insumos',
          },
          {
            icon: Zap,
            label: 'Terminal de Produção',
            href: '/operacoes/terminal',
            description: 'Terminal de produção em tempo real',
            permission: 'terminal_producao',
          },
        ],
      },

      {
        icon: BarChart3,
        label: 'Relatórios',
        href: '/relatorios',
        color: 'text-blue-600 dark:text-blue-400',
        permission: 'relatorio_producoes',
        subItems: [
          {
            icon: BarChart3,
            label: 'Visão Geral',
            href: '/relatorios/visao-geral',
            description: 'Dashboard principal',
            permission: 'dashboard_diario',
          },
        ],
      },

      {
        icon: TrendingUp,
        label: 'Marketing',
        href: '/marketing',
        color: 'text-pink-600 dark:text-pink-400',
        permission: 'marketing',
        subItems: [
          {
            icon: TrendingUp,
            label: 'Marketing 360',
            href: '/marketing/marketing-360',
            description: 'Estratégia completa',
            permission: 'marketing_360',
          },
        ],
      },

      {
        icon: Users,
        label: 'Gestão',
        href: '/gestao',
        color: 'text-indigo-600 dark:text-indigo-400',
        permission: 'gestao',
        subItems: [
          {
            icon: TrendingUp,
            label: 'Tabela de Desempenho',
            href: '/gestao/desempenho',
            description: 'Métricas e ranking da equipe',
            permission: 'tempo',
          },
          {
            icon: Calendar,
            label: 'Calendário',
            href: '/gestao/calendario',
            description: 'Gestão de eventos e agendamentos',
            permission: 'planejamento',
          },
          {
            icon: BarChart3,
            label: 'Planejamento Comercial',
            href: '/gestao/planejamento-comercial',
            description: 'Análise detalhada de eventos e indicadores',
            permission: 'planejamento',
          },
        ],
      },

      {
        icon: DollarSign,
        label: 'Financeiro',
        href: '/financeiro',
        color: 'text-green-600 dark:text-green-400',
        permission: 'financeiro',
        subItems: [
          {
            icon: Calendar,
            label: 'Agendamento',
            href: '/financeiro/agendamento',
            description: 'Agendar pagamentos',
            permission: 'pagamentos',
          },
          {
            icon: BarChart3,
            label: 'DRE',
            href: '/financeiro/dre',
            description: 'Demonstrativo de Resultado',
            permission: 'dashboard_financeiro_mensal',
          },
        ],
      },

      {
        icon: Settings,
        label: 'Configurações',
        href: '/configuracoes',
        color: 'text-gray-600 dark:text-gray-400',
        badge: badges.configuracoes > 0 ? badges.configuracoes : undefined,
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

    // Filtrar itens baseado nas permissões do usuário
    const filterItemsByPermissions = (items: SidebarItem[]): SidebarItem[] => {
      return items.filter(item => {
        // Home sempre é visível
        if (item.label === 'Home') {
          return true;
        }

        // Operações é visível se tem qualquer permissão relacionada
        if (item.label === 'Operações') {
          return hasPermission('checklists') || 
                 hasPermission('terminal_producao') || 
                 hasPermission('receitas_insumos') ||
                 hasPermission('operacoes') ||
                 hasPermission('todos');
        }

        // Se o item tem permissão definida, verificar se o usuário tem acesso
        // Caso contrário, assumir que tem acesso (para itens sem permissão específica)
        let hasItemAccess = true;
        
        if (item.permission) {
          hasItemAccess = hasPermission(item.permission) || 
                         hasPermission(item.label.toLowerCase()) ||
                         hasPermission(item.label.toLowerCase().replace(' ', '_')) ||
                         hasPermission('todos'); // Permissão especial "todos"
        }

        // Se o item tem subitens, filtrar os subitens também
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(subItem => {
            if (!subItem.permission) return true;
            
            // Verificar múltiplas variações da permissão
            return hasPermission(subItem.permission) ||
                   hasPermission(subItem.label.toLowerCase()) ||
                   hasPermission(subItem.label.toLowerCase().replace(' ', '_')) ||
                   hasPermission(subItem.label.toLowerCase().replace(/\s+/g, '_')) ||
                   hasPermission('todos'); // Permissão especial "todos"
          });
          
          // Se há subitens após filtrar, mostrar o item pai
          if (filteredSubItems.length > 0) {
            item.subItems = filteredSubItems;
            return true;
          }
          
          // Se não há subitens mas o item pai tem acesso direto, mostrar
          if (hasItemAccess) {
            return true;
          }
          
          return false;
        }

        return hasItemAccess;
      });
    };

    return filterItemsByPermissions(allItems);
  };

  // Obter itens da sidebar com badges
  const sidebarItems = getSidebarItems();

  // Usar diretamente os itens da sidebar (já inclui configurações)
  const allSidebarItems = sidebarItems;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  const hasActiveSubItem = (subItems?: SubMenuItem[]) => {
    if (!subItems || !pathname) return false;
    return subItems.some(subItem => pathname.startsWith(subItem.href));
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const newState = prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label];
      return newState;
    });

    // Marcar como manualmente manipulado
    setManuallyToggledItems(prev =>
      prev.includes(label) ? prev : [...prev, label]
    );
  };

  const isExpanded = (label: string) => {
    // Se o item foi manipulado manualmente, respeita apenas o estado manual
    if (manuallyToggledItems.includes(label)) {
      const result = expandedItems.includes(label);
      return result;
    }

    // Se não foi manipulado manualmente, pode usar expansão automática por hover
    if (
      isHovered &&
      hasActiveSubItem(
        allSidebarItems.find(item => item.label === label)?.subItems
      )
    ) {
      return true;
    }

    return false;
  };

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
            {allSidebarItems.map(item => {
              const isItemActive = item.href
                ? isActive(item.href)
                : hasActiveSubItem(item.subItems);
              const itemExpanded = isExpanded(item.label);

              return (
                <div key={item.label}>
                  {/* Main item */}
                  <div
                    className={`group flex items-center h-10 px-3 transition-width transition-colors duration-200 rounded-xl relative cursor-pointer
                      ${ isHovered ? 'justify-start' : 'justify-center'}
                      ${ isItemActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                   `}
                  >
                    {/* Link wrapper for items with direct href - clicar no nome/ícone navega */}
                    {item.href ? (
                      <Link href={item.href} className="flex items-center flex-1">
                        <ItemContent
                          item={item}
                          isItemActive={isItemActive}
                          isHovered={isHovered}
                          hasSubItems={!!item.subItems}
                          isExpanded={itemExpanded}
                          showExpandIcon={false}
                        />
                      </Link>
                    ) : (
                      <ItemContent
                        item={item}
                        isItemActive={isItemActive}
                        isHovered={isHovered}
                        hasSubItems={!!item.subItems}
                        isExpanded={itemExpanded}
                        showExpandIcon={false}
                      />
                    )}

                    {/* Botão separado para expandir/colapsar - clicar na setinha expande */}
                    {item.subItems && isHovered && (
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

                    {/* Tooltip for collapsed state */}
                    {!isHovered && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                      </div>
                    )}
                  </div>

                  {/* Sub-items */}
                  {item.subItems && isHovered && itemExpanded && (
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

        {/* Bottom section */}
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

// Componente auxiliar para renderizar o conteúdo do item
function ItemContent({
  item,
  isItemActive,
  isHovered,
  hasSubItems = false,
  isExpanded = false,
  showExpandIcon = true,
}: {
  item: SidebarItem;
  isItemActive: boolean;
  isHovered: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  showExpandIcon?: boolean;
}) {
  return (
    <>
      {/* Icon */}
      <item.icon
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isItemActive
            ? 'text-blue-600 dark:text-blue-400'
            : item.color || 'text-gray-500 dark:text-gray-400'
        }`}
      />

      {/* Label */}
      {isHovered && (
        <span className="ml-3 font-medium animate-slide-in-from-left duration-200 flex-1 text-sm">
          {item.label}
        </span>
      )}

      {/* Badge */}
      {item.badge && isHovered && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-slide-in-from-right duration-200 shadow-sm">
          {item.badge}
        </span>
      )}

      {/* Expand/Collapse Icon for items with subitems */}
      {showExpandIcon && hasSubItems && isHovered && (
        <div className="ml-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      )}
    </>
  );
}
