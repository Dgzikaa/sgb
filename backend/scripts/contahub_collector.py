#!/usr/bin/env python3
"""
🧪 TESTE REAL DAS QUERIES CONTAHUB
Testando todas as queries com data real: 27.06.2025
"""
import requests
import json
import hashlib
import time
from datetime import datetime

# Configurações
CONTAHUB_EMAIL = "digao@3768"
CONTAHUB_SENHA = "Geladeira@001"
EMP_ID = "3768"
DATA_TESTE = "27.06.2025"  # Data para teste
DATA_CONTAHUB = "2025-06-27"  # Formato ContaHub

def gerar_timestamp():
    """Gerar timestamp único para as queries ContaHub"""
    timestamp = str(int(time.time() * 1000))
    time.sleep(0.001)  # Garantir timestamps únicos
    return timestamp

def login_contahub():
    """Fazer login no ContaHub"""
    print("🔐 Fazendo login no ContaHub...")
    
    password_sha1 = hashlib.sha1(CONTAHUB_SENHA.encode()).hexdigest()
    timestamp = gerar_timestamp()
    
    login_data = {
        "usr_email": CONTAHUB_EMAIL,
        "usr_password_sha1": password_sha1
    }
    
    response = requests.post(
        f"https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/{timestamp}?emp=0",
        data=login_data,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        timeout=30
    )
    
    if response.status_code == 200:
        cookies = response.headers.get('set-cookie')
        if cookies:
            print("✅ Login realizado com sucesso!")
            return cookies
        else:
            raise Exception("Cookies não obtidos")
    else:
        raise Exception(f"Erro no login: {response.status_code}")

