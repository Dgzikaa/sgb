// ========================================
// 🤖 API META AUTOMATION MANAGEMENT
// ========================================
// API para gerenciar a automação de coleta Meta via pgcron
// Recursos: status, ativar/desativar, execução manual, logs

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ========================================
// 🔒 AUTENTICAÇÃO E VALIDAÇÃO
// ========================================
async function validateAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return false
  
  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role === 'admin'
}

// ========================================
// 📊 GET - STATUS DA AUTOMAÇÃO
// ========================================
export async function GET(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'status') {
      // 🔍 Status atual da automação
      const { data: statusData, error: statusError } = await supabase
        .from('meta_automation_status')
        .select('*')
        .single()

      if (statusError) {
        console.error('Erro ao buscar status:', statusError)
        return NextResponse.json(
          { error: 'Erro ao buscar status da automação' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        automation: statusData,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'logs') {
      // 📋 Logs recentes das execuções
      const limite = parseInt(searchParams.get('limit') || '10')
      
      const { data: logsData, error: logsError } = await supabase
        .rpc('get_meta_execucoes_recentes', { limite })

      if (logsError) {
        console.error('Erro ao buscar logs:', logsError)
        return NextResponse.json(
          { error: 'Erro ao buscar logs de execução' },
          { status: 500 }
        )
      }

      // Calcular estatísticas
      const totalExecucoes = logsData.length
      const sucessos = logsData.filter((log: any) => log.status === 'sucesso').length
      const erros = logsData.filter((log: any) => log.status === 'erro' || log.status === 'erro_critico').length
      const taxaSucesso = totalExecucoes > 0 ? ((sucessos / totalExecucoes) * 100).toFixed(2) : '0'

      return NextResponse.json({
        success: true,
        logs: logsData,
        statistics: {
          total_execucoes: totalExecucoes,
          sucessos,
          erros,
          taxa_sucesso: `${taxaSucesso}%`,
          tempo_medio_execucao: totalExecucoes > 0 ? 
            Math.round(logsData.reduce((acc: number, log: any) => acc + (log.tempo_execucao_segundos || 0), 0) / totalExecucoes) : 0
        },
        timestamp: new Date().toISOString()
      })

    } else {
      // 📊 Status geral (padrão)
      const [statusResult, logsResult] = await Promise.all([
        supabase.from('meta_automation_status').select('*').single(),
        supabase.rpc('get_meta_execucoes_recentes', { limite: 5 })
      ])

      if (statusResult.error) {
        console.error('Erro ao buscar status geral:', statusResult.error)
        return NextResponse.json(
          { error: 'Erro ao buscar status da automação' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        status: statusResult.data,
        recent_logs: logsResult.data || [],
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Erro na API Meta Automation GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// ⚡ POST - AÇÕES DE CONTROLE
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, params } = body

    switch (action) {
      case 'toggle': {
        // 🔄 Ativar/Desativar automação
        const ativar = params?.enable === true
        
        const { data, error } = await supabase
          .rpc('toggle_meta_automation', { ativar })

        if (error) {
          console.error('Erro ao alterar status da automação:', error)
          return NextResponse.json(
            { error: 'Erro ao alterar status da automação' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: data,
          action: 'toggle',
          enabled: ativar,
          timestamp: new Date().toISOString()
        })
      }

      case 'execute_manual': {
        // 🚀 Execução manual para teste
        const { data, error } = await supabase
          .rpc('executar_meta_manual')

        if (error) {
          console.error('Erro na execução manual:', error)
          return NextResponse.json(
            { error: 'Erro na execução manual da coleta' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Execução manual iniciada com sucesso',
          result: data,
          action: 'execute_manual',
          timestamp: new Date().toISOString()
        })
      }

      case 'test_discord': {
        // 🔔 Testar webhook Discord
        try {
          const webhookUrl = 'https://discord.com/api/webhooks/1391538130737303674/V6WiwfJodQT3C7WqdJTpmyaOLJByuKR8KZwtxW9ATmEqo0N4Msh73pF7PmOEVc12hx75'
          
          const discordPayload = {
            embeds: [{
              title: '🧪 Teste de Webhook - Automação Meta',
              description: 'Teste manual do sistema de notificações Discord',
              color: 3447003, // Azul
              fields: [
                {
                  name: '⏰ Horário do Teste',
                  value: new Date().toLocaleString('pt-BR', { 
                    timeZone: 'America/Sao_Paulo' 
                  }),
                  inline: true
                },
                {
                  name: '🎯 Status do Sistema',
                  value: 'Operacional ✅',
                  inline: true
                },
                {
                  name: '🔧 Executado por',
                  value: 'Admin via API',
                  inline: false
                }
              ],
              footer: {
                text: 'SGB Marketing Bot • Teste Manual'
              },
              timestamp: new Date().toISOString()
            }]
          }

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SGB-Meta-Test/1.0'
            },
            body: JSON.stringify(discordPayload)
          })

          if (!response.ok) {
            throw new Error(`Discord webhook failed: ${response.status}`)
          }

          return NextResponse.json({
            success: true,
            message: 'Teste do Discord webhook enviado com sucesso',
            action: 'test_discord',
            timestamp: new Date().toISOString()
          })

        } catch (discordError) {
          console.error('Erro no teste Discord:', discordError)
          return NextResponse.json(
            { error: 'Erro ao testar webhook Discord' },
            { status: 500 }
          )
        }
      }

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro na API Meta Automation POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 🛠️ PUT - ATUALIZAR CONFIGURAÇÕES
// ========================================
export async function PUT(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { frequency_hours, webhook_url } = body

    // Aqui poderíamos implementar atualização das configurações
    // Por enquanto, retornamos sucesso
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas (funcionalidade em desenvolvimento)',
      updated_settings: {
        frequency_hours,
        webhook_url: webhook_url ? '[CONFIGURADO]' : '[NÃO ALTERADO]'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API Meta Automation PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 📋 OPÇÕES DISPONÍVEIS
// ========================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// ========================================
// 📝 DOCUMENTAÇÃO DA API
// ========================================
/*
META AUTOMATION API ENDPOINTS:

GET /api/admin/meta-automation
  ?action=status     - Status atual da automação
  ?action=logs       - Logs das execuções (?limit=N)
  (default)          - Status geral + logs recentes

POST /api/admin/meta-automation
  { "action": "toggle", "params": { "enable": true/false } }     - Ativar/Desativar
  { "action": "execute_manual" }                                 - Execução manual
  { "action": "test_discord" }                                   - Testar Discord

PUT /api/admin/meta-automation
  { "frequency_hours": 6, "webhook_url": "..." }                - Atualizar config

Todas as requisições precisam de:
  Authorization: Bearer [JWT_TOKEN]
  User role: admin

Respostas sempre incluem:
  - success: boolean
  - timestamp: ISO string
  - message/error: string
*/ 