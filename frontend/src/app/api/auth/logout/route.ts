import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Criar response
    const response = NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    )
    
    // Limpar cookie httpOnly
    response.cookies.set('sgb_user', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0) // Data no passado para expirar imediatamente
    })
    
    return response
  } catch (error) {
    console.error('❌ Erro no logout:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 