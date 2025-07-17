'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import AuthGuard from '@/components/auth/AuthGuard'

interface StandardPageLayoutProps {
  children: ReactNode
  className?: string
  spacing?: 'normal' | 'tight' | 'loose'
}

export function StandardPageLayout({ 
  children, 
  className,
  spacing = 'normal' 
}: StandardPageLayoutProps) {
  const spacingClasses = {
    tight: 'space-y-4',
    normal: 'space-y-6',
    loose: 'space-y-8'
  }

  // Force dark mode classes on all elements
  useEffect(() => {
    const applyDarkModeForce = () => {
      // Find all cards without dark mode
      const elements = document.querySelectorAll('div, section, article, main')
      elements.forEach(el => {
        // Cards with white background
        if (el.classList.contains('bg-white') && !el.classList.contains('dark:bg-gray-800')) {
          el.classList.add('dark:bg-gray-800', 'dark:border-gray-700')
        }
        
        // Gray backgrounds
        if (el.classList.contains('bg-gray-50') && !el.classList.contains('dark:bg-gray-900')) {
          el.classList.add('dark:bg-gray-900')
        }
        
        if (el.classList.contains('bg-gray-100') && !el.classList.contains('dark:bg-gray-700')) {
          el.classList.add('dark:bg-gray-700')
        }
      })

      // Text elements
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div')
      textElements.forEach(el => {
        if (el.classList.contains('text-gray-900') && !el.classList.contains('dark:text-white')) {
          el.classList.add('dark:text-white')
        }
        if (el.classList.contains('text-gray-700') && !el.classList.contains('dark:text-gray-300')) {
          el.classList.add('dark:text-gray-300')
        }
        if (el.classList.contains('text-gray-600') && !el.classList.contains('dark:text-gray-400')) {
          el.classList.add('dark:text-gray-400')
        }
        if (el.classList.contains('text-gray-500') && !el.classList.contains('dark:text-gray-500')) {
          el.classList.add('dark:text-gray-500')
        }
      })

      // Borders
      const borderElements = document.querySelectorAll('[class*="border-gray"]')
      borderElements.forEach(el => {
        if (el.classList.contains('border-gray-200') && !el.classList.contains('dark:border-gray-700')) {
          el.classList.add('dark:border-gray-700')
        }
        if (el.classList.contains('border-gray-300') && !el.classList.contains('dark:border-gray-600')) {
          el.classList.add('dark:border-gray-600')
        }
      })

      // Forms
      const formElements = document.querySelectorAll('input, textarea, select')
      formElements.forEach(el => {
        if (!el.classList.contains('dark:bg-gray-700')) {
          el.classList.add('dark:bg-gray-700', 'dark:border-gray-600', 'dark:text-white', 'dark:placeholder-gray-400')
        }
      })

      // Tables
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        if (!table.classList.contains('dark:bg-gray-800')) {
          table.classList.add('dark:bg-gray-800')
          
          const ths = table.querySelectorAll('th')
          ths.forEach(th => {
            if (!th.classList.contains('dark:text-white')) {
              th.classList.add('dark:text-white', 'dark:bg-gray-800')
            }
          })

          const tds = table.querySelectorAll('td')
          tds.forEach(td => {
            if (!td.classList.contains('dark:text-gray-100')) {
              td.classList.add('dark:text-gray-100', 'dark:border-gray-700')
            }
          })

          const trs = table.querySelectorAll('tr')
          trs.forEach(tr => {
            if (!tr.classList.contains('dark:hover:bg-gray-700')) {
              tr.classList.add('dark:hover:bg-gray-700')
            }
          })
        }
      })
    }

    // Apply immediately
    applyDarkModeForce()

    // Apply whenever DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(applyDarkModeForce, 100)
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  return (
    <AuthGuard>
      <div className={cn(
        'transition-colors duration-300',
        spacingClasses[spacing],
        className
      )}>
        {children}
      </div>
    </AuthGuard>
  )
}

export default StandardPageLayout 
