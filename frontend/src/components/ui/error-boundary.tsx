'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Aqui poderemos integrar Sentry posteriormente
    console.error('Captured by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card-dark p-6">
          <h3 className="card-title-dark mb-2">Ocorreu um erro</h3>
          <p className="card-description-dark">Tente recarregar a página. Se o problema persistir, contate o suporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


