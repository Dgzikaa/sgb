#!/usr/bin/env python3
"""
Coletor ContaAzul Playwright - Download Excel com 2FA Automático
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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações 2FA (usando variável de ambiente)
SECRET_2FA = os.getenv('SECRET_2FA', 'PKB7MTXCP5M3Y54C6KGTZFMXONAGOLQDUKGDN3LF5U4XAXNULP4A')

async def main():
    parser = argparse.ArgumentParser(description='Coletor ContaAzul Playwright - Download Excel')
    parser.add_argument('--credenciais-arquivo', required=True, help='Arquivo JSON com credenciais')
    parser.add_argument('--periodo', default='30', help='Período em dias')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    parser.add_argument('--download-dir', default=None, help='Diretório de download (padrão: Downloads do usuário)')
    
    args = parser.parse_args()
    
    # Parse credenciais
    with open(args.credenciais_arquivo, 'r', encoding='utf-8') as f:
        credenciais = json.load(f)
    
    email = credenciais.get('email')
    senha = credenciais.get('senha')
    
    if not email or not senha:
        raise ValueError("Email e senha são obrigatórios")
    
    # Configurar diretório de download
    if args.download_dir:
        download_dir = Path(args.download_dir)
    else:
        download_dir = Path.home() / "Downloads"
    
    download_dir.mkdir(exist_ok=True)
    logger.info(f"📁 Diretório de download: {download_dir}")
    
    async with async_playwright() as p:
        try:
            logger.info("🚀 Iniciando navegador...")
            browser = await p.chromium.launch(headless=args.headless)
            
            # Configurar contexto com downloads
            context = await browser.new_context(
                accept_downloads=True,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            page = await context.new_page()
            
            logger.info("🌐 Acessando ContaAzul...")
            await page.goto('https://login.contaazul.com/#/', wait_until='networkidle')
            
            # Aguardar carregamento
            await page.wait_for_timeout(5000)
            
            logger.info(f"📍 URL atual: {page.url}")
            logger.info(f"📄 Título: {await page.title()}")
            
            # ===== ETAPA 1: LOGIN =====
            logger.info("🔐 Iniciando processo de login...")
            
            # Aguardar inputs aparecerem
            try:
                await page.wait_for_selector('input[type="email"]', timeout=15000)
                logger.info("✅ Campo email encontrado!")
            except:
                logger.error("❌ Campo email não encontrado")
                return {"success": False, "error": "Campo email não encontrado"}
            
            # Preencher email
            logger.info("📧 Preenchendo email...")
            await page.fill('input[type="email"]', email)
            
            # Preencher senha
            logger.info("🔑 Preenchendo senha...")
            await page.fill('input[type="password"]', senha)
            
            # Aguardar um pouco
            await page.wait_for_timeout(2000)
            
            # Clicar no botão de login
            logger.info("🚀 Clicando no botão de login...")
            await page.click('button[type="submit"]')
            
            # Aguardar resposta
            await page.wait_for_timeout(10000)
            
            # Verificar se chegou na tela de 2FA
            current_url = page.url
            logger.info(f"📍 URL após login: {current_url}")
            
            if 'verificacao-duas-etapas' in current_url:
                logger.info("🔐 2FA detectado! Gerando código automático...")
                
                # ===== ETAPA 2: 2FA AUTOMÁTICO =====
                
                # Gerar código TOTP
                totp = pyotp.TOTP(SECRET_2FA)
                codigo_2fa = totp.now()
                logger.info(f"🔢 Código 2FA gerado: {codigo_2fa}")
                
                # Aguardar campo de 2FA aparecer
                try:
                    await page.wait_for_selector('input[type="text"][maxlength="6"]', timeout=10000)
                    logger.info("✅ Campo 2FA encontrado!")
                except:
                    logger.error("❌ Campo 2FA não encontrado")
                    return {"success": False, "error": "Campo 2FA não encontrado"}
                
                # Preencher código 2FA
                logger.info("🔢 Preenchendo código 2FA...")
                await page.fill('input[type="text"][maxlength="6"]', str(codigo_2fa))
                
                # Aguardar um pouco
                await page.wait_for_timeout(2000)
                
                # Clicar no botão de verificação
                logger.info("✅ Clicando no botão de verificação...")
                await page.click('button[type="submit"]')
                
                # Aguardar resposta
                await page.wait_for_timeout(10000)
                
                # Verificar sucesso
                current_url = page.url
                logger.info(f"📍 URL após 2FA: {current_url}")
            
            # ===== ETAPA 3: VERIFICAR SUCESSO DO LOGIN =====
            
            if ('dashboard' in current_url.lower() or 
                ('contaazul.com' in current_url and 'login' not in current_url and 'verificacao' not in current_url)):
                
                logger.info("🎉 Login + 2FA realizados com sucesso!")
                
                # ===== ETAPA 4: NAVEGAR PARA FINANCEIRO =====
                
                logger.info("💰 Navegando para página financeira...")
                
                # URL correta para competência
                financial_url = 'https://pro.contaazul.com/#/ca/financeiro/competencia'
                
                logger.info(f"🔍 Acessando: {financial_url}")
                await page.goto(financial_url, wait_until='networkidle', timeout=60000)
                await page.wait_for_timeout(5000)
                
                current_url = page.url
                page_title = await page.title()
                logger.info(f"📍 URL carregada: {current_url}")
                logger.info(f"📄 Título: {page_title}")
                
                # ===== ETAPA 5: CONFIGURAR FILTRO "TODO O PERÍODO" =====
                
                logger.info("📅 Configurando filtro 'Todo o período'...")
                
                try:
                    # Aguardar página carregar completamente
                    await page.wait_for_timeout(5000)
                    
                    # Buscar botão do período
                    period_selectors = [
                        "button:has-text('Julho de 2025')",  # Texto específico
                        "button:has-text('2025')",  # Parte do texto
                        ".dropdown-toggle",  # Classe comum
                        "button[aria-expanded]",  # Botão com aria-expanded
                        "//span/button",  # XPath genérico
                    ]
                    
                    period_button = None
                    for selector in period_selectors:
                        try:
                            if selector.startswith('//'):
                                period_button = await page.wait_for_selector(f"xpath={selector}", timeout=3000)
                            else:
                                period_button = await page.wait_for_selector(selector, timeout=3000)
                            
                            if period_button:
                                logger.info(f"✅ Botão de período encontrado: {selector}")
                                break
                        except:
                            continue
                    
                    if period_button:
                        # Clicar no botão de período
                        await period_button.click()
                        logger.info("📅 Clicou no seletor de período")
                        
                        await page.wait_for_timeout(2000)
                        
                        # Buscar opção "Todo o período"
                        todo_periodo_selectors = [
                            "text=Todo o período",
                            "//span[contains(text(), 'Todo o período')]",
                            "li:has-text('Todo o período')",
                            "div:has-text('Todo o período')",
                            ".dropdown-item:has-text('Todo o período')",
                        ]
                        
                        todo_found = False
                        for selector in todo_periodo_selectors:
                            try:
                                if selector.startswith('//'):
                                    todo_option = await page.wait_for_selector(f"xpath={selector}", timeout=3000)
                                else:
                                    todo_option = await page.wait_for_selector(selector, timeout=3000)
                                
                                if todo_option:
                                    await todo_option.click()
                                    logger.info(f"✅ Selecionou 'Todo o período' com: {selector}")
                                    todo_found = True
                                    break
                            except:
                                continue
                        
                        if not todo_found:
                            logger.warning("⚠️ Opção 'Todo o período' não encontrada, usando período padrão")
                        
                        # Aguardar dados carregarem
                        await page.wait_for_timeout(10000)
                        logger.info("⏳ Aguardando dados do período completo carregarem...")
                        
                    else:
                        logger.warning("⚠️ Botão de período não encontrado, usando período padrão")
                        
                except Exception as e:
                    logger.warning(f"⚠️ Erro ao configurar período: {e}")
                
                # ===== ETAPA 6: FAZER DOWNLOAD DO EXCEL =====
                
                logger.info("📥 Iniciando download do Excel...")
                
                # Buscar botão de exportar/download
                export_selectors = [
                    "button:has-text('Exportar')",
                    "button:has-text('Excel')",
                    "button:has-text('Download')",
                    "a:has-text('Exportar')",
                    "a:has-text('Excel')",
                    "[title*='Exportar']",
                    "[title*='Excel']",
                    "[title*='Download']",
                    ".export-button",
                    ".download-button",
                    "button[class*='export']",
                    "button[class*='download']",
                    "//button[contains(text(), 'Exportar')]",
                    "//a[contains(text(), 'Excel')]",
                    "//button[contains(@title, 'Exportar')]",
                ]
                
                export_button = None
                for selector in export_selectors:
                    try:
                        if selector.startswith('//'):
                            export_button = await page.wait_for_selector(f"xpath={selector}", timeout=3000)
                        else:
                            export_button = await page.wait_for_selector(selector, timeout=3000)
                        
                        if export_button:
                            logger.info(f"✅ Botão de exportar encontrado: {selector}")
                            break
                    except:
                        continue
                
                if export_button:
                    # Configurar listener para download
                    download_info = None
                    
                    async def handle_download(download):
                        nonlocal download_info
                        download_info = download
                        logger.info(f"📥 Download iniciado: {download.suggested_filename}")
                        
                        # Salvar arquivo com nome baseado no timestamp
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        # Detectar extensão do arquivo original
                        original_ext = download.suggested_filename.split('.')[-1] if '.' in download.suggested_filename else 'xlsx'
                        filename = f"contaazul_competencia_{timestamp}.{original_ext}"
                        filepath = download_dir / filename
                        
                        await download.save_as(filepath)
                        logger.info(f"💾 Arquivo salvo: {filepath}")
                        
                        return filepath
                    
                    page.on("download", handle_download)
                    
                    # Clicar no botão de exportar
                    logger.info("🖱️ Clicando no botão de exportar...")
                    await export_button.click()
                    
                    # Aguardar download
                    logger.info("⏳ Aguardando download...")
                    await page.wait_for_timeout(15000)  # 15 segundos para download
                    
                    if download_info:
                        # Aguardar um pouco para garantir que o arquivo foi salvo
                        await page.wait_for_timeout(2000)
                        
                        # Buscar o arquivo mais recente na pasta Downloads
                        import glob
                        pattern = str(download_dir / "contaazul_competencia_*.xls*")
                        files = glob.glob(pattern)
                        
                        if files:
                            # Pegar o arquivo mais recente
                            filepath = max(files, key=os.path.getctime)
                            logger.info(f"📁 Arquivo encontrado: {filepath}")
                        else:
                            logger.error("❌ Nenhum arquivo de download encontrado")
                            return {"success": False, "error": "Arquivo de download não encontrado"}
                        
                        try:
                            # Ler Excel
                            logger.info("📊 Processando arquivo Excel...")
                            df = pd.read_excel(filepath)
                            
                            logger.info(f"📋 Arquivo Excel lido: {len(df)} linhas, {len(df.columns)} colunas")
                            logger.info(f"📋 Colunas: {list(df.columns)}")
                            
                            # Converter para JSON estruturado
                            dados_json = []
                            for index, row in df.iterrows():
                                registro = {}
                                for col in df.columns:
                                    valor = row[col]
                                    # Converter valores NaN para None
                                    if pd.isna(valor):
                                        registro[col] = None
                                    else:
                                        registro[col] = str(valor)
                                
                                dados_json.append(registro)
                            
                            # Salvar JSON
                            json_filename = f"contaazul_competencia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                            json_filepath = download_dir / json_filename
                            
                            with open(json_filepath, 'w', encoding='utf-8') as f:
                                json.dump(dados_json, f, indent=2, ensure_ascii=False)
                            
                            logger.info(f"💾 JSON salvo: {json_filepath}")
                            
                            # Resultado final
                            resultado = {
                                "success": True,
                                "dados": {
                                    "total_registros": len(dados_json),
                                    "colunas": list(df.columns),
                                    "arquivo_excel": str(filepath),
                                    "arquivo_json": str(json_filepath),
                                    "primeiros_registros": dados_json[:5],  # Primeiros 5 para debug
                                    "metadados": {
                                        "timestamp": datetime.now().isoformat(),
                                        "metodo": "playwright_excel_download",
                                        "login_com_2fa": True,
                                        "url_financeira": current_url,
                                        "periodo": "todo_periodo"
                                    }
                                }
                            }
                            
                            # Salvar resultado
                            result_filename = f"resultado_contaazul_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                            result_filepath = download_dir / result_filename
                            
                            with open(result_filepath, 'w', encoding='utf-8') as f:
                                json.dump(resultado, f, indent=2, ensure_ascii=False)
                            
                            logger.info(f"✅ Resultado salvo: {result_filepath}")
                            print(json.dumps(resultado, ensure_ascii=False))
                            
                            return resultado
                            
                        except Exception as e:
                            logger.error(f"❌ Erro ao processar Excel: {e}")
                            return {"success": False, "error": f"Erro ao processar Excel: {e}"}
                    
                    else:
                        logger.error("❌ Download não foi detectado")
                        return {"success": False, "error": "Download não foi detectado"}
                
                else:
                    logger.error("❌ Botão de exportar não encontrado")
                    # Tentar buscar todos os botões para debug
                    try:
                        all_buttons = await page.query_selector_all("button, a")
                        logger.info(f"🔍 Encontrados {len(all_buttons)} botões/links na página")
                        
                        for i, button in enumerate(all_buttons[:20]):  # Primeiros 20
                            try:
                                text = await button.inner_text()
                                if text and len(text.strip()) > 0:
                                    logger.info(f"Botão {i}: '{text.strip()}'")
                            except:
                                continue
                    except:
                        pass
                    
                    return {"success": False, "error": "Botão de exportar não encontrado"}
                
            else:
                logger.error(f"❌ Login/2FA falhou. URL: {current_url}")
                return {"success": False, "error": "Login/2FA falhou"}
                
        except Exception as e:
            logger.error(f"💥 Erro: {e}")
            return {"success": False, "error": str(e)}
        
        finally:
            await context.close()
            await browser.close()
            logger.info("🔚 Navegador fechado")

if __name__ == "__main__":
    result = asyncio.run(main())
    if not result.get("success"):
        sys.exit(1) 