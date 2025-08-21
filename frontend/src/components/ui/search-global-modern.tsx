'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  Clock, 
  Star, 
  TrendingUp,
  FileText,
  User,
  BarChart3,
  Calendar,
  Settings,
  Home,
  Plus,
  ArrowRight,
  Command,
  Zap,
  Sparkles,
  Eye,
  EyeOff,
  Bookmark,
  History,
  Tag,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Tipos para busca
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: 'page' | 'user' | 'document' | 'setting' | 'action';
  url?: string;
  icon?: React.ReactNode;
  tags?: string[];
  priority?: number;
  lastAccessed?: Date;
  isBookmarked?: boolean;
}

interface SearchCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

interface SearchFilters {
  categories: string[];
  types: string[];
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SearchGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

// Dados de exemplo para busca
const mockSearchData: SearchResult[] = [
  // Páginas
  {
    id: 'home',
    title: 'Home',
    description: 'Página inicial do sistema',
    category: 'Navegação',
    type: 'page',
    url: '/',
    icon: <Home className="w-4 h-4" />,
    tags: ['início', 'dashboard', 'principal'],
    priority: 10,
    lastAccessed: new Date()
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Painel principal com métricas e indicadores',
    category: 'Navegação',
    type: 'page',
    url: '/dashboard',
    icon: <BarChart3 className="w-4 h-4" />,
    tags: ['métricas', 'indicadores', 'estatísticas'],
    priority: 9,
    lastAccessed: new Date()
  },
  {
    id: 'usuarios',
    title: 'Usuários',
    description: 'Gerenciamento de usuários do sistema',
    category: 'Administração',
    type: 'page',
    url: '/configuracoes/usuarios',
    icon: <User className="w-4 h-4" />,
    tags: ['gerenciar', 'admin', 'permissões'],
    priority: 8,
    lastAccessed: new Date()
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Relatórios e análises do sistema',
    category: 'Relatórios',
    type: 'page',
    url: '/relatorios',
    icon: <FileText className="w-4 h-4" />,
    tags: ['análises', 'dados', 'estatísticas'],
    priority: 7,
    lastAccessed: new Date()
  },
  {
    id: 'agendamento',
    title: 'Agendamento',
    description: 'Sistema de agendamento e calendário',
    category: 'Operações',
    type: 'page',
    url: '/agendamento',
    icon: <Calendar className="w-4 h-4" />,
    tags: ['calendário', 'eventos', 'compromissos'],
    priority: 6,
    lastAccessed: new Date()
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Configurações gerais do sistema',
    category: 'Sistema',
    type: 'page',
    url: '/configuracoes',
    icon: <Settings className="w-4 h-4" />,
    tags: ['ajustes', 'preferências', 'sistema'],
    priority: 5,
    lastAccessed: new Date()
  },

  // Ações
  {
    id: 'novo-usuario',
    title: 'Novo Usuário',
    description: 'Criar novo usuário no sistema',
    category: 'Ações',
    type: 'action',
    url: '/configuracoes/usuarios/novo',
    icon: <Plus className="w-4 h-4" />,
    tags: ['criar', 'adicionar', 'usuário'],
    priority: 8,
    lastAccessed: new Date()
  },
  {
    id: 'novo-evento',
    title: 'Novo Evento',
    description: 'Agendar novo evento',
    category: 'Ações',
    type: 'action',
    url: '/agendamento/novo',
    icon: <Plus className="w-4 h-4" />,
    tags: ['agendar', 'evento', 'calendário'],
    priority: 7,
    lastAccessed: new Date()
  },

  // Documentos
  {
    id: 'manual-usuario',
    title: 'Manual do Usuário',
    description: 'Documentação completa do sistema',
    category: 'Documentação',
    type: 'document',
    url: '/ajuda/manual',
    icon: <FileText className="w-4 h-4" />,
    tags: ['ajuda', 'documentação', 'tutorial'],
    priority: 6,
    lastAccessed: new Date()
  },
  {
    id: 'politica-privacidade',
    title: 'Política de Privacidade',
    description: 'Políticas de privacidade e LGPD',
    category: 'Documentação',
    type: 'document',
    url: '/legal/privacidade',
    icon: <FileText className="w-4 h-4" />,
    tags: ['legal', 'privacidade', 'lgpd'],
    priority: 4,
    lastAccessed: new Date()
  }
];

// Hook para busca global
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    types: [],
    tags: []
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  // Abrir busca
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

