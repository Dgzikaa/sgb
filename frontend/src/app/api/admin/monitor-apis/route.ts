import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Caminho para o script de monitoramento
    const scriptsPath = path.join(process.cwd(), '..', 'scripts');
    const monitorScript = path.join(scriptsPath, 'api-monitor.js');
    
    console.log('🚀 Executando monitoramento de APIs via interface admin...');
    
    // Executar o script de monitoramento
    const { stdout, stderr } = await execAsync(`node "${monitorScript}"`, {
      cwd: scriptsPath,
      timeout: 60000 // 1 minuto de timeout
    });
    
    // Parse do output para extrair informações estruturadas
    let result = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        online: 0,
        offline: 0,
        pending: 0
      },
      apis: {} as Record<string, any>,
      logs: stdout,
      success: true
    };
    
    // Tentar extrair informações do log
    try {
      // Procurar por padrões no output
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        // Extrair status das APIs
        if (line.includes('✅') && line.includes('Online')) {
          const match = line.match(/✅\s+(.+?):\s+Online\s+\((\d+)ms\)/);
          if (match) {
            const [, name, responseTime] = match;
            result.apis[name] = {
              name,
              status: 'online',
              responseTime: parseInt(responseTime),
              category: 'production'
            };
            result.summary.online++;
            result.summary.total++;
          }
        }
        
        if (line.includes('❌') || line.includes('⚠️')) {
          const match = line.match(/[❌⚠️]\s+(.+?):\s+(.+)/);
          if (match) {
            const [, name, error] = match;
            result.apis[name] = {
              name,
              status: 'offline',
              error,
              category: 'production'
            };
            result.summary.offline++;
            result.summary.total++;
          }
        }
        
        if (line.includes('⏸️')) {
          const match = line.match(/⏸️\s+(.+?):/);
          if (match) {
            const [, name] = match;
            result.apis[name] = {
              name,
              status: 'pending',
              category: 'pending'
            };
            result.summary.pending++;
            result.summary.total++;
          }
        }
        
        // Extrair resumo
        if (line.includes('Total de APIs:')) {
          const match = line.match(/Total de APIs:\s+(\d+)/);
          if (match) result.summary.total = parseInt(match[1]);
        }
        
        if (line.includes('🟢 Online:')) {
          const match = line.match(/🟢 Online:\s+(\d+)/);
          if (match) result.summary.online = parseInt(match[1]);
        }
        
        if (line.includes('🔴 Offline:')) {
          const match = line.match(/🔴 Offline:\s+(\d+)/);
          if (match) result.summary.offline = parseInt(match[1]);
        }
        
        if (line.includes('⏸️  Pendentes:')) {
          const match = line.match(/⏸️\s+Pendentes:\s+(\d+)/);
          if (match) result.summary.pending = parseInt(match[1]);
        }
      }
    } catch (parseError) {
      console.warn('Erro ao fazer parse do output:', parseError);
    }
    
    console.log('✅ Monitoramento concluído:', result.summary);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Erro no monitoramento:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        online: 0,
        offline: 0,
        pending: 0
      },
      apis: {},
      logs: error.message,
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de monitoramento ativo',
    endpoints: {
      'POST /api/admin/monitor-apis': 'Executar monitoramento das APIs',
      'GET /api/admin/monitor-apis': 'Informações da API'
    }
  });
} 