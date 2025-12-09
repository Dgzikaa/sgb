import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange' | 'pink' | 'indigo' | 'cyan';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, color = 'blue', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const getColorClass = () => {
      switch (color) {
        case 'green':
          return 'bg-green-500';
        case 'purple':
          return 'bg-purple-500';
        case 'yellow':
          return 'bg-yellow-500';
        case 'red':
          return 'bg-red-500';
        case 'orange':
          return 'bg-orange-500';
        case 'pink':
          return 'bg-pink-500';
        case 'indigo':
          return 'bg-indigo-500';
        case 'cyan':
          return 'bg-cyan-500';
        case 'blue':
        default:
          return 'bg-blue-500';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            getColorClass()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
