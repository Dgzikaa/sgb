import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // API fallback para badges não implementados
    // Retorna sempre 0 para evitar erros 404/500
    return NextResponse.json({
      success: true,
      count: 0,
      message: 'Badge não implementado - retornando 0'
    })
  } catch (error) {
    console.error('Erro na API badges/fallback:', error)
    return NextResponse.json({
      success: true,
      count: 0
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 