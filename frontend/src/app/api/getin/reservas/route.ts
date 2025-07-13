import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 📅 GET /api/getin/reservas - Buscar reservas
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id') || '3'
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const status = searchParams.get('status') || 'pending,confirmed,pending-payment'
    const unitId = searchParams.get('unit_id') // ID da unidade específica

    console.log('📅 Buscando reservas getIn:', {
      barId,
      startDate,
      endDate,
      status,
      unitId
    })

    // Buscar credenciais salvas
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()

    if (error || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais getIn não encontradas. Configure primeiro em /paginas/configuracoes/getin'
      }, { status: 404 })
    }

    // Verificar se token ainda é válido
    const expiresAt = new Date(credentials.configuracoes.expires_at || 0)
    const now = new Date()
    
    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado. Faça login novamente.',
        expired: true
      }, { status: 401 })
    }

    const token = credentials.access_token
    const units = credentials.configuracoes.units || []

    // Se não foi especificado unit_id, usar o primeiro disponível
    const targetUnitId = unitId || units[0]?.id || 'M1mAGM13'

    console.log('🏢 Usando unit_id:', targetUnitId)

    // Fazer requisição para API do getIn usando os headers corretos
    const apiUrl = `https://agent.getinapis.com/reservation/v1/units/${targetUnitId}/reservations?start_date=${startDate}&end_date=${endDate}&status=${status}&pagination=0&sort_field=date,time`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'pt-BR,pt-q=0.9,en-q=0.8,en-GB-q=0.7,en-US-q=0.6,es-ES-q=0.5,es-q=0.4',
        'Authorization': `Bearer ${token}`,
        'Origin': 'https://painel-reserva.getinapp.com.br',
        'Referer': 'https://painel-reserva.getinapp.com.br/',
        'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Microsoft Edge";v="108"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0'
      }
    })

    const data = await response.json()
    console.log('📊 Resposta da API getIn:', data)

    if (!response.ok) {
      console.error('❌ Erro na API getIn:', data)
      
      // Se erro de autorização, marcar token como expirado
      if (response.status === 401 || data.forceLogout) {
        await supabase
          .from('api_credentials')
          .update({ 
            ativo: false,
            configuracoes: {
              ...credentials.configuracoes,
              expires_at: new Date().toISOString()
            }
          })
          .eq('id', credentials.id)

        return NextResponse.json({
          success: false,
          error: 'Token expirado. Faça login novamente.',
          expired: true
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao buscar reservas',
        details: data
      }, { status: response.status })
    }

    // Processar e padronizar dados das reservas
    const reservas = data.data?.map((reserva: any) => ({
      id: reserva.id,
      id_externo: reserva.id,
      data_reserva: reserva.date,
      horario: reserva.time,
      nome_cliente: reserva.customer_name || reserva.name,
      email_cliente: reserva.customer_email || reserva.email,
      telefone_cliente: reserva.customer_phone || reserva.phone,
      pessoas: reserva.people || reserva.guests,
      mesa: reserva.table,
      status: reserva.status,
      observacoes: reserva.notes || reserva.observations,
      valor_total: reserva.total_value || 0,
      valor_entrada: reserva.entry_value || 0,
      criado_em: reserva.created_at,
      atualizado_em: reserva.updated_at,
      // Dados adicionais do getIn
      unit_id: targetUnitId,
      unit_name: units.find((u: any) => u.id === targetUnitId)?.name || 'Unidade',
      source: 'getin',
      raw_data: reserva
    })) || []

    // Salvar/atualizar reservas no banco usando função upsert
    const savedReservations = []
    for (const reserva of reservas) {
      try {
        const { data, error } = await supabase.rpc('upsert_getin_reserva', {
          p_id_externo: reserva.id_externo,
          p_bar_id: parseInt(barId),
          p_cliente_nome: reserva.nome_cliente,
          p_cliente_telefone: reserva.telefone_cliente,
          p_cliente_email: reserva.email_cliente,
          p_data_reserva: reserva.data_reserva,
          p_hora_reserva: reserva.horario,
          p_numero_pessoas: reserva.pessoas,
          p_mesa_numero: reserva.mesa,
          p_observacoes: reserva.observacoes,
          p_status: reserva.status,
          p_valor_entrada: reserva.valor_entrada,
          p_valor_consumacao: reserva.valor_total,
          p_unit_id: reserva.unit_id,
          p_unit_name: reserva.unit_name,
          p_raw_data: reserva.raw_data
        })
        
        if (error) {
          console.error('❌ Erro ao salvar reserva:', error)
          continue
        }
        
        savedReservations.push({ ...reserva, db_id: data })
        console.log(`✅ Reserva ${reserva.id} salva com sucesso (DB ID: ${data})`)
      } catch (err) {
        console.error('❌ Erro ao processar reserva:', err)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      data: reservas,
      total: reservas.length,
      saved_count: savedReservations.length,
      period: { start_date: startDate, end_date: endDate },
      unit: { id: targetUnitId, name: units.find((u: any) => u.id === targetUnitId)?.name || 'Unidade' },
      available_units: units.map((u: any) => ({ id: u.id, name: u.name })),
      sync_info: {
        total_fetched: reservas.length,
        total_saved: savedReservations.length,
        sync_time: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar reservas getIn:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao buscar reservas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// ========================================
// 📊 POST /api/getin/reservas - Criar nova reserva
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, unit_id, reserva } = body

    console.log('➕ Criando nova reserva getIn:', { bar_id, unit_id, reserva })

    // Buscar credenciais
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single()

    if (error || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais getIn não encontradas'
      }, { status: 404 })
    }

    const token = credentials.access_token

    // Criar reserva via API getIn
    const response = await fetch(`https://agent.getinapis.com/reservation/v1/units/${unit_id}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': 'https://painel-reserva.getinapp.com.br',
        'Referer': 'https://painel-reserva.getinapp.com.br/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(reserva)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: data.message || 'Erro ao criar reserva',
        details: data
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Reserva criada com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao criar reserva getIn:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao criar reserva'
    }, { status: 500 })
  }
} 