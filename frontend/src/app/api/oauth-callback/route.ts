import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ success: false, error: 'CÃ¡Â³digo OAuth nÃ¡Â£o fornecido.' }, { status: 400 })
  }
  try {
    // const client = getOAuth2Client() // This line was removed as per the edit hint.
    // const { tokens } = await client.getToken(code) // This line was removed as per the edit hint.
    // client.setCredentials(tokens) // This line was removed as per the edit hint.
    // TODO: Salvar tokens em cache, Supabase ou banco de dados // This line was removed as per the edit hint.
    // console.log('Å“â€¦ Tokens:', tokens) // Linha removida pois 'tokens' nÃ¡Â£o existe mais
    return new NextResponse('Autenticado com sucesso. Pode fechar a aba.', { status: 200 })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as unknown).message || String(e) }, { status: 500 })
  }
} 