def testar_query(cookies, nome, url, description=""):
    """Testar uma query específica"""
    print(f"\n🧪 TESTANDO: {nome.upper()}")
    print("=" * 60)
    print(f"📝 Descrição: {description}")
    print(f"🔗 URL: {url}")
    
    try:
        response = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Cookie": cookies,
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            timeout=60
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                
                if data and 'list' in data and isinstance(data['list'], list):
                    registros = data['list']
                    print(f"✅ SUCESSO! {len(registros)} registros encontrados")
                    
                    if len(registros) > 0:
                        print(f"\n📋 ESTRUTURA DO PRIMEIRO REGISTRO:")
                        print("-" * 40)
                        primeiro = registros[0]
                        for key, value in primeiro.items():
                            tipo = type(value).__name__
                            valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                            print(f"  {key}: {valor_str} ({tipo})")
                        
                        # Salvar amostra dos dados
                        amostra = registros[:3] if len(registros) >= 3 else registros
                        filename = f"sample_{nome}_{DATA_TESTE.replace('.', '_')}.json"
                        with open(filename, 'w', encoding='utf-8') as f:
                            json.dump({
                                "query_name": nome,
                                "url": url,
                                "data_teste": DATA_TESTE,
                                "total_registros": len(registros),
                                "amostra": amostra
                            }, f, indent=2, ensure_ascii=False)
                        print(f"💾 Amostra salva em: {filename}")
                        
                        return {
                            "success": True,
                            "total": len(registros),
                            "campos": list(primeiro.keys()),
                            "amostra": primeiro
                        }
                    else:
                        print("⚠️ Nenhum registro encontrado para esta data")
                        return {"success": True, "total": 0}
                else:
                    print("❌ Resposta sem dados ou formato inválido")
                    return {"success": False, "error": "Formato inválido"}
                    
            except json.JSONDecodeError as e:
                print(f"❌ Erro ao fazer parse do JSON: {e}")
                print(f"📄 Resposta: {response.text[:200]}")
                return {"success": False, "error": "JSON inválido"}
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"📄 Resposta: {response.text[:200]}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"💥 Erro na requisição: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Função principal"""
    print("🎯 TESTE REAL DAS QUERIES CONTAHUB")
    print("=" * 70)
    print(f"📅 Data de teste: {DATA_TESTE}")
    print(f"🏢 Empresa: {EMP_ID}")
    print(f"🕐 Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    try:
        # Login
        cookies = login_contahub()
        
        # Definir queries para testar - COM TIMESTAMPS DINÂMICOS
        queries = [
            {
                "nome": "pagamentos",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=7&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}&nfe=1&meio=",
                "description": "Pagamentos detalhados por transação"
            },
            {
                "nome": "periodo",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=5&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}&nfe=1",
                "description": "Vendas por período com dados de clientes"
            },
            {
                "nome": "analitico",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=81&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}&prod=&grupo=&local=",
                "description": "Análise detalhada de produtos vendidos"
            },
            {
                "nome": "tempo",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=81&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&prod=&grupo=&local=&emp={EMP_ID}&nfe=1",
                "description": "Tempos de produção por item (timestamp dinâmico)"
            },
            {
                "nome": "nfs",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=21&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}",
                "description": "Notas fiscais emitidas (timestamp dinâmico)"
            },
            {
                "nome": "fatporhora",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=92&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}",
                "description": "Faturamento agrupado por hora (timestamp dinâmico)"
            },
            
            # ===== NOVAS QUERIES DESCOBERTAS - COM TIMESTAMPS DINÂMICOS =====
            {
                "nome": "clientes_faturamento",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=93&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&nome=&limit=1000&emp={EMP_ID}&nfe=1",
                "description": "Clientes com melhor faturamento"
            },
            {
                "nome": "clientes_presenca",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=94&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&nome=&limit=1000&emp={EMP_ID}&nfe=1",
                "description": "Clientes por presença"
            },
            {
                "nome": "clientes_cpf",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=59&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}&nfe=1",
                "description": "Dados por CPF"
            },
            {
                "nome": "compras_vendas",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=26&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&emp={EMP_ID}&nfe=1",
                "description": "Compras x Vendas (controle de estoque)"
            },
            {
                "nome": "xml_notas",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=20&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&prod=&grupo=&forn=&emp={EMP_ID}&nfe=1",
                "description": "XML das notas fiscais"
            },
            {
                "nome": "query_70",
                "url": f"https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/{gerar_timestamp()}?qry=70&d0={DATA_CONTAHUB}&d1={DATA_CONTAHUB}&prod=&grupo=&emp={EMP_ID}&nfe=1",
                "description": "Query 70 - Análise adicional de produtos/grupos"
            }
        ]
        
        # Executar testes
        results = {}
        success_count = 0
        
        for query in queries:
            result = testar_query(cookies, query["nome"], query["url"], query["description"])
            results[query["nome"]] = result
            if result.get("success"):
                success_count += 1
        
        # Resumo final
        print("\n" + "=" * 70)
        print("📊 RESUMO DOS TESTES CONTAHUB")
        print("=" * 70)
        
        for nome, result in results.items():
            if result.get("success"):
                total = result.get("total", 0)
                if total > 0:
                    print(f"✅ {nome}: {total} registros")
                else:
                    print(f"⚠️ {nome}: SEM DADOS para {DATA_TESTE}")
            else:
                print(f"❌ {nome}: FALHOU - {result.get('error', 'N/A')}")
        
        print(f"\n📈 ESTATÍSTICAS:")
        print(f"  • ✅ Funcionando: {success_count}/{len(queries)}")
        print(f"  • 📅 Data testada: {DATA_TESTE}")
        print(f"  • 💾 Amostras salvas em arquivos JSON")
        
        # Criar resumo consolidado
        print(f"\n📋 CAMPOS IDENTIFICADOS POR QUERY:")
        for nome, result in results.items():
            if result.get("success") and result.get("campos"):
                print(f"\n🔍 {nome.upper()}:")
                print(f"   Campos: {len(result['campos'])}")
                print(f"   Lista: {', '.join(result['campos'][:10])}{'...' if len(result['campos']) > 10 else ''}")
        
        return results
        
    except Exception as e:
        print(f"💥 ERRO GERAL: {e}")
        return {}

if __name__ == "__main__":
    main() 