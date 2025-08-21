import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetinReservation {
  id: string
  unit_id: string
  unit_name: string
  sector_id: string
  sector_name: string
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  time: string
  people: number
  status: string
  discount: number
  no_show: boolean
  no_show_tax: number
  no_show_hours: number
  no_show_eligible: boolean
  confirmation_sent: boolean
  nps_answered: boolean
  nps_url: string
  info: string
  unit: {
    cover_image: string
    profile_image: string
    full_address: string
    zipcode: string
    cuisine_name: string
    city_name: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

interface GetinResponse {
  data: GetinReservation[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando sincronização contínua GET IN')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Getin credentials
    const { data: credenciais, error: credError } = await supabase
      .from('credenciais_apis')
      .select('*')
      .eq('sistema', 'getin')
      .eq('ambiente', 'producao')
      .single()

    if (credError || !credenciais) {
      throw new Error('Credenciais do Getin não encontradas')
    }

    console.log('✅ Credenciais encontradas:', { 
      sistema: credenciais.sistema, 
      ambiente: credenciais.ambiente, 
      username: credenciais.username 
    })

    // Calculate date range: (today - 1) to (today + 60)
    const hoje = new Date()
    const dataInicio = new Date(hoje)
    dataInicio.setDate(hoje.getDate() - 1) // Ontem
    
    const dataFim = new Date(hoje)
    dataFim.setDate(hoje.getDate() + 60) // Hoje + 60 dias

    const startDate = dataInicio.toISOString().split('T')[0]
    const endDate = dataFim.toISOString().split('T')[0]

    console.log(`📅 Período de sincronização: ${startDate} a ${endDate} (61 dias)`)

    // Clean old reservations (older than yesterday)
    const dataLimpeza = new Date(hoje)
    dataLimpeza.setDate(hoje.getDate() - 2) // Anteontem
    const cleanupDate = dataLimpeza.toISOString().split('T')[0]

    console.log(`🧹 Removendo reservas anteriores a ${cleanupDate}...`)
    const { error: cleanupError } = await supabase
      .from('getin_reservations')
      .delete()
      .lt('reservation_date', cleanupDate)

    if (cleanupError) {
      console.warn('⚠️ Erro na limpeza:', cleanupError.message)
    } else {
      console.log('✅ Limpeza concluída')
    }

    let totalReservas = 0
    let totalSalvas = 0
    let totalErros = 0
    let currentPage = 1
    let hasMorePages = true

    // Process all pages
    while (hasMorePages) {
      console.log(`📡 Buscando reservas: ${startDate} a ${endDate} (página ${currentPage})`)

      const getinUrl = new URL('https://api.getin.com.br/v1/reservations')
      getinUrl.searchParams.set('start_date', startDate)
      getinUrl.searchParams.set('end_date', endDate)
      getinUrl.searchParams.set('page', currentPage.toString())
      getinUrl.searchParams.set('per_page', '50')

      const response = await fetch(getinUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credenciais.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erro na API Getin: ${response.status} - ${response.statusText}`)
      }

      const data: GetinResponse = await response.json()
      
      if (!data.data || data.data.length === 0) {
        console.log('📭 Nenhuma reserva encontrada nesta página')
        break
      }

      console.log(`✅ ${data.data.length} reservas encontradas na página ${currentPage}`)
      console.log(`📊 Paginação: ${data.pagination.current_page}/${data.pagination.total_pages} (total: ${data.pagination.total_items})`)

      totalReservas += data.data.length

      // Process reservations in batches
      console.log(`📊 Processando ${data.data.length} reservas da página ${currentPage}...`)

      for (const reserva of data.data) {
        try {
          const reservaData = {
            reservation_id: reserva.id,
            unit_id: reserva.unit_id,
            unit_name: reserva.unit_name,
            sector_id: reserva.sector_id,
            sector_name: reserva.sector_name,
            bar_id: 3, // Ordinário Bar
            customer_name: reserva.customer_name,
            customer_email: reserva.customer_email,
            customer_phone: reserva.customer_phone,
            reservation_date: reserva.date,
            reservation_time: reserva.time,
            people: reserva.people,
            status: reserva.status,
            discount: reserva.discount || 0,
            no_show: reserva.no_show || false,
            no_show_tax: reserva.no_show_tax || 0,
            no_show_hours: reserva.no_show_hours || 0,
            no_show_eligible: reserva.no_show_eligible || false,
            confirmation_sent: reserva.confirmation_sent || false,
            nps_answered: reserva.nps_answered || false,
            nps_url: reserva.nps_url || '',
            info: reserva.info || '',
            unit_cover_image: reserva.unit?.cover_image || '',
            unit_profile_image: reserva.unit?.profile_image || '',
            unit_full_address: reserva.unit?.full_address || '',
            unit_zipcode: reserva.unit?.zipcode || '',
            unit_cuisine_name: reserva.unit?.cuisine_name || '',
            unit_city_name: reserva.unit?.city_name || '',
            unit_coordinates_lat: reserva.unit?.coordinates?.lat || 0,
            unit_coordinates_lng: reserva.unit?.coordinates?.lng || 0,
            raw_data: reserva,
            updated_at: new Date().toISOString()
          }

          // Upsert reservation
          const { error: upsertError } = await supabase
            .from('getin_reservations')
            .upsert(reservaData, {
              onConflict: 'reservation_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error(`❌ Erro ao salvar ${reserva.id}:`, upsertError.message)
            totalErros++
          } else {
            console.log(`✅ ${reserva.id} - ${reserva.customer_name} (${reserva.date})`)
            totalSalvas++
          }

        } catch (error) {
          console.error(`❌ Erro ao processar reserva ${reserva.id}:`, error)
          totalErros++
        }
      }

      // Check if there are more pages
      hasMorePages = data.pagination.current_page < data.pagination.total_pages
      currentPage++

      // Rate limiting - wait 2 seconds between pages
      if (hasMorePages) {
        console.log('⏳ Aguardando próxima página...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Log sync completion
    const agora = new Date()
    const proximaExecucao = new Date(agora.getTime() + (4 * 60 * 60 * 1000)) // +4 horas

    console.log('\n🎉 SINCRONIZAÇÃO CONTÍNUA CONCLUÍDA:')
    console.log('================================================================================')
    console.log(`📊 Reservas encontradas: ${totalReservas}`)
    console.log(`✅ Reservas salvas/atualizadas: ${totalSalvas}`)
    console.log(`❌ Erros: ${totalErros}`)
    console.log(`⏱️  Duração: ${Math.round((Date.now() - agora.getTime()) / 1000)}s`)
    console.log(`📅 Período: ${startDate} a ${endDate}`)
    console.log(`🕐 Próxima execução: ${proximaExecucao.toLocaleString('pt-BR')}`)
    console.log('================================================================================')

    // Try to log sync result (optional, don't fail if table doesn't exist)
    try {
      await supabase
        .from('sync_logs')
        .insert({
          sistema: 'getin',
          tipo: 'continuous',
          status: totalErros === 0 ? 'success' : 'partial',
          total_encontrados: totalReservas,
          total_salvos: totalSalvas,
          total_erros: totalErros,
          periodo_inicio: startDate,
          periodo_fim: endDate,
          detalhes: {
            proxima_execucao: proximaExecucao.toISOString(),
            duracao_segundos: Math.round((Date.now() - agora.getTime()) / 1000)
          }
        })
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização contínua GET IN concluída',
        stats: {
          total_encontrados: totalReservas,
          total_salvos: totalSalvas,
          total_erros: totalErros,
          periodo: `${startDate} a ${endDate}`,
          proxima_execucao: proximaExecucao.toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
