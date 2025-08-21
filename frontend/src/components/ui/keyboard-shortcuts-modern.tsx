'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, 
  Command, 
  Search, 
  Settings, 
  Home,
  User,
  FileText,
  BarChart3,
  Calendar,
  Plus,
  Save,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Scissors,
  Delete,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  X,
  Zap,
  Star,
  Heart,
  Eye,
  EyeOff
} from 'lucide-react';

// Tipos para shortcuts
type ModifierKey = 'ctrl' | 'cmd' | 'alt' | 'shift';
type Key = string;

interface Shortcut {
  id: string;
  key: string;
  description: string;
  category: string;
  action: () => void;
  global?: boolean;
  context?: string;
  icon?: React.ReactNode;
  priority?: number;
}

interface KeyboardShortcutsProps {
  shortcuts?: Shortcut[];
  onShortcut?: (shortcut: Shortcut) => void;
  className?: string;
  disabled?: boolean;
}

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: Shortcut[];
}

// Hook para gerenciar shortcuts
export const useKeyboardShortcuts = (shortcuts: Shortcut[] = []) => {
  const [activeShortcuts, setActiveShortcuts] = useState<Shortcut[]>(shortcuts);
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastUsed, setLastUsed] = useState<Shortcut | null>(null);

  // Registrar shortcut
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setActiveShortcuts(prev => {
      const filtered = prev.filter(s => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
  }, []);

  // Remover shortcut
  const unregisterShortcut = useCallback((shortcutId: string) => {
    setActiveShortcuts(prev => prev.filter(s => s.id !== shortcutId));
  }, []);

  // Habilitar/desabilitar shortcuts
  const toggleShortcuts = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // Executar shortcut
  const executeShortcut = useCallback((shortcut: Shortcut) => {
    if (!isEnabled) return;
    
    try {
      shortcut.action();
      setLastUsed(shortcut);
    } catch (error) {
      console.error(`Erro ao executar shortcut ${shortcut.id}:`, error);
    }
  }, [isEnabled]);

  return {
    activeShortcuts,
    isEnabled,
    lastUsed,
    registerShortcut,
    unregisterShortcut,
    toggleShortcuts,
    executeShortcut
  };
};

// Hook para detectar combinações de teclas
export const useKeyCombination = (callback: (keys: Set<string>) => void) => {
  const pressedKeys = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const modifiers = new Set<string>();

    if (event.ctrlKey) modifiers.add('ctrl');
    if (event.metaKey) modifiers.add('cmd');
    if (event.altKey) modifiers.add('alt');
    if (event.shiftKey) modifiers.add('shift');

    // Adicionar tecla principal
    modifiers.add(key);

    pressedKeys.current = modifiers;
    callback(modifiers);
  }, [callback]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    pressedKeys.current.delete(key);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return pressedKeys.current;
};

