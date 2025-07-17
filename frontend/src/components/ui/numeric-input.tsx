import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'pattern'> {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allowDecimals?: boolean;
  maxDecimals?: number;
  allowNegative?: boolean;
  className?: string;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({
  value,
  onChange,
  allowDecimals = true,
  maxDecimals = 2,
  allowNegative = false,
  className,
  onKeyDown,
  onPaste,
  ...props
}, ref) => {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Executar callback personalizado se existir
    if (onKeyDown) {
      onKeyDown(e);
    }

    // Permitir: backspace, delete, tab, escape, enter, home, end, setas
    const allowedKeys = [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40];
    
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    const isCtrlCombo = e.ctrlKey && [65, 67, 86, 88, 90].includes(e.keyCode);
    
    if (allowedKeys.includes(e.keyCode) || isCtrlCombo) {
      return;
    }

    // Permitir números (0-9) do teclado principal e numérico
    const isNumber = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
    
    // Permitir ponto decimal (.) se decimais são permitidos
    const isDecimal = allowDecimals && (e.keyCode === 190 || e.keyCode === 110);
    
    // Permitir sinal negativo (-) se negativos são permitidos
    const isNegative = allowNegative && (e.keyCode === 189 || e.keyCode === 109);

    if (!isNumber && !isDecimal && !isNegative && !e.shiftKey) {
      e.preventDefault();
      return;
    }

    // Bloquear se shift está pressionado (evita símbolos)
    if (e.shiftKey && !allowedKeys.includes(e.keyCode)) {
      e.preventDefault();
      return;
    }

    // Validar ponto decimal
    if (isDecimal) {
      const currentValue = (e.target as HTMLInputElement).value;
      
      // Não permitir mais de um ponto decimal
      if (currentValue.includes('.')) {
        e.preventDefault();
        return;
      }
    }

    // Validar sinal negativo
    if (isNegative) {
      const currentValue = (e.target as HTMLInputElement).value;
      const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0;
      
      // Só permitir no início do input
      if (cursorPosition !== 0 || currentValue.includes('-')) {
        e.preventDefault();
        return;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Executar callback personalizado se existir
    if (onPaste) {
      onPaste(e);
    }

    // Validar conteúdo da área de transferência
    const pasteData = e.clipboardData.getData('text');
    
    // Criar regex baseado nas configurações
    let regex = /^\d*$/; // Apenas números por padrão
    
    if (allowDecimals && allowNegative) {
      regex = /^-?\d*\.?\d*$/;
    } else if (allowDecimals) {
      regex = /^\d*\.?\d*$/;
    } else if (allowNegative) {
      regex = /^-?\d*$/;
    }

    if (!regex.test(pasteData)) {
      e.preventDefault();
      return;
    }

    // Validar número de casas decimais se especificado
    if (allowDecimals && maxDecimals && pasteData.includes('.')) {
      const decimalPart = pasteData.split('.')[1];
      if (decimalPart && decimalPart.length > maxDecimals) {
        e.preventDefault();
        return;
      }
    }
  };

  return (
    <Input
      ref={ref}
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(className)}
      placeholder="0"
      {...props}
    />
  );
});

NumericInput.displayName = 'NumericInput'; 
