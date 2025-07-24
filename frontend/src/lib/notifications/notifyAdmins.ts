import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function notifyAdmins(message: string) {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')

  if (!admins || admins.length === 0) return

  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    conteudo: message,
    tipo: 'banco',
    lida: false,
    criado_em: new Date().toISOString()
  }))

  await supabase.from('notificacoes').insert(notifications)
} 