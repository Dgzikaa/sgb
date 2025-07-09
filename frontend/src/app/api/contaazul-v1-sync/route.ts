import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth } from '@/lib/auth-helper'
import { promisify } from 'util'
import { exec } from 'child_process'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Função para salvar status da sincronização
async function salvarStatusSync(status: any) {
  try {
    const statusFile = path.join(process.cwd(), 'temp', 'contaazul_v1_status.json')
    await fs.writeFile(statusFile, JSON.stringify(status, null, 2), 'utf-8')
  } catch (error) {
    console.warn('⚠️ Erro ao salvar status:', error)
  }
}

// Função para gerar o script Python
function createPythonScript(emailContaAzul: string, senhaContaAzul: string): string {
  return `
import asyncio
import sys
import json
import pandas as pd
import logging
import pyotp
from pathlib import Path
from playwright.async_api import async_playwright
import time
import os
import uuid

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Credenciais do ContaAzul
email = "${emailContaAzul}"
senha = "${senhaContaAzul}"
SECRET_2FA = "PKB7MTXCP5M3Y54C6KGTZFMXONAGOLQDUKGDN3LF5U4XAXNULP4A"  # Mesmo do script que funciona

async def main():
    arquivo_baixado = None
    
    try:
        # Diretórios
        script_dir = Path(__file__).parent
        downloads_dir = script_dir / "downloads"
        downloads_dir.mkdir(exist_ok=True)
        
        logger.info("🚀 Iniciando navegador Playwright...")
        
        # Tentar diferentes caminhos para Chrome
        chrome_paths = [
            "C:/Program Files/Google/Chrome/Application/chrome.exe",
            "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
        ]
        
        playwright = None
        browser = None
        
        for chrome_path in chrome_paths:
            try:
                playwright = await async_playwright().start()
                browser = await playwright.chromium.launch(
                    executable_path=chrome_path,
                    headless=True,
                    downloads_path=str(downloads_dir),
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                logger.info(f"✅ Navegador iniciado com: {chrome_path}")
                break
            except Exception as e:
                logger.warning(f"⚠️ Falha com {chrome_path}: {e}")
                if browser:
                    await browser.close()
                if playwright:
                    await playwright.stop()
                browser = None
                playwright = None
        
        # Se não conseguiu com Chrome específico, tentar auto
        if not browser:
            try:
                playwright = await async_playwright().start()
                browser = await playwright.chromium.launch(
                    headless=True,
                    downloads_path=str(downloads_dir),
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                logger.info("✅ Navegador iniciado com: auto")
            except Exception as e:
                logger.error(f"❌ Erro ao iniciar navegador: {e}")
                return {"success": False, "error": str(e)}

        context = await browser.new_context(
            accept_downloads=True,
            timeout=120000  # 2 minutos timeout para contexto
        )
        page = await context.new_page()
        
        # Definir timeout maior para a página
        page.set_default_timeout(120000)  # 2 minutos
        
        # 1) Acessar a página de login (igual ao script Selenium)
        logger.info("🌐 Acessando página de Login da Conta Azul...")
        await page.goto("https://login.contaazul.com/#/", timeout=60000)
        await page.wait_for_load_state('networkidle', timeout=60000)
        
        # Log da URL e título atuais
        current_url = page.url
        title = await page.title()
        logger.info(f"📍 URL atual: {current_url}")
        logger.info(f"📄 Título: {title}")
        
        # 2) Processo de login (igual ao script Selenium)
        logger.info("🔐 Preenchendo E-mail e Senha...")
        
        # Inserir email
        await page.fill('input[type="email"]', email)
        
        # Inserir senha
        await page.fill('input[type="password"]', senha)
        
        # Clicar no botão de login
        logger.info("🚀 Clicando no botão de login...")
        await page.click('button.ds-loader-button__button.ds-button.ds-button-primary.ds-button-md.ds-u-width--full')
        await page.wait_for_timeout(5000)  # Aumentado de 3000 para 5000
        
        # 3) Realizar o MFA (2FA) - IGUAL AO SCRIPT SELENIUM
        logger.info("🔐 Gerando TOTP via PyOTP...")
        totp = pyotp.TOTP(SECRET_2FA)
        codigo_2fa = totp.now()
        logger.info(f"🔢 Código 2FA gerado: {codigo_2fa}")
        
        # Aguardar página de 2FA carregar
        await page.wait_for_timeout(3000)
        
        # Inserir código 2FA
        logger.info("📱 Preenchendo código 2FA...")
        await page.fill('input[type="text"][maxlength="6"]', str(codigo_2fa))
        
        # Clicar no botão de verificação MFA
        logger.info("✅ Clicando no botão de verificação 2FA...")
        await page.click('button.ds-loader-button__button.ds-button.ds-button-primary.ds-button-md.ds-u-width--full')
        
        # Aguardar login + 2FA serem processados
        logger.info("⏳ Aguardando processamento do login + 2FA...")
        await page.wait_for_timeout(8000)  # Aumentado de 5000 para 8000
        
        # Verificar se login foi bem-sucedido
        current_url = page.url
        logger.info(f"📍 URL após 2FA: {current_url}")
        
        if "login.contaazul.com" in current_url and "verificacao" in current_url:
            raise Exception("2FA falhou - código pode estar incorreto")
        
        logger.info("✅ Login + 2FA realizados com sucesso!")
        
        # 4) Acessar a Visão de Competência (URL EXATA do script Selenium)
        logger.info("📊 Acessando Visão de Competência...")
        await page.goto("https://app.contaazul.com/#/ca/financeiro/competencia", timeout=60000)
        await page.wait_for_load_state('networkidle', timeout=60000)
        await page.wait_for_timeout(10000)  # Aumentado de 5000 para 10000
        
        current_url = page.url
        logger.info(f"📍 URL da página financeira: {current_url}")
        
        # 5) Selecionar "Todo o período" (XPath EXATO do script Selenium)
        logger.info("📅 Selecionando 'Todo o período'...")
        try:
            # XPath EXATO do script Selenium convertido para Playwright
            periodo_button_xpath = '/html/body/caf-application-layout/div/caf-application/div/div[2]/div[2]/div/main/div/div[2]/div/section/div[3]/div[2]/div[2]/div/div/div[2]/div/div[1]/div[2]/div[1]/div/div/div/div/div/div[1]/span/button'
            
            logger.info("🎯 Clicando no seletor de período com XPath exato...")
            await page.wait_for_selector(f'xpath={periodo_button_xpath}', timeout=30000)
            await page.click(f'xpath={periodo_button_xpath}')
            await page.wait_for_timeout(3000)
            
            # Procurar "Todo o período" - xpath do Selenium adaptado
            logger.info("🔍 Procurando opção 'Todo o período'...")
            todo_periodo_selectors = [
                'text="Todo o período"',
                'xpath=//span[contains(text(), "Todo o período")]',
                'xpath=//option[contains(text(), "Todo o período")]',
                'xpath=//*[contains(text(), "Todo o período")]'
            ]
            
            periodo_selecionado = False
            for selector in todo_periodo_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        logger.info(f"✅ Encontrou 'Todo o período' com: {selector}")
                        await page.click(selector)
                        await page.wait_for_timeout(5000)  # Aumentado de 3000 para 5000
                        periodo_selecionado = True
                        break
                except Exception as e:
                    logger.warning(f"⚠️ Erro com seletor {selector}: {e}")
                    continue
            
            if periodo_selecionado:
                logger.info("✅ Período 'Todo o período' selecionado com sucesso")
            else:
                logger.warning("⚠️ Não conseguiu selecionar 'Todo o período' - tentando continuar...")
            
        except Exception as e:
            logger.warning(f"⚠️ Erro geral na seleção de período: {e} - Tentando continuar...")
        
        # 6) Exportar dados - XPath EXATO do script Selenium
        logger.info("📥 Iniciando exportação com XPath exato...")
        
        try:
            # XPath EXATO do botão exportar do script Selenium
            exportar_xpath = '/html/body/caf-application-layout/div/caf-application/div/div[2]/div[2]/div/main/div/div[2]/div/section/div[2]/div/nav/div/div/div/div[2]/span[1]/button'
            
            logger.info("🎯 Tentando exportar com XPath exato do Selenium...")
            
            # Verificar se o botão existe
            if await page.locator(f'xpath={exportar_xpath}').count() > 0:
                logger.info("✅ Botão de exportar encontrado com XPath exato!")
                
                # Aguardar download com timeout aumentado para 120 segundos
                async with page.expect_download(timeout=120000) as download_info:
                    await page.click(f'xpath={exportar_xpath}')
                    download = await download_info.value
                    
                    # Salvar arquivo
                    filename = download.suggested_filename or f"visao_competencia_{uuid.uuid4().hex[:8]}.xlsx"
                    if not filename.endswith('.xlsx') and not filename.endswith('.xls'):
                        filename += '.xlsx'
                    
                    arquivo_baixado = downloads_dir / filename
                    await download.save_as(str(arquivo_baixado))
                    logger.info(f"📁 Arquivo exportado com XPath exato: {arquivo_baixado}")
                    
            else:
                logger.warning("⚠️ Botão com XPath exato não encontrado, tentando alternativas...")
                
                # Fallback para outros seletores baseados no script Selenium
                exportar_selectors_fallback = [
                    'xpath=//button[contains(@title, "Exportar")]',
                    'xpath=//span[contains(@title, "Exportar")]//button',
                    'xpath=//nav//button[contains(@title, "Exportar")]',
                    'button[title*="Exportar"]',
                    'span[title*="Exportar"] button'
                ]
                
                exportar_encontrado = False
                for selector in exportar_selectors_fallback:
                    try:
                        if await page.locator(selector).count() > 0:
                            logger.info(f"🎯 Botão de exportar encontrado com fallback: {selector}")
                            
                            # Aguardar download com timeout aumentado para 120 segundos
                            async with page.expect_download(timeout=120000) as download_info:
                                await page.click(selector)
                                download = await download_info.value
                                
                                # Salvar arquivo
                                filename = download.suggested_filename or f"visao_competencia_{uuid.uuid4().hex[:8]}.xlsx"
                                if not filename.endswith('.xlsx') and not filename.endswith('.xls'):
                                    filename += '.xlsx'
                                
                                arquivo_baixado = downloads_dir / filename
                                await download.save_as(str(arquivo_baixado))
                                logger.info(f"📁 Arquivo exportado com fallback: {arquivo_baixado}")
                                exportar_encontrado = True
                                break
                                
                    except Exception as e:
                        logger.warning(f"⚠️ Erro com fallback {selector}: {e}")
                        continue
                
                # Se ainda não encontrou, tentar JavaScript como último recurso
                if not exportar_encontrado:
                    logger.info("🔧 Último recurso: tentando JavaScript...")
                    
                    # JavaScript mais específico baseado no script Selenium
                    export_clicked = await page.evaluate("""
                        () => {
                            // Primeiro, tentar encontrar por XPath aproximado
                            const xpath = document.evaluate(
                                "//button[contains(@ng-click, 'exportar') or contains(@title, 'Exportar') or contains(@aria-label, 'Exportar')]",
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            ).singleNodeValue;
                            
                            if (xpath) {
                                xpath.click();
                                return 'xpath';
                            }
                            
                            // Fallback: procurar por texto ou atributos
                            const buttons = Array.from(document.querySelectorAll('button, a, span'));
                            for (const btn of buttons) {
                                const text = (btn.textContent || '').toLowerCase();
                                const title = (btn.title || '').toLowerCase();
                                const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                                const ngClick = (btn.getAttribute('ng-click') || '').toLowerCase();
                                
                                if (text.includes('exportar') || title.includes('exportar') || 
                                    text.includes('export') || title.includes('export') ||
                                    ariaLabel.includes('export') || ngClick.includes('export')) {
                                    btn.click();
                                    return 'fallback';
                                }
                            }
                            return false;
                        }
                    """)
                    
                    if export_clicked:
                        logger.info(f"🎯 Botão encontrado via JavaScript ({export_clicked}) - aguardando download...")
                        await page.wait_for_timeout(30000)  # Aumentado de 20000 para 30000
                        
                        # Verificar se arquivo foi baixado
                        excel_files = list(downloads_dir.glob("*.xlsx")) + list(downloads_dir.glob("*.xls"))
                        if excel_files:
                            arquivo_baixado = max(excel_files, key=lambda f: f.stat().st_mtime)
                            logger.info(f"📁 Arquivo detectado via JavaScript: {arquivo_baixado}")
        
        except Exception as e:
            logger.warning(f"⚠️ Erro na exportação: {e}")
        
        # Fechar navegador
        await browser.close()
        await playwright.stop()
        
        # 7) Verificar se conseguiu baixar arquivo
        if not arquivo_baixado or not arquivo_baixado.exists():
            raise Exception("Nenhum arquivo Excel foi baixado")
        
        # 8) Processar Excel (igual ao script original)
        logger.info(f"📊 Processando arquivo Excel: {arquivo_baixado}")
        df = pd.read_excel(arquivo_baixado, engine='openpyxl')  # Mesmo engine do script Selenium
        
        logger.info(f"📈 Arquivo lido: {len(df)} linhas, {len(df.columns)} colunas")
        logger.info(f"🏷️ Colunas: {list(df.columns)}")
        
        if len(df) > 0:
            amostra = df.head(3).to_dict('records')
            logger.info(f"📝 Amostra dos dados: {amostra}")
        
        # Preparar resultado
        resultado = {
            "success": True,
            "registros_processados": len(df),
            "mensagem": f"SUCCESS V1 Playwright: {len(df)} registros processados",
            "arquivo_baixado": str(arquivo_baixado),
            "colunas": list(df.columns),
            "amostra_dados": df.head(3).to_dict('records') if len(df) > 0 else []
        }
        
        # Salvar dados completos em arquivo temporário
        dados_temp_file = downloads_dir / f"dados_completos_{uuid.uuid4().hex[:8]}.json"
        dados_completos = df.to_dict('records')
        
        with open(dados_temp_file, 'w', encoding='utf-8') as f:
            json.dump(dados_completos, f, ensure_ascii=False, default=str)
        
        resultado["dados_temp_file"] = str(dados_temp_file)
        
        print(json.dumps(resultado, ensure_ascii=False, default=str))
        return resultado
        
    except Exception as e:
        logger.error(f"❌ Erro geral: {e}")
        error_result = {
            "success": False,
            "error": str(e),
            "registros_processados": 0
        }
        print(json.dumps(error_result, ensure_ascii=False))
        return error_result
    
    finally:
        # Limpar arquivo baixado
        if arquivo_baixado and arquivo_baixado.exists():
            try:
                arquivo_baixado.unlink()
                logger.info(f"🧹 Arquivo temporário removido: {arquivo_baixado}")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao remover arquivo: {e}")

if __name__ == "__main__":
    asyncio.run(main())
`
}

