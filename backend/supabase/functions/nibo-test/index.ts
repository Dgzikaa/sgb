import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Aceitar tanto GET quanto POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error('Método não permitido')
    }
    console.log('🧪 NIBO Test - Iniciando teste simples')
    
    // Teste básico de conectividade NIBO
    const url = new URL('https://api.nibo.com.br/empresas/v1/categories')
    url.searchParams.set('$top', '1')
    
    // Usar token hardcoded para teste
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': '02D8F9B964E74ADAA1A595909A67BA46'  // Token do bar_id 3
      }
    })

    if (!response.ok) {
      throw new Error(`API NIBO falhou: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ NIBO Test - Sucesso!')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teste NIBO bem-sucedido',
        data: {
          status_code: response.status,
          categories_found: data.items?.length || 0,
          first_category: data.items?.[0]?.name || 'N/A',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ NIBO Test - Erro:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}) 