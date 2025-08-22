'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CalendarDays,
  Clock,
  ArrowLeftRight,
  ArrowLeftRight as Range,
  Circle,
  Circle as SingleSelect
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface ModernDatePickerProps {
  value?: Date | DateRange | Date[];
  onChange?: (value: Date | DateRange | Date[]) => void;
  mode?: 'single' | 'range' | 'multiple';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  loading?: boolean;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showTime?: boolean;
  showPresets?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  locale?: string;
  className?: string;
}

// 🎨 COMPONENTE PRINCIPAL
export const ModernDatePicker = React.forwardRef<HTMLDivElement, ModernDatePickerProps>(
  ({
    value,
    onChange,
    mode = 'single',
    placeholder = 'Selecione uma data',
    disabled = false,
    error,
    success,
    loading = false,
    variant = 'default',
    size = 'md',
    animated = true,
    showTime = false,
    showPresets = true,
    minDate,
    maxDate,
    format = 'dd/MM/yyyy',
    locale = 'pt-BR',
    className,
    ...props
  }, ref) => {
    // 🎭 STATES
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
    const [selectedRange, setSelectedRange] = React.useState<DateRange>({ start: null, end: null });
    const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
    const [viewMode, setViewMode] = React.useState<'calendar' | 'time' | 'presets'>('calendar');

    // 🔍 REFS
    const containerRef = React.useRef<HTMLDivElement>(null);
    const calendarRef = React.useRef<HTMLDivElement>(null);

    // 🎯 HELPER FUNCTIONS
    const formatDate = (date: Date, formatStr: string = format): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return formatStr
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year.toString())
        .replace('HH', hours)
        .replace('mm', minutes);
    };

    const getDisplayValue = (): string => {
      if (mode === 'single' && value instanceof Date) {
        return formatDate(value);
      }
      if (mode === 'range' && 'start' in value && value.start && value.end) {
        return `${formatDate(value.start)} - ${formatDate(value.end)}`;
      }
      if (mode === 'multiple' && Array.isArray(value) && value.length > 0) {
        if (value.length === 1) return formatDate(value[0]);
        return `${value.length} datas selecionadas`;
      }
      return placeholder;
    };

    const isDateDisabled = (date: Date): boolean => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const isDateSelected = (date: Date): boolean => {
      if (mode === 'single' && value instanceof Date) {
        return date.toDateString() === value.toDateString();
      }
      if (mode === 'range' && 'start' in value) {
        return (
          (value.start && date.toDateString() === value.start.toDateString()) ||
          (value.end && date.toDateString() === value.end.toDateString())
        );
      }
      if (mode === 'multiple' && Array.isArray(value)) {
        return value.some(d => d.toDateString() === date.toDateString());
      }
      return false;
    };

    const isDateInRange = (date: Date): boolean => {
      if (mode !== 'range' || !('start' in value) || !value.start || !value.end) return false;
      
      const start = new Date(value.start);
      const end = new Date(value.end);
      const current = new Date(date);
      
      return current >= start && current <= end;
    };

    const isDateHovered = (date: Date): boolean => {
      if (mode !== 'range' || !hoveredDate || !('start' in value) || !value.start) return false;
      
      const start = new Date(value.start);
      const current = new Date(date);
      const hovered = new Date(hoveredDate);
      
      return current >= start && current <= hovered;
    };

    // 🎮 EVENT HANDLERS
    const handleToggle = () => {
      if (disabled || loading) return;
      setIsOpen(!isOpen);
    };

    const handleDateSelect = (date: Date) => {
      if (isDateDisabled(date)) return;

      if (mode === 'single') {
        onChange?.(date);
        setIsOpen(false);
      } else if (mode === 'range') {
        if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
          setSelectedRange({ start: date, end: null });
        } else {
          const start = selectedRange.start!;
          if (date < start) {
            setSelectedRange({ start: date, end: start });
          } else {
            setSelectedRange({ start, end: date });
          }
        }
      } else if (mode === 'multiple') {
        const newDates = selectedDates.filter(d => d.toDateString() !== date.toDateString());
        if (newDates.length === selectedDates.length) {
          newDates.push(date);
        }
        setSelectedDates(newDates);
      }
    };

    const handleRangeConfirm = () => {
      if (selectedRange.start && selectedRange.end) {
        onChange?.(selectedRange);
        setIsOpen(false);
        setSelectedRange({ start: null, end: null });
      }
    };

    const handleMultipleConfirm = () => {
      if (selectedDates.length > 0) {
        onChange?.(selectedDates);
        setIsOpen(false);
        setSelectedDates([]);
      }
    };

    const handleClear = () => {
      if (mode === 'single') {
        onChange?.(null as any);
      } else if (mode === 'range') {
        onChange?.({ start: null, end: null });
        setSelectedRange({ start: null, end: null });
      } else if (mode === 'multiple') {
        onChange?.([]);
        setSelectedDates([]);
      }
    };

    const handlePresetSelect = (preset: { label: string; start: Date; end: Date }) => {
      if (mode === 'range') {
        setSelectedRange({ start: preset.start, end: preset.end });
        setCurrentDate(preset.start);
      }
    };

    // 🎬 EFFECTS
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // 📅 CALENDAR LOGIC
    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days: Date[] = [];

      // Add previous month days to fill first week
      const firstDayOfWeek = firstDay.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }

      // Add current month days
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      // Add next month days to fill last week
      const lastDayOfWeek = lastDay.getDay();
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        days.push(new Date(year, month + 1, i));
      }

      return days;
    };

    const getMonthName = (date: Date): string => {
      return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    };

    const getWeekDays = (): string[] => {
      const baseDate = new Date(2024, 0, 1); // January 1, 2024 (Monday)
      const weekDays: string[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        weekDays.push(date.toLocaleDateString(locale, { weekday: 'short' }));
      }
      
      return weekDays;
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

    // 🎨 RENDER CALENDAR
    const renderCalendar = () => {
      const days = getDaysInMonth(currentDate);
      const weekDays = getWeekDays();

      return (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {getMonthName(currentDate)}
            </motion.h3>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isDisabled = isDateDisabled(date);
              const isSelected = isDateSelected(date);
              const isInRange = isDateInRange(date);
              const isHovered = isDateHovered(date);

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDateSelect(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-2 text-sm rounded-lg transition-all duration-200',
                    'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500',
                    isSelected && 'bg-blue-500 text-white hover:bg-blue-600',
                    isInRange && 'bg-blue-100 dark:bg-blue-900/30',
                    isHovered && 'bg-blue-50 dark:bg-blue-900/20',
                    isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {date.getDate()}
                  
                  {/* Range indicator */}
                  {mode === 'range' && isInRange && (
                    <motion.div
                      layoutId="rangeIndicator"
                      className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      );
    };

    // 🕐 RENDER TIME PICKER
    const renderTimePicker = () => {
      return (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selecionar Horário
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minuto
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      );
    };

    // 🎯 RENDER PRESETS
    const renderPresets = () => {
      const presets = [
        { label: 'Hoje', start: new Date(), end: new Date() },
        { label: 'Ontem', start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { label: 'Últimos 7 dias', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
        { label: 'Últimos 30 dias', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
        { label: 'Este mês', start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0) },
        { label: 'Mês passado', start: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1), end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 0) },
      ];

      return (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Períodos Rápidos
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetSelect(preset)}
                className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {preset.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(preset.start)} - {formatDate(preset.end)}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      );
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
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-expanded={isOpen}
          whileHover={animated && !disabled ? { scale: 1.02 } : undefined}
          whileTap={animated && !disabled ? { scale: 0.98 } : undefined}
        >
          {/* Icon */}
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />

          {/* Display value */}
          <div className="flex-1 min-w-0">
            <div className="truncate">
              {getDisplayValue()}
            </div>
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
            {((mode === 'single' && value instanceof Date) || 
              (mode === 'range' && 'start' in value && value.start) ||
              (mode === 'multiple' && Array.isArray(value) && value.length > 0)) && (
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

            {/* Calendar icon */}
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        </motion.div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={calendarRef}
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50 w-80 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
            >
              {/* View mode tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    'flex-1 p-3 text-sm font-medium transition-colors',
                    viewMode === 'calendar'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <CalendarDays className="w-4 h-4 inline mr-2" />
                  Calendário
                </motion.button>
                
                {showTime && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('time')}
                    className={cn(
                      'flex-1 p-3 text-sm font-medium transition-colors',
                      viewMode === 'time'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Horário
                  </motion.button>
                )}
                
                {showPresets && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('presets')}
                    className={cn(
                      'flex-1 p-3 text-sm font-medium transition-colors',
                      viewMode === 'presets'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Range className="w-4 h-4 inline mr-2" />
                    Rápido
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {viewMode === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderCalendar()}
                  </motion.div>
                )}
                
                {viewMode === 'time' && (
                  <motion.div
                    key="time"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderTimePicker()}
                  </motion.div>
                )}
                
                {viewMode === 'presets' && (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderPresets()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer actions */}
              {(mode === 'range' || mode === 'multiple') && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClear}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Limpar
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={mode === 'range' ? handleRangeConfirm : handleMultipleConfirm}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirmar
                  </motion.button>
                </div>
              )}
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

ModernDatePicker.displayName = 'ModernDatePicker';

// 🚀 EXPORT
export { ModernDatePicker };