  // Executar busca
  const executeSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const searchLower = term.toLowerCase();
    let filtered = mockSearchData.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        item.category.toLowerCase().includes(searchLower);

      const matchesFilters = 
        (filters.categories.length === 0 || filters.categories.includes(item.category)) &&
        (filters.types.length === 0 || filters.types.includes(item.type)) &&
        (filters.tags.length === 0 || filters.tags.some(tag => item.tags?.includes(tag)));

      return matchesSearch && matchesFilters;
    });

    // Ordenar por prioridade e relevância
    filtered.sort((a, b) => {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Priorizar resultados que começam com o termo de busca
      const aStartsWith = a.title.toLowerCase().startsWith(searchLower);
      const bStartsWith = b.title.toLowerCase().startsWith(searchLower);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return 0;
    });

    setResults(filtered);
    setSelectedIndex(0);
  }, [filters]);

  // Atualizar busca quando termo ou filtros mudarem
  useEffect(() => {
    executeSearch(searchTerm);
  }, [searchTerm, filters, executeSearch]);

  // Adicionar à busca recente
  const addToRecentSearches = useCallback((term: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t !== term);
      return [term, ...filtered].slice(0, 5);
    });
  }, []);

  // Adicionar ao histórico
  const addToHistory = useCallback((result: SearchResult) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      return [result, ...filtered].slice(0, 10);
    });
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    searchTerm,
    setSearchTerm,
    results,
    filters,
    setFilters,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    searchHistory,
    addToRecentSearches,
    addToHistory,
    executeSearch
  };
};

