'use client'

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

interface NewYearFireworksProps {
  show?: boolean
  onComplete?: () => void
  autoTrigger?: boolean
}

export default function NewYearFireworks({ 
  show = false, 
  onComplete,
  autoTrigger = false 
}: NewYearFireworksProps) {
  const [isActive, setIsActive] = useState(show)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (autoTrigger) {
      const now = new Date()
      const currentYear = now.getFullYear()
      const targetDate = new Date('2026-01-01T00:00:00')
      
      // Ativar automaticamente se for 01/01/2026 ou depois
      if (now >= targetDate) {
        const hasShown = localStorage.getItem(`newyear-fireworks-${currentYear}`)
        if (!hasShown) {
          setTimeout(() => {
            setIsActive(true)
            setShowMessage(true)
            localStorage.setItem(`newyear-fireworks-${currentYear}`, 'true')
          }, 500)
        }
      }
    }
  }, [autoTrigger])

  useEffect(() => {
    if (isActive || show) {
      // Explosão inicial gigante
      const duration = 8000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      // Fogos de artifício contínuos
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          if (onComplete) onComplete()
          return
        }

        const particleCount = 50 * (timeLeft / duration)
        
        // Explosões dos cantos
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      // Explosão central massiva no início
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
        zIndex: 9999,
      })

      // Efeito de estrelas caindo
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500'],
          zIndex: 9999,
        })
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500'],
          zIndex: 9999,
        })
      }, 1000)

      // Chuva de confetes coloridos
      setTimeout(() => {
        const count = 200
        const defaults2 = {
          origin: { y: 0.7 },
          zIndex: 9999,
        }

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults2,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          })
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        })

        fire(0.2, {
          spread: 60,
        })

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        })

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        })

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isActive, show, onComplete])

  return (
    <AnimatePresence>
      {(isActive || show) && showMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-center"
          >
            <motion.h1
              className="text-9xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-transparent bg-clip-text mb-4"
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              2026
            </motion.h1>
            <motion.p
              className="text-4xl font-bold text-white drop-shadow-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              🎉 Feliz Ano Novo! 🎊
            </motion.p>
            <motion.p
              className="text-2xl text-gray-200 mt-4 drop-shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              Confira nossa retrospectiva de 2025! 🚀
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
