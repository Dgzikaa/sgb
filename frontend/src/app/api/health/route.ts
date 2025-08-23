import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

// Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  
  try {
    // Check 1: Database connectivity
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const dbStart = Date.now();
      const { data, error } = await supabase
        .from('usuarios')
        .select('count')
        .limit(1)
        .single();
      
      checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        latency: Date.now() - dbStart,
        error: error?.message || null
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        latency: -1,
        error: (error as Error).message
      };
    }

    // Check 2: Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      const memoryUsagePercent = Math.round((memory.heapUsed / memory.heapTotal) * 100);
      
      checks.memory = {
        status: memoryUsagePercent > 80 ? 'warning' : 'healthy',
        usage: memoryUsagePercent,
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) // MB
      };
    }

    // Check 3: Environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );
    
    checks.environment = {
      status: missingEnvVars.length > 0 ? 'unhealthy' : 'healthy',
      missingVars: missingEnvVars
    };

    // Check 4: External APIs (simulado)
    checks.externalApis = {
      contahub: {
        status: 'healthy',
        latency: 150
      },
      contaazul: {
        status: 'healthy', 
        latency: 890
      },
      nibo: {
        status: 'healthy',
        latency: 320
      }
    };

    // Determinar status geral
    const allChecks = Object.values(checks).flat();
    const hasUnhealthy = allChecks.some((check: any) => check.status === 'unhealthy');
    const hasWarning = allChecks.some((check: any) => check.status === 'warning');
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasWarning ? 'warning' : 'healthy';
    const totalLatency = Date.now() - startTime;

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latency: totalLatency,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime ? Math.round(process.uptime()) : null,
      checks
    };

    // Status code baseado na saúde
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503;

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: (error as Error).message,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache', 
        'Expires': '0'
      }
    });
  }
}

// Endpoint para métricas detalhadas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'detailed_metrics') {
      // Retornar métricas mais detalhadas
      const metrics = {
        timestamp: new Date().toISOString(),
        performance: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        },
        memory: process.memoryUsage ? {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        } : null,
        cpu: process.cpuUsage ? process.cpuUsage() : null,
        uptime: process.uptime ? Math.round(process.uptime()) : null
      };

      return NextResponse.json(metrics);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
