import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Usar as variáveis de ambiente corretas do Supabase
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
        JSON.stringify({ success: false, error: 'Email e password são obrigatórios' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Buscar usuário na tabela usuarios_bar
    const { data: usuarios, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)

    if (error) {
      console.error('Erro ao buscar usuário:', error)
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
        JSON.stringify({ success: false, error: 'Usuário não encontrado ou inativo' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Verificação da senha
    const senhasValidas = {
      'rodrigo@grupomenosemais.com.br': 'Geladeira@001'
    }

    if (senhasValidas[email as keyof typeof senhasValidas] !== password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Senha incorreta' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    // Pegar dados do usuário
    const usuarioPrincipal = usuarios[0]
    
    // Buscar dados completos dos bares que o usuário tem acesso
    const barIds = [...new Set(usuarios.map(u => u.bar_id))]
    
    const { data: barsData } = await supabase
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true)
    
    // Combinar dados dos bares com permissões do usuário
    const baresAcesso = usuarios.map(u => {
      const barInfo = barsData?.find(b => b.id === u.bar_id)
      return {
        id: u.bar_id,
        nome: barInfo?.nome || 'Bar não encontrado',
        role: u.role,
        modulos_permitidos: u.modulos_permitidos
      }
    })

    // Buscar credenciais de APIs para cada bar
    const credenciaisPromises = baresAcesso.map(async (bar) => {
      const { data: credenciais } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', bar.bar_id)
        .eq('ativo', true)

      return {
        bar_id: bar.bar_id,
        credenciais: credenciais || []
      }
    })

    const credenciaisPorBar = await Promise.all(credenciaisPromises)

    const response: LoginResponse = {
      success: true,
      user: {
        ...usuarioPrincipal,
        bares_acesso: baresAcesso,
        credenciais_apis: credenciaisPorBar
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

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