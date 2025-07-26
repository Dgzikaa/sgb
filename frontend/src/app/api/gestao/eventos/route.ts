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
    const { data: countData, error: errorTodos } = await supabase
      .from('eventos')
      .select('count')
      .limit(1)

    console.log('📊 [API] Teste simples - Count:', countData, 'Erro:', errorTodos)

    // Agora a query principal com paginação para retornar todos os eventos
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
    
    // Implementar paginação completa para retornar todos os eventos
    let todosEventos: any[] = []
    let from = 0
    const pageSize = 100 // Supabase padrão
    
    while (true) {
      const { data: eventos, error } = await query.range(from, from + pageSize - 1)
      
      if (error) {
        console.error('❌ [API] Erro ao buscar eventos:', error)
        return NextResponse.json({ error: 'Erro ao buscar eventos', details: error }, { status: 500 })
      }
      
      if (!eventos || eventos.length === 0) {
        break // Não há mais eventos
      }
      
      todosEventos = todosEventos.concat(eventos)
      from += pageSize
      
      console.log(`📄 [API] Página ${Math.floor(from / pageSize)}: ${eventos.length} eventos`)
      
      // Se retornou menos que pageSize, chegamos ao fim
      if (eventos.length < pageSize) {
        break
      }
    }

    console.log('📊 [API] Resultado da query principal:')
    console.log('   - Total de eventos encontrados:', todosEventos.length)
    
    if (todosEventos.length > 0) {
      console.log('📋 [API] Primeiro evento:', todosEventos[0])
      console.log('📋 [API] Último evento:', todosEventos[todosEventos.length - 1])
    }

    console.log('✅ [API] Retornando eventos com sucesso')
    return NextResponse.json({ eventos: todosEventos })

  } catch (error) {
    console.error('💥 [API] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
} 