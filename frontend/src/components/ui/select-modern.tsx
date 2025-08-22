'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, X, Search, Users, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface ModernSelectProps {
  options: SelectOption[] | SelectGroup[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  loading?: boolean;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showClear?: boolean;
  maxHeight?: string;
  className?: string;
}

// 🎨 COMPONENTE PRINCIPAL
export const ModernSelect = React.forwardRef<HTMLDivElement, ModernSelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = 'Selecione uma opção',
    searchable = false,
    multiSelect = false,
    disabled = false,
    error,
    success,
    loading = false,
    variant = 'default',
    size = 'md',
    animated = true,
    showClear = true,
    maxHeight = '300px',
    className,
    ...props
  }, ref) => {
    // 🎭 STATES
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      multiSelect ? (Array.isArray(value) ? value : value ? [value] : []) : []
    );
    const [singleValue, setSingleValue] = React.useState<string>(
      multiSelect ? '' : (value as string) || ''
    );

    // 🔍 REFS
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const optionsListRef = React.useRef<HTMLDivElement>(null);

    // 🎯 HELPER FUNCTIONS
    const isGrouped = (opts: SelectOption[] | SelectGroup[]): opts is SelectGroup[] => {
      return opts.length > 0 && 'options' in opts[0];
    };

    const flattenOptions = (opts: SelectOption[] | SelectGroup[]): SelectOption[] => {
      if (isGrouped(opts)) {
        return opts.flatMap(group => group.options);
      }
      return opts;
    };

    const getFilteredOptions = () => {
      const allOptions = flattenOptions(options);
      if (!searchTerm) return allOptions;
      
      return allOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    const getSelectedLabels = () => {
      if (multiSelect) {
        const allOptions = flattenOptions(options);
        return selectedValues
          .map(val => allOptions.find(opt => opt.value === val)?.label)
          .filter(Boolean);
      }
      return [];
    };

    const getDisplayValue = () => {
      if (multiSelect) {
        const labels = getSelectedLabels();
        if (labels.length === 0) return placeholder;
        if (labels.length === 1) return labels[0];
        return `${labels.length} itens selecionados`;
      }
      return singleValue || placeholder;
    };

    // 🎮 EVENT HANDLERS
    const handleToggle = () => {
      if (disabled || loading) return;
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    const handleSelect = (optionValue: string) => {
      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        
        setSelectedValues(newValues);
        onChange?.(newValues);
      } else {
        setSingleValue(optionValue);
        onChange?.(optionValue);
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleClear = () => {
      if (multiSelect) {
        setSelectedValues([]);
        onChange?.([]);
      } else {
        setSingleValue('');
        onChange?.('');
      }
      setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const filteredOptions = getFilteredOptions();
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    // 🎬 EFFECTS
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
      if (isOpen && searchable) {
        setFocusedIndex(-1);
      }
    }, [searchTerm, isOpen, searchable]);

    // 🎨 STYLES
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent rounded-none focus:border-blue-500 dark:focus:border-blue-400';
        case 'glass':
          return 'border-white/20 dark:border-gray-700/50 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm focus:border-blue-500/50 dark:focus:border-blue-400/50';
        case 'premium':
          return 'border-2 border-transparent bg-gradient-to-r from-purple-500/10 to-blue-500/10 focus:border-purple-500 dark:focus:border-purple-400';
        default:
          return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm': return 'h-9 px-3 text-sm';
        case 'md': return 'h-11 px-4 text-base';
        case 'lg': return 'h-12 px-4 text-lg';
        case 'xl': return 'h-14 px-5 text-xl';
        default: return 'h-11 px-4 text-base';
      }
    };

    const getStatusColor = () => {
      if (error) return 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400';
      if (success) return 'border-green-500 dark:border-green-400 focus:border-green-500 dark:focus:border-green-400';
      return '';
    };

    // 🎭 ANIMATIONS
    const dropdownVariants = {
      hidden: { 
        opacity: 0, 
        y: -10, 
        scale: 0.95,
        transition: { duration: 0.2 }
      },
      visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }
      },
      exit: { 
        opacity: 0, 
        y: -10, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }
    };

    // 🎨 RENDER OPTIONS
    const renderOption = (option: SelectOption, index: number) => {
      const isSelected = multiSelect 
        ? selectedValues.includes(option.value)
        : singleValue === option.value;
      const isFocused = index === focusedIndex;

      return (
        <motion.div
          key={option.value}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          className={cn(
            'flex items-center px-4 py-3 cursor-pointer transition-all duration-200 relative',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            isSelected && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
            isFocused && 'bg-gray-50 dark:bg-gray-700',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !option.disabled && handleSelect(option.value)}
          onMouseEnter={() => setFocusedIndex(index)}
        >
          {/* Checkbox for multi-select */}
          {multiSelect && (
            <motion.div
              className={cn(
                'w-4 h-4 border-2 rounded mr-3 flex items-center justify-center',
                isSelected 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300 dark:border-gray-600'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Icon */}
          {option.icon && (
            <div className="mr-3 text-gray-500 dark:text-gray-400">
              {option.icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{option.label}</div>
            {option.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {option.description}
              </div>
            )}
          </div>

          {/* Single select indicator */}
          {!multiSelect && isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 text-blue-500 dark:text-blue-400"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
      );
    };

    const renderOptions = () => {
      const filteredOptions = getFilteredOptions();
      
      if (filteredOptions.length === 0) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
          >
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma opção encontrada</p>
            {searchTerm && (
              <p className="text-sm">Tente outro termo de busca</p>
            )}
          </motion.div>
        );
      }

      if (isGrouped(options)) {
        return options.map((group, groupIndex) => (
          <div key={group.label} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
              {(group as any).icon && <span className="mr-2">{(group as any).icon}</span>}
              {group.label}
            </div>
            {group.options
              .filter(option => 
                !searchTerm || 
                option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                option.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((option, optionIndex) => 
                renderOption(option, groupIndex * 1000 + optionIndex)
              )}
          </div>
        ));
      }

      return filteredOptions.map((option, index) => renderOption(option, index));
    };

    // 🚀 RENDER PRINCIPAL
    return (
      <div ref={containerRef} className={cn('relative w-full', className)} {...props}>
        {/* Trigger */}
        <motion.div
          ref={ref}
          className={cn(
            'relative flex items-center justify-between cursor-pointer transition-all duration-200',
            'border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
            getVariantStyles(),
            getSizeStyles(),
            getStatusColor(),
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500 dark:border-red-400',
            success && 'border-green-500 dark:border-green-400'
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          whileHover={animated && !disabled ? { scale: 1.02 } : undefined}
          whileTap={animated && !disabled ? { scale: 0.98 } : undefined}
        >
          {/* Selected values display */}
          <div className="flex-1 min-w-0">
            <div className="truncate">
              {getDisplayValue()}
            </div>
            
            {/* Multi-select chips */}
            {multiSelect && selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {getSelectedLabels().slice(0, 2).map((label, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    {label}
                  </motion.span>
                ))}
                {selectedValues.length > 2 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    +{selectedValues.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 ml-2">
            {/* Loading spinner */}
            {loading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            )}

            {/* Clear button */}
            {showClear && ((multiSelect && selectedValues.length > 0) || (!multiSelect && singleValue)) && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}

            {/* Dropdown arrow */}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 dark:text-gray-500"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </motion.div>
          </div>
        </motion.div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={optionsListRef}
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl',
                'max-h-[300px] overflow-hidden'
              )}
              style={{ maxHeight }}
            >
              {/* Search input */}
              {searchable && (
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar opções..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <div className="overflow-y-auto" style={{ maxHeight: searchable ? 'calc(100% - 60px)' : '100%' }}>
                {renderOptions()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-sm text-red-500 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

ModernSelect.displayName = 'ModernSelect';

// 🚀 EXPORT
// export { ModernSelect }; // Já exportado acima
