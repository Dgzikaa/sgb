'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '', 
  className = '',
  decimals = 0 
}: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    return decimals > 0 
      ? latest.toFixed(decimals)
      : Math.round(latest).toLocaleString('pt-BR')
  })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, { 
      duration,
      ease: "easeOut"
    })
    
    return controls.stop
  }, [count, value, duration])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest)
    })
    
    return unsubscribe
  }, [rounded])

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  )
}

interface AnimatedCurrencyProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCurrency({ value, duration = 2, className = '' }: AnimatedCurrencyProps) {
  const count = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState('R$ 0,00')

  useEffect(() => {
    const controls = animate(count, value, { 
      duration,
      ease: "easeOut"
    })
    
    const unsubscribe = count.on('change', (latest) => {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(latest)
      setDisplayValue(formatted)
    })
    
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [count, value, duration])

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  )
}
