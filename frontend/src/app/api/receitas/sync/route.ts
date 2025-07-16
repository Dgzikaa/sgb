import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // URL da Edge Function (fixa para o projeto SGB_V2)
    const EDGE_URL = 'https://uqtgsvujwcbymjmvkjhy.functions.supabase.co/sync-recipes-insumos'
    const res = await fetch(EDGE_URL, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
} 