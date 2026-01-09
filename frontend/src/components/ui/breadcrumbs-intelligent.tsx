'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Home, 
  Folder, 
  File, 
  Settings, 
  BarChart3, 
  Calendar, 
  User, 
  Search,
  Clock,
  Star,
  Bookmark,
  History,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Shield,
  Zap,
  Sparkles,
  Package,
  CheckSquare,
  Share,
  MoreHorizontal,
  Download,
  Plus
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

// Tipos para breadcrumbs
interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  description?: string;
  isActive?: boolean;
  isClickable?: boolean;
  metadata?: {
    lastVisited?: Date;
    visitCount?: number;
    isBookmarked?: boolean;
    priority?: number;
  };
}

interface BreadcrumbContext {
  category: string;
  subcategory?: string;
  action?: string;
  id?: string;
}

interface IntelligentBreadcrumbsProps {
  className?: string;
  showMetadata?: boolean;
  animated?: boolean;
  compact?: boolean;
  showQuickActions?: boolean;
  onItemClick?: (item: BreadcrumbItem) => void;
}

// Hook para breadcrumbs inteligentes
export const useIntelligentBreadcrumbs = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Mapeamento de rotas para breadcrumbs
  const routeMapping = useMemo(() => ({
    '/': { label: 'Home', icon: <Home className="w-4 h-4" />, category: 'Navegação' },
    '/dashboard': { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, category: 'Navegação' },
    '/visao-geral': { label: 'Visão Geral', icon: <TrendingUp className="w-4 h-4" />, category: 'Análise' },
    '/configuracoes': { label: 'Configurações', icon: <Settings className="w-4 h-4" />, category: 'Sistema' },
    '/configuracoes/usuarios': { label: 'Usuários', icon: <User className="w-4 h-4" />, category: 'Administração' },
    '/configuracoes/permissoes': { label: 'Permissões', icon: <Shield className="w-4 h-4" />, category: 'Segurança' },
    '/configuracoes/privacidade': { label: 'Privacidade', icon: <Shield className="w-4 h-4" />, category: 'Segurança' },
    '/relatorios': { label: 'Relatórios', icon: <File className="w-4 h-4" />, category: 'Análise' },
    '/operacoes': { label: 'Operações', icon: <Zap className="w-4 h-4" />, category: 'Operacional' },
    '/configuracoes/fichas-tecnicas': { label: 'Fichas Técnicas', icon: <DollarSign className="w-4 h-4" />, category: 'Operacional' },
    '/operacoes/produtos': { label: 'Produtos', icon: <Package className="w-4 h-4" />, category: 'Operacional' },
    '/operacoes/planejamento': { label: 'Planejamento', icon: <Target className="w-4 h-4" />, category: 'Estratégico' },
    '/operacoes/tempo': { label: 'Tempo', icon: <Clock className="w-4 h-4" />, category: 'Operacional' },
    '/funcionario': { label: 'Funcionário', icon: <Users className="w-4 h-4" />, category: 'Operacional' },
    '/funcionario/checklists': { label: 'Checklists', icon: <CheckSquare className="w-4 h-4" />, category: 'Operacional' },
    '/agendamento': { label: 'Agendamento', icon: <Calendar className="w-4 h-4" />, category: 'Operacional' },
    '/analitico': { label: 'Analítico', icon: <BarChart3 className="w-4 h-4" />, category: 'Análise' },
    '/analitico/clientes': { label: 'Clientes', icon: <User className="w-4 h-4" />, category: 'Análise' },
    '/estrategico': { label: 'Estratégico', icon: <Target className="w-4 h-4" />, category: 'Estratégico' },
    '/estrategico/desempenho': { label: 'Desempenho', icon: <TrendingUp className="w-4 h-4" />, category: 'Estratégico' },
    '/estrategico/orcamentacao': { label: 'Orçamentação', icon: <DollarSign className="w-4 h-4" />, category: 'Financeiro' },
    '/estrategico/planejamento-comercial': { label: 'Planejamento Comercial', icon: <Target className="w-4 h-4" />, category: 'Estratégico' },
    '/operacional': { label: 'Operacional', icon: <Zap className="w-4 h-4" />, category: 'Operacional' },
    '/operacional/dre': { label: 'DRE', icon: <BarChart3 className="w-4 h-4" />, category: 'Financeiro' },
    '/usuarios': { label: 'Usuários', icon: <User className="w-4 h-4" />, category: 'Administração' },
    '/usuarios/redefinir-senha': { label: 'Redefinir Senha', icon: <Shield className="w-4 h-4" />, category: 'Segurança' },
    '/login': { label: 'Login', icon: <Shield className="w-4 h-4" />, category: 'Autenticação' },
    '/home': { label: 'Home', icon: <Home className="w-4 h-4" />, category: 'Navegação' },
    '/usuarios/minha-conta': { label: 'Minha Conta', icon: <User className="w-4 h-4" />, category: 'Usuário' },
    '/auth': { label: 'Autenticação', icon: <Shield className="w-4 h-4" />, category: 'Segurança' }
  }), []);

  // Gerar breadcrumbs a partir do pathname
  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Sempre incluir Home
    breadcrumbs.push({
      id: 'home',
      label: 'Home',
      path: '/',
      icon: <Home className="w-4 h-4" />,
      isActive: path === '/',
      isClickable: true,
      metadata: {
        lastVisited: new Date(),
        visitCount: 999,
        isBookmarked: true,
        priority: 10
      }
    });

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const routeInfo = routeMapping[currentPath];
      
      if (routeInfo) {
        breadcrumbs.push({
          id: segment,
          label: routeInfo.label,
          path: currentPath,
          icon: routeInfo.icon,
          description: routeInfo.category,
          isActive: currentPath === path,
          isClickable: true,
          metadata: {
            lastVisited: new Date(),
            visitCount: Math.floor(Math.random() * 50) + 1,
            isBookmarked: Math.random() > 0.7,
            priority: 10 - index
          }
        });
      } else {
        // Para rotas não mapeadas, criar breadcrumb genérico
        breadcrumbs.push({
          id: segment,
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          path: currentPath,
          icon: <File className="w-4 h-4" />,
          isActive: currentPath === path,
          isClickable: false,
          metadata: {
            lastVisited: new Date(),
            visitCount: 1,
            isBookmarked: false,
            priority: 5
          }
        });
      }
    });

    return breadcrumbs;
  }, [routeMapping]);

  // Breadcrumbs atuais
  const breadcrumbs = useMemo(() => generateBreadcrumbs(pathname), [pathname, generateBreadcrumbs]);

  // Navegar para um breadcrumb
  const navigateToBreadcrumb = useCallback((item: BreadcrumbItem) => {
    if (item.isClickable && item.path !== pathname) {
      router.push(item.path);
    }
  }, [router, pathname]);

  // Contexto atual da página
  const currentContext = useMemo(() => {
    const activeItem = breadcrumbs.find(b => b.isActive);
    if (!activeItem) return null;

    return {
      category: activeItem.description || 'Geral',
      subcategory: activeItem.label,
      action: 'visualizando',
      id: activeItem.id
    };
  }, [breadcrumbs]);

  return {
    breadcrumbs,
    currentContext,
    navigateToBreadcrumb,
    pathname
  };
};

