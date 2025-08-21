'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Sparkles,
  Palette,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

// Tipos para temas
type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  variant?: 'default' | 'compact' | 'floating' | 'sidebar';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showSystem?: boolean;
  animated?: boolean;
  className?: string;
  onThemeChange?: (theme: Theme) => void;
}

// Hook para gerenciar tema
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Detectar tema do sistema
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Aplicar tema ao documento
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    const actualTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    // Remover classes antigas
    root.classList.remove('light', 'dark');
    
    // Adicionar nova classe
    root.classList.add(actualTheme);
    
    // Atualizar atributo data-theme
    root.setAttribute('data-theme', actualTheme);
    
    // Persistir no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    setTheme(newTheme);
    setResolvedTheme(actualTheme);
  }, [getSystemTheme]);

  // Inicializar tema
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const initialTheme = savedTheme || 'system';
      applyTheme(initialTheme);
      setMounted(true);
    }
  }, [applyTheme]);

  // Escutar mudanças no tema do sistema
  useEffect(() => {
    if (typeof window !== 'undefined' && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolvedTheme);
        
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
        root.setAttribute('data-theme', newResolvedTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Função para mudar tema
  const changeTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
  }, [applyTheme]);

  return {
    theme,
    resolvedTheme,
    mounted,
    changeTheme,
    getSystemTheme
  };
};

// Componente principal
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'default',
  size = 'md',
  showLabels = true,
  showSystem = true,
  animated = true,
  className = '',
  onThemeChange
}) => {
  const { theme, resolvedTheme, mounted, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState<Theme | null>(null);

  // Tamanhos dos componentes
  const sizeClasses = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-base'
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-lg'
    }
  };

  // Variantes do componente
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    compact: 'bg-transparent',
    floating: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50',
    sidebar: 'bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600'
  };

  // Opções de tema
  const themeOptions: Array<{
    value: Theme;
    label: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  }> = [
    {
      value: 'light',
      label: 'Claro',
      icon: <Sun className={sizeClasses[size].icon} />,
      description: 'Tema claro para ambientes bem iluminados',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      value: 'dark',
      label: 'Escuro',
      icon: <Moon className={sizeClasses[size].icon} />,
      description: 'Tema escuro para ambientes com pouca luz',
      color: 'from-blue-600 to-purple-700'
    },
    ...(showSystem ? [{
      value: 'system',
      label: 'Sistema',
      icon: <Monitor className={sizeClasses[size].icon} />,
      description: 'Segue as preferências do seu sistema',
      color: 'from-gray-500 to-gray-600'
    }] : [])
  ];

  // Função para mudar tema
  const handleThemeChange = useCallback((newTheme: Theme) => {
    changeTheme(newTheme);
    onThemeChange?.(newTheme);
    setIsOpen(false);
  }, [changeTheme, onThemeChange]);

  // Não renderizar até estar montado
  if (!mounted) {
    return (
      <div className={`${sizeClasses[size].button} rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  // Variante compacta (apenas ícone)
  if (variant === 'compact') {
    return (
      <motion.button
        className={`${sizeClasses[size].button} rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
        onClick={() => handleThemeChange(resolvedTheme === 'light' ? 'dark' : 'light')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Mudar para tema ${resolvedTheme === 'light' ? 'escuro' : 'claro'}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedTheme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {resolvedTheme === 'light' ? (
              <Moon className={sizeClasses[size].icon} />
            ) : (
              <Sun className={sizeClasses[size].icon} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  }

  // Variante padrão com dropdown
  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <motion.button
        className={`${sizeClasses[size].button} rounded-lg flex items-center justify-center ${variantClasses[variant]} shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        title="Alterar tema"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedTheme}
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative"
          >
            {resolvedTheme === 'light' ? (
              <Sun className={sizeClasses[size].icon} />
            ) : (
              <Moon className={sizeClasses[size].icon} />
            )}
            
            {/* Indicador de tema ativo */}
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Dropdown de temas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Escolher Tema
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Personalize a aparência do sistema
              </p>
            </div>

            {/* Opções de tema */}
            <div className="p-2">
              {themeOptions.map((option) => {
                const isActive = theme === option.value;
                const isHovered = hoveredTheme === option.value;
                
                return (
                  <motion.button
                    key={option.value}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => handleThemeChange(option.value)}
                    onMouseEnter={() => setHoveredTheme(option.value)}
                    onMouseLeave={() => setHoveredTheme(null)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Ícone com gradiente */}
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-white shadow-lg`}>
                        {option.icon}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${sizeClasses[size].text} ${
                            isActive 
                              ? 'text-blue-900 dark:text-blue-100' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {option.label}
                          </h4>
                          
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                              className="w-2 h-2 rounded-full bg-blue-500"
                            />
                          )}
                        </div>
                        
                        {showLabels && (
                          <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${
                            isActive 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {option.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Indicador de seleção */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                          className="text-blue-500"
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer com informações adicionais */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Tema atual: {resolvedTheme === 'light' ? 'Claro' : 'Escuro'}</span>
                </span>
                
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Preferência: {theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Escuro'}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop para fechar */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Componente de exemplo com todas as variantes
export const ThemeSwitcherExample: React.FC = () => {
  const { theme, resolvedTheme, changeTheme } = useTheme();

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Theme Switcher
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tema atual: <strong>{theme}</strong> | Resolvido: <strong>{resolvedTheme}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Variante padrão */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Padrão</h3>
          <ThemeSwitcher variant="default" size="md" />
        </div>

        {/* Variante compacta */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Compacto</h3>
          <ThemeSwitcher variant="compact" size="md" />
        </div>

        {/* Variante flutuante */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Flutuante</h3>
          <ThemeSwitcher variant="floating" size="md" />
        </div>

        {/* Variante sidebar */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Sidebar</h3>
          <ThemeSwitcher variant="sidebar" size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tamanhos */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tamanhos</h3>
          <div className="flex items-center justify-center gap-4">
            <ThemeSwitcher variant="compact" size="sm" />
            <ThemeSwitcher variant="compact" size="md" />
            <ThemeSwitcher variant="compact" size="lg" />
          </div>
        </div>

        {/* Com labels */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Com Labels</h3>
          <ThemeSwitcher variant="default" size="md" showLabels={true} />
        </div>

        {/* Sem sistema */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Sem Sistema</h3>
          <ThemeSwitcher variant="default" size="md" showSystem={false} />
        </div>
      </div>

      {/* Controles manuais */}
      <div className="text-center space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Controles Manuais</h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => changeTheme('light')}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Forçar Claro
          </button>
          <button
            onClick={() => changeTheme('dark')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Forçar Escuro
          </button>
          <button
            onClick={() => changeTheme('system')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Sistema
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
