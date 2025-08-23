import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Teste básico do Sentry
    console.log('🧪 Testando Sentry integration...');
    
    // Enviar evento de teste
    Sentry.addBreadcrumb({
      message: 'Teste de integração Sentry',
      level: 'info',
      category: 'test'
    });

    // Capturar mensagem de teste
    Sentry.captureMessage('✅ Sentry funcionando no Zykor!', 'info');

    // Simular diferentes tipos de eventos para teste
    const testType = request.nextUrl.searchParams.get('type') || 'success';

    switch (testType) {
      case 'error':
        // Teste de erro
        Sentry.captureException(new Error('🧪 Teste de erro do Zykor'));
        return NextResponse.json({ 
          message: 'Erro de teste enviado para Sentry',
          type: 'error'
        });

      case 'performance': {
        // Teste de performance
        await Sentry.startSpan({
          name: 'test-performance',
          op: 'test'
        }, async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        return NextResponse.json({
          message: 'Teste de performance enviado',
          type: 'performance'
        });
      }

      case 'user':
        // Teste com contexto de usuário
        Sentry.setUser({
          id: 'test-user',
          username: 'rodrigo',
          email: 'rodrigo.zykor@gmail.com.br'
        });
        
        Sentry.captureMessage('Teste com contexto de usuário', 'info');
        
        return NextResponse.json({
          message: 'Teste com usuário enviado',
          type: 'user'
        });

      default:
        return NextResponse.json({
          message: '✅ Sentry integrado com sucesso!',
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configurado' : 'Não configurado',
          environment: process.env.NODE_ENV,
          tests: {
            error: '/api/test-sentry?type=error',
            performance: '/api/test-sentry?type=performance', 
            user: '/api/test-sentry?type=user'
          },
          freeTierLimits: {
            errors: '5,000/mês',
            performance: '10,000 transactions/mês',
            retention: '30 dias'
          }
        });
    }

  } catch (error) {
    console.error('Erro no teste Sentry:', error);
    
    // Enviar o próprio erro para Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      error: 'Erro no teste Sentry',
      message: (error as Error).message
    }, { status: 500 });
  }
}
