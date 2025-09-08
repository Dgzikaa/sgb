import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetinResponse {
  success: boolean
  data: any[]
  pagination: {
    total: number
    current_page: number
    next_page: number | null
    last_page: number
    per_page: number
    is_last_page: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 INICIANDO TESTE DEBUG DA API GETIN')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get credentials
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('api_token')
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()

    if (!credenciais?.api_token) {
      throw new Error('Token não encontrado')
    }

    const hoje = new Date()
    const startDate = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    console.log(`📅 Testando período: ${startDate} a ${endDate}`)

    const tests = [
      {
        name: 'Teste 1: Sem parâmetros extras',
        params: {
          start_date: startDate,
          end_date: endDate,
          per_page: '50',
          page: '1'
        }
      },
      {
        name: 'Teste 2: Com unit_id específico',
        params: {
          start_date: startDate,
          end_date: endDate,
          per_page: '50',
          page: '1',
          unit_id: 'M1mAGM13'
        }
      },
      {
        name: 'Teste 3: Per page menor (15)',
        params: {
          start_date: startDate,
          end_date: endDate,
          per_page: '15',
          page: '1'
        }
      },
      {
        name: 'Teste 4: Apenas hoje',
        params: {
          date: hoje.toISOString().split('T')[0],
          per_page: '50',
          page: '1'
        }
      },
      {
        name: 'Teste 5: Com status específico',
        params: {
          start_date: startDate,
          end_date: endDate,
          per_page: '50',
          page: '1',
          status: 'CONFIRMED'
        }
      }
    ]

    const results = []

    for (const test of tests) {
      console.log(`\n🧪 ${test.name}`)
      
      const url = new URL('https://api.getinapis.com/apis/v2/reservations')
      Object.entries(test.params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      console.log(`🔗 URL: ${url.toString()}`)

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'apiKey': credenciais.api_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SGB-Getin-Debug/1.0'
          },
        })

        if (!response.ok) {
          console.log(`❌ HTTP ${response.status}: ${response.statusText}`)
          results.push({
            test: test.name,
            error: `HTTP ${response.status}`,
            params: test.params
          })
          continue
        }

        const data: GetinResponse = await response.json()
        
        console.log(`✅ Sucesso: ${data.success}`)
        console.log(`📊 Reservas encontradas: ${data.data?.length || 0}`)
        console.log(`📄 Paginação:`, data.pagination)

        if (data.data && data.data.length > 0) {
          console.log(`🔍 Primeira reserva:`, {
            id: data.data[0].id,
            date: data.data[0].date,
            status: data.data[0].status,
            name: data.data[0].name
          })
        }

        results.push({
          test: test.name,
          success: data.success,
          count: data.data?.length || 0,
          pagination: data.pagination,
          params: test.params,
          sample: data.data?.[0] ? {
            id: data.data[0].id,
            date: data.data[0].date,
            status: data.data[0].status
          } : null
        })

        // Se há mais páginas, testar a segunda página
        if (data.pagination && !data.pagination.is_last_page) {
          console.log(`📄 Testando página 2...`)
          
          const url2 = new URL('https://api.getinapis.com/apis/v2/reservations')
          Object.entries(test.params).forEach(([key, value]) => {
            url2.searchParams.set(key, value)
          })
          url2.searchParams.set('page', '2')

          const response2 = await fetch(url2.toString(), {
            method: 'GET',
            headers: {
              'apiKey': credenciais.api_token,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'SGB-Getin-Debug/1.0'
            },
          })

          if (response2.ok) {
            const data2: GetinResponse = await response2.json()
            console.log(`📄 Página 2: ${data2.data?.length || 0} reservas`)
            
            results[results.length - 1].page2_count = data2.data?.length || 0
          }
        }

      } catch (error) {
        console.log(`❌ Erro:`, error)
        results.push({
          test: test.name,
          error: error.message,
          params: test.params
        })
      }

      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎯 RESUMO DOS TESTES:')
    results.forEach(result => {
      console.log(`${result.test}: ${result.count || 0} reservas ${result.page2_count ? `(+${result.page2_count} na pág 2)` : ''}`)
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Testes de debug concluídos',
        results: results,
        period: `${startDate} a ${endDate}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro nos testes:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
