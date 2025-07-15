import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔄 Forçando execução do Meta Sync...')
    
    // Chamar diretamente a edge function
    const edgeResponse = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODUwNjYsImV4cCI6MjA1MTI2MTA2Nn0.8mBgB5jkE1nqLn5C49_WxbO6s8fG5_nq5t0N-yGCdeo',
        'Content-Type': 'application/json'
      }
    })
    
    const result = await edgeResponse.json()
    
    return NextResponse.json({
      success: edgeResponse.ok,
      status: edgeResponse.status,
      edge_function_response: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 