import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Iniciando busca de eventos...')
    console.log('🔧 [API] URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 [API] Anon Key configurada:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const status = searchParams.get('status')
    const genero = searchParams.get('genero')

    console.log('📋 [API] Filtros recebidos:', { dataInicio, dataFim, status, genero })

    // Primeiro, vamos testar uma query simples sem filtros
    console.log('🚀 [API] Testando query simples...')
    const { data: todosEventos, error: errorTodos } = await supabase
      .from('eventos')
      .select('count')
      .limit(1)

    console.log('📊 [API] Teste simples - Count:', todosEventos, 'Erro:', errorTodos)

    // Agora a query principal
    let query = supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true })

    // Filtros opcionais
    if (dataInicio) {
      query = query.gte('data_evento', dataInicio)
      console.log('📅 [API] Aplicando filtro dataInicio:', dataInicio)
    }
    
    if (dataFim) {
      query = query.lte('data_evento', dataFim)
      console.log('📅 [API] Aplicando filtro dataFim:', dataFim)
    }
    
    if (status) {
      query = query.eq('status', status)
      console.log('🎯 [API] Aplicando filtro status:', status)
    }
    
    if (genero) {
      query = query.eq('genero', genero)
      console.log('🎵 [API] Aplicando filtro genero:', genero)
    }

    console.log('🚀 [API] Executando query principal no Supabase...')
    const { data: eventos, error } = await query

    console.log('📊 [API] Resultado da query principal:')
    console.log('   - Eventos encontrados:', eventos?.length || 0)
    console.log('   - Erro:', error)
    
    if (eventos && eventos.length > 0) {
      console.log('📋 [API] Primeiro evento:', eventos[0])
    }

    if (error) {
      console.error('❌ [API] Erro ao buscar eventos:', error)
      return NextResponse.json({ error: 'Erro ao buscar eventos', details: error }, { status: 500 })
    }

    console.log('✅ [API] Retornando eventos com sucesso')
    return NextResponse.json({ eventos: eventos || [] })

  } catch (error) {
    console.error('💥 [API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
} 