// Componente principal de breadcrumbs inteligentes
export const IntelligentBreadcrumbs: React.FC<IntelligentBreadcrumbsProps> = ({
  className = '',
  showMetadata = false,
  animated = true,
  compact = false,
  showQuickActions = true,
  onItemClick
}) => {
  const { breadcrumbs, currentContext, navigateToBreadcrumb } = useIntelligentBreadcrumbs();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);

  // Ações rápidas baseadas no contexto
  const quickActions = useMemo(() => {
    if (!currentContext) return [];

    const actions = [
      {
        id: 'bookmark',
        label: 'Favoritar',
        icon: <Bookmark className="w-4 h-4" />,
        action: () => console.log('Favoritar página')
      },
      {
        id: 'history',
        label: 'Histórico',
        icon: <History className="w-4 h-4" />,
        action: () => console.log('Ver histórico')
      },
      {
        id: 'share',
        label: 'Compartilhar',
        icon: <Share className="w-4 h-4" />,
        action: () => console.log('Compartilhar página')
      }
    ];

    // Adicionar ações específicas por categoria
    if (currentContext.category === 'Administração') {
      actions.push({
        id: 'new',
        label: 'Novo',
        icon: <Plus className="w-4 h-4" />,
        action: () => console.log('Criar novo item')
      });
    }

    if (currentContext.category === 'Análise') {
      actions.push({
        id: 'export',
        label: 'Exportar',
        icon: <Download className="w-4 h-4" />,
        action: () => console.log('Exportar dados')
      });
    }

    return actions;
  }, [currentContext]);

  // Manipular clique no breadcrumb
  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      navigateToBreadcrumb(item);
    }
  }, [onItemClick, navigateToBreadcrumb]);

  if (compact) {
    return (
      <nav className={`flex items-center space-x-1 text-sm ${className}`}>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
            <button
              onClick={() => handleBreadcrumbClick(item)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                item.isActive
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${!item.isClickable ? 'cursor-default' : 'cursor-pointer'}`}
              disabled={!item.isClickable}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumbs principais */}
      <nav className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <button
                onClick={() => handleBreadcrumbClick(item)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  item.isActive
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${!item.isClickable ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={!item.isClickable}
              >
                <div className={`transition-transform duration-200 ${
                  hoveredItem === item.id ? 'scale-110' : 'scale-100'
                }`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                
                {showMetadata && item.metadata && (
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    {item.metadata.isBookmarked && (
                      <Bookmark className="w-3 h-3 text-yellow-500" />
                    )}
                    {item.metadata.visitCount && (
                      <span className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                        {item.metadata.visitCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </motion.div>
          </React.Fragment>
        ))}
      </nav>

      {/* Contexto e ações rápidas */}
      {showQuickActions && currentContext && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Contexto atual */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Folder className="w-4 h-4" />
              <span className="font-medium">{currentContext.category}</span>
              {currentContext.subcategory && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>{currentContext.subcategory}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Última visita: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
              </motion.button>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuickActionsMenu(!showQuickActionsMenu)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Menu de ações expandidas */}
      <AnimatePresence>
        {showQuickActionsMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Ações Rápidas
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de exemplo
export const BreadcrumbsIntelligentExample: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/configuracoes/usuarios');
  const [showMetadata, setShowMetadata] = useState(true);
  const [compact, setCompact] = useState(false);
  const [animated, setAnimated] = useState(true);

  const mockBreadcrumbs = [
    { id: 'home', label: 'Home', path: '/', icon: <Home className="w-4 h-4" />, isActive: false, isClickable: true },
    { id: 'configuracoes', label: 'Configurações', path: '/configuracoes', icon: <Settings className="w-4 h-4" />, isActive: false, isClickable: true },
    { id: 'usuarios', label: 'Usuários', path: '/configuracoes/usuarios', icon: <User className="w-4 h-4" />, isActive: true, isClickable: false }
  ];

  const handleBreadcrumbClick = useCallback((item: any) => {
    if (item.isClickable) {
      setCurrentPath(item.path);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Breadcrumbs Inteligentes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sistema de navegação contextual com breadcrumbs inteligentes, 
            metadados e ações rápidas baseadas no contexto
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Controles
          </h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMetadata}
                onChange={(e) => setShowMetadata(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar Metadados</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Modo Compacto</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Animações</span>
            </label>
          </div>
        </div>

        {/* Demonstração */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Demonstração
          </h2>
          
          <div className="space-y-6">
            {/* Breadcrumbs padrão */}
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Breadcrumbs Padrão
              </h3>
              <IntelligentBreadcrumbs
                showMetadata={showMetadata}
                animated={animated}
                compact={compact}
                showQuickActions={true}
                onItemClick={handleBreadcrumbClick}
              />
            </div>

            {/* Breadcrumbs compactos */}
            {!compact && (
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Breadcrumbs Compactos
                </h3>
                <IntelligentBreadcrumbs
                  showMetadata={false}
                  animated={false}
                  compact={true}
                  showQuickActions={false}
                  onItemClick={handleBreadcrumbClick}
                />
              </div>
            )}
          </div>
        </div>

        {/* Informações do sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Características
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>Navegação Contextual:</strong> Breadcrumbs inteligentes</li>
              <li>• <strong>Metadados:</strong> Histórico e estatísticas</li>
              <li>• <strong>Ações Rápidas:</strong> Baseadas no contexto</li>
              <li>• <strong>Animações:</strong> Transições suaves</li>
              <li>• <strong>Modo Compacto:</strong> Para espaços limitados</li>
              <li>• <strong>Responsivo:</strong> Adaptável a diferentes telas</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Contexto Atual
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Categoria: <strong>Administração</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Subcategoria: <strong>Usuários</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Ação: <strong>Visualizando</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbsIntelligentExample;
