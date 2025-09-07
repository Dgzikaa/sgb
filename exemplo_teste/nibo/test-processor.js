#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Teste simples do NIBO Processor
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M'

async function testProcessor() {
  console.log('🧪 Testando NIBO Processor...')
  
  const request = {
    raw_data_id: 4 // ID retornado pelo collector
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/nibo_processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ HTTP ${response.status}: ${errorText}`)
      return
    }
    
    const result = await response.json()
    console.log('✅ Resultado:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

if (import.meta.main) {
  await testProcessor()
}
