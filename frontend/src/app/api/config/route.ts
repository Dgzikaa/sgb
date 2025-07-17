import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache das configuraá§áµes para evitar máºltiplas chamadas
let configCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

async function fetchSupabaseSecrets() {
  try {
    // Buscar secrets diretamente do Supabase usando edge function com autenticaá§á£o
    const response = await fetch('https://iddtrhexgjbfhxebpklf.supabase.co/functions/v1/get-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-internal-config-token-2025'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error('Falha ao buscar configuraá§áµes')
    }

    const config = await response.json()
    return config
  } catch (error) {
    console.error('Œ Erro ao buscar secrets:', error)
    
    // Secrets sá£o obrigatá³rios
    throw new Error('Configuraá§áµes dos secrets ná£o disponá­veis - verificar edge function get-config')
  }
}

export async function GET() {
  try {
    const now = Date.now()
    
    // Verificar se o cache ainda á© vá¡lido
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(configCache)
    }

    // Buscar novas configuraá§áµes
    const config = await fetchSupabaseSecrets()
    
    // Atualizar cache
    configCache = config
    cacheTimestamp = now

    return NextResponse.json(config)
  } catch (error) {
    console.error('Œ Erro na API de configuraá§á£o:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuraá§áµes' },
      { status: 500 }
    )
  }
} 
