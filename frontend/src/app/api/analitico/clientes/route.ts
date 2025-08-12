import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Clientes: Iniciando busca...')
    
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      console.log('❌ API Clientes: Usuário não autenticado')
      return authErrorResponse('Usuário não autenticado')
    }
    
    console.log('✅ API Clientes: Usuário autenticado:', user.nome)
    
    const supabase = await getAdminClient()
    console.log('✅ API Clientes: Cliente administrativo Supabase obtido')
    
    // Buscar dados dos clientes
    console.log('📊 API Clientes: Buscando dados dos clientes...')
    
    // Tentar query direta primeiro
    const { data: testData, error: testError } = await supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_fone, bar_id, dt_gerencial')
      .not('cli_nome', 'is', null)
      .not('cli_fone', 'is', null)
      .limit(5)

    console.log('🧪 Teste query direta:', { 
      count: testData?.length, 
      error: testError,
      amostra: testData?.slice(0, 2)
    })

    const { data: clientes, error: clientesError } = await supabase
      .rpc('get_clientes_unificados_top', { limite: 100 })

    console.log('🎯 Resultado RPC get_clientes_unificados_top:', {
      count: clientes?.length,
      error: clientesError,
      amostra: clientes?.slice(0, 2)
    })

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos clientes' },
        { status: 500 }
      )
    }

    console.log(`✅ API Clientes: ${clientes?.length || 0} clientes encontrados`)

    // Buscar estatísticas unificadas
    console.log('📈 API Clientes: Buscando estatísticas unificadas...')
    const { data: estatisticas, error: estatisticasError } = await supabase
      .rpc('get_estatisticas_unificadas')

    if (estatisticasError) {
      console.error('Erro ao buscar estatísticas:', estatisticasError)
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas dos clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientes: clientes || [],
      estatisticas: estatisticas?.[0] || {
        total_clientes_unicos: 0,
        total_visitas_geral: 0,
        ticket_medio_geral: 0,
        ticket_medio_entrada: 0,
        ticket_medio_consumo: 0,
        valor_total_entrada: 0,
        valor_total_consumo: 0
      }
    })
  } catch (error) {
    console.error('Erro na API de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
