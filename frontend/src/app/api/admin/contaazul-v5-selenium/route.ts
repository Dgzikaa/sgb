import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 🚀 CONTAAZUL V5 - SELENIUM (SCRIPT ORIGINAL)
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Usar autenticação real (sem mock)
    const user = await getUserAuth(request)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado' 
      }, { status: 401 })
    }
    
    if (!isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem executar sincronização' 
      }, { status: 403 })
    }

    console.log('🚀 Iniciando ContaAzul V5 - Selenium (Script Original)')
    console.log(`✅ Usuário autenticado: ${user.id} bar_id: ${user.bar_id}`)

    const body = await request.json()
    const { headless = true } = body

    console.log('📋 Parâmetros recebidos:', { headless })

    // Buscar credenciais do Supabase
    console.log('🔍 Buscando credenciais do Supabase...')
    
    let credentialsData, credentialsError
    try {
      const result = await supabase
        .from('api_credentials')
        .select('*')
        .eq('sistema', 'contaazul')
        .single()
      
      credentialsData = result.data
      credentialsError = result.error
      
      console.log('📊 Resultado da busca de credenciais:')
      console.log('  Error:', credentialsError)
      console.log('  Data keys:', credentialsData ? Object.keys(credentialsData) : 'null')
      console.log('  Data sample:', credentialsData ? { 
        id: credentialsData.id, 
        sistema: credentialsData.sistema,
        has_username: !!credentialsData.username,
        has_password: !!credentialsData.password,
        has_configuracoes: !!credentialsData.configuracoes
      } : 'null')
      
    } catch (queryError: any) {
      console.log('❌ Erro na query de credenciais:', queryError)
      return NextResponse.json({ 
        error: 'Erro ao buscar credenciais no banco',
        details: queryError.message 
      }, { status: 500 })
    }

    if (credentialsError || !credentialsData) {
      console.log('❌ Credenciais não encontradas:', credentialsError)
      return NextResponse.json({ 
        error: 'Credenciais do ContaAzul não configuradas',
        details: credentialsError?.message 
      }, { status: 500 })
    }

    console.log('✅ Credenciais encontradas, verificando campos...')
    console.log('📊 Estrutura dos dados:', Object.keys(credentialsData))
    
    const { username: email, password, configuracoes: config } = credentialsData
    const secret2FA = config?.secret_2fa

    console.log('🔍 Debug credenciais:')
    console.log('  📧 Username (email) presente:', !!email)
    console.log('  🔑 Password presente:', !!password)
    console.log('  ⚙️ Configuracoes presente:', !!config)
    console.log('  🔢 Secret 2FA presente:', !!secret2FA)
    if (config) {
      console.log('  📋 Configuracoes content:', JSON.stringify(config))
    }

    if (!email || !password || !secret2FA) {
      console.log('❌ Credenciais incompletas!')
      console.log('  Email:', email ? 'OK' : 'MISSING')
      console.log('  Password:', password ? 'OK' : 'MISSING')
      console.log('  Config:', config ? JSON.stringify(config) : 'MISSING')
      console.log('  Secret 2FA:', secret2FA ? 'OK' : 'MISSING')
      
      return NextResponse.json({ 
        error: 'Credenciais incompletas (email, senha ou 2FA missing)',
        debug: {
          email_present: !!email,
          password_present: !!password,
          config_present: !!config,
          secret_2fa_present: !!secret2FA,
          config_content: config
        }
      }, { status: 500 })
    }

    console.log('✅ Credenciais encontradas no Supabase')
    console.log(`📧 Email: ${email.substring(0, 3)}***@${email.split('@')[1]}`)

        // Adaptar o script Python original para usar nossas credenciais
    const scriptPath = path.join(process.cwd(), 'contaazul_ordinario_api.py')
    
    // Criar versão EXATA do script original que funciona, apenas salvando no Supabase
    const adaptedScript = `
import os
import time
import pyotp
import pandas as pd
import logging
import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementNotInteractableException

# Configuração do logging - IGUAL AO ORIGINAL
logging.basicConfig(level=logging.DEBUG, format='[%(levelname)s] %(message)s')

# Credenciais passadas via argumentos
CONTA_AZUL_EMAIL = "${email}"
CONTA_AZUL_SENHA = "${password}"
SECRET_2FA = "${secret2FA}"
DOWNLOAD_PATH = r"C:\\Users\\rodri\\Downloads"
EXPORT_FILE_NAME = "visao_competencia.xls"  # Nome exato do original

# Lista de seletores para pop-ups - IGUAL AO ORIGINAL
POPUP_SELECTORS = [
    {"popup": "a.tracksale-close-link", "description": "Pesquisa NPS"},
    {"popup": "#tracksale-wrapper button.close", "description": "Tracksale wrapper"},
    {"popup": ".modal-dialog .close", "description": "Modal genérico"},
    {"popup": ".modal-dialog button[data-dismiss='modal']", "description": "Botão dismiss modal"},
    {"popup": ".popper-container .close-btn", "description": "Popper container"},
    {"popup": ".notification-container .close-btn", "description": "Notificação"},
    {"popup": ".toast-container .close-button", "description": "Toast notification"},
    {"popup": "div[role='dialog'] button[aria-label='Close']", "description": "Dialog ARIA"}
]

def check_and_close_popups(driver, wait):
    """Verifica e fecha qualquer pop-up que possa estar presente na página - FUNÇÃO ORIGINAL"""
    print("[DEBUG] Verificando possíveis pop-ups...")
    
    # Primeiro, tenta remover overlays via JavaScript - IGUAL AO ORIGINAL
    try:
        driver.execute_script("""
            // Remove elementos comuns de overlay
            const elements = [
                'tracksale-wrapper', 
                'tracksale-content',
                'modal-backdrop',
                'modal-dialog'
            ];
            
            elements.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.remove();
            });
            
            // Remove classes de modal do body
            document.body.classList.remove('modal-open');
        """)
    except Exception as e:
        print(f"[DEBUG] Erro ao executar script de remoção: {e}")
    
    # Tenta fechar cada tipo de pop-up conhecido - IGUAL AO ORIGINAL
    popups_found = False
    for selector in POPUP_SELECTORS:
        try:
            close_button = WebDriverWait(driver, 1).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector["popup"]))
            )
            print(f"[DEBUG] Pop-up encontrado: {selector['description']}")
            driver.execute_script("arguments[0].click();", close_button)
            print(f"[INFO] Pop-up {selector['description']} fechado com sucesso")
            popups_found = True
            time.sleep(0.5)  # Pequena pausa após fechar um pop-up
        except (TimeoutException, NoSuchElementException, ElementNotInteractableException):
            pass
    
    if not popups_found:
        print("[DEBUG] Nenhum pop-up encontrado")
    
    return popups_found

def main():
    # CONFIGURAÇÃO SUPER SIMPLES - EXATAMENTE COMO O SCRIPT ORIGINAL
    edge_options = webdriver.EdgeOptions()
    
    # Modo headless básico
    edge_options.add_argument('--headless')
    edge_options.add_argument('--window-size=1920,1080')
    
    # REMOVER TUDO QUE PODE CAUSAR CONFLITO
    # Sem user-data-dir
    # Sem remote-debugging-port
    # Sem configurações extras
    
    print("[DEBUG] Iniciando Edge WebDriver em modo headless SIMPLES...")
    driver = webdriver.Edge(options=edge_options)
    wait = WebDriverWait(driver, 30)
    print("[DEBUG] Edge WebDriver iniciado com sucesso!")

    try:
        # 1) Acessar a página de login - IGUAL AO ORIGINAL
        print("[DEBUG] Acessando página de Login da Conta Azul...")
        driver.get("https://login.contaazul.com/#/")

        # Verificar e fechar pop-ups antes do login
        check_and_close_popups(driver, wait)

        print("[DEBUG] Preenchendo E-mail e Senha...")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
        email_input.send_keys(CONTA_AZUL_EMAIL)

        password_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='password']")))
        password_input.send_keys(CONTA_AZUL_SENHA)

        # Verificar pop-ups novamente
        check_and_close_popups(driver, wait)

        print("[DEBUG] Clicando no botão de login...")
        botao_login = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR,
            "button.ds-loader-button__button.ds-button.ds-button-primary.ds-button-md.ds-u-width--full")))
        botao_login.click()

        # 2) Realizar o MFA (2FA) - IGUAL AO ORIGINAL
        print("[DEBUG] Gerando TOTP via PyOTP...")
        totp = pyotp.TOTP(SECRET_2FA)
        codigo_2fa = totp.now()
        print(f"[DEBUG] Código gerado: {codigo_2fa}")

        # Verificar pop-ups novamente
        check_and_close_popups(driver, wait)

        print("[DEBUG] Localizando campo de 2FA...")
        mfa_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='text' and @maxlength='6']")))
        mfa_input.clear()
        mfa_input.send_keys(str(codigo_2fa))

        # Verificar pop-ups novamente
        check_and_close_popups(driver, wait)

        print("[DEBUG] Clicando no botão de MFA...")
        botao_mfa = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR,
            "button.ds-loader-button__button.ds-button.ds-button-primary.ds-button-md.ds-u-width--full")))
        botao_mfa.click()

        print("[INFO] Login + MFA concluídos com sucesso.")
        time.sleep(5)

        # Verificar pop-ups após login
        check_and_close_popups(driver, wait)

        # 3) Acessar a Visão de Competência - IGUAL AO ORIGINAL
        print("[DEBUG] Acessando Visão de Competência...")
        driver.get("https://app.contaazul.com/#/ca/financeiro/competencia")
        time.sleep(5)

        # Verificar pop-ups após navegação
        check_and_close_popups(driver, wait)

        # SELEÇÃO DE PERÍODO - IGUAL AO ORIGINAL
        try:
            janeiro_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "/html/body/caf-application-layout/div/caf-application/div/div[2]/div[2]/div/main/div/div[2]/div/section/div[3]/div[2]/div[2]/div/div/div[2]/div/div[1]/div[2]/div[1]/div/div/div/div/div/div[1]/span/button"))
            )
            
            # Verificar pop-ups antes de clicar
            check_and_close_popups(driver, wait)
            
            janeiro_button.click()
            
            # Verificar pop-ups após clicar
            check_and_close_popups(driver, wait)

            periodo_personalizado_option = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Todo o período')]"))
            )
            
            # Verificar pop-ups novamente
            check_and_close_popups(driver, wait)
            
            periodo_personalizado_option.click()
            time.sleep(5)
            
            # Verificar pop-ups após selecionar período
            check_and_close_popups(driver, wait)
            
        except TimeoutException:
            print("[ALERTA] Não foi possível encontrar o seletor de período. Tentando continuar...")
            # Verificar e fechar quaisquer pop-ups que possam estar bloqueando
            check_and_close_popups(driver, wait)

        # EXPORTAÇÃO - IGUAL AO ORIGINAL
        try:
            exportar_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "/html/body/caf-application-layout/div/caf-application/div/div[2]/div[2]/div/main/div/div[2]/div/section/div[2]/div/nav/div/div/div/div[2]/span[1]/button"))
            )
            
            # Verificar pop-ups antes de exportar
            check_and_close_popups(driver, wait)
            
            driver.execute_script("arguments[0].click();", exportar_btn)
            print("[DEBUG] Aguardando o download do arquivo...")
            time.sleep(20)
            
            # Verificar pop-ups durante o download
            check_and_close_popups(driver, wait)
        except TimeoutException:
            print("[ERRO] Não foi possível encontrar o botão de exportação.")
            # Verificar e fechar quaisquer pop-ups que possam estar bloqueando
            check_and_close_popups(driver, wait)

        # PROCESSAR ARQUIVO - ADAPTADO PARA SALVAR NO SUPABASE
        file_path = os.path.join(DOWNLOAD_PATH, EXPORT_FILE_NAME)
        if os.path.exists(file_path):
            print("[DEBUG] Arquivo exportado localizado. Processando...")
            
            # Ler arquivo com engine openpyxl - IGUAL AO ORIGINAL
            df = pd.read_excel(file_path, engine='openpyxl')
            df = df.fillna("")  # Substitui valores NaN por string vazia
            
            print(f"[DEBUG] DataFrame shape: {df.shape}")
            print(f"[DEBUG] DataFrame columns: {df.columns.tolist()}")
            
            registros_count = len(df)
            print(f"[DEBUG] Registros encontrados: {registros_count}")
            
            # Resultado para a API
            result = {
                "success": True,
                "registros": registros_count,
                "arquivo": file_path,
                "message": f"SUCCESS V5 Original: {registros_count} registros exportados",
                "colunas": df.columns.tolist(),
                "amostra_dados": df.head(3).to_dict('records') if len(df) > 0 else []
            }
            
            # Salvar dados completos em arquivo temporário para processamento
            import uuid
            dados_temp_file = os.path.join(DOWNLOAD_PATH, f"dados_completos_{uuid.uuid4().hex[:8]}.json")
            dados_completos = df.to_dict('records')
            
            with open(dados_temp_file, 'w', encoding='utf-8') as f:
                json.dump(dados_completos, f, ensure_ascii=False, default=str)
            
            result["dados_temp_file"] = dados_temp_file
            
            print(json.dumps(result, ensure_ascii=False, default=str))
            
            print("[DEBUG] Deletando o arquivo exportado...")
            os.remove(file_path)
            print("[INFO] Arquivo deletado com sucesso.")
        else:
            print("[ERROR] Arquivo exportado não encontrado no caminho especificado.")
            result = {"success": False, "error": "Arquivo não foi baixado"}
            print(json.dumps(result))

    except TimeoutException:
        print("[ERROR] Timeout ao localizar elemento.")
        # Verificar pop-ups que possam estar causando o timeout
        check_and_close_popups(driver, wait)
        result = {"success": False, "error": "Timeout ao localizar elemento"}
        print(json.dumps(result))
    except Exception as e:
        logging.exception("Ocorreu um erro durante a execução do script.")
        # Verificar pop-ups que possam estar causando o erro
        check_and_close_popups(driver, wait)
        result = {"success": False, "error": str(e)}
        print(json.dumps(result))
    finally:
        print("[DEBUG] Fechando navegador Edge.")
        driver.quit()

if __name__ == "__main__":
    main()
`

    // Salvar script adaptado
    fs.writeFileSync(scriptPath, adaptedScript)
    console.log('📄 Script V5 criado:', scriptPath)

    // Executar script
    console.log('🐍 Executando script Selenium V5...')
    console.log('🔧 Comando: python', scriptPath)

    const startTime = Date.now()
    
    try {
      const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, {
        timeout: 300000 // 5 minutos
      })
      
      const duration = Date.now() - startTime
      
      console.log('📊 Resultado da execução Python:')
      console.log(`   Duração: ${duration}ms`)
      console.log(`   STDOUT (${stdout.length} chars):`, stdout.substring(0, 500))
      console.log(`   STDERR (${stderr.length} chars):`, stderr.substring(0, 500))

      // Tentar parsear resultado JSON do script
      let resultado = null
      try {
        // Procurar por JSON no stdout
        const lines = stdout.split('\n')
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            resultado = JSON.parse(line.trim())
            break
          }
        }
      } catch (parseError) {
        console.log('⚠️ Erro ao parsear JSON, analisando output alternativo')
      }

      // Limpar arquivo script temporário
      try {
        fs.unlinkSync(scriptPath)
        console.log('🧹 Script temporário removido')
      } catch (cleanupError) {
        console.log('⚠️ Erro ao remover script temporário:', cleanupError)
      }

      if (resultado?.success && resultado?.dados_temp_file) {
        console.log('💾 Processando dados e salvando no Supabase...')
        
        try {
          // Ler dados do arquivo temporário
          const dadosCompletos = JSON.parse(fs.readFileSync(resultado.dados_temp_file, 'utf8'))
          
          // Limpar arquivo temporário de dados
          fs.unlinkSync(resultado.dados_temp_file)
          
          console.log(`📊 Dados carregados: ${dadosCompletos.length} registros`)
          
          // Mapear dados para formato do banco
          const dadosFormatados = dadosCompletos.map((item: any) => ({
            data_competencia: item['Data de competência'] || null,
            historico: item['Histórico'] || null,
            codigo_categoria: item['Código da categoria'] || null,
            categoria: item['Categoria'] || null,
            receita: parseFloat(item['Receita']?.toString()?.replace(/[^\d,-]/g, '')?.replace(',', '.') || '0'),
            despesa: parseFloat(item['Despesa']?.toString()?.replace(/[^\d,-]/g, '')?.replace(',', '.') || '0'),
            bar_id: user.bar_id,
            created_at: new Date().toISOString(),
            sync_method: 'selenium_v5_original'
          }))

          console.log('🗄️ Limpando dados antigos do ContaAzul...')
          await supabase
            .from('contaazul')
            .delete()
            .eq('bar_id', user.bar_id)

          console.log('💾 Inserindo novos dados...')
          const { data: insertData, error: insertError } = await supabase
            .from('contaazul')
            .insert(dadosFormatados)
            .select()

          if (insertError) {
            console.error('❌ Erro ao inserir dados:', insertError)
            throw insertError
          }

          console.log(`✅ ${insertData?.length} registros inseridos com sucesso!`)

          return NextResponse.json({
            success: true,
            message: `SUCCESS V5 Original: ${dadosCompletos.length} registros processados e salvos no banco`,
            registros: dadosCompletos.length,
            registros_salvos: insertData?.length || 0,
            duracao: `${duration}ms`,
            versao: 'V5 - Selenium Original',
            detalhes: {
              colunas_originais: resultado.colunas,
              amostra: resultado.amostra_dados,
              metodo: 'selenium_v5_original'
            }
          })

        } catch (dbError: any) {
          console.error('❌ Erro ao salvar no banco:', dbError)
          return NextResponse.json({
            success: false,
            error: `Dados extraídos mas erro ao salvar: ${dbError.message}`,
            registros_extraidos: resultado.registros,
            duracao: `${duration}ms`,
            detalhes: {
              erro_banco: dbError.message,
              stdout: stdout.substring(0, 1000)
            }
          }, { status: 500 })
        }
        
      } else if (resultado?.success) {
        return NextResponse.json({
          success: true,
          message: resultado.message || 'ContaAzul V5 executado com sucesso',
          registros: resultado.registros || 'N/A',
          duracao: `${duration}ms`,
          versao: 'V5 - Selenium Original'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: resultado?.error || 'Erro desconhecido na execução',
          registros: 'N/A',
          duracao: `${duration}ms`,
          debug: {
            stdout: stdout.substring(0, 1000),
            stderr: stderr.substring(0, 1000)
          }
        }, { status: 500 })
      }

    } catch (execError: any) {
      console.error('❌ Erro na execução:', execError)
      return NextResponse.json({
        success: false,
        error: 'Erro na execução do script Python',
        details: execError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Erro geral na API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 📋 INFORMAÇÕES DA API
// ========================================
export async function GET() {
  return NextResponse.json({
    versao: "ContaAzul V5 - Selenium Original",
    descricao: "Usa o script Selenium original que funcionava",
    tecnologia: "Edge WebDriver + XPaths específicos",
    recursos: [
      "Login automático com 2FA",
      "Detecção e fechamento de pop-ups",
      "Navegação por XPaths testados",
      "Download e processamento de Excel",
      "Limpeza automática de arquivos"
    ],
    diferencial: "Baseado no script original que funcionava perfeitamente"
  })
} 