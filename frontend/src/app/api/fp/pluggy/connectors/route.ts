import { NextRequest, NextResponse } from 'next/server'
import { createPluggyClient } from '@/lib/pluggy/client'

export async function GET(request: NextRequest) {
  try {
    const pluggy = createPluggyClient()
    
    // Buscar conectores brasileiros (principais bancos)
    const connectors = await pluggy.getConnectors()
    
    // Filtrar principais bancos brasileiros
    const bancosBrasileiros = connectors.filter(c => 
      ['nubank', 'bradesco', 'itau', 'banco-do-brasil', 'caixa', 'santander', 'inter', 'original', 'c6-bank', 'next'].some(
        banco => c.id.toLowerCase().includes(banco) || c.name.toLowerCase().includes(banco)
      )
    )

    return NextResponse.json({
      success: true,
      data: bancosBrasileiros.sort((a, b) => a.name.localeCompare(b.name))
    })
  } catch (error: any) {
    console.error('Erro ao buscar conectores Pluggy:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar bancos disponíveis' 
    }, { status: 500 })
  }
}
