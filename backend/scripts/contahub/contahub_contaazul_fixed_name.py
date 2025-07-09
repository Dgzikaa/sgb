#!/usr/bin/env python3
"""
ContaAzul Coletor V4 - Nome Fixo + Limpeza Automática
Sempre usa 'visao_competencia.xlsx' e deleta após processar
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
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path
import traceback

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações globais
SCREENSHOT_ON_ERROR = True
SECRET_2FA = os.getenv('SECRET_2FA', 'PKB7MTXCP5M3Y54C6KGTZFMXONAGOLQDUKGDN3LF5U4XAXNULP4A')
ARQUIVO_FIXO = "visao_competencia.xlsx"  # Nome sempre o mesmo

def datetime_to_string(obj):
    """Converte objetos datetime para string para serialização JSON"""
    if isinstance(obj, dict):
        return {k: datetime_to_string(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [datetime_to_string(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj

class ContaAzulCollectorV4:
    def __init__(self, email, senha, headless=True, download_dir=None):
        self.email = email
        self.senha = senha
        self.headless = headless
        self.download_dir = Path(download_dir) if download_dir else Path.home() / "Downloads"
        self.download_dir.mkdir(exist_ok=True, parents=True)
        
        # Arquivo sempre com nome fixo
        self.arquivo_excel = self.download_dir / ARQUIVO_FIXO
        
        self.browser = None
        self.context = None
        self.page = None
        
        # Estatísticas
        self.stats = {
            'tentativas': 0,
            'erros_capturados': [],
            'tempo_inicio': None,
            'tempo_fim': None,
            'arquivo_deletado': False,
            'novo_download': False
        }
    
    async def save_screenshot(self, nome, prefixo="erro"):
        """Salva screenshot para debug"""
        if not SCREENSHOT_ON_ERROR or not self.page:
            return None
            
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefixo}_{nome}_{timestamp}.png"
            filepath = self.download_dir / "screenshots" / filename
            filepath.parent.mkdir(exist_ok=True, parents=True)
            
            await self.page.screenshot(path=str(filepath), full_page=True)
            logger.info(f"📸 Screenshot salvo: {filepath}")
            return str(filepath)
        except Exception as e:
            logger.warning(f"⚠️ Erro ao salvar screenshot: {e}")
            return None

    async def preparar_ambiente(self):
        """Remove arquivo antigo se existir para forçar download novo"""
        try:
            if self.arquivo_excel.exists():
                logger.info(f"🗑️ Removendo arquivo antigo: {self.arquivo_excel}")
                self.arquivo_excel.unlink()
                self.stats['arquivo_deletado'] = True
                logger.info("✅ Arquivo antigo removido - download será novo")
            else:
                logger.info("ℹ️ Nenhum arquivo antigo encontrado")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao remover arquivo antigo: {e}")

    async def initialize_browser(self):
        """Inicializar navegador Playwright"""
        try:
            logger.info("🚀 Inicializando navegador...")
            playwright = await async_playwright().start()
            
            self.browser = await playwright.chromium.launch(
                headless=self.headless,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            self.context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            self.page = await self.context.new_page()
            logger.info("✅ Navegador inicializado")
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar navegador: {e}")
            raise

    async def click_with_retry(self, element, desc, max_retries=3):
        """Clica em elemento com retry automático"""
        for tentativa in range(max_retries):
            try:
                await element.click()
                logger.info(f"✅ Clique realizado: {desc}")
                return True
            except Exception as e:
                logger.warning(f"⚠️ Tentativa {tentativa + 1} falhou para {desc}: {e}")
                if tentativa < max_retries - 1:
                    await asyncio.sleep(2)
                else:
                    raise
        return False

    async def login_with_2fa(self):
        """Login com 2FA automático"""
        try:
            logger.info("🔐 Iniciando login...")
            await self.page.goto('https://app.contaazul.com/#/')
            await self.page.wait_for_load_state('networkidle')
            
            # Email - múltiplos seletores possíveis
            email_selectors = [
                '#email',
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="email"]',
                'input[placeholder*="E-mail"]',
                'input[id*="email"]',
                '[data-testid="email"]'
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    email_input = await self.page.wait_for_selector(selector, timeout=3000)
                    if email_input:
                        logger.info(f"✅ Campo email encontrado: {selector}")
                        break
                except:
                    continue
            
            if not email_input:
                raise Exception("Campo de email não encontrado")
            
            await email_input.fill(self.email)
            
            # Senha - múltiplos seletores possíveis
            senha_selectors = [
                '#password',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="senha"]',
                'input[placeholder*="Senha"]',
                'input[id*="password"]',
                '[data-testid="password"]'
            ]
            
            senha_input = None
            for selector in senha_selectors:
                try:
                    senha_input = await self.page.wait_for_selector(selector, timeout=3000)
                    if senha_input:
                        logger.info(f"✅ Campo senha encontrado: {selector}")
                        break
                except:
                    continue
            
            if not senha_input:
                raise Exception("Campo de senha não encontrado")
            
            await senha_input.fill(self.senha)
            
            # Login - múltiplos seletores possíveis
            login_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Entrar")',
                'button:has-text("Login")',
                'button:has-text("Acessar")',
                '[data-testid="login"]',
                '.login-button'
            ]
            
            login_button = None
            for selector in login_selectors:
                try:
                    login_button = await self.page.wait_for_selector(selector, timeout=3000)
                    if login_button:
                        logger.info(f"✅ Botão login encontrado: {selector}")
                        break
                except:
                    continue
            
            if not login_button:
                raise Exception("Botão de login não encontrado")
            
            await self.click_with_retry(login_button, "botão de login")
            
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)
            
            # Verificar se precisa 2FA
            if '2fa' in self.page.url or 'two-factor' in self.page.url:
                logger.info("🔑 2FA detectado, gerando código...")
                
                totp = pyotp.TOTP(SECRET_2FA)
                codigo_2fa = totp.now()
                logger.info(f"🔢 Código 2FA gerado: {codigo_2fa}")
                
                code_input = await self.page.wait_for_selector('input[name="code"], input[id="code"], input[type="text"]', timeout=10000)
                await code_input.fill(codigo_2fa)
                
                submit_button = await self.page.wait_for_selector('button[type="submit"]', timeout=10000)
                await self.click_with_retry(submit_button, "botão de confirmação 2FA")
                
                await self.page.wait_for_load_state('networkidle')
            
            await asyncio.sleep(5)  # Aguardar mais tempo para estabilizar
            
            # Verificar se não foi redirecionado para login expirado
            current_url = self.page.url
            if 'login.contaazul.com' in current_url or 'expired-token' in current_url:
                logger.warning("🔄 Token expirado detectado, tentando novamente...")
                await asyncio.sleep(3)
                
                # Tentar acessar dashboard diretamente
                await self.page.goto('https://app.contaazul.com/dashboard')
                await self.page.wait_for_load_state('networkidle')
                await asyncio.sleep(3)
                
                # Verificar se ainda precisa fazer login
                if 'login' in self.page.url:
                    logger.info("🔐 Refazendo login...")
                    await self.page.goto('https://app.contaazul.com/#/')
                    await self.page.wait_for_load_state('networkidle')
                    # Processo de login novamente se necessário
                    await asyncio.sleep(2)
            
            logger.info("✅ Login realizado com sucesso")
            logger.info(f"📍 URL atual: {self.page.url}")
            await self.save_screenshot("login_sucesso", "sucesso")
            
        except Exception as e:
            logger.error(f"❌ Erro no login: {e}")
            await self.save_screenshot("login_error")
            raise

    async def navigate_to_financial(self):
        """Navegar para seção financeira usando múltiplas estratégias"""
        try:
            logger.info("📊 Navegando para seção financeira...")
            
            # ESTRATÉGIA 1: Tentar URLs diretas
            financial_urls = [
                'https://app.contaazul.com/#/ca/financeiro/competencia',  # URL CORRETA!
                'https://app.contaazul.com/app/#/ca/financeiro/competencia',  # Variação 
                'https://app.contaazul.com/#/financeiro/competencia',
                'https://app.contaazul.com/reports/financial',
                'https://app.contaazul.com/financeiro/relatorios',
                'https://app.contaazul.com/dashboard'
            ]
            
            for url in financial_urls:
                try:
                    logger.info(f"🔍 Tentando URL: {url}")
                    await self.page.goto(url)
                    await self.page.wait_for_load_state('networkidle')
                    await asyncio.sleep(8)  # Mais tempo para SPAs carregarem
                    
                    current_url = self.page.url
                    logger.info(f"📍 URL atual após tentativa: {current_url}")
                    
                    # Verificar se chegou na página certa
                    if ('financeiro' in current_url or 'financial' in current_url or 'reports' in current_url or 
                        'competencia' in current_url or '/ca/' in current_url):
                        logger.info(f"✅ Página financeira encontrada: {current_url}")
                        await self.save_screenshot("financeiro_encontrado", "sucesso")
                        return
                    elif 'login' not in current_url:
                        # Chegou em alguma página do app, tentar navegar daqui
                        logger.info(f"📄 Chegou na aplicação: {current_url}")
                        break
                        
                except Exception as e:
                    logger.warning(f"⚠️ URL {url} não funcionou: {e}")
                    continue
            
            # ESTRATÉGIA 2: Navegar pelo menu/interface após estar logado
            logger.info("🧭 Tentando navegar através do menu da interface...")
            
            # Aguardar a interface carregar
            await asyncio.sleep(5)
            
            # Selectors possíveis para menu financeiro
            menu_selectors = [
                "a[href*='financeiro']",
                "a[href*='financial']", 
                "a[href*='competencia']",
                "a[href*='reports']",
                "button:has-text('Financeiro')",
                "span:has-text('Financeiro')",
                "div:has-text('Financeiro')",
                "li:has-text('Financeiro')",
                "[data-testid*='financeiro']",
                "[data-testid*='financial']"
            ]
            
            for selector in menu_selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=5000)
                    if element:
                        logger.info(f"🔗 Menu financeiro encontrado: {selector}")
                        await self.click_with_retry(element, f"menu financeiro ({selector})")
                        await self.page.wait_for_load_state('networkidle')
                        await asyncio.sleep(5)
                        
                        current_url = self.page.url
                        logger.info(f"📍 URL após clique no menu: {current_url}")
                        
                        if ('financeiro' in current_url or 'financial' in current_url or 'competencia' in current_url):
                            logger.info(f"✅ Página financeira encontrada via menu: {current_url}")
                            await self.save_screenshot("financeiro_menu_sucesso", "sucesso")
                            return
                        break
                except:
                    continue
            
            # ESTRATÉGIA 3: Buscar qualquer link que contenha 'competencia' ou palavras relacionadas
            logger.info("🔍 Procurando links específicos para relatórios...")
            
            try:
                # Buscar todos os links na página
                all_links = await self.page.query_selector_all("a")
                logger.info(f"🔗 Encontrados {len(all_links)} links na página")
                
                for link in all_links[:20]:  # Verificar os primeiros 20 links
                    try:
                        href = await link.get_attribute("href")
                        text = await link.inner_text()
                        
                        if href and ('competencia' in href.lower() or 'financeiro' in href.lower() or 
                                   'relatorio' in href.lower() or 'report' in href.lower()):
                            logger.info(f"🎯 Link relevante encontrado: {text} -> {href}")
                            await self.click_with_retry(link, f"link específico ({text})")
                            await self.page.wait_for_load_state('networkidle')
                            await asyncio.sleep(5)
                            
                            current_url = self.page.url
                            if ('financeiro' in current_url or 'competencia' in current_url):
                                logger.info(f"✅ Página encontrada via link específico: {current_url}")
                                await self.save_screenshot("financeiro_link_sucesso", "sucesso")
                                return
                    except:
                        continue
                        
            except Exception as e:
                logger.warning(f"⚠️ Erro ao buscar links: {e}")
            
            # Se chegou aqui, usar página atual e continuar
            current_url = self.page.url
            logger.info(f"ℹ️ Usando página atual para buscar exportação: {current_url}")
            await self.save_screenshot("pagina_atual_debug")
            
        except Exception as e:
            logger.error(f"❌ Erro ao navegar para financeiro: {e}")
            await self.save_screenshot("navegacao_financeiro_error")
            raise
            


    async def configure_period_filter(self):
        """Configurar filtro de período (todo o período disponível)"""
        try:
            logger.info("📅 Configurando filtro de período...")
            
            # Procurar por seletores de período
            period_selectors = [
                "select[name*='periodo']",
                "select[name*='period']",
                "select[id*='periodo']",
                "button:has-text('Período')",
                "button:has-text('Filtro')",
                ".date-picker",
                "[data-testid*='period']"
            ]
            
            found_period = False
            for selector in period_selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=3000)
                    if element:
                        logger.info(f"🎯 Filtro de período encontrado: {selector}")
                        await self.click_with_retry(element, f"filtro período ({selector})")
                        await asyncio.sleep(1)
                        
                        # Tentar selecionar "Todo período" ou similar
                        all_period_options = [
                            "option:has-text('Todo')",
                            "option:has-text('All')",
                            "li:has-text('Todo período')",
                            "button:has-text('Todo período')"
                        ]
                        
                        for option_selector in all_period_options:
                            try:
                                option = await self.page.wait_for_selector(option_selector, timeout=2000)
                                if option:
                                    await self.click_with_retry(option, f"opção todo período ({option_selector})")
                                    found_period = True
                                    break
                            except:
                                continue
                        
                        if found_period:
                            break
                            
                except:
                    continue
            
            if found_period:
                logger.info("✅ Período configurado para 'Todo período'")
            else:
                logger.info("ℹ️ Filtro de período não encontrado, usando configuração padrão")
            
            await self.save_screenshot("periodo_configurado", "config")
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao configurar período: {e}")
            await self.save_screenshot("periodo_config_error")

    async def download_excel(self):
        """Download do arquivo Excel com nome fixo"""
        try:
            logger.info("📥 Iniciando download do Excel...")
            
            # Procurar botão de exportar (mais seletores para ContaAzul)
            export_selectors = [
                "button:has-text('Exportar')",
                "button:has-text('Excel')",
                "button:has-text('Baixar')", 
                "button:has-text('Download')",
                "a:has-text('Exportar')",
                "a:has-text('Excel')",
                "a:has-text('Baixar')",
                "[title*='Exportar']",
                "[title*='Excel']",
                "[title*='Baixar']",
                "button[data-testid*='export']",
                "button[data-testid*='download']",
                ".export-button",
                ".download-button",
                "i.fa-download",
                "i.fa-file-excel",
                "[class*='export']",
                "[class*='download']",
                "[aria-label*='Export']",
                "[aria-label*='Download']"
            ]
            
            # Aguardar a página carregar completamente
            await asyncio.sleep(3)
            await self.page.wait_for_load_state('networkidle')
            
            export_button = None
            for selector in export_selectors:
                try:
                    export_button = await self.page.wait_for_selector(selector, timeout=8000)  # Timeout maior
                    if export_button:
                        logger.info(f"✅ Botão de exportar encontrado: {selector}")
                        break
                except:
                    continue
            
            if not export_button:
                # Debug: listar todos os botões e links disponíveis
                logger.info("🔍 DEBUG: Listando elementos disponíveis...")
                try:
                    buttons = await self.page.query_selector_all("button")
                    links = await self.page.query_selector_all("a")
                    inputs = await self.page.query_selector_all("input")
                    
                    logger.info(f"📋 Botões encontrados: {len(buttons)}")
                    for i, btn in enumerate(buttons[:15]):  # Primeiros 15
                        text = await btn.inner_text() if btn else ""
                        title = await btn.get_attribute("title") if btn else ""
                        onclick = await btn.get_attribute("onclick") if btn else ""
                        class_name = await btn.get_attribute("class") if btn else ""
                        logger.info(f"  {i+1}. Botão: '{text.strip()}' | title: '{title}' | class: '{class_name}' | onclick: '{onclick}'")
                    
                    logger.info(f"🔗 Links encontrados: {len(links)}")
                    for i, link in enumerate(links[:15]):  # Primeiros 15
                        text = await link.inner_text() if link else ""
                        href = await link.get_attribute("href") if link else ""
                        class_name = await link.get_attribute("class") if link else ""
                        logger.info(f"  {i+1}. Link: '{text.strip()}' | href: '{href}' | class: '{class_name}'")
                    
                    logger.info(f"📝 Inputs encontrados: {len(inputs)}")
                    for i, input_elem in enumerate(inputs[:10]):  # Primeiros 10
                        input_type = await input_elem.get_attribute("type") if input_elem else ""
                        value = await input_elem.get_attribute("value") if input_elem else ""
                        class_name = await input_elem.get_attribute("class") if input_elem else ""
                        if input_type in ['submit', 'button']:
                            logger.info(f"  {i+1}. Input[{input_type}]: value='{value}' | class: '{class_name}'")
                    
                    # Tentar buscar elementos com texto específico usando XPath
                    logger.info("🔍 Buscando elementos com texto de exportação...")
                    export_texts = ['Exportar', 'Export', 'Baixar', 'Download', 'Excel', 'CSV', 'Relatório', 'Salvar']
                    
                    for text in export_texts:
                        try:
                            xpath_selectors = [
                                f"//*[contains(text(), '{text}')]",
                                f"//button[contains(text(), '{text}')]",
                                f"//a[contains(text(), '{text}')]",
                                f"//input[@value='{text}']",
                                f"//*[@title='{text}']"
                            ]
                            
                            for xpath in xpath_selectors:
                                try:
                                    element = await self.page.wait_for_selector(f"xpath={xpath}", timeout=2000)
                                    if element:
                                        tag_name = await element.evaluate("element => element.tagName")
                                        element_text = await element.inner_text()
                                        logger.info(f"  🎯 Elemento encontrado com '{text}': {tag_name} - '{element_text}'")
                                        
                                        # Tentar usar este elemento
                                        logger.info(f"🧪 Tentando clicar no elemento com '{text}'...")
                                        await self.click_with_retry(element, f"elemento com texto '{text}'")
                                        
                                        # Verificar se algo aconteceu (download ou mudança de página)
                                        await asyncio.sleep(3)
                                        export_button = element  # Usar este como botão de exportar
                                        break
                                except:
                                    continue
                            
                            if export_button:
                                break
                        except:
                            continue
                        
                except Exception as e:
                    logger.warning(f"⚠️ Erro no debug: {e}")
                
                await self.save_screenshot("elementos_pagina_debug")
                
                if not export_button:
                    raise Exception("Botão de exportar não encontrado após busca exaustiva")
            
            # Configurar listener para download
            download_concluido = False
            
            async def handle_download(download):
                nonlocal download_concluido
                try:
                    # Salvar sempre com nome fixo
                    await download.save_as(self.arquivo_excel)
                    logger.info(f"💾 Arquivo salvo como: {self.arquivo_excel}")
                    download_concluido = True
                    self.stats['novo_download'] = True
                except Exception as e:
                    logger.error(f"❌ Erro ao salvar download: {e}")
            
            self.page.on("download", handle_download)
            
            # Clicar no botão
            await self.click_with_retry(export_button, "botão de exportar")
            
            # Aguardar download
            logger.info("⏳ Aguardando download...")
            timeout = 30  # 30 segundos
            for i in range(timeout):
                if download_concluido and self.arquivo_excel.exists():
                    break
                await asyncio.sleep(1)
                if i % 5 == 0:
                    logger.info(f"⏳ Aguardando... {i+1}/{timeout}s")
            
            if download_concluido and self.arquivo_excel.exists():
                file_size = self.arquivo_excel.stat().st_size
                logger.info(f"✅ Download concluído: {self.arquivo_excel} ({file_size} bytes)")
                await self.save_screenshot("download_sucesso", "sucesso")
                return True
            else:
                raise Exception("Download não foi concluído ou arquivo não encontrado")
                
        except Exception as e:
            logger.error(f"💥 Erro no download: {e}")
            await self.save_screenshot("download_error")
            raise

    def process_excel_to_json(self):
        """Processar arquivo Excel para JSON"""
        try:
            logger.info(f"📊 Processando arquivo Excel: {self.arquivo_excel}")
            
            if not self.arquivo_excel.exists():
                raise Exception(f"Arquivo não encontrado: {self.arquivo_excel}")
            
            # Ler Excel
            df = pd.read_excel(self.arquivo_excel)
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
            
            # Salvar JSON temporário
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            json_filename = f"contaazul_processado_{timestamp}.json"
            json_filepath = self.download_dir / json_filename
            
            with open(json_filepath, 'w', encoding='utf-8') as f:
                json.dump(dados_json, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 JSON salvo: {json_filepath}")
            
            return {
                "total_registros": len(dados_json),
                "colunas": list(df.columns),
                "arquivo_excel": str(self.arquivo_excel),
                "arquivo_json": str(json_filepath),
                "dados": dados_json
            }
            
        except Exception as e:
            logger.error(f"💥 Erro ao processar Excel: {e}")
            raise

    def cleanup_files(self):
        """Limpar arquivos após processamento"""
        try:
            logger.info("🧹 Limpando arquivos...")
            
            # Deletar arquivo Excel
            if self.arquivo_excel.exists():
                self.arquivo_excel.unlink()
                logger.info(f"✅ Arquivo Excel deletado: {self.arquivo_excel}")
                self.stats['arquivo_deletado'] = True
            
            # Manter apenas JSON mais recente (opcional)
            json_files = list(self.download_dir.glob("contaazul_processado_*.json"))
            if len(json_files) > 3:  # Manter apenas 3 mais recentes
                json_files.sort(key=lambda x: x.stat().st_mtime)
                for old_file in json_files[:-3]:
                    old_file.unlink()
                    logger.info(f"🗑️ JSON antigo removido: {old_file}")
            
        except Exception as e:
            logger.warning(f"⚠️ Erro na limpeza: {e}")

    async def cleanup_browser(self):
        """Limpeza de recursos do navegador"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            logger.info("🔚 Navegador fechado")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao fechar navegador: {e}")

    async def collect_data(self):
        """Método principal para coleta de dados"""
        self.stats['tempo_inicio'] = datetime.now()
        
        try:
            logger.info("🚀 Iniciando ContaAzul Coletor V4 (Nome Fixo + Limpeza)")
            
            # 1. Preparar ambiente (remover arquivo antigo)
            await self.preparar_ambiente()
            
            # 2. Processo de coleta
            await self.initialize_browser()
            await self.login_with_2fa()
            await self.navigate_to_financial()
            await self.configure_period_filter()
            
            # 3. Download e processamento
            download_ok = await self.download_excel()
            if not download_ok:
                raise Exception("Falha no download")
            
            dados_processados = self.process_excel_to_json()
            
            # 4. Limpeza
            self.cleanup_files()
            
            self.stats['tempo_fim'] = datetime.now()
            duracao = self.stats['tempo_fim'] - self.stats['tempo_inicio']
            
            # Resultado final
            resultado = {
                "success": True,
                "dados": dados_processados,
                "estatisticas": {
                    "duracao_total": str(duracao),
                    "novo_download": self.stats['novo_download'],
                    "arquivo_deletado": self.stats['arquivo_deletado'],
                    "timestamp": self.stats['tempo_fim'].isoformat()
                },
                "metadados": {
                    "versao": "ContaAzul V4 - Nome Fixo + Limpeza",
                    "arquivo_usado": ARQUIVO_FIXO,
                    "estrategia": "nome_fixo_com_limpeza_automatica"
                }
            }
            
            logger.info(f"⏱️ Coleta concluída em: {duracao}")
            logger.info(f"📊 Total de registros: {dados_processados['total_registros']}")
            
            # Output seguro para JSON
            resultado_safe = datetime_to_string(resultado)
            print(json.dumps(resultado_safe, ensure_ascii=False))
            return resultado_safe
            
        except Exception as e:
            self.stats['tempo_fim'] = datetime.now()
            self.stats['erros_capturados'].append({
                'timestamp': datetime.now().isoformat(),
                'erro': str(e),
                'traceback': traceback.format_exc()
            })
            
            logger.error(f"💥 Erro na coleta: {e}")
            await self.save_screenshot("error_final")
            
            erro_resultado = {
                "success": False,
                "error": str(e),
                "estatisticas": datetime_to_string(self.stats)
            }
            
            print(json.dumps(erro_resultado, ensure_ascii=False))
            return erro_resultado
            
        finally:
            await self.cleanup_browser()

async def main():
    parser = argparse.ArgumentParser(description='ContaAzul Coletor V4 - Nome Fixo + Limpeza')
    parser.add_argument('--credenciais-arquivo', required=True, help='Arquivo JSON com credenciais')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    parser.add_argument('--download-dir', default=None, help='Diretório de download')
    
    args = parser.parse_args()
    
    # Parse credenciais
    with open(args.credenciais_arquivo, 'r', encoding='utf-8') as f:
        credenciais = json.load(f)
    
    email = credenciais.get('email')
    senha = credenciais.get('senha')
    
    if not email or not senha:
        raise ValueError("Email e senha são obrigatórios")
    
    # Configurar diretório
    download_dir = Path(args.download_dir) if args.download_dir else Path.home() / "Downloads"
    
    # Executar coleta
    collector = ContaAzulCollectorV4(
        email=email, 
        senha=senha, 
        headless=args.headless,
        download_dir=download_dir
    )
    
    resultado = await collector.collect_data()
    
    if not resultado.get("success"):
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 