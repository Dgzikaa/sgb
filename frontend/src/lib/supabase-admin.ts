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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY n·£o est·° configurada nos secrets do sistema. Configure via MCP Supabase.')
  }

  try {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('úÖ Cliente administrativo Supabase inicializado')
    return adminClient

  } catch (error) {
    console.error('ùå Erro ao inicializar cliente administrativo:', error)
    throw error
  }
}

// Fun·ß·£o helper para rotas API (evita inicializa·ß·£o no m·≥dulo)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Vari·°veis de ambiente Supabase n·£o configuradas')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export { getAdminClient, createServiceRoleClient } 
