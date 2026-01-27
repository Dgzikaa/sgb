import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface corrigida para refletir a estrutura REAL da API do GetIn
interface GetinReservation {
  id: string
  date: string
  time: string
  people: number
  status: string
  discount: number
  info: string
  // Dados do cliente - nomes corretos da API
  name: string           // customer_name
  email: string          // customer_email  
  mobile: string         // customer_phone
  // Dados da unit - objeto aninhado
  unit: {
    id: string
    name: string
    cover_image: string
    profile_image: string
    full_address: string
    zipcode?: string
    cuisine_name: string
    city_name: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  // Dados do setor - objeto aninhado
  sector: {
    id: string
    name: string
  }
  // Campos opcionais
  monetize?: any
  custom_fields?: any[]
  confirmation_sent?: boolean
  nps_answered?: boolean
  nps_url?: string
  no_show?: boolean
  no_show_tax?: number
  no_show_hours?: number
  no_show_eligible?: boolean
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
    console.log('🚀 Iniciando sincronização GET IN (modo unit_id mapping)')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse body para parâmetros opcionais
    let bodyParams: { start_date?: string; end_date?: string } = {}
    try {
      if (req.method === 'POST') {
        const text = await req.text()
        if (text) {
          bodyParams = JSON.parse(text)
        }
      }
    } catch (e) {
      console.log('📝 Sem body ou body inválido, usando padrão')
    }

    // Buscar credenciais GET IN (única API key para todas as units)
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('api_token')
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .limit(1)
      .single()

    if (credError || !credenciais?.api_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais GET IN não encontradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Buscar mapeamento unit_id -> bar_id da tabela getin_units
    const { data: unitsMapping, error: unitsError } = await supabase
      .from('getin_units')
      .select('unit_id, bar_id, name')
    
    if (unitsError) {
      console.warn('⚠️ Erro ao buscar getin_units:', unitsError)
    }
    
    // Criar mapa de unit_id -> bar_id
    const unitToBarMap = new Map<string, number>()
    const unitToNameMap = new Map<string, string>()
    if (unitsMapping) {
      for (const unit of unitsMapping) {
        unitToBarMap.set(unit.unit_id, unit.bar_id)
        unitToNameMap.set(unit.unit_id, unit.name)
      }
    }
    console.log(`📍 Mapeamento de units carregado: ${unitToBarMap.size} units`)

    // Calculate date range
    let startDate: string
    let endDate: string

    if (bodyParams.start_date && bodyParams.end_date) {
      startDate = bodyParams.start_date
      endDate = bodyParams.end_date
      console.log(`📅 Período: ${startDate} a ${endDate} (RETROATIVO)`)
    } else {
      const hoje = new Date()
      const dataInicio = new Date(hoje)
      dataInicio.setDate(hoje.getDate() - 30)
      const dataFim = new Date(hoje)
      dataFim.setDate(hoje.getDate() + 30)
      startDate = dataInicio.toISOString().split('T')[0]
      endDate = dataFim.toISOString().split('T')[0]
      console.log(`📅 Período: ${startDate} a ${endDate} (60 dias)`)
    }

    // Contadores
    let totalReservas = 0
    let totalNovas = 0
    let totalAtualizadas = 0
    let totalErros = 0
    let totalSemMapeamento = 0
    let currentPage = 1
    let hasMorePages = true
    const unitsEncontradas = new Set<string>()
    const resultadosPorBar = new Map<number, { novas: number; atualizadas: number; erros: number }>()

    // Process all pages
    while (hasMorePages) {
      const getinUrl = new URL('https://api.getinapis.com/apis/v2/reservations')
      getinUrl.searchParams.set('start_date', startDate)
      getinUrl.searchParams.set('end_date', endDate)
      getinUrl.searchParams.set('page', currentPage.toString())
      getinUrl.searchParams.set('per_page', '50')

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
        const errorText = await response.text()
        console.error(`❌ Erro na API Getin: ${response.status} - ${errorText}`)
        break
      }

      let data: GetinResponse
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('❌ Erro ao parsear resposta JSON da API Getin')
        break
      }
      
      if (!data || !data.success || !data.data || data.data.length === 0) {
        console.log('📭 Sem mais reservas ou resposta inválida')
        break
      }

      console.log(`📄 Página ${currentPage}: ${data.data.length} reservas`)
      totalReservas += data.data.length

      for (const reserva of data.data) {
        try {
          // Extrair unit_id do objeto unit (estrutura correta da API)
          const unitId = reserva.unit?.id || null
          const unitName = reserva.unit?.name || null
          
          // Registrar unit encontrada
          if (unitId) {
            unitsEncontradas.add(unitId)
          }

          // Determinar bar_id pelo mapeamento de unit_id
          let barId = unitId ? unitToBarMap.get(unitId) : null
          
          // Se não encontrou mapeamento, registrar nova unit para análise
          if (!barId && unitId) {
            totalSemMapeamento++
            console.warn(`⚠️ Unit sem mapeamento: ${unitId} (${unitName})`)
            // Usar bar_id = null para identificar depois
            barId = undefined
          }

          const { data: existingReservation } = await supabase
            .from('getin_reservations')
            .select('reservation_id, created_at')
            .eq('reservation_id', reserva.id)
            .single()

          const today = new Date().toISOString().split('T')[0]
          const isNewReservation = !existingReservation || 
            (existingReservation.created_at && 
             existingReservation.created_at.split('T')[0] === today)

          // Mapeamento CORRIGIDO - usando campos reais da API GetIn
          const reservaData = {
            reservation_id: reserva.id,
            unit_id: unitId,                              // de reserva.unit.id
            unit_name: unitName,                          // de reserva.unit.name
            sector_id: reserva.sector?.id || null,        // de reserva.sector.id
            sector_name: reserva.sector?.name || null,    // de reserva.sector.name
            bar_id: barId || null,
            customer_name: reserva.name || null,          // de reserva.name (NÃO customer_name)
            customer_email: reserva.email || null,        // de reserva.email (NÃO customer_email)
            customer_phone: reserva.mobile || null,       // de reserva.mobile (NÃO customer_phone)
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

          const { error: upsertError } = await supabase
            .from('getin_reservations')
            .upsert(reservaData, {
              onConflict: 'reservation_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            totalErros++
          } else {
            // Contabilizar por bar
            if (barId) {
              const stats = resultadosPorBar.get(barId) || { novas: 0, atualizadas: 0, erros: 0 }
              if (isNewReservation) {
                stats.novas++
                totalNovas++
              } else {
                stats.atualizadas++
                totalAtualizadas++
              }
              resultadosPorBar.set(barId, stats)
            } else {
              if (isNewReservation) totalNovas++
              else totalAtualizadas++
            }
          }

        } catch (error) {
          totalErros++
        }
      }

      hasMorePages = data.pagination ? !data.pagination.is_last_page : false
      currentPage++

      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Log units encontradas que não têm mapeamento
    const unitsSemMapeamento: string[] = []
    for (const unitId of unitsEncontradas) {
      if (!unitToBarMap.has(unitId)) {
        unitsSemMapeamento.push(unitId)
      }
    }

    if (unitsSemMapeamento.length > 0) {
      console.log(`\n⚠️ UNITS SEM MAPEAMENTO (precisam ser adicionadas em getin_units):`)
      for (const unitId of unitsSemMapeamento) {
        console.log(`   - ${unitId}`)
      }
    }

    // Preparar resultado por bar
    const resultadosArray = Array.from(resultadosPorBar.entries()).map(([barId, stats]) => ({
      bar_id: barId,
      novas: stats.novas,
      atualizadas: stats.atualizadas,
      erros: stats.erros
    }))

    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 RESUMO DA SINCRONIZAÇÃO`)
    console.log(`   📋 Total reservas: ${totalReservas}`)
    console.log(`   🆕 Novas: ${totalNovas}`)
    console.log(`   🔄 Atualizadas: ${totalAtualizadas}`)
    console.log(`   ❌ Erros: ${totalErros}`)
    console.log(`   ⚠️ Sem mapeamento: ${totalSemMapeamento}`)
    console.log(`   🏪 Units encontradas: ${unitsEncontradas.size}`)
    console.log(`${'='.repeat(60)}`)

    // Log sync result
    try {
      await supabase.from('getin_sync_logs').insert({
        status: totalErros === 0 ? 'sucesso' : 'erro_parcial',
        reservas_extraidas: totalReservas,
        reservas_novas: totalNovas,
        reservas_atualizadas: totalAtualizadas,
        detalhes: {
          periodo_inicio: startDate,
          periodo_fim: endDate,
          total_erros: totalErros,
          units_encontradas: Array.from(unitsEncontradas),
          units_sem_mapeamento: unitsSemMapeamento,
          resultados_por_bar: resultadosArray
        }
      })
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização GET IN concluída`,
        totais: {
          reservas: totalReservas,
          novas: totalNovas,
          atualizadas: totalAtualizadas,
          erros: totalErros,
          sem_mapeamento: totalSemMapeamento
        },
        units_encontradas: Array.from(unitsEncontradas),
        units_sem_mapeamento: unitsSemMapeamento,
        resultados_por_bar: resultadosArray,
        periodo: `${startDate} a ${endDate}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Erro desconhecido')
    console.error('❌ Erro na sincronização:', errorMessage)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
