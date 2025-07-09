#!/usr/bin/env python3
"""
Coletor ContaAzul Playwright V2 - VERSÃO ROBUSTA
- Retry automático em falhas
- Capturas de tela em erros
- Timeouts adaptativos
- Logs detalhados
- Recuperação de sessão
"""

import os
import sys
import json
import time
import logging
import argparse
import pyotp
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import asyncio
from playwright.async_api import async_playwright
import traceback

# Configuração de logging avançada
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'contaazul_logs_{datetime.now().strftime("%Y%m%d")}.log')
    ]
)
logger = logging.getLogger(__name__)

# Configurações globais
SECRET_2FA = os.getenv('SECRET_2FA', 'PKB7MTXCP5M3Y54C6KGTZFMXONAGOLQDUKGDN3LF5U4XAXNULP4A')
MAX_RETRIES = 3
RETRY_DELAY = 5  # segundos
SCREENSHOT_ON_ERROR = True

class ContaAzulCollector:
    def __init__(self, email, senha, headless=True, screenshots_dir=None):
        self.email = email
        self.senha = senha
        self.headless = headless
        self.screenshots_dir = Path(screenshots_dir) if screenshots_dir else Path.home() / "Downloads" / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True, parents=True)
        
        self.browser = None
        self.context = None
        self.page = None
        
        # Estatísticas
        self.stats = {
            'tentativas': 0,
            'erros_capturados': [],
            'tempo_inicio': None,
            'tempo_fim': None,
            'screenshots_salvos': []
        }
    
    async def save_screenshot(self, nome, prefixo="erro"):
        """Salva screenshot com timestamp para debug"""
        if not SCREENSHOT_ON_ERROR or not self.page:
            return None
            
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefixo}_{nome}_{timestamp}.png"
            filepath = self.screenshots_dir / filename
            
            await self.page.screenshot(path=str(filepath), full_page=True)
            logger.info(f"📸 Screenshot salvo: {filepath}")
            self.stats['screenshots_salvos'].append(str(filepath))
            return str(filepath)
        except Exception as e:
            logger.warning(f"⚠️ Erro ao salvar screenshot: {e}")
            return None
    
    async def wait_with_retry(self, selector, timeout=10000, description=""):
        """Aguarda elemento com retry automático"""
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"🔍 Tentativa {attempt + 1}/{MAX_RETRIES}: Aguardando {description or selector}")
                element = await self.page.wait_for_selector(selector, timeout=timeout)
                if element:
                    logger.info(f"✅ Elemento encontrado: {description or selector}")
                    return element
            except Exception as e:
                logger.warning(f"⚠️ Tentativa {attempt + 1} falhou para {description}: {e}")
                if attempt < MAX_RETRIES - 1:
                    await self.save_screenshot(f"retry_{attempt + 1}_{description.replace(' ', '_')}")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    await self.save_screenshot(f"final_error_{description.replace(' ', '_')}")
                    raise
        return None
    
    async def click_with_retry(self, element_or_selector, description=""):
        """Clica em elemento com retry automático"""
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"🖱️ Tentativa {attempt + 1}/{MAX_RETRIES}: Clicando {description}")
                
                if isinstance(element_or_selector, str):
                    await self.page.click(element_or_selector)
                else:
                    await element_or_selector.click()
                    
                logger.info(f"✅ Clique realizado: {description}")
                return True
            except Exception as e:
                logger.warning(f"⚠️ Tentativa {attempt + 1} de clique falhou: {e}")
                if attempt < MAX_RETRIES - 1:
                    await self.save_screenshot(f"click_retry_{attempt + 1}")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    await self.save_screenshot(f"click_final_error")
                    raise
        return False
    
    async def initialize_browser(self):
        """Inicializa navegador com configurações otimizadas"""
        try:
            logger.info("🚀 Inicializando navegador com configurações otimizadas...")
            
            playwright = await async_playwright().__aenter__()
            
            # Configurações otimizadas do navegador
            self.browser = await playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--allow-running-insecure-content'
                ]
            )
            
            # Contexto com configurações anti-detecção
            self.context = await self.browser.new_context(
                accept_downloads=True,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='pt-BR',
                timezone_id='America/Sao_Paulo'
            )
            
            self.page = await self.context.new_page()
            
            # Configurar timeouts mais longos
            self.page.set_default_timeout(30000)
            self.page.set_default_navigation_timeout(60000)
            
            logger.info("✅ Navegador inicializado com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"💥 Erro ao inicializar navegador: {e}")
            await self.save_screenshot("browser_init_error")
            raise
    
    async def login_with_2fa(self):
        """Processo completo de login com 2FA"""
        try:
            logger.info("🌐 Acessando página de login ContaAzul...")
            await self.page.goto('https://login.contaazul.com/#/', wait_until='networkidle')
            await asyncio.sleep(3)
            
            await self.save_screenshot("pagina_inicial", "sucesso")
            
            logger.info(f"📍 URL atual: {self.page.url}")
            logger.info(f"📄 Título: {await self.page.title()}")
            
            # Login
            logger.info("🔐 Iniciando processo de login...")
            
            email_field = await self.wait_with_retry('input[type="email"]', description="campo email")
            await email_field.fill(self.email)
            logger.info("📧 Email preenchido")
            
            password_field = await self.wait_with_retry('input[type="password"]', description="campo senha")
            await password_field.fill(self.senha)
            logger.info("🔑 Senha preenchida")
            
            await asyncio.sleep(2)
            await self.save_screenshot("formulario_preenchido", "sucesso")
            
            login_button = await self.wait_with_retry('button[type="submit"]', description="botão login")
            await self.click_with_retry(login_button, "botão de login")
            
            # Aguardar resposta
            await asyncio.sleep(5)
            current_url = self.page.url
            logger.info(f"📍 URL após login: {current_url}")
            
            # Verificar se precisa de 2FA
            if 'verificacao-duas-etapas' in current_url:
                logger.info("🔐 2FA detectado! Processando automaticamente...")
                await self.process_2fa()
            
            # Verificar sucesso do login
            await asyncio.sleep(3)
            final_url = self.page.url
            logger.info(f"📍 URL final: {final_url}")
            
            if ('dashboard' in final_url.lower() or 
                ('contaazul.com' in final_url and 'login' not in final_url and 'verificacao' not in final_url)):
                logger.info("🎉 Login realizado com sucesso!")
                await self.save_screenshot("login_sucesso", "sucesso")
                return True
            else:
                raise Exception(f"Login falhou - URL final: {final_url}")
                
        except Exception as e:
            logger.error(f"💥 Erro no login: {e}")
            await self.save_screenshot("login_error")
            raise
    
    async def process_2fa(self):
        """Processa 2FA automaticamente"""
        try:
            # Gerar código TOTP
            totp = pyotp.TOTP(SECRET_2FA)
            codigo_2fa = totp.now()
            logger.info(f"🔢 Código 2FA gerado: {codigo_2fa}")
            
            # Aguardar campo 2FA
            campo_2fa = await self.wait_with_retry(
                'input[type="text"][maxlength="6"]', 
                description="campo 2FA"
            )
            
            await campo_2fa.fill(str(codigo_2fa))
            logger.info("🔢 Código 2FA preenchido")
            
            await asyncio.sleep(2)
            await self.save_screenshot("2fa_preenchido", "sucesso")
            
            # Clicar em verificar
            verify_button = await self.wait_with_retry('button[type="submit"]', description="botão verificação")
            await self.click_with_retry(verify_button, "botão de verificação 2FA")
            
            await asyncio.sleep(5)
            logger.info("✅ 2FA processado")
            
        except Exception as e:
            logger.error(f"💥 Erro no 2FA: {e}")
            await self.save_screenshot("2fa_error")
            raise
    
    async def navigate_to_financial(self):
        """Navega para página financeira"""
        try:
            logger.info("💰 Navegando para página financeira...")
            financial_url = 'https://pro.contaazul.com/#/ca/financeiro/competencia'
            
            await self.page.goto(financial_url, wait_until='networkidle', timeout=60000)
            await asyncio.sleep(5)
            
            await self.save_screenshot("pagina_financeira", "sucesso")
            
            current_url = self.page.url
            page_title = await self.page.title()
            logger.info(f"📍 URL carregada: {current_url}")
            logger.info(f"📄 Título: {page_title}")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Erro ao navegar para financeiro: {e}")
            await self.save_screenshot("navigation_error")
            raise
    
    async def configure_period_filter(self):
        """Configura filtro para 'Todo o período'"""
        try:
            logger.info("📅 Configurando filtro 'Todo o período'...")
            await asyncio.sleep(5)
            
            # Tentar encontrar botão de período
            period_selectors = [
                "button:has-text('2025')",
                "button:has-text('Julho')",
                ".dropdown-toggle",
                "button[aria-expanded]"
            ]
            
            period_button = None
            for selector in period_selectors:
                try:
                    period_button = await self.page.wait_for_selector(selector, timeout=5000)
                    if period_button:
                        logger.info(f"✅ Botão de período encontrado: {selector}")
                        break
                except:
                    continue
            
            if period_button:
                await self.click_with_retry(period_button, "seletor de período")
                await asyncio.sleep(3)
                
                # Procurar opção "Todo o período"
                todo_selectors = [
                    "text=Todo o período",
                    "li:has-text('Todo o período')",
                    "div:has-text('Todo o período')"
                ]
                
                for selector in todo_selectors:
                    try:
                        todo_option = await self.page.wait_for_selector(selector, timeout=5000)
                        if todo_option:
                            await self.click_with_retry(todo_option, "opção 'Todo o período'")
                            logger.info("✅ Período configurado para 'Todo o período'")
                            await asyncio.sleep(10)  # Aguardar carregamento
                            await self.save_screenshot("periodo_configurado", "sucesso")
                            return True
                    except:
                        continue
                
                logger.warning("⚠️ Opção 'Todo o período' não encontrada, usando período padrão")
            else:
                logger.warning("⚠️ Botão de período não encontrado, usando período padrão")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Erro ao configurar período: {e}")
            await self.save_screenshot("period_config_error")
            # Não falhar por causa disso, continuar com período padrão
            return True
    
    async def download_excel(self, download_dir):
        """Faz download do arquivo Excel"""
        try:
            logger.info("📥 Iniciando download do Excel...")
            
            # Procurar botão de exportar
            export_selectors = [
                "button:has-text('Exportar')",
                "button:has-text('Excel')",
                "a:has-text('Exportar')",
                "[title*='Exportar']"
            ]
            
            export_button = None
            for selector in export_selectors:
                try:
                    export_button = await self.page.wait_for_selector(selector, timeout=5000)
                    if export_button:
                        logger.info(f"✅ Botão de exportar encontrado: {selector}")
                        break
                except:
                    continue
            
            if not export_button:
                raise Exception("Botão de exportar não encontrado")
            
            # Configurar listener para download
            download_info = None
            download_path = None
            
            async def handle_download(download):
                nonlocal download_info, download_path
                download_info = download
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                original_ext = download.suggested_filename.split('.')[-1] if '.' in download.suggested_filename else 'xlsx'
                filename = f"contaazul_competencia_{timestamp}.{original_ext}"
                download_path = download_dir / filename
                
                await download.save_as(download_path)
                logger.info(f"💾 Arquivo salvo: {download_path}")
            
            self.page.on("download", handle_download)
            
            # Clicar no botão
            await self.click_with_retry(export_button, "botão de exportar")
            
            # Aguardar download
            logger.info("⏳ Aguardando download...")
            await asyncio.sleep(15)
            
            if download_info and download_path and download_path.exists():
                logger.info(f"✅ Download concluído: {download_path}")
                await self.save_screenshot("download_sucesso", "sucesso")
                return download_path
            else:
                raise Exception("Download não foi concluído")
                
        except Exception as e:
            logger.error(f"💥 Erro no download: {e}")
            await self.save_screenshot("download_error")
            raise
    
    async def process_excel_file(self, filepath, output_dir):
        """Processa arquivo Excel para JSON"""
        try:
            logger.info(f"📊 Processando arquivo Excel: {filepath}")
            
            # Ler Excel
            df = pd.read_excel(filepath)
            logger.info(f"📋 Arquivo Excel lido: {len(df)} linhas, {len(df.columns)} colunas")
            logger.info(f"📋 Colunas: {list(df.columns)}")
            
            # Converter para JSON
            dados_json = []
            for index, row in df.iterrows():
                registro = {}
                for col in df.columns:
                    valor = row[col]
                    registro[col] = None if pd.isna(valor) else str(valor)
                dados_json.append(registro)
            
            # Salvar JSON
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            json_filename = f"contaazul_competencia_{timestamp}.json"
            json_filepath = output_dir / json_filename
            
            with open(json_filepath, 'w', encoding='utf-8') as f:
                json.dump(dados_json, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 JSON salvo: {json_filepath}")
            
            # Resultado estruturado
            resultado = {
                "success": True,
                "dados": {
                    "total_registros": len(dados_json),
                    "colunas": list(df.columns),
                    "arquivo_excel": str(filepath),
                    "arquivo_json": str(json_filepath),
                    "primeiros_registros": dados_json[:5],
                    "estatisticas": self.stats,
                    "metadados": {
                        "timestamp": datetime.now().isoformat(),
                        "metodo": "playwright_excel_download_v2",
                        "login_com_2fa": True,
                        "versao_robusta": True,
                        "screenshots_salvos": self.stats['screenshots_salvos']
                    }
                }
            }
            
            # Salvar resultado
            result_filename = f"resultado_contaazul_v2_{timestamp}.json"
            result_filepath = output_dir / result_filename
            
            with open(result_filepath, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Resultado salvo: {result_filepath}")
            return resultado
            
        except Exception as e:
            logger.error(f"💥 Erro ao processar Excel: {e}")
            raise
    
    async def cleanup(self):
        """Limpeza de recursos"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            logger.info("🔚 Recursos liberados")
        except Exception as e:
            logger.warning(f"⚠️ Erro na limpeza: {e}")
    
    async def collect_data(self, output_dir=None):
        """Método principal para coleta de dados"""
        self.stats['tempo_inicio'] = datetime.now()
        
        try:
            if not output_dir:
                output_dir = Path.home() / "Downloads"
            output_dir = Path(output_dir)
            output_dir.mkdir(exist_ok=True)
            
            logger.info("🚀 Iniciando coleta de dados ContaAzul V2 (Versão Robusta)")
            
            # Processo completo
            await self.initialize_browser()
            await self.login_with_2fa()
            await self.navigate_to_financial()
            await self.configure_period_filter()
            
            excel_file = await self.download_excel(output_dir)
            resultado = await self.process_excel_file(excel_file, output_dir)
            
            self.stats['tempo_fim'] = datetime.now()
            duracao = self.stats['tempo_fim'] - self.stats['tempo_inicio']
            logger.info(f"⏱️ Coleta concluída em: {duracao}")
            
            resultado['dados']['duracao_total'] = str(duracao)
            
            # Output final para integração
            print(json.dumps(resultado, ensure_ascii=False))
            return resultado
            
        except Exception as e:
            self.stats['tempo_fim'] = datetime.now()
            self.stats['erros_capturados'].append({
                'timestamp': datetime.now().isoformat(),
                'erro': str(e),
                'traceback': traceback.format_exc()
            })
            
            logger.error(f"💥 Erro na coleta: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            
            await self.save_screenshot("error_final")
            
            erro_resultado = {
                "success": False,
                "error": str(e),
                "estatisticas": self.stats,
                "screenshots_erro": self.stats['screenshots_salvos']
            }
            
            print(json.dumps(erro_resultado, ensure_ascii=False))
            return erro_resultado
            
        finally:
            await self.cleanup()

async def main():
    parser = argparse.ArgumentParser(description='Coletor ContaAzul Playwright V2 - Versão Robusta')
    parser.add_argument('--credenciais-arquivo', required=True, help='Arquivo JSON com credenciais')
    parser.add_argument('--periodo', default='30', help='Período em dias')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    parser.add_argument('--download-dir', default=None, help='Diretório de download')
    parser.add_argument('--screenshots-dir', default=None, help='Diretório para screenshots')
    
    args = parser.parse_args()
    
    # Parse credenciais
    with open(args.credenciais_arquivo, 'r', encoding='utf-8') as f:
        credenciais = json.load(f)
    
    email = credenciais.get('email')
    senha = credenciais.get('senha')
    
    if not email or not senha:
        raise ValueError("Email e senha são obrigatórios")
    
    # Configurar diretórios
    download_dir = Path(args.download_dir) if args.download_dir else Path.home() / "Downloads"
    screenshots_dir = Path(args.screenshots_dir) if args.screenshots_dir else download_dir / "screenshots"
    
    # Executar coleta
    collector = ContaAzulCollector(
        email=email, 
        senha=senha, 
        headless=args.headless,
        screenshots_dir=screenshots_dir
    )
    
    resultado = await collector.collect_data(download_dir)
    
    if not resultado.get("success"):
        sys.exit(1)

if __name__ == "__main__":
    try:
        resultado = asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Execução interrompida pelo usuário")
        sys.exit(1)
    except Exception as e:
        logger.error(f"💥 Erro fatal: {e}")
        sys.exit(1) 