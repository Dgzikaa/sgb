import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Usar as variá¡veis de ambiente corretas do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  user?: any
  error?: string
}

Deno.serve(async (req: Request) => {
  // Permitir CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  try {
    const { email, password }: LoginRequest = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email e password sá£o obrigatá³rios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Buscar usuá¡rio na tabela usuarios_bar
    const { data: usuarios, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)

    if (error) {
      console.error('Erro ao buscar usuá¡rio:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuá¡rio ná£o encontrado ou inativo' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // REMOVIDO: Sistema de senhas hardcoded foi eliminado por seguraná§a
    // A autenticaá§á£o deve ser feita exclusivamente via Supabase Auth
    
    // Se chegou atá© aqui, significa que o usuá¡rio existe na tabela
    // mas devemos usar apenas Supabase Auth para validaá§á£o de senha
    return new Response(
      JSON.stringify({ success: false, error: 'Este endpoint está¡ obsoleto. Use /api/auth/login no frontend.' }),
      { 
        status: 410, // Gone - endpoint descontinuado
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

    // Esta edge function está¡ obsoleta - toda autenticaá§á£o deve ser feita via frontend
    // Retornar sempre erro para forá§ar migraá§á£o para sistema seguro

  } catch (error) {
    console.error('Erro na Edge Function de login:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}) 
