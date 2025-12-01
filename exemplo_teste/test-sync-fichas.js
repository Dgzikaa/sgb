/**
 * Script de teste para sincronização de fichas técnicas
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M'
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sync-fichas-tecnicas`

async function testSync() {
  console.log('🧪 Testando sincronização de fichas técnicas...')
  console.log(`📡 URL: ${FUNCTION_URL}`)

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        trigger: 'manual',
        test: true
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('\n✅ Sincronização executada com sucesso!')
      console.log('\n📊 Resultado:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.error('\n❌ Erro na sincronização:')
      console.error(JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('\n❌ Erro ao chamar a função:', error.message)
  }
}

testSync()

