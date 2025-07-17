import { NextRequest, NextResponse } from 'next/server';

// Variá¡vel global para armazenar o interval
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
        console.log('ðŸ”„ Executando sincronizaá§á£o automá¡tica...');
        
        try {
          // Chamar endpoint de sincronizaá§á£o
          const response = await fetch('http://localhost:3000/api/sync/getin-reservas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('œ… Sincronizaá§á£o automá¡tica concluá­da:', result.data);
          } else {
            console.error('Œ Erro na sincronizaá§á£o automá¡tica:', result.error);
          }
        } catch (error) {
          console.error('Œ Erro ao executar sincronizaá§á£o automá¡tica:', error);
        }
      }, intervalMinutes * 60 * 1000); // Converter minutos para milliseconds

      console.log(`ðŸš€ Sincronizaá§á£o automá¡tica iniciada a cada ${intervalMinutes} minutos`);

      return NextResponse.json({
        success: true,
        message: `Sincronizaá§á£o automá¡tica iniciada a cada ${intervalMinutes} minutos`,
        intervalMinutes
      });

    } else if (action === 'stop') {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('¸ï¸ Sincronizaá§á£o automá¡tica parada');

        return NextResponse.json({
          success: true,
          message: 'Sincronizaá§á£o automá¡tica parada'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Nenhuma sincronizaá§á£o automá¡tica estava rodando'
        });
      }

    } else if (action === 'status') {
      return NextResponse.json({
        success: true,
        status: syncInterval ? 'running' : 'stopped',
        message: syncInterval ? 'Sincronizaá§á£o automá¡tica ativa' : 'Sincronizaá§á£o automá¡tica parada'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Aá§á£o invá¡lida. Use: start, stop ou status'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Œ Erro no cron setup:', error);
    
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
    message: syncInterval ? 'Sincronizaá§á£o automá¡tica ativa' : 'Sincronizaá§á£o automá¡tica parada'
  });
} 
