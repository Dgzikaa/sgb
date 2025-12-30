'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useMenuBadges } from '@/hooks/useMenuBadges';
import {
  Home,
  CheckSquare,
  ChefHat,
  TrendingUp,
  BarChart3,
  Menu,
  X,
  Zap,
  Target,
  Wrench,
  Settings,
  Package,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  color?: string;
}

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Menu hambúrguer overlay completo (igual ao sidebar desktop)
function MobileHamburgerMenu({ isOpen, onClose }: MobileHamburgerMenuProps) {
  const pathname = usePathname();
  const { isRole } = usePermissions();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  const toggleSection = (label: string) => {
    setExpandedSections(prev => 
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  // Estrutura completa do menu (igual ao sidebar)
  const menuSections = [
    {
      icon: Target,
      label: 'Estratégico',
      href: '/estrategico',
      color: 'text-blue-600 dark:text-blue-400',
      subItems: [
        { icon: TrendingUp, label: 'Visão Geral', href: '/estrategico/visao-geral' },
        { icon: BarChart3, label: 'Desempenho', href: '/estrategico/desempenho' },
        { icon: Calendar, label: 'Planejamento Comercial', href: '/estrategico/planejamento-comercial' },
      ],
    },
    {
      icon: Sparkles,
      label: 'Retrospectiva 2025',
      href: '/retrospectiva-2025',
      color: 'text-purple-600 dark:text-purple-400',
      subItems: [
        { icon: Sparkles, label: 'Visão Geral', href: '/retrospectiva-2025' },
        { icon: BarChart3, label: 'Análise Detalhada', href: '/retrospectiva-2025/detalhes' },
      ],
    },
    {
      icon: Wrench,
      label: 'Ferramentas',
      href: '/ferramentas',
      color: 'text-green-600 dark:text-green-400',
      subItems: [
        { icon: Package, label: 'Produção e Insumos', href: '/ferramentas/producao-insumos' },
        { icon: Package, label: 'Contagem de Estoque', href: '/ferramentas/contagem-estoque' },
        { icon: Calendar, label: 'Agendamento', href: '/ferramentas/agendamento' },
        { icon: Users, label: 'NPS', href: '/ferramentas/nps' },
        { icon: TrendingUp, label: 'CMV Semanal', href: '/ferramentas/cmv-semanal' },
        { icon: Users, label: 'Simulação de CMO', href: '/ferramentas/simulacao-cmo' },
        { icon: AlertTriangle, label: 'Stockout', href: '/ferramentas/stockout' },
      ],
    },
    {
      icon: BarChart3,
      label: 'Analítico',
      href: '/analitico',
      color: 'text-indigo-600 dark:text-indigo-400',
      subItems: [
        { icon: Clock, label: 'Eventos', href: '/analitico/eventos' },
        { icon: Users, label: 'Clientes', href: '/analitico/clientes' },
        { icon: Users, label: 'Clientes Ativos', href: '/relatorios/clientes-ativos' },
      ],
    },
  ];

  // Adicionar Configurações se for admin
  if (isRole('admin')) {
    menuSections.push({
      icon: Settings,
      label: 'Configurações',
      href: '/configuracoes',
      color: 'text-gray-600 dark:text-gray-400',
      subItems: [],
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
      />

      {/* Menu content */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              SGB Mobile
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu items - estrutura completa */}
        <div className="p-4 space-y-2 pb-20">
          {/* Home */}
          <Link
            href="/home"
            onClick={onClose}
            className={`flex items-center p-3 rounded-xl transition-colors ${
              isActive('/home')
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium">Home</span>
          </Link>

          {/* Seções expansíveis */}
          {menuSections.map(section => {
            const isExpanded = expandedSections.includes(section.label);
            const sectionActive = isActive(section.href);
            
            return (
              <div key={section.label}>
                {/* Cabeçalho da seção */}
                <button
                  onClick={() => {
                    if (section.subItems.length > 0) {
                      toggleSection(section.label);
                    } else {
                      onClose();
                      window.location.href = section.href;
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    sectionActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <section.icon className={`w-5 h-5 flex-shrink-0 ${section.color}`} />
                    <span className="ml-3 font-medium">{section.label}</span>
                  </div>
                  {section.subItems.length > 0 && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )
                  )}
                </button>

                {/* Subitens */}
                {isExpanded && section.subItems.length > 0 && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                    {section.subItems.map(subItem => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onClose}
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          isActive(subItem.href)
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <subItem.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="ml-2 text-sm">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Online
              </span>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              v2.0 Mobile
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export function BottomNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { badges } = useMenuBadges();

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  // Principais funcionalidades para bottom nav - PÁGINAS PRINCIPAIS
  const bottomNavItems: BottomNavItem[] = [
    {
      icon: Home,
      label: 'Home',
      href: '/home',
      color: 'text-blue-600 dark:text-blue-400',
      badge: badges.home > 0 ? badges.home : undefined,
    },
    {
      icon: Target,
      label: 'Estratégico',
      href: '/estrategico',
      color: 'text-blue-600 dark:text-blue-400',
      badge: badges.visaoGeral > 0 ? badges.visaoGeral : undefined,
    },
    {
      icon: Wrench,
      label: 'Ferramentas',
      href: '/ferramentas',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: BarChart3,
      label: 'Analítico',
      href: '/analitico',
      color: 'text-indigo-600 dark:text-indigo-400',
      badge: badges.marketing > 0 ? badges.marketing : undefined,
    },
    {
      icon: Menu,
      label: 'Menu',
      href: '#',
      color: 'text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - apenas no mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        {/* Gradient shadow above */}
        <div className="h-4 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>

        {/* Navigation bar */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-2">
          <div className="flex items-center justify-around">
            {bottomNavItems.map(item => {
              const active = isActive(item.href);
              const isMenuButton = item.href === '#';
              
              if (isMenuButton) {
                return (
                  <button
                    key="menu"
                    onClick={() => setIsMenuOpen(true)}
                    className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="relative">
                      <Menu className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Menu
                    </span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="relative">
                    <item.icon
                      className={`w-5 h-5 mb-1 transition-colors ${
                        active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Bottom padding para compensar fixed bottom nav - apenas no mobile */}
      <div className="h-20 md:hidden"></div>
    </>
  );
}
