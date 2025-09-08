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
  success: boolean
  data: GetinReservation[]
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log de autorização para debug
    const authHeader = req.headers.get('authorization')
    console.log('🔐 Authorization header:', authHeader ? 'Presente' : 'Ausente')
    // Log da requisição para debug
    console.log('📥 Requisição recebida:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })
    console.log('🚀 Iniciando sincronização contínua GET IN')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('🔐 Configurações:', {
      supabaseUrl: supabaseUrl ? 'Configurada' : 'Não encontrada',
      supabaseKey: supabaseKey ? 'Configurada' : 'Não encontrada'
    })
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Getin credentials
    console.log('🔍 Buscando credenciais GET IN...')
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('username, api_token')
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()
    
    console.log('🔐 Resultado da busca:', {
      encontrou: !!credenciais,
      erro: credError?.message,
      username: credenciais?.username
    })

    if (credError || !credenciais) {
      throw new Error('Credenciais do Getin não encontradas')
    }

    if (!credenciais.api_token) {
      throw new Error('API Token do Getin não configurado')
    }

    console.log('✅ Credenciais encontradas:', { 
      sistema: 'getin', 
      ambiente: 'producao', 
      username: credenciais.username 
    })

    // Calculate date range: (today - 30) to (today + 30) - SINCRONIZAÇÃO COMPLETA 60 DIAS
    const hoje = new Date()
    const dataInicio = new Date(hoje)
    dataInicio.setDate(hoje.getDate() - 30) // 30 dias atrás
    
    const dataFim = new Date(hoje)
    dataFim.setDate(hoje.getDate() + 30) // Hoje + 30 dias

    const startDate = dataInicio.toISOString().split('T')[0]
    const endDate = dataFim.toISOString().split('T')[0]

    console.log(`📅 Período de sincronização: ${startDate} a ${endDate} (60 dias)`)
    console.log(`📋 Modo: Sincronização COMPLETA - Últimos 30 dias + Próximos 30 dias`)

    let totalReservas = 0
    let totalSalvas = 0
    let totalNovas = 0
    let totalAtualizadas = 0
    let totalErros = 0
    let currentPage = 1
    let hasMorePages = true

    // Process all pages
    while (hasMorePages) {
      console.log(`📡 Buscando reservas: ${startDate} a ${endDate} (página ${currentPage})`)

      const getinUrl = new URL('https://api.getinapis.com/apis/v2/reservations')
      getinUrl.searchParams.set('start_date', startDate)
      getinUrl.searchParams.set('end_date', endDate)
      getinUrl.searchParams.set('page', currentPage.toString())
      getinUrl.searchParams.set('per_page', '50') // Máximo real da API

      const response = await fetch(getinUrl.toString(), {
        method: 'GET',
        headers: {
          'apiKey': credenciais.api_token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'SGB-Getin-Sync/1.0'
        },
      })

      if (!response.ok) {
        throw new Error(`Erro na API Getin: ${response.status} - ${response.statusText}`)
      }

      const data: GetinResponse = await response.json()
      
      if (!data.success) {
        console.error('❌ API Getin retornou erro:', data)
        break
      }
      
      if (!data.data || data.data.length === 0) {
        console.log('📭 Nenhuma reserva encontrada nesta página')
        break
      }

      console.log(`✅ ${data.data.length} reservas encontradas na página ${currentPage}`)
      console.log(`📊 Paginação: ${data.pagination?.current_page || currentPage}/${data.pagination?.last_page || 'undefined'} (total: ${data.pagination?.total || 'undefined'})`)
      console.log(`🔍 Debug paginação:`, {
        current_page: data.pagination?.current_page || currentPage,
        last_page: data.pagination?.last_page || 'undefined',
        total: data.pagination?.total || 'undefined',
        per_page: data.pagination?.per_page || 'undefined',
        is_last_page: data.pagination?.is_last_page || false,
        hasMorePages: data.pagination ? !data.pagination.is_last_page : false
      })

      totalReservas += data.data.length

      // Process reservations in batches
      console.log(`📊 Processando ${data.data.length} reservas da página ${currentPage}...`)

      for (const reserva of data.data) {
        try {
          // Check if reservation already exists and when it was created
          const { data: existingReservation } = await supabase
            .from('getin_reservations')
            .select('reservation_id, created_at, updated_at')
            .eq('reservation_id', reserva.id)
            .single()

          // Consider as new if: doesn't exist OR was created today
          const today = new Date().toISOString().split('T')[0]
          const isNewReservation = !existingReservation || 
            (existingReservation.created_at && 
             existingReservation.created_at.split('T')[0] === today)

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
            if (isNewReservation) {
              totalNovas++
              console.log(`🆕 ${reserva.id} - ${reserva.customer_name} (${reserva.date}) - NOVA`)
            } else {
              totalAtualizadas++
              console.log(`🔄 ${reserva.id} - ${reserva.customer_name} (${reserva.date}) - ATUALIZADA`)
            }
            totalSalvas++
          }

        } catch (error) {
          console.error(`❌ Erro ao processar reserva ${reserva.id}:`, error)
          totalErros++
        }
      }

      // Check if there are more pages using correct API response
      hasMorePages = data.pagination ? !data.pagination.is_last_page : false
      
      console.log(`🔍 Debug paginação detalhada:`, {
        is_last_page: data.pagination?.is_last_page,
        hasMorePages: hasMorePages,
        currentPage: currentPage,
        nextPage: currentPage + 1
      })
      
      currentPage++

      // Rate limiting - wait 2 seconds between pages
      if (hasMorePages) {
        console.log(`⏳ Aguardando próxima página... (${currentPage} -> ${currentPage + 1})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log(`🏁 Última página processada: ${currentPage}`)
      }
    }

    // Log sync completion
    const agora = new Date()
    const proximaExecucao = new Date(agora.getTime() + (4 * 60 * 60 * 1000)) // +4 horas

    console.log('\n🎉 SINCRONIZAÇÃO CONTÍNUA CONCLUÍDA:')
    console.log('================================================================================')
    console.log(`📊 Reservas encontradas: ${totalReservas}`)
    console.log(`🆕 Reservas novas: ${totalNovas}`)
    console.log(`🔄 Reservas atualizadas: ${totalAtualizadas}`)
    console.log(`✅ Total salvas: ${totalSalvas}`)
    console.log(`❌ Erros: ${totalErros}`)
    console.log(`⏱️  Duração: ${Math.round((Date.now() - agora.getTime()) / 1000)}s`)
    console.log(`📅 Período: ${startDate} a ${endDate}`)
    console.log(`🕐 Próxima execução: ${proximaExecucao.toLocaleString('pt-BR')}`)
    console.log('================================================================================')

    // Log sync result to getin_sync_logs table
    try {
      await supabase
        .from('getin_sync_logs')
        .insert({
          status: totalErros === 0 ? 'sucesso' : 'erro_parcial',
          reservas_extraidas: totalReservas,
          reservas_novas: totalNovas,
          reservas_atualizadas: totalAtualizadas,
          detalhes: {
            periodo_inicio: startDate,
            periodo_fim: endDate,
            total_erros: totalErros,
            duracao_segundos: Math.round((Date.now() - agora.getTime()) / 1000),
            proxima_execucao: proximaExecucao.toISOString()
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
          total_novas: totalNovas,
          total_atualizadas: totalAtualizadas,
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
