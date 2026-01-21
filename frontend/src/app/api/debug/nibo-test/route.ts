import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Endpoint de teste para verificar se o deploy está atualizado
export async function GET() {
  const buildVersion = '2026-01-20-v3-VALOR-NEGATIVO';
  
  // Simular o cálculo que fazemos na rota de schedules
  const valorOriginal = 100;
  const valorNumerico = Math.abs(valorOriginal);
  const valorNegativo = valorNumerico * -1;
  
  return NextResponse.json({
    build_version: buildVersion,
    timestamp: new Date().toISOString(),
    teste_calculo: {
      valor_original: valorOriginal,
      valor_numerico: valorNumerico,
      valor_negativo: valorNegativo,
      valor_negativo_correto: valorNegativo < 0
    },
    message: 'Se você vê esta mensagem, o deploy está atualizado!'
  });
}
