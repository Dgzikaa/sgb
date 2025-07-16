import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/googleAuth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ success: false, error: 'Código OAuth não fornecido.' }, { status: 400 })
  }
  try {
    const client = getOAuth2Client()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)
    // TODO: Salvar tokens em cache, Supabase ou banco de dados
    console.log('✅ Tokens:', tokens)
    return new NextResponse('Autenticado com sucesso. Pode fechar a aba.', { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 })
  }
} 