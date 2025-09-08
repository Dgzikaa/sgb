'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  badgeColor?: 'default' | 'secondary' | 'destructive' | 'outline';
  description?: string;
  keywords?: string[];
  category: 'main' | 'operations' | 'reports' | 'config' | 'admin';
  requiredRole?: 'admin' | 'manager' | 'user';
  importance?: 'high' | 'medium' | 'low';
  isNew?: boolean;
  isActive?: boolean;
  subItems?: MenuItem[];
}

interface NavigationContext {
  currentPath: string;
  userRole: string;
  barId: string;
  recentPages: string[];
  favorites: string[];
  workflowState: 'opening' | 'production' | 'closing' | 'reports' | 'normal';
}

interface SmartSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function SmartSidebar({
  isCollapsed = false,
  onToggle,
}: SmartSidebarProps) {
  const pathname = usePathname();
  const { selectedBar } = useBar();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'config',
  ]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [workflowState, setWorkflowState] = useState<
    'opening' | 'production' | 'closing' | 'reports' | 'normal'
  >('normal');

  // Definir itens de menu com contexto inteligente - APENAS CONFIGURAÇÕES
  const menuItems: MenuItem[] = [
    // Configuration - ÚNICO ITEM DO MENU
    {
      id: 'configuracoes',
      title: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      category: 'config',
      importance: 'high',
      keywords: ['configurações', 'admin', 'sistema'],
      requiredRole: 'admin',
    },
  ];

  // Detectar contexto de navegação
  const navigationContext: NavigationContext = useMemo(() => {
    return {
      currentPath: pathname,
      userRole: user?.role || 'user',
      barId: String(selectedBar?.id || ''),
      recentPages,
      favorites,
      workflowState,
    };
  }, [pathname, user?.role, selectedBar?.id, recentPages, favorites, workflowState]);

  // Filtrar itens baseado no contexto e permissões
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Verificar permissões de role
      if (item.requiredRole && navigationContext.userRole !== item.requiredRole) {
        return false;
      }

      // Filtrar por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.keywords?.some(keyword => keyword.toLowerCase().includes(query)) ||
          item.description?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [menuItems, navigationContext.userRole, searchQuery]);

  // Agrupar itens por categoria
  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, MenuItem[]>>(
      (acc, item) => {
        const category = item.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      },
      {}
    );
  }, [filteredItems]);

  // Função para alternar favoritos
  const toggleFavorite = (itemId: string) => {
    setFavorites(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Função para alternar categoria expandida
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  // Verificar se item está ativo
  const isItemActive = (item: MenuItem) => {
    if (item.href === '/configuracoes') {
      return pathname === '/configuracoes' || pathname.startsWith('/configuracoes');
    }
    return pathname === item.href || pathname.startsWith(item.href);
  };

  // Mapear nomes das categorias
  const categoryNames = {
    main: 'Principal',
    operations: 'Operações',
    reports: 'Relatórios',
    config: 'Configurações',
    admin: 'Administração',
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Gestão
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {!isCollapsed && items.length > 0 && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}

              {(isCollapsed || expandedCategories.includes(category)) && (
                <div className="space-y-1">
                  {items.map(item => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isCollapsed={isCollapsed}
                      isActive={isItemActive(item)}
                      isFavorite={favorites.includes(item.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Sistema Online</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para item de navegação
function NavItem({
  item,
  isCollapsed,
  isActive,
  isFavorite,
  onToggleFavorite,
}: {
  item: MenuItem;
  isCollapsed: boolean;
  isActive: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 flex-shrink-0',
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
        )}
      />

      {!isCollapsed && (
        <>
          <span className="flex-1 font-medium text-sm truncate">
            {item.title}
          </span>

          <div className="flex items-center gap-1">
            {item.isNew && <Sparkles className="h-3 w-3 text-yellow-500" />}

            {item.badge && (
              <Badge
                variant={item.badgeColor || 'secondary'}
                className="text-xs"
              >
                {item.badge}
              </Badge>
            )}

            <button
              onClick={e => {
                e.preventDefault();
                onToggleFavorite(item.id);
              }}
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                isFavorite
                  ? 'text-yellow-500'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {isFavorite ? (
                <Star className="h-3 w-3 fill-current" />
              ) : (
                <Star className="h-3 w-3" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <a
      href={item.href}
      className="block"
      title={isCollapsed ? item.title : undefined}
    >
      {content}
    </a>
  );
}