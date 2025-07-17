import { NextRequest, NextResponse } from 'next/server';

// VariÃ¡vel global para armazenar o interval
let syncInterval: NodeJS.Timeout | null = null;

export async function POST(request: NextRequest) {
  try {
    const { action, intervalMinutes = 30 } = await request.json();

    if (action === 'start') {
      // Parar interval anterior se existir
      if (syncInterval) {
        clearInterval(syncInterval);
      }

      // Configurar novo interval
      syncInterval = setInterval(async () => {
        console.log('ðŸ”„ Executando sincronizaÃ§Ã£o automÃ¡tica...');
        
        try {
          // Chamar endpoint de sincronizaÃ§Ã£o
          const response = await fetch('http://localhost:3000/api/sync/getin-reservas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('âœ… SincronizaÃ§Ã£o automÃ¡tica concluÃ­da:', result.data);
          } else {
            console.error('âŒ Erro na sincronizaÃ§Ã£o automÃ¡tica:', result.error);
          }
        } catch (error) {
          console.error('âŒ Erro ao executar sincronizaÃ§Ã£o automÃ¡tica:', error);
        }
      }, intervalMinutes * 60 * 1000); // Converter minutos para milliseconds

      console.log(`ðŸš€ SincronizaÃ§Ã£o automÃ¡tica iniciada a cada ${intervalMinutes} minutos`);

      return NextResponse.json({
        success: true,
        message: `SincronizaÃ§Ã£o automÃ¡tica iniciada a cada ${intervalMinutes} minutos`,
        intervalMinutes
      });

    } else if (action === 'stop') {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('â¸ï¸ SincronizaÃ§Ã£o automÃ¡tica parada');

        return NextResponse.json({
          success: true,
          message: 'SincronizaÃ§Ã£o automÃ¡tica parada'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Nenhuma sincronizaÃ§Ã£o automÃ¡tica estava rodando'
        });
      }

    } else if (action === 'status') {
      return NextResponse.json({
        success: true,
        status: syncInterval ? 'running' : 'stopped',
        message: syncInterval ? 'SincronizaÃ§Ã£o automÃ¡tica ativa' : 'SincronizaÃ§Ã£o automÃ¡tica parada'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'AÃ§Ã£o invÃ¡lida. Use: start, stop ou status'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('âŒ Erro no cron setup:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: syncInterval ? 'running' : 'stopped',
    message: syncInterval ? 'SincronizaÃ§Ã£o automÃ¡tica ativa' : 'SincronizaÃ§Ã£o automÃ¡tica parada'
  });
} 
