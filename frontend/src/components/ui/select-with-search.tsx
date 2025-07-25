import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import Image from 'next/image';

interface Option {
  value: string;
  label: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface SelectWithSearchProps {
  options: Option[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectWithSearch({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione uma opção',
  searchPlaceholder = 'Pesquisar...',
  disabled = false,
  className = '',
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar a opção selecionada
  const selectedOption = options.find(option => option.value === value);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          const selectedOption = filteredOptions[highlightedIndex];
          onValueChange(selectedOption.value);
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (option: Option) => {
    onValueChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`
          w-full flex items-center justify-between px-4 py-3 text-left
          border border-gray-300 rounded-lg shadow-sm bg-white
          hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <div className="flex items-center space-x-3">
          {selectedOption ? (
            <>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                {selectedOption.avatar ? (
                  <Image
                    src={selectedOption.avatar}
                    alt={selectedOption.label}
                    width={32}
                    height={32}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOption.label}
                </p>
                {selectedOption.email && (
                  <p className="text-xs text-gray-500">
                    {selectedOption.email}
                  </p>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 text-left
                    hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                    ${index === highlightedIndex ? 'bg-indigo-50' : ''}
                    ${option.value === value ? 'bg-indigo-100' : ''}
                    transition-colors duration-150
                  `}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {option.avatar ? (
                      <Image
                        src={option.avatar}
                        alt={option.label}
                        width={32}
                        height={32}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {option.label}
                    </p>
                    {option.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {option.email}
                      </p>
                    )}
                    {option.role && (
                      <span
                        className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1
                        ${
                          option.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : option.role === 'manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }
                      `}
                      >
                        {option.role === 'admin'
                          ? 'Administrador'
                          : option.role === 'manager'
                            ? 'Gerente'
                            : 'Funcionário'}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