// 🚀 CONTAAZUL V1 - SINCRONIZAÇÃO COMPLETA (PLAYWRIGHT)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    console.log(`📊 [V1] Iniciando sincronização ContaAzul V1 para bar_id: ${user.bar_id}`)

    // Salvar status inicial
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Iniciando sincronização ContaAzul V1...'
    })

    // 1. PRIMEIRO: Buscar credenciais do ContaAzul
    console.log('🔍 [V1] Buscando credenciais do ContaAzul...')
    const { data: credentialsData, error: credentialsError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .single()

    if (credentialsError || !credentialsData) {
      const errorMsg = 'Credenciais do ContaAzul não encontradas'
      console.error('❌ [V1]', errorMsg)
      return NextResponse.json({ 
        success: false,
        error: errorMsg
      }, { status: 500 })
    }

    const { username: emailContaAzul, password: senhaContaAzul } = credentialsData

    if (!emailContaAzul || !senhaContaAzul) {
      const errorMsg = 'Credenciais incompletas (email ou senha)'
      console.error('❌ [V1]', errorMsg)
      return NextResponse.json({ 
        success: false,
        error: errorMsg
      }, { status: 500 })
    }

    console.log('✅ [V1] Credenciais encontradas')

    // 2. SEGUNDO: Limpar dados antigos da tabela contaazul
    console.log('🧹 [V1] Limpando dados antigos do ContaAzul...')
    try {
      // Verificar registros antes da limpeza
      const { count: antesCount, data: dadosAntes } = await supabase
        .from('contaazul')
        .select('id, sincronizado_em', { count: 'exact' })
        .eq('bar_id', user.bar_id)
        .limit(3)

      console.log(`📊 [V1] Registros antes da limpeza: ${antesCount || 0}`)
      if (dadosAntes && dadosAntes.length > 0) {
        console.log(`🔍 [V1] Amostras encontradas:`, dadosAntes.map((d: any) => ({ id: d.id, sincronizado_em: d.sincronizado_em })))
      }

      // Fazer limpeza completa
      const { error: deleteError, count: deletedCount } = await supabase
        .from('contaazul')
        .delete({ count: 'exact' })
        .eq('bar_id', user.bar_id)

      if (deleteError) {
        throw new Error(`Erro ao limpar dados: ${deleteError.message}`)
      }

      console.log(`✅ [V1] Limpeza concluída: ${deletedCount || 0} registros removidos`)

      // Verificar se realmente limpou
      const { count: depoisCount } = await supabase
        .from('contaazul')
        .select('id', { count: 'exact', head: true })
        .eq('bar_id', user.bar_id)

      console.log(`🔍 [V1] Registros após limpeza: ${depoisCount || 0}`)

    } catch (cleanupError: any) {
      console.error('❌ [V1] Erro na limpeza:', cleanupError)
      return NextResponse.json({ 
        success: false, 
        error: `Erro na limpeza: ${cleanupError.message}` 
      }, { status: 500 })
    }

    // 3. Executar Python script para extrair dados
    console.log('🚀 [V1] Executando script Playwright...')
    
    // Salvar status durante execução
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Executando script Playwright para extrair dados...'
    })
    
    const tempDir = path.join(process.cwd(), 'temp')
    const scriptPath = path.join(tempDir, `contaazul_v1_${Date.now()}.py`)
    
    // Garantir que o diretório temp existe
    if (!fsSync.existsSync(tempDir)) {
      await fs.mkdir(tempDir, { recursive: true })
    }

    const scriptContent = createPythonScript(emailContaAzul, senhaContaAzul)

    // Salvar script
    await fs.writeFile(scriptPath, scriptContent, 'utf-8')

    // Executar script Python
    const { spawn } = require('child_process')
    const processo = spawn('python', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    let stdout = ''
    let stderr = ''

    processo.stdout.on('data', (data: any) => {
      stdout += data.toString()
    })

    processo.stderr.on('data', (data: any) => {
      stderr += data.toString()
    })

    const resultado: any = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        processo.kill()
        reject(new Error('Timeout: Processo excedeu 8 minutos'))
      }, 8 * 60 * 1000) // 8 minutos - aumentado para dar mais tempo

      processo.on('close', (code: number) => {
        clearTimeout(timeout)
        
        if (code === 0) {
          try {
            const ultimaLinha = stdout.trim().split('\n').pop()
            const result = JSON.parse(ultimaLinha || '{}')
            resolve(result)
          } catch (e) {
            console.error('❌ [V1] Erro ao parsear resultado:', e)
            resolve({ success: false, error: 'Erro ao processar resultado do Python' })
          }
        } else {
          resolve({ success: false, error: `Processo Python falhou com código ${code}` })
        }
      })

      processo.on('error', (error: any) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    console.log(`📊 [V1] Resultado da execução:`)
    console.log(`   STDOUT: ${stdout.substring(0, 500)}${stdout.length > 500 ? '...' : ''}`)
    console.log(`   STDERR: ${stderr}`)

    // Limpar script temporário
    try {
      await fs.unlink(scriptPath)
      console.log('🧹 [V1] Script temporário removido')
    } catch (e) {
      console.warn('⚠️ [V1] Erro ao remover script:', e)
    }

    // 4. Se sucesso, processar e salvar dados na tabela contaazul
    if (resultado?.success && resultado?.dados_temp_file) {
      console.log('💾 [V1] Processando e salvando dados na tabela contaazul...')
      
      try {
        // Ler dados completos do arquivo temporário
        const dadosCompletos = JSON.parse(await fs.readFile(resultado.dados_temp_file, 'utf-8'))
        
        console.log(`📊 [V1] Processando ${dadosCompletos.length} registros do Excel...`)

        // Mapear dados do Excel para estrutura da tabela contaazul
        const registrosProcessados = dadosCompletos.map((registro: any, index: number) => {
          // Extrair e limpar os dados
          const valor = parseFloat(String(registro["Valor (R$)"] || "0").replace(/[^-0-9.,]/g, '').replace(',', '.')) || 0
          const descricao = String(registro["Descrição"] || "").trim()
          const dataCompetencia = registro["Data de competência"]
          const categoria = String(registro["Categoria 1"] || "").trim()
          const centroCusto = String(registro["Centro de Custo 1"] || "").trim()
          const clienteFornecedor = String(registro["Nome do fornecedor/cliente"] || "").trim()
          const observacoes = String(registro["Observações"] || "").trim()
          
          // Determinar tipo (receita ou despesa)
          const tipo = valor >= 0 ? 'receita' : 'despesa'
          
          // Converter data
          let dataFormatada = null
          if (dataCompetencia) {
            try {
              // Se vier no formato DD/MM/YYYY
              if (typeof dataCompetencia === 'string' && dataCompetencia.includes('/')) {
                const [dia, mes, ano] = dataCompetencia.split('/')
                dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
              } else {
                // Tentar converter diretamente
                const data = new Date(dataCompetencia)
                if (!isNaN(data.getTime())) {
                  dataFormatada = data.toISOString().split('T')[0]
                }
              }
            } catch (e) {
              console.warn(`⚠️ [V1] Erro ao converter data: ${dataCompetencia}`)
            }
          }
          
          if (!dataFormatada) {
            dataFormatada = new Date().toISOString().split('T')[0] // Fallback para hoje
          }

          return {
            id: `contaazul_v1_${user.bar_id}_${Date.now()}_${index}`,
            bar_id: user.bar_id,
            descricao: descricao || 'Sem descrição',
            valor: valor,
            categoria: categoria || null,
            centro_custo: centroCusto || null,
            data_competencia: dataFormatada,
            data_vencimento: null, // Não disponível no Excel
            status: 'sincronizado',
            tipo: tipo,
            cliente_fornecedor: clienteFornecedor || null,
            documento: null, // Não disponível no Excel
            forma_pagamento: null, // Não disponível no Excel
            observacoes: observacoes || null,
            dados_originais: registro, // Salvar dados originais do Excel
            sincronizado_em: new Date().toISOString()
          }
        }).filter((registro: any) => registro.descricao !== 'Sem descrição' && registro.valor !== 0) // Filtrar registros inválidos

        console.log(`✅ [V1] ${registrosProcessados.length} registros válidos preparados para inserção`)

        // Inserir em lotes para evitar timeout
        const LOTE_SIZE = 100
        let totalInseridos = 0

        for (let i = 0; i < registrosProcessados.length; i += LOTE_SIZE) {
          const lote = registrosProcessados.slice(i, i + LOTE_SIZE)
          
          console.log(`💾 [V1] Inserindo lote ${Math.floor(i/LOTE_SIZE) + 1}: ${lote.length} registros...`)

          const { error: insertError } = await supabase
            .from('contaazul')
            .insert(lote)

          if (insertError) {
            console.error(`❌ [V1] Erro ao inserir lote ${Math.floor(i/LOTE_SIZE) + 1}:`, insertError)
            throw new Error(`Erro ao inserir lote: ${insertError.message}`)
          }

          totalInseridos += lote.length
          console.log(`✅ [V1] Lote ${Math.floor(i/LOTE_SIZE) + 1} inserido com sucesso`)
        }

        console.log(`🎉 [V1] Inserção concluída: ${totalInseridos} registros salvos na tabela contaazul`)

        // Salvar status de sucesso
        await salvarStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'sucesso',
          registros_processados: totalInseridos,
          mensagem: `SUCCESS V1 Playwright: ${totalInseridos} registros processados`
        })

        // Limpar arquivo temporário de dados
        try {
          await fs.unlink(resultado.dados_temp_file)
          console.log('🧹 [V1] Arquivo temporário de dados removido')
        } catch (e) {
          console.warn('⚠️ [V1] Erro ao remover arquivo temporário:', e)
        }

        return NextResponse.json({
          success: true,
          message: 'Sincronização ContaAzul V1 concluída com sucesso',
          registros_processados: totalInseridos,
          registros_excel: resultado.registros_processados,
          arquivo_baixado: resultado.arquivo_baixado
        })

      } catch (saveError: any) {
        console.error('❌ [V1] Erro ao processar/salvar dados:', saveError)
        
        // Salvar status de erro
        await salvarStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'erro',
          mensagem: `Erro ao processar dados: ${saveError.message}`
        })
        
        return NextResponse.json({ 
          success: false, 
          error: `Erro ao processar dados: ${saveError.message}` 
        }, { status: 500 })
      }
    } else {
      // Salvar status de erro do script Python
      await salvarStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: resultado?.error || 'Falha na execução do script Python'
      })
      
      return NextResponse.json({ 
        success: false, 
        error: resultado?.error || 'Falha na execução do script Python' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ [V1] Erro geral:', error)
    
    // Salvar status de erro geral
    await salvarStatusSync({
      executando: false,
      ultima_execucao: new Date().toISOString(),
      status: 'erro',
      mensagem: `Erro geral: ${error.message}`
    })
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}