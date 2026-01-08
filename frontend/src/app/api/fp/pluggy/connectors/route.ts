import { NextRequest, NextResponse } from 'next/server'
import { getPluggyClient } from '@/lib/pluggy-client'

/**
 * GET /api/fp/pluggy/connectors
 * Lista todos os conectores (bancos) disponíveis no Pluggy
 * Ref: https://docs.pluggy.ai/reference/connectors-list
 */
export async function GET(request: NextRequest) {
  try {
    const pluggyClient = getPluggyClient()
    
    // Buscar todos os conectores
    const connectors = await pluggyClient.listConnectors()
    
    // Filtrar apenas bancos brasileiros pessoais
    const bancosBrasileiros = connectors.results?.filter((c: any) => 
      c.country === 'BR' && 
      c.type === 'PERSONAL_BANK' &&
      c.products.includes('ACCOUNTS') &&
      c.products.includes('TRANSACTIONS')
    ) || []

    return NextResponse.json({
      success: true,
      data: bancosBrasileiros.sort((a: any, b: any) => a.name.localeCompare(b.name)),
      total: bancosBrasileiros.length
    })
  } catch (error: any) {
    console.error('Erro ao buscar conectores Pluggy:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Erro ao buscar bancos disponíveis' 
    }, { status: 500 })
  }
}
