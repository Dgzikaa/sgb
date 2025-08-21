'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Shield, 
  ArrowLeft,
  Zap,
  FileText,
  Send
} from 'lucide-react';

// =====================================================
// 🚨 SISTEMA DE ERROR BOUNDARIES - ZYKOR
// =====================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showDetails?: boolean;
  className?: string;
}

// =====================================================
// 🎯 ERROR BOUNDARY PRINCIPAL
// =====================================================

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    this.logError(error, errorInfo);
    
    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualizar estado
    this.setState({
      error,
      errorInfo,
    });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // Console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Boundary Caught Error:', errorData);
    }

    // Log para produção (pode ser enviado para serviço de monitoramento)
    this.sendErrorToMonitoring(errorData);
  };

  private sendErrorToMonitoring = async (errorData: any) => {
    try {
      // Enviar para API de monitoramento (se configurada)
      if (process.env.NEXT_PUBLIC_ERROR_MONITORING_URL) {
        await fetch(process.env.NEXT_PUBLIC_ERROR_MONITORING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        });
      }
    } catch (sendError) {
      // Fallback: salvar no localStorage
      this.saveErrorToLocalStorage(errorData);
    }
  };

  private saveErrorToLocalStorage = (errorData: any) => {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('zykor_errors') || '[]');
      existingErrors.push(errorData);
      
      // Manter apenas os últimos 10 erros
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('zykor_errors', JSON.stringify(existingErrors));
    } catch (e) {
      // Ignorar erros de localStorage
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      // Máximo de tentativas atingido
      this.setState({ hasError: false });
      window.location.reload();
      return;
    }

    // Verificar se passou tempo suficiente desde o último erro
    const timeSinceLastError = Date.now() - this.state.lastErrorTime;
    if (timeSinceLastError < retryDelay) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1,
      error: null,
      errorInfo: null,
    }));
  };

  private handleGoHome = () => {
    window.location.href = '/home';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Copiar para clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2));
    
    // Mostrar feedback
    alert('Relatório de bug copiado para clipboard!');
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          showDetails={this.props.showDetails || process.env.NODE_ENV === 'development'}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onGoBack={this.handleGoBack}
          onReportBug={this.handleReportBug}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// =====================================================
// 🎨 COMPONENTE DE FALLBACK DE ERRO
// =====================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
  onRetry: () => void;
  onGoHome: () => void;
  onGoBack: () => void;
  onReportBug: () => void;
  className?: string;
}

function ErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  showDetails,
  onRetry,
  onGoHome,
  onGoBack,
  onReportBug,
  className = '',
}: ErrorFallbackProps) {
  const canRetry = retryCount < maxRetries;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="card-dark border-red-200 dark:border-red-800">
          <CardHeader className="text-center border-b border-red-200 dark:border-red-800">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <CardTitle className="text-xl text-red-900 dark:text-red-100">
              Ops! Algo deu errado
            </CardTitle>
            
            <CardDescription className="text-red-700 dark:text-red-300">
              Encontramos um problema inesperado. Nossa equipe foi notificada.
            </CardDescription>

            <Badge variant="outline" className="mt-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
              ID: {errorId}
            </Badge>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Informações do erro (apenas em desenvolvimento) */}
            {showDetails && error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Detalhes do Erro
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  <strong>Mensagem:</strong> {error.message}
                </p>
                {error.stack && (
                  <details className="text-xs text-red-700 dark:text-red-300">
                    <summary className="cursor-pointer hover:text-red-600 dark:hover:text-red-400">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap bg-red-100 dark:bg-red-900/30 p-2 rounded">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Ações disponíveis */}
            <div className="space-y-3">
              {canRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente ({retryCount + 1}/{maxRetries})
                </Button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={onGoBack}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>

                <Button
                  onClick={onGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Home
                </Button>
              </div>

              <Button
                onClick={onReportBug}
                variant="outline"
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Reportar Bug
              </Button>
            </div>

            {/* Informações adicionais */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>Se o problema persistir, entre em contato com o suporte.</p>
                <p className="mt-1">ID do erro: {errorId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// =====================================================
// 🚀 ERROR BOUNDARY ESPECÍFICOS
// =====================================================

// Error Boundary para componentes específicos
export class ComponentErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Erro no componente</span>
          </div>
          <Button
            onClick={this.handleRetry}
            size="sm"
            variant="outline"
            className="mt-2 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600"
          >
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary para formulários
export class FormErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Problema no formulário</span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Tente recarregar a página ou verificar sua conexão.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary para gráficos
export class ChartErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Gráfico Indisponível
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Não foi possível carregar este gráfico.
          </p>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// 🛠️ UTILITÁRIOS E HOOKS
// =====================================================

// Gerar ID único para erro
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log do erro
    console.error('🚨 Error caught by useErrorHandler:', error);
    
    // Enviar para monitoramento
    sendErrorToMonitoring(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

// Função para enviar erros para monitoramento
async function sendErrorToMonitoring(error: Error) {
  try {
    if (process.env.NEXT_PUBLIC_ERROR_MONITORING_URL) {
      await fetch(process.env.NEXT_PUBLIC_ERROR_MONITORING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    }
  } catch (e) {
    // Ignorar erros de envio
  }
}

// =====================================================
// 📱 ERROR BOUNDARY RESPONSIVO
// =====================================================

export function ResponsiveErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ErrorBoundary
      {...props}
      fallback={
        isMobile ? (
          <MobileErrorFallback />
        ) : (
          <ErrorFallback
            error={null}
            errorInfo={null}
            errorId=""
            retryCount={0}
            maxRetries={3}
            showDetails={false}
            onRetry={() => {}}
            onGoHome={() => {}}
            onGoBack={() => {}}
            onReportBug={() => {}}
          />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Fallback específico para mobile
function MobileErrorFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Erro no Sistema
        </h2>
        
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          Tente recarregar a página ou entre em contato com o suporte.
        </p>
        
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recarregar
        </Button>
      </div>
    </div>
  );
}


