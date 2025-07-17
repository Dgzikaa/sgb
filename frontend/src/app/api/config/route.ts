import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache das configura·ß·µes para evitar m·∫ltiplas chamadas
let configCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

async function fetchSupabaseSecrets() {
  try {
    // Buscar secrets diretamente do Supabase usando edge function com autentica·ß·£o
    const response = await fetch('https://iddtrhexgjbfhxebpklf.supabase.co/functions/v1/get-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-internal-config-token-2025'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error('Falha ao buscar configura·ß·µes')
    }

    const config = await response.json()
    return config
  } catch (error) {
    console.error('ùå Erro ao buscar secrets:', error)
    
    // Secrets s·£o obrigat·≥rios
    throw new Error('Configura·ß·µes dos secrets n·£o dispon·≠veis - verificar edge function get-config')
  }
}

export async function GET() {
  try {
    const now = Date.now()
    
    // Verificar se o cache ainda ·© v·°lido
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(configCache)
    }

    // Buscar novas configura·ß·µes
    const config = await fetchSupabaseSecrets()
    
    // Atualizar cache
    configCache = config
    cacheTimestamp = now

    return NextResponse.json(config)
  } catch (error) {
    console.error('ùå Erro na API de configura·ß·£o:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configura·ß·µes' },
      { status: 500 }
    )
  }
} 