// Componente principal de keyboard shortcuts
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts = [],
  onShortcut,
  className = '',
  disabled = false
}) => {
  const { activeShortcuts, executeShortcut } = useKeyboardShortcuts(shortcuts);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Mapear teclas para shortcuts
  const keyToShortcut = useCallback((keys: Set<string>) => {
    setPressedKeys(keys);
    
    // Encontrar shortcut que corresponde à combinação
    const shortcut = activeShortcuts.find(s => {
      const shortcutKeys = new Set(s.key.toLowerCase().split('+'));
      return keys.size === shortcutKeys.size && 
             Array.from(keys).every(key => shortcutKeys.has(key));
    });

    if (shortcut) {
      executeShortcut(shortcut);
      onShortcut?.(shortcut);
    }
  }, [activeShortcuts, executeShortcut, onShortcut]);

  // Usar hook de combinações de teclas
  useKeyCombination(keyToShortcut);

  if (disabled) {
    return <div className={className}></div>;
  }

  return (
    <div className={className}>
      {/* Indicador visual de teclas pressionadas */}
      {pressedKeys.size > 0 && (
        <motion.div
          className="fixed bottom-4 left-4 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            <div className="flex gap-1">
              {Array.from(pressedKeys).map((key, index) => (
                <kbd
                  key={index}
                  className="px-2 py-1 bg-gray-700 rounded text-xs font-mono"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Componente de ajuda de shortcuts
export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({
  isOpen,
  onClose,
  shortcuts = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrar shortcuts
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Agrupar por categoria
  const groupedShortcuts = filteredShortcuts.reduce((groups, shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = [];
    }
    groups[shortcut.category].push(shortcut);
    return groups;
  }, {} as Record<string, Shortcut[]>);

  // Categorias disponíveis
  const categories = ['all', ...Array.from(new Set(shortcuts.map(s => s.category)))];

  // Formatar tecla para exibição
  const formatKey = (key: string) => {
    return key.split('+').map(k => {
      const keyMap: Record<string, string> = {
        'ctrl': 'Ctrl',
        'cmd': '⌘',
        'alt': 'Alt',
        'shift': 'Shift',
        'enter': '↵',
        'escape': 'Esc',
        'tab': 'Tab',
        'space': 'Space',
        'backspace': '⌫',
        'delete': 'Del'
      };
      return keyMap[k] || k.toUpperCase();
    }).join(' + ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Atalhos de Teclado
                </h2>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search e Filtros */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-4">
                {/* Busca */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar atalhos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtro de categoria */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Todas as Categorias' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Shortcuts */}
            <div className="max-h-96 overflow-y-auto p-6">
              {Object.keys(groupedShortcuts).length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Keyboard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum atalho encontrado</p>
                  <p className="text-sm">Tente ajustar sua busca ou filtros</p>
                </div>
              ) : (
                Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                      {category}
                    </h3>
                    
                    <div className="grid gap-3">
                      {categoryShortcuts.map((shortcut) => (
                        <motion.div
                          key={shortcut.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center gap-3">
                            {shortcut.icon && (
                              <div className="text-blue-500">
                                {shortcut.icon}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {shortcut.description}
                              </p>
                              {shortcut.context && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {shortcut.context}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <kbd className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
                            {formatKey(shortcut.key)}
                          </kbd>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {filteredShortcuts.length} atalho{filteredShortcuts.length !== 1 ? 's' : ''} encontrado{filteredShortcuts.length !== 1 ? 's' : ''}
                </span>
                
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Keyboard className="w-4 h-4" />
                    <span>Pressione ? para abrir</span>
                  </span>
                  
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>Powered by Zykor</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para abrir ajuda de shortcuts
export const useShortcutHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Atalho global para abrir ajuda (?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
};

// Shortcuts padrão do sistema
export const defaultShortcuts: Shortcut[] = [
  // Navegação
  {
    id: 'help',
    key: '?',
    description: 'Abrir ajuda de atalhos',
    category: 'Sistema',
    action: () => {},
    global: true,
    icon: <HelpCircle className="w-4 h-4" />
  },
  {
    id: 'search',
    key: 'ctrl+k',
    description: 'Busca global',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <Search className="w-4 h-4" />
  },
  {
    id: 'home',
    key: 'ctrl+h',
    description: 'Ir para Home',
    category: 'Navegação',
    action: () => window.location.href = '/',
    global: true,
    icon: <Home className="w-4 h-4" />
  },
  {
    id: 'settings',
    key: 'ctrl+,',
    description: 'Configurações',
    category: 'Navegação',
    action: () => window.location.href = '/configuracoes',
    global: true,
    icon: <Settings className="w-4 h-4" />
  },

  // Edição
  {
    id: 'save',
    key: 'ctrl+s',
    description: 'Salvar',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Save className="w-4 h-4" />
  },
  {
    id: 'undo',
    key: 'ctrl+z',
    description: 'Desfazer',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Undo className="w-4 h-4" />
  },
  {
    id: 'redo',
    key: 'ctrl+shift+z',
    description: 'Refazer',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Redo className="w-4 h-4" />
  },
  {
    id: 'copy',
    key: 'ctrl+c',
    description: 'Copiar',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Copy className="w-4 h-4" />
  },
  {
    id: 'paste',
    key: 'ctrl+v',
    description: 'Colar',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Clipboard className="w-4 h-4" />
  },
  {
    id: 'cut',
    key: 'ctrl+x',
    description: 'Recortar',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Scissors className="w-4 h-4" />
  },
  {
    id: 'delete',
    key: 'delete',
    description: 'Excluir',
    category: 'Edição',
    action: () => {},
    global: true,
    icon: <Delete className="w-4 h-4" />
  },

  // Ações
  {
    id: 'new',
    key: 'ctrl+n',
    description: 'Novo item',
    category: 'Ações',
    action: () => {},
    global: true,
    icon: <Plus className="w-4 h-4" />
  },
  {
    id: 'escape',
    key: 'escape',
    description: 'Cancelar/Fechar',
    category: 'Ações',
    action: () => {},
    global: true,
    icon: <XCircle className="w-4 h-4" />
  },
  {
    id: 'enter',
    key: 'enter',
    description: 'Confirmar/Executar',
    category: 'Ações',
    action: () => {},
    global: true,
    icon: <ArrowRight className="w-4 h-4" />
  },

  // Navegação por teclado
  {
    id: 'arrow-up',
    key: 'arrowup',
    description: 'Navegar para cima',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowUp className="w-4 h-4" />
  },
  {
    id: 'arrow-down',
    key: 'arrowdown',
    description: 'Navegar para baixo',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowDown className="w-4 h-4" />
  },
  {
    id: 'arrow-left',
    key: 'arrowleft',
    description: 'Navegar para esquerda',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowLeft className="w-4 h-4" />
  },
  {
    id: 'arrow-right',
    key: 'arrowright',
    description: 'Navegar para direita',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowRight className="w-4 h-4" />
  },
  {
    id: 'tab',
    key: 'tab',
    description: 'Próximo campo',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowRight className="w-4 h-4" />
  },
  {
    id: 'shift-tab',
    key: 'shift+tab',
    description: 'Campo anterior',
    category: 'Navegação',
    action: () => {},
    global: true,
    icon: <ArrowLeft className="w-4 h-4" />
  }
];

// Componente de exemplo
export const KeyboardShortcutsExample: React.FC = () => {
  const { isOpen, toggle } = useShortcutHelp();
  const [lastExecuted, setLastExecuted] = useState<Shortcut | null>(null);

  const handleShortcut = useCallback((shortcut: Shortcut) => {
    setLastExecuted(shortcut);
    
    // Simular execução
    setTimeout(() => {
      setLastExecuted(null);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sistema de Keyboard Shortcuts
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sistema completo de atalhos de teclado com suporte a combinações globais, 
            contextuais e sistema de ajuda integrado
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Área de demonstração */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Demonstração
          </h2>

          {/* Card interativo */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-center mb-6">
              <Keyboard className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Teste os Atalhos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Use os atalhos de teclado para interagir com este card
              </p>
            </div>

            {/* Último atalho executado */}
            {lastExecuted && (
              <motion.div
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Atalho executado!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {lastExecuted.description} ({lastExecuted.key})
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Instruções */}
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Atalhos disponíveis:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> - Abrir ajuda</li>
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+K</kbd> - Busca global</li>
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+H</kbd> - Ir para Home</li>
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+,</kbd> - Configurações</li>
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+S</kbd> - Salvar</li>
                <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Z</kbd> - Desfazer</li>
              </ul>
            </div>
          </div>

          {/* Botão para abrir ajuda */}
          <div className="text-center">
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Abrir Ajuda de Atalhos
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Ou pressione <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd>
            </p>
          </div>
        </div>

        {/* Informações do sistema */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sobre o Sistema
          </h2>

          {/* Características */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Características
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>Atalhos Globais:</strong> Funcionam em toda a aplicação</li>
              <li>• <strong>Atalhos Contextuais:</strong> Específicos para cada tela</li>
              <li>• <strong>Combinações Complexas:</strong> Suporte a múltiplas teclas</li>
              <li>• <strong>Sistema de Ajuda:</strong> Documentação integrada</li>
              <li>• <strong>Detecção Automática:</strong> Funciona em diferentes sistemas</li>
              <li>• <strong>Feedback Visual:</strong> Indica teclas pressionadas</li>
            </ul>
          </div>

          {/* Estatísticas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {defaultShortcuts.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Atalhos Disponíveis
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Array.from(new Set(defaultShortcuts.map(s => s.category))).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Categorias
                </div>
              </div>
            </div>
          </div>

          {/* Compatibilidade */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Compatibilidade
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Windows/Linux:</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl</kbd>
              </div>
              <div className="flex items-center gap-2">
                <span>macOS:</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘</kbd>
              </div>
              <div className="flex items-center gap-2">
                <span>Universal:</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Alt</kbd>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de shortcuts */}
      <KeyboardShortcuts
        shortcuts={defaultShortcuts}
        onShortcut={handleShortcut}
      />

      {/* Ajuda de shortcuts */}
      <ShortcutHelp
        isOpen={isOpen}
        onClose={toggle}
        shortcuts={defaultShortcuts}
      />
    </div>
  );
};

export default KeyboardShortcutsExample;
