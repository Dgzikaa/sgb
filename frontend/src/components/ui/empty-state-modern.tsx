'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileText, 
  Users, 
  BarChart3, 
  Calendar, 
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// Tipos para o componente
interface EmptyStateProps {
  variant?: 'default' | 'search' | 'data' | 'users' | 'analytics' | 'calendar' | 'error' | 'custom';
  title?: string;
  description?: string;
  illustration?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

// Ilustrações SVG animadas
const EmptyStateIllustrations = {
  search: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.circle
        cx="50"
        cy="50"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.line
        x1="70"
        y1="70"
        x2="90"
        y2="90"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="5"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
    </motion.svg>
  ),
  
  data: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.rect
        x="20"
        y="80"
        width="15"
        height="20"
        fill="currentColor"
        initial={{ height: 0, y: 100 }}
        animate={{ height: 20, y: 80 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.rect
        x="40"
        y="60"
        width="15"
        height="40"
        fill="currentColor"
        initial={{ height: 0, y: 100 }}
        animate={{ height: 40, y: 60 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      />
      <motion.rect
        x="60"
        y="40"
        width="15"
        height="60"
        fill="currentColor"
        initial={{ height: 0, y: 100 }}
        animate={{ height: 60, y: 40 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      />
      <motion.rect
        x="80"
        y="70"
        width="15"
        height="30"
        fill="currentColor"
        initial={{ height: 0, y: 100 }}
        animate={{ height: 30, y: 70 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  ),
  
  users: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.circle
        cx="60"
        cy="35"
        r="15"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.circle
        cx="35"
        cy="70"
        r="12"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.circle
        cx="85"
        cy="70"
        r="12"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.path
        d="M60 50 Q60 70 60 85"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
    </motion.svg>
  ),
  
  analytics: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.circle
        cx="60"
        cy="60"
        r="40"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d="M60 20 L60 40 M60 80 L60 100 M20 60 L40 60 M80 60 L100 60"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="3"
        fill="currentColor"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
    </motion.svg>
  ),
  
  calendar: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.rect
        x="25"
        y="25"
        width="70"
        height="70"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.rect
        x="25"
        y="25"
        width="70"
        height="20"
        fill="currentColor"
        initial={{ height: 0 }}
        animate={{ height: 20 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      <motion.circle
        cx="35"
        cy="35"
        r="2"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.1 }}
      />
      <motion.circle
        cx="45"
        cy="35"
        r="2"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
      <motion.circle
        cx="55"
        cy="35"
        r="2"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.3 }}
      />
    </motion.svg>
  ),
  
  error: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-red-300 dark:text-red-600"
    >
      <motion.circle
        cx="60"
        cy="60"
        r="40"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M45 45 L75 75 M75 45 L45 75"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
    </motion.svg>
  ),
  
  default: (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <motion.rect
        x="30"
        y="30"
        width="60"
        height="60"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d="M45 60 L55 70 L75 50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
    </motion.svg>
  )
};

// Componente principal
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  illustration,
  actions,
  size = 'md',
  animated = true,
  className = ''
}) => {
  // Títulos e descrições padrão por variante
  const defaultContent = {
    search: {
      title: 'Nenhum resultado encontrado',
      description: 'Tente ajustar seus filtros ou termos de busca para encontrar o que procura.'
    },
    data: {
      title: 'Nenhum dado disponível',
      description: 'Não há dados para exibir no momento. Tente atualizar ou verificar suas configurações.'
    },
    users: {
      title: 'Nenhum usuário encontrado',
      description: 'Não há usuários cadastrados ou que correspondam aos critérios de busca.'
    },
    analytics: {
      title: 'Nenhuma análise disponível',
      description: 'Não há dados suficientes para gerar análises. Continue coletando informações.'
    },
    calendar: {
      title: 'Nenhum evento agendado',
      description: 'Não há eventos ou compromissos agendados para o período selecionado.'
    },
    error: {
      title: 'Algo deu errado',
      description: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'
    },
    default: {
      title: 'Nada por aqui',
      description: 'Esta área está vazia no momento. Adicione conteúdo para começar.'
    }
  };

  const content = defaultContent[variant];
  const finalTitle = title || content.title;
  const finalDescription = description || content.description;
  const finalIllustration = illustration || EmptyStateIllustrations[variant];

  // Classes de tamanho
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={variant}
          initial={animated ? { scale: 0.8, opacity: 0 } : false}
          animate={animated ? { scale: 1, opacity: 1 } : false}
          exit={animated ? { scale: 0.8, opacity: 0 } : false}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          {finalIllustration}
        </motion.div>
      </AnimatePresence>

      <motion.h3
        className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={animated ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {finalTitle}
      </motion.h3>

      <motion.p
        className="text-gray-600 dark:text-gray-400 max-w-md mb-6"
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={animated ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {finalDescription}
      </motion.p>

      {actions && (
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={animated ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
};

// Componentes de ação pré-definidos
export const EmptyStateActions = {
  // Ação primária
  Primary: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <motion.button
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  ),

  // Ação secundária
  Secondary: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <motion.button
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  ),

  // Ação de atualizar
  Refresh: ({ onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <motion.button
      className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <RefreshCw className="w-4 h-4" />
      Atualizar
    </motion.button>
  ),

  // Ação de adicionar
  Add: ({ onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <motion.button
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <Plus className="w-4 h-4" />
      {children || 'Adicionar'}
    </motion.button>
  ),

  // Ação de continuar
  Continue: ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <motion.button
      className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children || 'Continuar'}
      <ArrowRight className="w-4 h-4" />
    </motion.button>
  )
};

// Componente de exemplo de uso
export const EmptyStateExample: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Estado vazio padrão */}
      <EmptyState variant="default" />
      
      {/* Estado vazio de busca */}
      <EmptyState 
        variant="search"
        actions={
          <>
            <EmptyStateActions.Primary onClick={() => console.log('Nova busca')}>
              <Search className="w-4 h-4" />
              Nova Busca
            </EmptyStateActions.Primary>
            <EmptyStateActions.Secondary onClick={() => console.log('Limpar filtros')}>
              Limpar Filtros
            </EmptyStateActions.Secondary>
          </>
        }
      />
      
      {/* Estado vazio de dados */}
      <EmptyState 
        variant="data"
        actions={
          <>
            <EmptyStateActions.Add onClick={() => console.log('Adicionar dados')}>
              Adicionar Dados
            </EmptyStateActions.Add>
            <EmptyStateActions.Refresh onClick={() => console.log('Atualizar')} />
          </>
        }
      />
      
      {/* Estado vazio de usuários */}
      <EmptyState 
        variant="users"
        actions={
          <>
            <EmptyStateActions.Primary onClick={() => console.log('Convidar usuários')}>
              <Users className="w-4 h-4" />
              Convidar Usuários
            </EmptyStateActions.Primary>
            <EmptyStateActions.Secondary onClick={() => console.log('Importar')}>
              Importar
            </EmptyStateActions.Secondary>
          </>
        }
      />
      
      {/* Estado vazio de analytics */}
      <EmptyState 
        variant="analytics"
        actions={
          <>
            <EmptyStateActions.Primary onClick={() => console.log('Configurar métricas')}>
              <BarChart3 className="w-4 h-4" />
              Configurar Métricas
            </EmptyStateActions.Primary>
            <EmptyStateActions.Continue onClick={() => console.log('Ver tutorial')}>
              Ver Tutorial
            </EmptyStateActions.Continue>
          </>
        }
      />
      
      {/* Estado vazio de calendário */}
      <EmptyState 
        variant="calendar"
        actions={
          <>
            <EmptyStateActions.Add onClick={() => console.log('Agendar evento')}>
              <Calendar className="w-4 h-4" />
              Agendar Evento
            </EmptyStateActions.Add>
            <EmptyStateActions.Secondary onClick={() => console.log('Ver histórico')}>
              Ver Histórico
            </EmptyStateActions.Secondary>
          </>
        }
      />
      
      {/* Estado de erro */}
      <EmptyState 
        variant="error"
        actions={
          <>
            <EmptyStateActions.Refresh onClick={() => console.log('Tentar novamente')} />
            <EmptyStateActions.Secondary onClick={() => console.log('Contatar suporte')}>
              Contatar Suporte
            </EmptyStateActions.Secondary>
          </>
        }
      />
    </div>
  );
};

export default EmptyState;
