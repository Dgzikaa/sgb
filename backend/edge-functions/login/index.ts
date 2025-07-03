import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cliente Supabase com service role
const supabaseUrl = Deno.env.get('DATABASE_URL')!
const supabaseServiceKey = Deno.env.get('DATABASE_SERVICE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req: Request) => {
  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== LOGIN EDGE FUNCTION INICIADA ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    
    const { email, senha } = await req.json()
    console.log('Email recebido:', email)

    if (!email || !senha) {
      console.log('Email ou senha não fornecidos')
      return new Response(
        JSON.stringify({ success: false, error: 'Email e senha são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Buscando usuário no banco...')
    
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Usuários encontrados:', usuarios?.length || 0)

    if (!usuarios || usuarios.length === 0) {
      console.log('Nenhum usuário encontrado')
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado ou inativo' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificação de senha
    const senhasValidas = {
      'rodrigo@grupomenosemais.com.br': 'Geladeira@001'
    }

    if (senhasValidas[email as keyof typeof senhasValidas] !== senha) {
      console.log('Senha incorreta')
      return new Response(
        JSON.stringify({ success: false, error: 'Senha incorreta' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Senha correta, montando resposta...')

    // Montar dados do usuário
    const usuarioPrincipal = usuarios[0]
    
    const baresAcesso = usuarios.map(u => ({
      bar_id: u.bar_id,
      role: u.role,
      modulos_permitidos: u.modulos_permitidos
    }))

    console.log('Buscando credenciais de APIs...')
    
    // Buscar credenciais de APIs
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
    console.log('Credenciais encontradas para', credenciaisPorBar.length, 'bares')

    const response = {
      success: true,
      user: {
        ...usuarioPrincipal,
        bares_acesso: baresAcesso,
        credenciais_apis: credenciaisPorBar
      }
    }

    console.log('=== LOGIN BEM-SUCEDIDO ===')
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== ERRO NA EDGE FUNCTION ===', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 