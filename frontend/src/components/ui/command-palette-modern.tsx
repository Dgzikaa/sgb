'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Command, 
  ArrowUp, 
  ArrowDown, 
  ArrowRight,
  Settings,
  User,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Home,
  Plus,
  X,
  Sparkles,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Shield,
  HelpCircle
} from 'lucide-react';

// Tipos para comandos
interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  shortcut?: string;
  priority?: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  placeholder?: string;
  className?: string;
}

// Comandos padrão do sistema
const defaultCommands: CommandItem[] = [
  // Navegação
  {
    id: 'home',
    title: 'Ir para Home',
    description: 'Voltar para a página inicial',
    category: 'Navegação',
    icon: <Home className="w-4 h-4" />,
    keywords: ['home', 'início', 'página inicial', 'dashboard'],
    action: () => window.location.href = '/',
    shortcut: '⌘H'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Visualizar métricas e indicadores',
    category: 'Navegação',
    icon: <BarChart3 className="w-4 h-4" />,
    keywords: ['dashboard', 'métricas', 'indicadores', 'estatísticas'],
    action: () => window.location.href = '/dashboard',
    shortcut: '⌘D'
  },
  {
    id: 'usuarios',
    title: 'Gerenciar Usuários',
    description: 'Administrar usuários do sistema',
    category: 'Navegação',
    icon: <Users className="w-4 h-4" />,
    keywords: ['usuários', 'usuarios', 'gerenciar', 'admin'],
    action: () => window.location.href = '/configuracoes/usuarios',
    shortcut: '⌘U'
  },
  
  // Ações
  {
    id: 'novo-usuario',
    title: 'Novo Usuário',
    description: 'Criar novo usuário',
    category: 'Ações',
    icon: <Plus className="w-4 h-4" />,
    keywords: ['novo', 'criar', 'adicionar', 'usuário'],
    action: () => window.location.href = '/configuracoes/usuarios/novo',
    shortcut: '⌘N'
  },
  {
    id: 'novo-evento',
    title: 'Novo Evento',
    description: 'Agendar novo evento',
    category: 'Ações',
    icon: <Calendar className="w-4 h-4" />,
    keywords: ['evento', 'agendar', 'calendário', 'compromisso'],
    action: () => window.location.href = '/agendamento/novo',
    shortcut: '⌘E'
  },
  
  // Configurações
  {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Acessar configurações do sistema',
    category: 'Configurações',
    icon: <Settings className="w-4 h-4" />,
    keywords: ['configurações', 'config', 'ajustes', 'preferências'],
    action: () => window.location.href = '/configuracoes',
    shortcut: '⌘,'
  },
  {
    id: 'perfil',
    title: 'Meu Perfil',
    description: 'Editar perfil e preferências',
    category: 'Configurações',
    icon: <User className="w-4 h-4" />,
    keywords: ['perfil', 'conta', 'preferências', 'configurações pessoais'],
    action: () => window.location.href = '/usuarios/minha-conta',
    shortcut: '⌘P'
  },
  
  // Relatórios
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Acessar relatórios e análises',
    category: 'Relatórios',
    icon: <FileText className="w-4 h-4" />,
    keywords: ['relatórios', 'relatorios', 'análises', 'relatórios'],
    action: () => window.location.href = '/relatorios',
    shortcut: '⌘R'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Visualizar análises avançadas',
    category: 'Relatórios',
    icon: <TrendingUp className="w-4 h-4" />,
    keywords: ['analytics', 'análises', 'métricas', 'estatísticas'],
    action: () => window.location.href = '/analitico',
    shortcut: '⌘A'
  },
  
  // Sistema
  {
    id: 'ajuda',
    title: 'Ajuda e Suporte',
    description: 'Acessar documentação e suporte',
    category: 'Sistema',
    icon: <HelpCircle className="w-4 h-4" />,
    keywords: ['ajuda', 'suporte', 'documentação', 'tutorial'],
    action: () => window.location.href = '/ajuda',
    shortcut: '⌘?'
  },
  {
    id: 'sair',
    title: 'Sair do Sistema',
    description: 'Fazer logout da conta',
    category: 'Sistema',
    icon: <X className="w-4 h-4" />,
    keywords: ['sair', 'logout', 'desconectar', 'encerrar sessão'],
    action: () => {
      // Implementar logout
      console.log('Logout');
    },
    shortcut: '⌘Q'
  }
];

// Componente principal
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands = defaultCommands,
  placeholder = 'Digite um comando ou pesquise...',
  className = ''
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([]);

  // Filtrar comandos baseado na busca
  const filterCommands = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      return commands.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    const searchLower = searchTerm.toLowerCase();
    return commands
      .filter(command => 
        command.title.toLowerCase().includes(searchLower) ||
        command.description?.toLowerCase().includes(searchLower) ||
        command.keywords.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        command.category.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        // Priorizar por relevância
        const aTitleMatch = a.title.toLowerCase().includes(searchLower);
        const bTitleMatch = b.title.toLowerCase().includes(searchLower);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        
        return (b.priority || 0) - (a.priority || 0);
      });
  }, [commands]);

  // Atualizar comandos filtrados quando a busca mudar
  useEffect(() => {
    const filtered = filterCommands(search);
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search, filterCommands]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Atalhos globais
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  // Event listeners para navegação
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Resetar estado quando abrir
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Executar comando
  const executeCommand = (command: CommandItem) => {
    command.action();
    onClose();
  };

  // Agrupar comandos por categoria
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
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
          className={`relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Command className="w-5 h-5" />
              <span className="text-sm font-medium">Command Palette</span>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                ⌘K
              </kbd>
              <span>para abrir</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">Nenhum comando encontrado</p>
                <p className="text-sm">Tente ajustar sua busca ou verificar a ortografia</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  
                  {/* Commands in Category */}
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.findIndex(c => c.id === command.id);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <motion.div
                        key={command.id}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => executeCommand(command)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {command.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium truncate ${
                                isSelected 
                                  ? 'text-blue-900 dark:text-blue-100' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {command.title}
                              </h4>
                              {command.shortcut && (
                                <kbd className={`px-2 py-1 text-xs rounded ${
                                  isSelected 
                                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' 
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                }`}>
                                  {command.shortcut}
                                </kbd>
                              )}
                            </div>
                            {command.description && (
                              <p className={`text-sm truncate ${
                                isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {command.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Arrow */}
                          <ArrowRight className={`w-4 h-4 ${
                            isSelected 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  <span>navegar</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono">↵</span>
                  <span>executar</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Powered by Zykor</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook para usar o Command Palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Atalho global Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
};

// Componente de exemplo de uso
export const CommandPaletteExample: React.FC = () => {
  const { isOpen, toggle } = useCommandPalette();

  return (
    <div className="p-8">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        <Command className="w-4 h-4" />
        Abrir Command Palette
      </button>
      
      <CommandPalette 
        isOpen={isOpen} 
        onClose={toggle}
        commands={defaultCommands}
      />
    </div>
  );
};

export default CommandPalette;