// Componente principal de busca global
export const SearchGlobal: React.FC<SearchGlobalProps> = ({
  isOpen,
  onClose,
  onResultSelect,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    types: [],
    tags: []
  });

  // Categorias disponíveis
  const categories = useMemo(() => {
    const cats = Array.from(new Set(mockSearchData.map(item => item.category)));
    return cats.map(cat => ({
      id: cat,
      name: cat,
      icon: getCategoryIcon(cat),
      color: getCategoryColor(cat),
      count: mockSearchData.filter(item => item.category === cat).length
    }));
  }, []);

  // Tipos disponíveis
  const types = useMemo(() => {
    return Array.from(new Set(mockSearchData.map(item => item.type)));
  }, []);

  // Tags disponíveis
  const tags = useMemo(() => {
    const allTags = mockSearchData.flatMap(item => item.tags || []);
    return Array.from(new Set(allTags));
  }, []);

  // Executar busca
  const executeSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const searchLower = term.toLowerCase();
    let filtered = mockSearchData.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        item.category.toLowerCase().includes(searchLower);

      const matchesFilters = 
        (filters.categories.length === 0 || filters.categories.includes(item.category)) &&
        (filters.types.length === 0 || filters.types.includes(item.type)) &&
        (filters.tags.length === 0 || filters.tags.some(tag => item.tags?.includes(tag)));

      return matchesSearch && matchesFilters;
    });

    // Ordenar por prioridade
    filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    setResults(filtered);
    setSelectedIndex(0);
  }, [filters]);

  // Atualizar busca
  useEffect(() => {
    executeSearch(searchTerm);
  }, [searchTerm, filters, executeSearch]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  // Selecionar resultado
  const handleResultSelect = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
    onClose();
  }, [onResultSelect, onClose]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      types: [],
      tags: []
    });
  }, []);

  // Toggle filtro
  const toggleFilter = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 z-50 flex items-start justify-center pt-16 ${className}`}
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

        {/* Modal de busca */}
        <motion.div
          className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Search className="w-5 h-5" />
              <span className="text-sm font-medium">Busca Global</span>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                ⌘K
              </kbd>
              <span>para abrir</span>
            </div>
          </div>

          {/* Campo de busca */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar no sistema..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                autoFocus
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botão de filtros */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {Object.values(filters).some(f => f.length > 0) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>

              {Object.values(filters).some(f => f.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  {/* Categorias */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categorias
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleFilter('categories', category.id)}
                          className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full transition-colors ${
                            filters.categories.includes(category.id)
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                          }`}
                        >
                          {category.icon}
                          {category.name}
                          <span className="text-xs opacity-70">({category.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipos */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {types.map(type => (
                        <button
                          key={type}
                          onClick={() => toggleFilter('types', type)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filters.types.includes(type)
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 10).map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleFilter('tags', tag)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filters.tags.includes(tag)
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resultados */}
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 && searchTerm ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente ajustar sua busca ou filtros</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">Comece a digitar para buscar</p>
                <p className="text-sm">Use filtros para refinar seus resultados</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => {
                  const isSelected = index === selectedIndex;
                  const category = categories.find(c => c.id === result.category);
                  
                  return (
                    <motion.div
                      key={result.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleResultSelect(result)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Ícone da categoria */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          category?.color || 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {result.icon || category?.icon || <FileText className="w-4 h-4" />}
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium truncate ${
                              isSelected 
                                ? 'text-blue-900 dark:text-blue-100' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {result.title}
                            </h4>
                            
                            {/* Badge de tipo */}
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              result.type === 'page' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                              result.type === 'action' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                              result.type === 'document' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {result.type}
                            </span>
                          </div>
                          
                          <p className={`text-sm truncate ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {result.description}
                          </p>
                          
                          {/* Tags */}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Seta */}
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
                  <span>selecionar</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Powered by Zykor</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Funções auxiliares
function getCategoryIcon(category: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'Navegação': <Home className="w-4 h-4" />,
    'Administração': <User className="w-4 h-4" />,
    'Relatórios': <BarChart3 className="w-4 h-4" />,
    'Operações': <Calendar className="w-4 h-4" />,
    'Sistema': <Settings className="w-4 h-4" />,
    'Ações': <Plus className="w-4 h-4" />,
    'Documentação': <FileText className="w-4 h-4" />
  };
  
  return iconMap[category] || <FileText className="w-4 h-4" />;
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Navegação': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    'Administração': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    'Relatórios': 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    'Operações': 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    'Sistema': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    'Ações': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    'Documentação': 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
  };
  
  return colorMap[category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
}

// Componente de exemplo
export const SearchGlobalExample: React.FC = () => {
  const { isOpen, toggle } = useGlobalSearch();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const handleResultSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    
    // Simular navegação
    setTimeout(() => {
      setSelectedResult(null);
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Search Global com Categorização
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sistema de busca global avançado com categorização inteligente, 
            filtros em tempo real e resultados organizados
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demonstração */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Demonstração
          </h2>

          {/* Card interativo */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-center mb-6">
              <Search className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Teste a Busca Global
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clique no botão abaixo ou use ⌘K para abrir a busca
              </p>
            </div>

            {/* Resultado selecionado */}
            {selectedResult && (
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
                      Resultado selecionado!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {selectedResult.title} - {selectedResult.category}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Botão para abrir busca */}
            <div className="text-center">
              <button
                onClick={toggle}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
                Abrir Busca Global
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Ou pressione <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘K</kbd>
              </p>
            </div>
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
              <li>• <strong>Busca em Tempo Real:</strong> Resultados instantâneos</li>
              <li>• <strong>Categorização Inteligente:</strong> Organização automática</li>
              <li>• <strong>Filtros Avançados:</strong> Refinamento de resultados</li>
              <li>• <strong>Navegação por Teclado:</strong> Atalhos completos</li>
              <li>• <strong>Histórico de Busca:</strong> Resultados recentes</li>
              <li>• <strong>Tags e Metadados:</strong> Busca contextual</li>
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
                  {mockSearchData.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Itens Indexados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Array.from(new Set(mockSearchData.map(s => s.category))).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Categorias
                </div>
              </div>
            </div>
          </div>

          {/* Categorias disponíveis */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Categorias Disponíveis
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Array.from(new Set(mockSearchData.map(s => s.category))).map(category => (
                <div
                  key={category}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-blue-500">{getCategoryIcon(category)}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de busca global */}
      <SearchGlobal
        isOpen={isOpen}
        onClose={toggle}
        onResultSelect={handleResultSelect}
      />
    </div>
  );
};

export default SearchGlobalExample;
