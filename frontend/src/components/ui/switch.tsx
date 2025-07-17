import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }
    
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only peer"
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            // Base styles
            "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
            // Default colors (gray when unchecked, blue when checked)
            "bg-gray-300 peer-checked:bg-blue-600",
            // Focus styles
            "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2",
            // Toggle ball styles
            "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform after:duration-200 after:ease-in-out",
            // Move ball when checked
            "peer-checked:after:translate-x-5",
            // Custom className can override colors (like data-[state=checked]:bg-green-500)
            className
          )}
        />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch } 
