import { NextRequest, NextResponse } from 'next/server';

// VariÃ¡Â¡vel global para armazenar o interval
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
        console.log('Ã°Å¸â€â€ž Executando sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica...');
        
        try {
          // Chamar endpoint de sincronizaÃ¡Â§Ã¡Â£o
          const response = await fetch('http://localhost:3000/api/sync/getin-reservas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('Å“â€¦ SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica concluÃ¡Â­da:', result.data);
          } else {
            console.error('ÂÅ’ Erro na sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica:', result.error);
          }
        } catch (error) {
          console.error('ÂÅ’ Erro ao executar sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica:', error);
        }
      }, intervalMinutes * 60 * 1000); // Converter minutos para milliseconds

      console.log(`Ã°Å¸Å¡â‚¬ SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica iniciada a cada ${intervalMinutes} minutos`);

      return NextResponse.json({
        success: true,
        message: `SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica iniciada a cada ${intervalMinutes} minutos`,
        intervalMinutes
      });

    } else if (action === 'stop') {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('ÂÂ¸Ã¯Â¸Â SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica parada');

        return NextResponse.json({
          success: true,
          message: 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica parada'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Nenhuma sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica estava rodando'
        });
      }

    } else if (action === 'status') {
      return NextResponse.json({
        success: true,
        status: syncInterval ? 'running' : 'stopped',
        message: syncInterval ? 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica ativa' : 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica parada'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'AÃ¡Â§Ã¡Â£o invÃ¡Â¡lida. Use: start, stop ou status'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('ÂÅ’ Erro no cron setup:', error);
    
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
    message: syncInterval ? 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica ativa' : 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica parada'
  });
} 

