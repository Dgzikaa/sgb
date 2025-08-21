'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, usePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Settings, 
  BarChart3,
  Users,
  FileText,
  Calendar,
  Zap,
  Sparkles,
  Star,
  Heart
} from 'lucide-react';

// Tipos para transições
type TransitionType = 
  | 'slide' 
  | 'fade' 
  | 'scale' 
  | 'flip' 
  | 'cube' 
  | 'morph' 
  | 'slide-up' 
  | 'slide-down' 
  | 'zoom-in' 
  | 'zoom-out'
  | 'rotate'
  | 'bounce'
  | 'elastic'
  | 'spring';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  ease?: string;
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

interface TransitionConfig {
  initial: any;
  animate: any;
  exit: any;
  transition: any;
}

// Configurações de transição por tipo
const transitionConfigs: Record<TransitionType, TransitionConfig> = {
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.6, ease: "easeInOut" }
  },
  
  'slide-up': {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
    transition: { duration: 0.6, ease: "easeInOut" }
  },
  
  'slide-down': {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { duration: 0.6, ease: "easeInOut" }
  },
  
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4, ease: "easeInOut" }
  },
  
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
    transition: { duration: 0.5, ease: "easeInOut" }
  },
  
  flip: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 },
    transition: { duration: 0.7, ease: "easeInOut" }
  },
  
  cube: {
    initial: { rotateX: -90, rotateY: -90, opacity: 0 },
    animate: { rotateX: 0, rotateY: 0, opacity: 1 },
    exit: { rotateX: 90, rotateY: 90, opacity: 0 },
    transition: { duration: 0.8, ease: "easeInOut" }
  },
  
  morph: {
    initial: { 
      borderRadius: '50%', 
      scale: 0, 
      rotate: -180, 
      opacity: 0 
    },
    animate: { 
      borderRadius: '0%', 
      scale: 1, 
      rotate: 0, 
      opacity: 1 
    },
    exit: { 
      borderRadius: '50%', 
      scale: 0, 
      rotate: 180, 
      opacity: 0 
    },
    transition: { duration: 0.6, ease: "easeInOut" }
  },
  
  'zoom-in': {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  },
  
  'zoom-out': {
    initial: { scale: 1.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  },
  
  rotate: {
    initial: { rotate: -360, scale: 0, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: 360, scale: 0, opacity: 0 },
    transition: { duration: 0.8, ease: "easeInOut" }
  },
  
  bounce: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
    transition: { 
      duration: 0.6, 
      ease: "easeOut",
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  
  elastic: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { 
      duration: 0.8, 
      ease: "easeOut",
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  },
  
  spring: {
    initial: { y: 50, opacity: 0, scale: 0.9 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -50, opacity: 0, scale: 0.9 },
    transition: { 
      duration: 0.6, 
      ease: "easeOut",
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

// Componente principal de transição de página
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'slide',
  duration,
  delay = 0,
  ease,
  className = '',
  onEnter,
  onExit
}) => {
  const [isPresent, safeToRemove] = usePresence();
  const config = transitionConfigs[type];
  
  // Aplicar configurações customizadas
  const finalConfig = {
    ...config,
    transition: {
      ...config.transition,
      duration: duration || config.transition.duration,
      ease: ease || config.transition.ease,
      delay
    }
  };

  useEffect(() => {
    if (isPresent) {
      onEnter?.();
    } else {
      onExit?.();
    }
  }, [isPresent, onEnter, onExit]);

  useEffect(() => {
    if (!isPresent) {
      setTimeout(safeToRemove, finalConfig.transition.duration * 1000);
    }
  }, [isPresent, safeToRemove, finalConfig.transition.duration]);

  return (
    <motion.div
      className={className}
      initial={finalConfig.initial}
      animate={finalConfig.animate}
      exit={finalConfig.exit}
      transition={finalConfig.transition}
      style={{
        perspective: type === 'flip' || type === 'cube' ? '1000px' : 'none',
        transformStyle: type === 'flip' || type === 'cube' ? 'preserve-3d' : 'flat'
      }}
    >
      {children}
    </motion.div>
  );
};

// Hook para gerenciar transições de página
export const usePageTransitions = () => {
  const [currentTransition, setCurrentTransition] = useState<TransitionType>('slide');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  // Detectar mudança de rota
  useEffect(() => {
    if (previousPath.current !== pathname) {
      setIsTransitioning(true);
      previousPath.current = pathname;
      
      // Resetar estado após transição
      setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    }
  }, [pathname]);

  // Função para navegar com transição específica
  const navigateWithTransition = useCallback((
    path: string, 
    transition: TransitionType = 'slide'
  ) => {
    setCurrentTransition(transition);
    setIsTransitioning(true);
    router.push(path);
  }, [router]);

  // Função para voltar com transição
  const goBackWithTransition = useCallback((transition: TransitionType = 'slide') => {
    setCurrentTransition(transition);
    setIsTransitioning(true);
    router.back();
  }, [router]);

  return {
    currentTransition,
    isTransitioning,
    navigateWithTransition,
    goBackWithTransition,
    setCurrentTransition
  };
};

// Componente de navegação com transições
export const TransitionalNavigation: React.FC = () => {
  const { navigateWithTransition, goBackWithTransition } = usePageTransitions();
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('slide');

  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" />, transition: 'fade' as TransitionType },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, transition: 'slide' as TransitionType },
    { path: '/usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" />, transition: 'scale' as TransitionType },
    { path: '/relatorios', label: 'Relatórios', icon: <FileText className="w-4 h-4" />, transition: 'flip' as TransitionType },
    { path: '/agendamento', label: 'Agendamento', icon: <Calendar className="w-4 h-4" />, transition: 'slide-up' as TransitionType },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings className="w-4 h-4" />, transition: 'morph' as TransitionType }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Navegação com Transições
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Experimente diferentes efeitos de transição entre páginas
        </p>
      </div>

      {/* Seletor de transição */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de Transição:
        </label>
        <select
          value={selectedTransition}
          onChange={(e) => setSelectedTransition(e.target.value as TransitionType)}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {Object.keys(transitionConfigs).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Botões de navegação */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {navigationItems.map((item) => (
          <motion.button
            key={item.path}
            onClick={() => navigateWithTransition(item.path, item.transition)}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {item.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.transition}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => goBackWithTransition(selectedTransition)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </motion.button>
        
        <motion.button
          onClick={() => navigateWithTransition('/dashboard', selectedTransition)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Dashboard
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

// Componente de exemplo de transições
export const PageTransitionsExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transitionType, setTransitionType] = useState<TransitionType>('slide');

  const pages = [
    {
      id: 1,
      title: 'Página 1',
      content: 'Conteúdo da primeira página com transição suave',
      color: 'from-blue-500 to-purple-600',
      icon: <Star className="w-12 h-12" />
    },
    {
      id: 2,
      title: 'Página 2',
      content: 'Segunda página com animações cinematográficas',
      color: 'from-green-500 to-teal-600',
      icon: <Heart className="w-12 h-12" />
    },
    {
      id: 3,
      title: 'Página 3',
      content: 'Terceira página com efeitos visuais avançados',
      color: 'from-red-500 to-pink-600',
      icon: <Zap className="w-12 h-12" />
    }
  ];

  const nextPage = () => {
    setCurrentPage(prev => prev === pages.length ? 1 : prev + 1);
  };

  const prevPage = () => {
    setCurrentPage(prev => prev === 1 ? pages.length : prev - 1);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Transitions Cinematográficas
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Experimente diferentes tipos de transições entre páginas com animações suaves e efeitos visuais impressionantes
        </p>
      </div>

      {/* Seletor de transição */}
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de Transição:
        </label>
        <select
          value={transitionType}
          onChange={(e) => setTransitionType(e.target.value as TransitionType)}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {Object.keys(transitionConfigs).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Container das páginas */}
      <div className="max-w-4xl mx-auto">
        <div className="relative h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {pages.map((page) => 
              page.id === currentPage && (
                <PageTransition
                  key={page.id}
                  type={transitionType}
                  className="absolute inset-0 flex flex-col items-center justify-center text-white"
                >
                  <div className={`w-full h-full bg-gradient-to-br ${page.color} flex flex-col items-center justify-center p-8 text-center`}>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="mb-6"
                    >
                      {page.icon}
                    </motion.div>
                    
                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-3xl font-bold mb-4"
                    >
                      {page.title}
                    </motion.h3>
                    
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-lg max-w-md"
                    >
                      {page.content}
                    </motion.p>
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="mt-6 text-4xl font-bold opacity-20"
                    >
                      {page.id}
                    </motion.div>
                  </div>
                </PageTransition>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Controles de navegação */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <motion.button
            onClick={prevPage}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </motion.button>
          
          <div className="flex gap-2">
            {pages.map((page) => (
              <motion.button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentPage === page.id 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
            ))}
          </div>
          
          <motion.button
            onClick={nextPage}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Próxima
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Informações sobre transições */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(transitionConfigs).map(([type, config]) => (
            <motion.div
              key={type}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              whileHover={{ y: -2, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                {type}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duração: {config.transition.duration}s
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Easing: {config.transition.ease}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
