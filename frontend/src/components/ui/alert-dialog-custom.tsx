'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AlertDialogCustomProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const alertColors = {
  success: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400'
  },
  error: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400'
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    title: 'text-amber-800 dark:text-amber-300',
    message: 'text-amber-700 dark:text-amber-400'
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400'
  }
};

export function AlertDialogCustom({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  action 
}: AlertDialogCustomProps) {
  if (!isOpen) return null;

  const Icon = alertIcons[type];
  const colors = alertColors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Alert Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md mx-auto"
      >
        <Card className={`card-dark shadow-2xl ${colors.border}`}>
          <CardContent className="p-6">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 h-auto w-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* Content */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 p-2 rounded-full ${colors.bg}`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              
              {/* Text Content */}
              <div className="flex-1 pt-1">
                <h3 className={`font-semibold text-lg mb-2 ${colors.title}`}>
                  {title}
                </h3>
                <p className={`text-sm leading-relaxed ${colors.message}`}>
                  {message}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400"
              >
                Fechar
              </Button>
              {action && (
                <Button
                  onClick={action.onClick}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                >
                  {action.label}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
