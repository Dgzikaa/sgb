'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function RetrospectiveButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const now = new Date()
    const targetDate = new Date('2026-01-01T00:00:00')
    
    // Mostrar botão se for 2026 ou depois
    if (now >= targetDate) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Link href="/retrospectiva-2025">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            {/* Glow Effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl"
            />
            
            {/* Button */}
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span className="text-lg">Retrospectiva 2025</span>
            </div>

            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 rounded-full"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}
