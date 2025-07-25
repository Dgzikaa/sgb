import * as React from 'react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[];
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  mode = 'single',
  selected,
  onSelect,
  disabled,
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const today = new Date();
  const selectedDate = selected as Date;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false;
  };

  return (
    <div className={cn('p-4 bg-white dark:bg-gray-800', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
        >
          ←
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date: Date | null, index: number) => {
          if (!date) {
            return <div key={index} className="p-2" />;
          }

          const disabled = isDisabled(date);
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={date.toDateString()}
              onClick={() => !disabled && onSelect?.(date)}
              disabled={disabled}
              className={cn(
                'p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white',
                {
                  'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600':
                    selected,
                  'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400':
                    today && !selected,
                  'text-gray-400 dark:text-gray-600 cursor-not-allowed hover:bg-transparent':
                    disabled,
                  'hover:bg-gray-100 dark:hover:bg-gray-700':
                    !disabled && !selected,
                }
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Calendar };
