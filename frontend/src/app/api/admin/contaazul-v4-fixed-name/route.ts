import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🚀 CONTAAZUL V4 - NOME FIXO + LIMPEZA (CORRIGIDO)
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando ContaAzul V4 - Nome fixo + Limpeza automática')

    // Verificar autenticação (permitir pgcron)
    let user = null
    const authHeader = request.headers.get('authorization')
    
    try {
      // Usar autenticação real (sem mock)
      user = await getUserAuth(request)
      
      if (!user) {
        return NextResponse.json({ 
          error: 'Usuário não autenticado' 
        }, { status: 401 })
      }
      
      if (!isAdmin(user)) {
        return NextResponse.json({ 
          error: 'Apenas administradores podem executar coleta' 
        }, { status: 403 })
      }
    } catch (error) {
      // Se falhar auth normal, verificar se é do pgcron
      if (!authHeader?.includes('pgcron') && !request.headers.get('user-agent')?.includes('Supabase')) {
        return NextResponse.json({ 
          error: 'Autenticação necessária' 
        }, { status: 401 })
      }
      // Para pgcron, usar bar_id padrão
      user = { bar_id: 3, id: 'pgcron-system' }
    }

    console.log('✅ Usuário autenticado:', user.id, 'bar_id:', user.bar_id)

    const body = await request.json().catch(() => ({}))
    const { email, senha, headless = true } = body

    console.log('📋 Parâmetros recebidos:', { email: email ? '***' : 'não fornecido', headless })

    // 🔐 BUSCAR CREDENCIAIS DO SUPABASE
    let credenciais = {
      email: email || process.env.CONTAAZUL_EMAIL || null,
      senha: senha || process.env.CONTAAZUL_SENHA || null
    }

    console.log('🔍 Credenciais iniciais:', { 
      email: credenciais.email ? 'fornecido' : 'não fornecido',
      senha: credenciais.senha ? 'fornecida' : 'não fornecida'
    })

    // Se não foram passadas credenciais, buscar do banco
    if (!credenciais.email || !credenciais.senha) {
      try {
        console.log('🔍 Buscando credenciais do Supabase...')
        
        // Buscar credenciais do ContaAzul ou ContaHub (fallback)
        const { data: creds, error } = await supabase
          .from('api_credentials')
          .select('username, password, configuracoes')
          .eq('bar_id', user.bar_id)
          .in('sistema', ['contaazul', 'contahub'])
          .eq('ativo', true)
          .limit(1)
          .single()

        console.log('📊 Resultado da busca:', { 
          erro: error?.message,
          encontrou: !!creds,
          tem_email: !!creds?.username,
          tem_senha: !!creds?.password
        })

        if (error) {
          console.log('⚠️ Erro ao buscar credenciais:', error.message)
        } else if (creds) {
          credenciais.email = creds.username
          credenciais.senha = creds.password
          
          // Se tiver secret_2fa nas configurações, definir como variável de ambiente
          if (creds.configuracoes?.secret_2fa) {
            process.env.SECRET_2FA = creds.configuracoes.secret_2fa
            console.log('🔑 Secret 2FA configurado do banco')
          }
          
          console.log('✅ Credenciais encontradas no Supabase')
        }
      } catch (err) {
        console.log('⚠️ Erro na busca de credenciais:', err)
        return NextResponse.json({
          success: false,
          error: 'Erro ao buscar credenciais do banco',
          details: err
        }, { status: 500 })
      }
    }

    // Validar se temos credenciais
    if (!credenciais.email || !credenciais.senha) {
      console.log('❌ Credenciais não encontradas')
      return NextResponse.json({
        success: false,
        error: 'Credenciais do ContaAzul não configuradas. Configure na tabela api_credentials.',
        help: {
          como_configurar: 'INSERT INTO api_credentials (bar_id, sistema, username, password, ativo) VALUES (3, \'contaazul\', \'seu_email\', \'sua_senha\', true)',
          tabela: 'api_credentials'
        }
      }, { status: 400 })
    }

    console.log('📧 Credenciais configuradas para:', credenciais.email.replace(/(.{3}).*(@.*)/, '$1***$2'))

    // Preparar caminhos - CORRIGIDO
    const scriptPath = path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_contaazul_fixed_name.py')
    const credentialsPath = path.join(process.cwd(), 'temp', 'credentials_v4.json')
    const tempDir = path.dirname(credentialsPath)

    console.log('🔍 DEBUG - Caminhos:')
    console.log(`   Script Python: ${scriptPath}`)
    console.log(`   Credenciais: ${credentialsPath}`)
    console.log(`   Script existe? ${fs.existsSync(scriptPath)}`)

    // Verificar se script existe
    if (!fs.existsSync(scriptPath)) {
      const error = `Script Python não encontrado: ${scriptPath}`
      console.error('❌', error)
      return NextResponse.json({
        success: false,
        error,
        debug: {
          script_path: scriptPath,
          working_dir: process.cwd(),
          script_exists: false
        }
      }, { status: 500 })
    }

    // Criar diretório temporário
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
      console.log('📁 Diretório temp criado:', tempDir)
    }

    // Salvar credenciais temporárias
    console.log('💾 Salvando credenciais temporárias...')
    fs.writeFileSync(credentialsPath, JSON.stringify(credenciais, null, 2))
    console.log('✅ Credenciais salvas em:', credentialsPath)

    console.log('🐍 Executando script Python V4 com navegação inteligente...')
    console.log('🧭 Estratégias: URLs diretas → Menu → Links específicos → Busca XPath')
    console.log('⏱️ Timeout aumentado para 5 minutos')

    // Executar script Python - COMANDO CORRIGIDO
    const command = `python "${scriptPath}" --credenciais-arquivo "${credentialsPath}" ${headless ? '--headless' : ''}`
    
    console.log(`🔧 Comando: ${command}`)

    const startTime = new Date()
    
    let stdout = ''
    let stderr = ''
    let executionError = null

    try {
      const result = await execAsync(command, {
        timeout: 300000, // 5 minutos (para permitir múltiplas estratégias de navegação)
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })
      stdout = result.stdout
      stderr = result.stderr
      console.log('✅ Script Python executado com sucesso')
    } catch (error: any) {
      executionError = error
      stdout = error.stdout || ''
      stderr = error.stderr || ''
      console.error('❌ Erro na execução do Python:', error.message)
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    console.log('📊 Resultado da execução Python:')
    console.log(`   Duração: ${duration}ms`)
    console.log(`   STDOUT (${stdout.length} chars):`, stdout.substring(0, 500))
    console.log(`   STDERR (${stderr.length} chars):`, stderr.substring(0, 500))
    console.log(`   Erro de execução:`, executionError?.message || 'Nenhum')

    // Limpar arquivo de credenciais
    try {
      fs.unlinkSync(credentialsPath)
      console.log('🧹 Credenciais temporárias removidas')
    } catch (e) {
      console.log('⚠️ Erro ao limpar credenciais:', e)
    }

    // Processar resultado - MELHORADO
    let resultado
    try {
      // Tentar extrair JSON do stdout
      const jsonMatch = stdout.match(/\{[\s\S]*\}$/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
        console.log('✅ JSON extraído com sucesso do stdout')
      } else {
        throw new Error('JSON não encontrado no output')
      }
    } catch (e) {
      console.log('⚠️ Erro ao parsear JSON, analisando output alternativo')
      
      // Verificar se há indicações de sucesso no output
      const hasSuccess = stdout.includes('SUCCESS') || stdout.includes('success') || stdout.includes('✅')
      const hasError = stderr.length > 0 || executionError !== null
      
      resultado = {
        success: hasSuccess && !hasError,
        message: hasSuccess ? 'Coleta executada (sem JSON válido)' : 'Erro na execução',
        output: stdout.substring(0, 1000),
        stderr: stderr?.substring(0, 500),
        execution_error: executionError?.message,
        debug: {
          stdout_length: stdout.length,
          stderr_length: stderr.length,
          has_json: false,
          has_success_indicator: hasSuccess,
          has_error_indicator: hasError
        }
      }
    }

    // Adicionar estatísticas detalhadas
    resultado.api_stats = {
      duracao_api: duration,
      timestamp: endTime.toISOString(),
      executado_por: user.id || 'sistema',
      versao: 'ContaAzul V4 - Nome Fixo + Limpeza (Debug Enhanced)',
      script_path: scriptPath,
      script_exists: fs.existsSync(scriptPath),
      comando_executado: command
    }

    console.log('🎯 Resultado final:', {
      success: resultado.success,
      registros: resultado.dados?.total_registros || 'N/A',
      duracao: duration + 'ms',
      tem_erro: !!executionError
    })

    return NextResponse.json(resultado)

  } catch (error: any) {
    console.error('❌ Erro geral na API ContaAzul V4:', error)

    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        stack: error.stack?.substring(0, 500)
      },
      debug: {
        working_dir: process.cwd(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// ========================================
// 📊 STATUS E INFORMAÇÕES
// ========================================
export async function GET() {
  return NextResponse.json({
    info: "ContaAzul V4 - Coleta com nome fixo e limpeza automática (DEBUG MODE)",
    version: "4.1",
    features: [
      "Nome fixo de arquivo (visao_competencia.xlsx)",
      "Limpeza automática após processamento", 
      "Download sempre novo (nunca cache)",
      "Logs detalhados para debug",
      "Compatível com pgcron",
      "Debug melhorado para diagnóstico"
    ],
    strategy: {
      problema_resolvido: "Arquivo antigo impedia novos downloads",
      solucao: "Nome fixo + deleção após processar",
      melhorias_v4_1: [
        "Verificação de existência do script",
        "Captura melhorada de erros",
        "Debug detalhado de stdout/stderr",
        "Log local sem dependência do Supabase"
      ]
    },
    debug: {
      working_directory: process.cwd(),
      script_expected_path: path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_contaazul_fixed_name.py')
    }
  })
} 