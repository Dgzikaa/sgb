import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🧪 TESTE CALLBACK - Dados recebidos:', body)
    
    // Simular callback do Inter
    const mockCallback = {
      chave: "03964156108",
      codigoSolicitacao: "teste-" + Date.now(),
      dataHoraMovimento: new Date().toISOString(),
      dataHoraSolicitacao: new Date().toISOString(),
      descricaoPagamento: "Teste de callback",
      endToEnd: "E00416968202309302034aqtneKsYCqs",
      instituicaoDestinatario: "Banco Inter S.A.",
      recebedor: {
        cpfCnpj: "03964156108",
        nome: "RODRIGO LOPES OLIVEIRA"
      },
      status: "PROCESSADO",
      tipoMovimentacao: "PAGAMENTO",
      valor: "1.00"
    }

    console.log('📤 Enviando callback simulado para nossa API...')
    
    // Enviar para nossa API de callback
    const response = await fetch(`${request.nextUrl.origin}/api/webhook/inter/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockCallback)
    })

    const result = await response.json()
    
    console.log('📡 Resposta da API de callback:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Teste de callback realizado',
      callback_data: mockCallback,
      api_response: result
    })

  } catch (error: any) {
    console.error('❌ Erro no teste de callback:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 