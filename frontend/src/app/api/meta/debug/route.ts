import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase-admin'

// ========================================
// 🔧 DEBUG - Testar header x-user-data
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG - Iniciando teste de headers...')
    
    // 1. Verificar todos os headers
    const headersList = headers()
    const allHeaders = Array.from(headersList.entries())
    console.log('📝 Todos os headers recebidos:')
    allHeaders.forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })
    
    // 2. Verificar especificamente o x-user-data
    const userData = headersList.get('x-user-data')
    console.log('📊 Header x-user-data:')
    console.log(`  Presente: ${!!userData}`)
    console.log(`  Tamanho: ${userData?.length || 0}`)
    console.log(`  Valor: ${userData}`)
    
    // 3. Tentar parsear se existir
    let parsedUserData = null
    if (userData) {
      try {
        // Primeiro decodificar URL encoding, depois parsear JSON
        const decodedUserData = decodeURIComponent(userData)
        console.log('🔓 Dados decodificados:', decodedUserData)
        
        parsedUserData = JSON.parse(decodedUserData)
        console.log('✅ Dados parseados com sucesso:', parsedUserData)
      } catch (parseError) {
        console.error('❌ Erro ao parsear dados:', parseError)
        return NextResponse.json({
          error: 'Erro ao parsear dados do usuário',
          details: parseError instanceof Error ? parseError.message : 'Erro desconhecido',
          userData: userData,
          decodedAttempt: userData ? decodeURIComponent(userData) : null
        }, { status: 400 })
      }
    }
    
    // 4. Verificar variáveis de ambiente
    console.log('🔧 Verificando variáveis de ambiente:')
    console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO'}`)
    console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO'}`)
    console.log(`  SERVICE_ROLE_KEY: ${process.env.SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO'}`)
    
    // 5. Testar cliente Supabase
    let supabaseStatus = 'ERRO'
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('api_credentials')
        .select('count')
        .limit(1)
      
      supabaseStatus = error ? `ERRO: ${error.message}` : 'OK'
    } catch (supabaseError) {
      supabaseStatus = `ERRO: ${supabaseError}`
    }
    
    console.log(`  Supabase Cliente: ${supabaseStatus}`)
    
    // 6. Retornar resultado do debug
    return NextResponse.json({
      success: true,
      debug: {
        headers: {
          total: allHeaders.length,
          hasUserData: !!userData,
          userDataLength: userData?.length || 0,
          allHeaders: Object.fromEntries(allHeaders)
        },
        userData: {
          raw: userData,
          parsed: parsedUserData,
          hasBarId: parsedUserData?.bar_id ? true : false,
          hasPermissao: parsedUserData?.permissao ? true : false,
          barId: parsedUserData?.bar_id,
          permissao: parsedUserData?.permissao
        },
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO',
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO',
          serviceRoleKeyAlt: process.env.SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO',
          supabaseClient: supabaseStatus
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Erro crítico no debug:', error)
    return NextResponse.json({
      error: 'Erro crítico no debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// ========================================
// 🔧 DEBUG - Testar POST também
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG POST - Iniciando teste...')
    
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    const body = await request.json()
    
    console.log('📊 Dados recebidos:')
    console.log(`  Header x-user-data: ${userData}`)
    console.log(`  Body:`, body)
    
    return NextResponse.json({
      success: true,
      received: {
        userData: userData,
        body: body,
        hasUserData: !!userData
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no POST debug:', error)
    return NextResponse.json({
      error: 'Erro no POST debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 