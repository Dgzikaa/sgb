/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toBeDisabled(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeHidden(): R
      toHaveFocus(): R
      toHaveValue(value: string | string[] | number): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveStyle(css: string | Record<string, any>): R
      toHaveAccessibleName(name: string | RegExp): R
      toHaveAccessibleDescription(description: string | RegExp): R
      toHaveErrorMessage(text: string | RegExp): R
    }
  }
}

export {} 