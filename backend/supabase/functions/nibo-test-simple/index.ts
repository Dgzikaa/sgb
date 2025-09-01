import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  try {
    console.log('🧪 Testando API do Nibo diretamente...')
    
    const token = '02D8F9B964E74ADAA1A595909A67BA46'
    const url = `https://api.nibo.com.br/empresas/v1/stakeholders?apitoken=${token}&$top=1`
    
    console.log('🔗 URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': token
      }
    })
    
    console.log('📊 Status:', response.status)
    console.log('📊 StatusText:', response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: response.status,
          statusText: response.statusText,
          error: errorText 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const data = await response.json()
    console.log('✅ Dados recebidos:', data.count, 'registros')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: response.status,
        count: data.count,
        message: 'API do Nibo funcionando perfeitamente!'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('💥 Erro:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
