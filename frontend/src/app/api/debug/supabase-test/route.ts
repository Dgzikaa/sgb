import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ” Testando configuraÃ§Ã£o do Supabase...')
    
    // Verificar variÃ¡veis de ambiente
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'NÃ£o configurada',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'NÃ£o configurada',
      SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY ? 'Configurada' : 'NÃ£o configurada'
    }
    
    console.log('ðŸ” VariÃ¡veis de ambiente:', envCheck)
    
    // Testar cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
      console.log('âœ… Cliente administrativo criado com sucesso')
    } catch (adminError) {
      console.error('âŒ Erro ao criar cliente administrativo:', adminError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar cliente administrativo',
        details: adminError instanceof Error ? adminError.message : 'Erro desconhecido',
        envCheck
      }, { status: 500 })
    }
    
    // Testar conexÃ£o com banco
    try {
      const { data, error } = await adminClient
        .from('usuarios_bar')
        .select('id, nome, email')
        .limit(1)
      
      if (error) {
        console.error('âŒ Erro ao conectar com banco:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao conectar com banco',
          details: error.message,
          envCheck
        }, { status: 500 })
      }
      
      console.log('âœ… ConexÃ£o com banco funcionando')
      
      return NextResponse.json({
        success: true,
        message: 'ConfiguraÃ§Ã£o do Supabase estÃ¡ funcionando corretamente',
        envCheck,
        testQuery: {
          success: true,
          recordCount: data?.length || 0
        }
      })
      
    } catch (dbError) {
      console.error('âŒ Erro na query de teste:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Erro na query de teste',
        details: dbError instanceof Error ? dbError.message : 'Erro desconhecido',
        envCheck
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('âŒ Erro geral no teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral no teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
