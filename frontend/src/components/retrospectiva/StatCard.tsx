'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  icon: LucideIcon
  gradient: string
  delay?: number
  description?: string
}

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  gradient,
  delay = 0,
  description,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 group"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 opacity-10 ${gradient} group-hover:opacity-20 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {title}
        </h3>

        <div className="flex items-baseline gap-2">
          <motion.div
            className="text-4xl font-black text-gray-900 dark:text-white"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            <CountUp
              start={0}
              end={value}
              duration={2.5}
              delay={delay}
              decimals={decimals}
              prefix={prefix}
              suffix={suffix}
              separator="."
              decimal=","
            />
          </motion.div>
        </div>

        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            {description}
          </p>
        )}
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.8 }}
      />
    </motion.div>
  )
}
