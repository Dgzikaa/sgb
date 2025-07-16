import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_ACCESS_TOKEN = Deno.env.get('GOOGLE_ACCESS_TOKEN') || ''
const ACCOUNT_ID = Deno.env.get('GOOGLE_ACCOUNT_ID') || ''
const LOCATION_ID = Deno.env.get('GOOGLE_LOCATION_ID') || ''

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req: Request) => {
  if (!GOOGLE_ACCESS_TOKEN || !ACCOUNT_ID || !LOCATION_ID) {
    return new Response(JSON.stringify({ error: 'Token, AccountId ou LocationId não configurados.' }), { status: 500 })
  }

  // Buscar avaliações do Google Business Profile
  const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/reviews`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.error || data }), { status: 500 })
  }

  // Salvar no Supabase (tabela avaliacoes_google_raw)
  const { error } = await supabase.from('avaliacoes_google_raw').insert({
    bar_id: 1, // TODO: parametrizar conforme necessário
    data_coleta: new Date().toISOString().split('T')[0],
    json_raw: data,
    criado_em: new Date().toISOString()
  })

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, reviews: data }), { status: 200 })
}) 