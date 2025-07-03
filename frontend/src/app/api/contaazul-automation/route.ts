import { NextRequest, NextResponse } from 'next/server'

// URL da API Python (configurÃ¡vel via env)
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸ¤– Iniciando chamada para automaÃ§Ã£o ContaAzul via Python API...');

    // Chamar API Python
    const response = await fetch(`${PYTHON_API_URL}/execute-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout longo pois a automaÃ§Ã£o pode demorar
      signal: AbortSignal.timeout(15 * 60 * 1000), // 15 minutos
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Python falhou: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'AutomaÃ§Ã£o ContaAzul executada com sucesso!',
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `AutomaÃ§Ã£o falhou: ${result.error || result.message}`,
        details: result
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('âŒ Erro na automaÃ§Ã£o ContaAzul:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        message: 'Timeout: A automaÃ§Ã£o demorou mais de 15 minutos para executar',
        error: 'TIMEOUT'
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para verificar status da API Python
    const response = await fetch(`${PYTHON_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 segundos
    });

    if (!response.ok) {
      throw new Error(`API Python indisponÃ­vel: ${response.status}`);
    }

    const healthData = await response.json();

    return NextResponse.json({
      success: true,
      message: 'API Python estÃ¡ online',
      pythonApi: {
        url: PYTHON_API_URL,
        status: 'online',
        ...healthData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('âŒ Erro ao verificar API Python:', error);
    
    return NextResponse.json({
      success: false,
      message: 'API Python nÃ£o estÃ¡ disponÃ­vel',
      pythonApi: {
        url: PYTHON_API_URL,
        status: 'offline',
        error: error.message
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}