'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Settings,
  Zap,
  Heart,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Inbox,
  FolderOpen,
  Database,
  Globe,
  Smartphone,
  Mail,
  Bell,
} from 'lucide-react';

// =====================================================
// 🎭 SISTEMA DE EMPTY STATES - ZYKOR
// =====================================================

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAnimation?: boolean;
}

// =====================================================
// 🎨 COMPONENTE PRINCIPAL
// =====================================================

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  actions,
  variant = 'default',
  size = 'md',
  className = '',
  showAnimation = true,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className={cn('text-center', sizeClasses[size], className)}>
      {/* Ilustração ou Ícone */}
      <div className="flex justify-center mb-4">
        {illustration ? (
          <motion.div
            initial={showAnimation ? { opacity: 0, scale: 0.8 } : false}
            animate={showAnimation ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-24 h-24"
          >
            {illustration}
          </motion.div>
        ) : icon ? (
          <motion.div
            initial={showAnimation ? { opacity: 0, y: 20 } : false}
            animate={showAnimation ? { opacity: 1, y: 0 } : false}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              'mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-600',
              iconSizes[size]
            )}
          >
            {icon}
          </motion.div>
        ) : null}
      </div>

      {/* Título */}
      <motion.h3
        initial={showAnimation ? { opacity: 0, y: 20 } : false}
        animate={showAnimation ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}
      >
        {title}
      </motion.h3>

      {/* Descrição */}
      <motion.p
        initial={showAnimation ? { opacity: 0, y: 20 } : false}
        animate={showAnimation ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={cn(
          'text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}
      >
        {description}
      </motion.p>

      {/* Ações */}
      {actions && (
        <motion.div
          initial={showAnimation ? { opacity: 0, y: 20 } : false}
          animate={showAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {actions}
        </motion.div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="card-dark">
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}

// =====================================================
// 🎨 EMPTY STATES PRÉ-DEFINIDOS PARA ZYKOR
// =====================================================

// Checklist vazio
export function EmptyChecklist({ 
  onCreate, 
  variant = 'default',
  size = 'md' 
}: { 
  onCreate?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Nenhum Checklist Encontrado"
      description="Comece criando seu primeiro checklist para organizar suas tarefas e processos."
      illustration={<ChecklistIllustration />}
      actions={
        onCreate && (
          <Button onClick={onCreate} className="btn-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Criar Checklist
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Dados vazios
export function EmptyData({ 
  title = "Nenhum Dado Encontrado",
  description = "Não há dados para exibir no momento.",
  onRefresh,
  variant = 'default',
  size = 'md'
}: {
  title?: string;
  description?: string;
  onRefresh?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration={<DataIllustration />}
      actions={
        onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="btn-outline-dark">
            <Zap className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Busca sem resultados
export function EmptySearch({ 
  query,
  onClear,
  variant = 'default',
  size = 'md'
}: {
  query?: string;
  onClear?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Nenhum Resultado Encontrado"
      description={
        query 
          ? `Não encontramos resultados para "${query}". Tente outros termos ou verifique a ortografia.`
          : "Sua busca não retornou resultados. Tente outros termos ou filtros."
      }
      illustration={<SearchIllustration />}
      actions={
        onClear && (
          <Button onClick={onClear} variant="outline" className="btn-outline-dark">
            <Search className="w-4 h-4 mr-2" />
            Limpar Busca
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Usuários vazios
export function EmptyUsers({ 
  onInvite,
  variant = 'default',
  size = 'md'
}: {
  onInvite?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Nenhum Usuário Cadastrado"
      description="Comece convidando usuários para colaborar no sistema."
      illustration={<UsersIllustration />}
      actions={
        onInvite && (
          <Button onClick={onInvite} className="btn-primary-dark">
            <Users className="w-4 h-4 mr-2" />
            Convidar Usuário
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Relatórios vazios
export function EmptyReports({ 
  onGenerate,
  variant = 'default',
  size = 'md'
}: {
  onGenerate?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Nenhum Relatório Disponível"
      description="Gere relatórios para analisar dados e métricas do seu negócio."
      illustration={<ReportsIllustration />}
      actions={
        onGenerate && (
          <Button onClick={onGenerate} className="btn-primary-dark">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Eventos vazios
export function EmptyEvents({ 
  onCreate,
  variant = 'default',
  size = 'md'
}: {
  onCreate?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Nenhum Evento Programado"
      description="Crie eventos para atrair clientes e aumentar suas vendas."
      illustration={<EventsIllustration />}
      actions={
        onCreate && (
          <Button onClick={onCreate} className="btn-primary-dark">
            <Calendar className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// Configurações vazias
export function EmptySettings({ 
  onConfigure,
  variant = 'default',
  size = 'md'
}: {
  onConfigure?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <EmptyState
      title="Configurações Não Definidas"
      description="Configure o sistema para personalizar sua experiência e funcionalidades."
      illustration={<SettingsIllustration />}
      actions={
        onConfigure && (
          <Button onClick={onConfigure} className="btn-primary-dark">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        )
      }
      variant={variant}
      size={size}
    />
  );
}

// =====================================================
// 🎨 ILUSTRAÇÕES SVG CUSTOMIZADAS
// =====================================================

function ChecklistIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-blue-500 dark:text-blue-400">
      <rect x="40" y="30" width="120" height="140" rx="8" fill="currentColor" opacity="0.1"/>
      <rect x="50" y="40" width="100" height="8" rx="4" fill="currentColor" opacity="0.3"/>
      <rect x="50" y="60" width="80" height="6" rx="3" fill="currentColor" opacity="0.2"/>
      <rect x="50" y="80" width="90" height="6" rx="3" fill="currentColor" opacity="0.2"/>
      <rect x="50" y="100" width="70" height="6" rx="3" fill="currentColor" opacity="0.2"/>
      <circle cx="160" cy="45" r="8" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="65" r="8" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="85" r="8" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="105" r="8" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

function DataIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-green-500 dark:text-green-400">
      <rect x="30" y="150" width="20" height="30" fill="currentColor" opacity="0.6"/>
      <rect x="60" y="120" width="20" height="60" fill="currentColor" opacity="0.6"/>
      <rect x="90" y="90" width="20" height="90" fill="currentColor" opacity="0.6"/>
      <rect x="120" y="60" width="20" height="120" fill="currentColor" opacity="0.6"/>
      <rect x="150" y="30" width="20" height="150" fill="currentColor" opacity="0.6"/>
      <line x1="20" y1="180" x2="180" y2="180" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <line x1="20" y1="20" x2="20" y2="180" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-purple-500 dark:text-purple-400">
      <circle cx="80" cy="80" r="50" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.6"/>
      <line x1="120" y1="120" x2="160" y2="160" stroke="currentColor" strokeWidth="8" opacity="0.6"/>
      <circle cx="80" cy="80" r="20" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}

function UsersIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500 dark:text-indigo-400">
      <circle cx="100" cy="60" r="25" fill="currentColor" opacity="0.6"/>
      <circle cx="60" cy="120" r="20" fill="currentColor" opacity="0.6"/>
      <circle cx="140" cy="120" r="20" fill="currentColor" opacity="0.6"/>
      <path d="M 75 140 Q 100 160 125 140" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.6"/>
    </svg>
  );
}

function ReportsIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-orange-500 dark:text-orange-400">
      <rect x="40" y="40" width="120" height="120" rx="8" fill="currentColor" opacity="0.1"/>
      <rect x="60" y="60" width="80" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <rect x="60" y="80" width="60" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <rect x="60" y="100" width="90" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <rect x="60" y="120" width="40" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <circle cx="160" cy="70" r="6" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="90" r="6" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="110" r="6" fill="currentColor" opacity="0.6"/>
      <circle cx="160" cy="130" r="6" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

function EventsIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-pink-500 dark:text-pink-400">
      <rect x="40" y="60" width="120" height="100" rx="8" fill="currentColor" opacity="0.1"/>
      <rect x="50" y="40" width="100" height="20" rx="10" fill="currentColor" opacity="0.3"/>
      <circle cx="100" cy="50" r="8" fill="currentColor" opacity="0.6"/>
      <rect x="60" y="80" width="80" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <rect x="60" y="100" width="60" height="8" rx="4" fill="currentColor" opacity="0.4"/>
      <rect x="60" y="120" width="70" height="8" rx="4" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}

function SettingsIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full text-gray-500 dark:text-gray-400">
      <circle cx="100" cy="100" r="40" fill="currentColor" opacity="0.1"/>
      <circle cx="100" cy="100" r="30" fill="currentColor" opacity="0.2"/>
      <circle cx="100" cy="100" r="20" fill="currentColor" opacity="0.3"/>
      <circle cx="100" cy="100" r="10" fill="currentColor" opacity="0.4"/>
      <rect x="95" y="30" width="10" height="20" fill="currentColor" opacity="0.6"/>
      <rect x="95" y="150" width="10" height="20" fill="currentColor" opacity="0.6"/>
      <rect x="30" y="95" width="20" height="10" fill="currentColor" opacity="0.6"/>
      <rect x="150" y="95" width="20" height="10" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

// =====================================================
// 🚀 HOOKS E UTILITÁRIOS
// =====================================================

export function useEmptyState() {
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [emptyReason, setEmptyReason] = React.useState<string>('');

  const setEmpty = (reason: string) => {
    setIsEmpty(true);
    setEmptyReason(reason);
  };

  const setNotEmpty = () => {
    setIsEmpty(false);
    setEmptyReason('');
  };

  return {
    isEmpty,
    emptyReason,
    setEmpty,
    setNotEmpty,
  };
}

// =====================================================
// 📱 EMPTY STATE RESPONSIVO
// =====================================================

export function ResponsiveEmptyState(props: EmptyStateProps & { 
  mobileVariant?: 'default' | 'minimal' | 'card' | 'fullscreen';
  mobileSize?: 'sm' | 'md' | 'lg';
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mobileProps = {
    variant: props.mobileVariant || 'minimal',
    size: props.mobileSize || 'sm',
  };

  return (
    <EmptyState
      {...props}
      {...(isMobile ? mobileProps : {})}
    />
  );
}
