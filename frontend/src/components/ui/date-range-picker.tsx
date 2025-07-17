import * as React from 'react'
import { Calendar } from './calendar'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: [Date | null, Date | null]
  onChange: (range: [Date | null, Date | null]) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  className
}) => {
  const [start, end] = value

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    if (!start || (start && end)) {
      onChange([date, null])
    } else if (start && !end) {
      if (date < start) {
        onChange([date, start])
      } else {
        onChange([start, date])
      }
    }
  }

  const isInRange = (date: Date) => {
    if (start && end) {
      return date >= start && date <= end
    }
    return false
  }

  return (
    <div className={cn('flex flex-col gap-2 card-dark p-4 rounded-xl', className)}>
      <div className="flex items-center gap-4 mb-2">
        <span className="card-title-dark">PerÃ­odo:</span>
        <span className="card-description-dark">
          {start ? start.toLocaleDateString('pt-BR') : 'InÃ­cio'}
          {' '}â€“{' '}
          {end ? end.toLocaleDateString('pt-BR') : 'Fim'}
        </span>
        {(start || end) && (
          <button
            className="btn-secondary-dark px-2 py-1 rounded text-xs ml-2"
            onClick={() => onChange([null, null])}
            type="button"
          >
            Limpar
          </button>
        )}
      </div>
      <Calendar
        mode="range"
        selected={start && end ? [start, end] : start ? [start] : []}
        onSelect={handleSelect}
        disabled={date => {
          let isDisabled = false;
          if (minDate && date < minDate) isDisabled = true;
          if (maxDate && date > maxDate) isDisabled = true;
          return isDisabled;
        }}
        className="bg-transparent"
      />
    </div>
  )
} 
