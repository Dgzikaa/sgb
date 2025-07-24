import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordAlert } from '@/lib/discord/sendDiscordAlert'
import { notifyAdmins } from '@/lib/notifications/notifyAdmins'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const valor = parseFloat(body.valor)
  if (isNaN(valor) || valor < 1) {
    return NextResponse.json({ ignored: true, motivo: 'valor menor que R$1,00' })
  }

  const desc = body.descricao || 'Movimentação'
  const tipo = body.tipoMovimentacao || 'INDEFINIDO'
  const origem = body.remetente?.nome || 'Desconhecido'
  const doc = body.numeroDocumento || '-'

  const mensagem = `💸 **${desc}**\n📥 Tipo: \`${tipo}\`\n🧾 Doc: \`${doc}\`\n👤 Remetente: ${origem}\n💰 Valor: R$ ${valor.toFixed(2)}`

  await sendDiscordAlert(mensagem)
  await notifyAdmins(`[Banco Inter] ${desc} de R$ ${valor.toFixed(2)} recebida`)

  return NextResponse.json({ sucesso: true })
} 