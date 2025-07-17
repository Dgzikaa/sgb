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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nÃ£o estÃ¡ configurada nos secrets do sistema. Configure via MCP Supabase.')
  }

  try {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('âœ… Cliente administrativo Supabase inicializado')
    return adminClient

  } catch (error) {
    console.error('âŒ Erro ao inicializar cliente administrativo:', error)
    throw error
  }
}

// FunÃ§Ã£o helper para rotas API (evita inicializaÃ§Ã£o no mÃ³dulo)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VariÃ¡veis de ambiente Supabase nÃ£o configuradas')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export { getAdminClient, createServiceRoleClient } 
