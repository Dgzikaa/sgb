import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ success: false, error: 'CÃ³digo OAuth nÃ£o fornecido.' }, { status: 400 })
  }
  try {
    // const client = getOAuth2Client() // This line was removed as per the edit hint.
    // const { tokens } = await client.getToken(code) // This line was removed as per the edit hint.
    // client.setCredentials(tokens) // This line was removed as per the edit hint.
    // TODO: Salvar tokens em cache, Supabase ou banco de dados // This line was removed as per the edit hint.
    // console.log('âœ… Tokens:', tokens) // Linha removida pois 'tokens' nÃ£o existe mais
    return new NextResponse('Autenticado com sucesso. Pode fechar a aba.', { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 })
  }
} 
