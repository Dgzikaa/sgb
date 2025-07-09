import { createClient } from '@supabase/supabase-js'

// Cliente administrativo do Supabase (usa service role key)
let adminClient: any = null

async function getAdminClient() {
  if (adminClient) {
    return adminClient
  }

  // Usar valores dos secrets do sistema (fixos e seguros)
  const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada nos secrets do sistema. Configure via MCP Supabase.')
  }

  try {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Cliente administrativo Supabase inicializado')
    return adminClient

  } catch (error) {
    console.error('❌ Erro ao inicializar cliente administrativo:', error)
    throw error
  }
}

export { getAdminClient } 