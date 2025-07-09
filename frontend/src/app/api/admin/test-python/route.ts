import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste simples de execução Python')

    // Verificar se o script existe
    const scriptPath = path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_contaazul_fixed_name.py')
    
    console.log('🔍 Verificando script Python:')
    console.log(`   Caminho: ${scriptPath}`)
    console.log(`   Existe: ${fs.existsSync(scriptPath)}`)
    console.log(`   Working dir: ${process.cwd()}`)

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({
        success: false,
        error: 'Script Python não encontrado',
        debug: {
          script_path: scriptPath,
          working_dir: process.cwd(),
          script_exists: false
        }
      })
    }

    // Testar execução simples do Python
    console.log('🐍 Testando execução básica do Python...')
    
    try {
      const { stdout, stderr } = await execAsync('python --version', { timeout: 5000 })
      console.log('✅ Python encontrado:', stdout.trim())
      
      return NextResponse.json({
        success: true,
        resultado: {
          python_version: stdout.trim(),
          script_exists: true,
          script_path: scriptPath,
          working_dir: process.cwd(),
          stderr: stderr || 'nenhum erro'
        }
      })
      
    } catch (error: any) {
      console.log('❌ Erro ao executar Python:', error.message)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar Python',
        details: {
          message: error.message,
          stdout: error.stdout,
          stderr: error.stderr
        }
      })
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: "API de teste para verificar execução Python",
    uso: "POST /api/admin/test-python"
  })
} 