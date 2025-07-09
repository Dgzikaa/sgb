import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🧪 Testando endpoint de login...')
  
  try {
    // Testar com credenciais conhecidas
    const testEmail = 'teste@sgbsistema.com'
    const testPassword = 'teste123'
    
    console.log('📧 Testando com email:', testEmail)
    
    // Verificar variáveis de ambiente
    console.log('🔍 Verificando variáveis de ambiente...')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO')
    console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'FALTANDO')
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO')
    
    // Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
      console.log('✅ Cliente administrativo obtido com sucesso')
    } catch (adminError: any) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração administrativa não disponível',
        details: adminError.message 
      }, { status: 500 })
    }
    
    // Criar cliente para autenticação (sem service role)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('🔍 Tentando autenticar usuário...')
    
    // Tentar autenticar com Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciais inválidas',
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!authData.user) {
      console.error('❌ Nenhum usuário retornado após autenticação')
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado após autenticação' 
      }, { status: 401 })
    }
    
    console.log('✅ Usuário autenticado com sucesso:', authData.user.id)
    
    // Buscar dados do usuário no banco
    const { data: usuarios, error: usuariosError } = await adminClient
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('ativo', true)
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar usuário no banco:', usuariosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar dados do usuário',
        details: usuariosError.message 
      }, { status: 500 })
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.error('❌ Usuário não encontrado no banco de dados')
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado no sistema' 
      }, { status: 404 })
    }
    
    console.log('✅ Dados do usuário encontrados:', usuarios.length, 'registros')
    
    // Buscar dados dos bares
    const barIds = [...new Set(usuarios.map((u: any) => u.bar_id))]
    
    const { data: barsData, error: barsError } = await adminClient
      .from('bars')
      .select('*')
      .in('id', barIds)
      .eq('ativo', true)
    
    if (barsError) {
      console.error('❌ Erro ao buscar bares:', barsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar dados dos bares',
        details: barsError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Dados dos bares encontrados:', barsData?.length || 0)
    
    // Fazer logout do authClient
    await authClient.auth.signOut()
    
    return NextResponse.json({
      success: true,
      message: 'Login funcionando corretamente!',
      data: {
        user: authData.user,
        usuarios_count: usuarios.length,
        bares_count: barsData?.length || 0,
        usuarios: usuarios,
        bares: barsData
      }
    })
    
  } catch (error: any) {
    console.error('🔥 Erro fatal no teste de login:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste de login',
    info: 'Use POST para executar o teste'
  })
} 