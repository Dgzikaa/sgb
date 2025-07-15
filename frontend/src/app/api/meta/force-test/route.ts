import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🚀 Forçando execução da Edge Function...')
    
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M',
        'Content-Type': 'application/json'
      }
    })
    
    const text = await response.text()
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      response: text,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 