'use client'

import { useEffect } from 'react'

export function useForceDarkMode() {
  useEffect(() => {
    const applyDarkModeForce = () => {
      // Cards and containers
      const elements = document.querySelectorAll('div, section, article, main, aside, header, footer')
      elements.forEach(el => {
        // White backgrounds
        if (el.classList.contains('bg-white') && !el.classList.contains('dark:bg-gray-800')) {
          el.classList.add('dark:bg-gray-800')
        }
        
        // Gray backgrounds
        if (el.classList.contains('bg-gray-50') && !el.classList.contains('dark:bg-gray-900')) {
          el.classList.add('dark:bg-gray-900')
        }
        
        if (el.classList.contains('bg-gray-100') && !el.classList.contains('dark:bg-gray-700')) {
          el.classList.add('dark:bg-gray-700')
        }

        if (el.classList.contains('bg-gray-200') && !el.classList.contains('dark:bg-gray-600')) {
          el.classList.add('dark:bg-gray-600')
        }
      })

      // Text elements
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, label, a')
      textElements.forEach(el => {
        // Black text
        if (el.classList.contains('text-black') && !el.classList.contains('dark:text-white')) {
          el.classList.add('dark:text-white')
        }
        
        // Gray text variants
        if (el.classList.contains('text-gray-900') && !el.classList.contains('dark:text-white')) {
          el.classList.add('dark:text-white')
        }
        if (el.classList.contains('text-gray-800') && !el.classList.contains('dark:text-gray-200')) {
          el.classList.add('dark:text-gray-200')
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
        if (el.classList.contains('text-gray-400') && !el.classList.contains('dark:text-gray-600')) {
          el.classList.add('dark:text-gray-600')
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
        if (el.classList.contains('border-gray-400') && !el.classList.contains('dark:border-gray-500')) {
          el.classList.add('dark:border-gray-500')
        }
      })

      // Form elements
      const formElements = document.querySelectorAll('input, textarea, select')
      formElements.forEach(el => {
        if (!el.classList.contains('dark:bg-gray-700')) {
          el.classList.add('dark:bg-gray-700', 'dark:border-gray-600', 'dark:text-white')
          
          // Add placeholder styling if element supports it
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.classList.add('dark:placeholder-gray-400')
          }
        }
      })

      // Buttons without explicit dark mode
      const buttons = document.querySelectorAll('button:not([class*="dark:"])')
      buttons.forEach(button => {
        if (button.classList.contains('bg-white')) {
          button.classList.add('dark:bg-gray-700', 'dark:text-white', 'dark:border-gray-600')
        }
        if (button.classList.contains('bg-gray-100')) {
          button.classList.add('dark:bg-gray-600', 'dark:text-white')
        }
      })

      // Tables
      const tables = document.querySelectorAll('table')
      tables.forEach(table => {
        if (!table.classList.contains('dark:bg-gray-800')) {
          table.classList.add('dark:bg-gray-800')
          
          // Headers
          const ths = table.querySelectorAll('th')
          ths.forEach(th => {
            if (!th.classList.contains('dark:text-white')) {
              th.classList.add('dark:text-white', 'dark:bg-gray-800', 'dark:border-gray-700')
            }
          })

          // Cells
          const tds = table.querySelectorAll('td')
          tds.forEach(td => {
            if (!td.classList.contains('dark:text-gray-100')) {
              td.classList.add('dark:text-gray-100', 'dark:border-gray-700')
            }
          })

          // Rows
          const trs = table.querySelectorAll('tr')
          trs.forEach(tr => {
            if (!tr.classList.contains('dark:hover:bg-gray-700')) {
              tr.classList.add('dark:hover:bg-gray-700', 'dark:border-gray-700')
            }
          })
        }
      })

      // Cards (common patterns)
      const cards = document.querySelectorAll('[class*="Card"], [class*="card"]')
      cards.forEach(card => {
        if (!card.classList.contains('dark:bg-gray-800')) {
          card.classList.add('dark:bg-gray-800', 'dark:border-gray-700')
        }
      })

      // Badges and status indicators
      const badges = document.querySelectorAll('[class*="badge"], [class*="Badge"]')
      badges.forEach(badge => {
        if (badge.classList.contains('bg-gray-100')) {
          badge.classList.add('dark:bg-gray-700', 'dark:text-gray-200')
        }
      })

      // Loading states
      const loadingElements = document.querySelectorAll('[class*="animate-pulse"]')
      loadingElements.forEach(el => {
        if (el.classList.contains('bg-gray-200')) {
          el.classList.add('dark:bg-gray-700')
        }
        if (el.classList.contains('bg-gray-300')) {
          el.classList.add('dark:bg-gray-600')
        }
      })
    }

    // Apply immediately
    applyDarkModeForce()

    // Create observer for dynamic content
    const observer = new MutationObserver(() => {
      // Debounce to avoid excessive calls
      setTimeout(applyDarkModeForce, 50)
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])
} 
