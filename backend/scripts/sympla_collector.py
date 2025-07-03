#!/usr/bin/env python3
"""
🧪 TESTE REAL DAS APIS SYMPLA E YUZER
Testando com data real: 29.06.2025
"""
import requests
import json
from datetime import datetime

# Configurações Sympla (token real usado no projeto)
SYMPLA_TOKEN = "3085e782ebcccbbc75b26f6a5057f170e4dfa4aeabe4c19974fc2639fbfc0a77"

# Configurações Yuzer (token real usado no projeto) 
YUZER_TOKEN = "d3237ab2-4a68-4624-8ae4-16bc68929499"

# Testar com data que sabemos ter movimento (ontem - 29/06)
DATA_TESTE = "29.06.2025"
DATA_YUZER = "2025-06-29"  # Formato Yuzer

def testar_sympla():
    """Testar API do Sympla"""
    print("🎪 TESTANDO SYMPLA API")
    print("=" * 50)
    
    headers = {
        "s_token": SYMPLA_TOKEN,
        "Content-Type": "application/json"
    }
    
    resultados = {}
    
    # 1. Testar eventos
    print("\n📋 1. TESTANDO: Eventos")
    try:
        url_eventos = "https://api.sympla.com.br/public/v1.5.1/events"
        response = requests.get(url_eventos, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            eventos = data.get('data', [])
            print(f"✅ {len(eventos)} eventos encontrados")
            
            if eventos:
                # Filtrar eventos ativos ou do período
                eventos_relevantes = []
                for evento in eventos:
                    if 'ordi' in evento.get('name', '').lower():
                        eventos_relevantes.append(evento)
                
                print(f"🎯 {len(eventos_relevantes)} eventos 'ordi' encontrados")
                
                if eventos_relevantes:
                    print("\n📋 ESTRUTURA DO EVENTO:")
                    primeiro_evento = eventos_relevantes[0]
                    for key, value in primeiro_evento.items():
                        tipo = type(value).__name__
                        valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                        print(f"  {key}: {valor_str} ({tipo})")
                    
                    # Salvar amostra
                    with open(f"sample_sympla_eventos_{DATA_TESTE.replace('.', '_')}.json", 'w', encoding='utf-8') as f:
                        json.dump({
                            "api": "sympla",
                            "endpoint": "eventos",
                            "data_teste": DATA_TESTE,
                            "total_eventos": len(eventos),
                            "eventos_ordi": len(eventos_relevantes),
                            "amostra": eventos_relevantes[:2]
                        }, f, indent=2, ensure_ascii=False)
                    
                    resultados['eventos'] = {
                        "success": True,
                        "total": len(eventos),
                        "relevantes": len(eventos_relevantes),
                        "campos": list(primeiro_evento.keys())
                    }
                    
                    # 2. Testar participantes de TODOS os eventos relevantes COM PAGINAÇÃO
                    print(f"\n📋 2. TESTANDO: Participantes de TODOS os eventos (COM PAGINAÇÃO)")
                    
                    todos_participantes = []
                    detalhes_eventos = {}
                    
                    for i, evento in enumerate(eventos_relevantes):
                        event_id = evento.get('id')
                        event_name = evento.get('name', 'N/A')[:50]
                        
                        if event_id:
                            print(f"\n🎯 Evento {i+1}/{len(eventos_relevantes)}: {event_name} (ID: {event_id})")
                            
                            # Implementar paginação completa
                            pagina = 1
                            participantes_evento = []
                            
                            while True:
                                url_participantes = f"https://api.sympla.com.br/public/v1.5.1/events/{event_id}/participants"
                                params = {"page": pagina, "per_page": 100}  # 100 é o máximo da API
                                
                                try:
                                    response_part = requests.get(url_participantes, headers=headers, params=params, timeout=30)
                                    print(f"  📄 Página {pagina} - Status: {response_part.status_code}")
                                    
                                    if response_part.status_code == 200:
                                        data_part = response_part.json()
                                        participantes_pagina = data_part.get('data', [])
                                        
                                        if participantes_pagina:
                                            participantes_evento.extend(participantes_pagina)
                                            print(f"  ✅ +{len(participantes_pagina)} participantes (total evento: {len(participantes_evento)})")
                                            pagina += 1
                                            
                                            # Verificar se há mais páginas
                                            pagination = data_part.get('pagination', {})
                                            if pagination.get('has_next', False) == False:
                                                print(f"  🏁 Última página atingida")
                                                break
                                        else:
                                            print(f"  🏁 Página vazia - fim da paginação")
                                            break
                                    else:
                                        print(f"  ❌ Erro HTTP: {response_part.status_code}")
                                        break
                                        
                                except Exception as e:
                                    print(f"  ❌ Erro ao buscar página {pagina}: {e}")
                                    break
                            
                            if participantes_evento:
                                todos_participantes.extend(participantes_evento)
                                detalhes_eventos[event_id] = {
                                    "nome": event_name,
                                    "participantes": len(participantes_evento)
                                }
                                print(f"  🎉 Total do evento: {len(participantes_evento)} participantes")
                    
                    print(f"\n🎊 TOTAL GERAL: {len(todos_participantes)} participantes de {len(eventos_relevantes)} eventos")
                    
                    if todos_participantes:
                        print("\n📋 ESTRUTURA DO PARTICIPANTE:")
                        primeiro_part = todos_participantes[0]
                        for key, value in primeiro_part.items():
                            tipo = type(value).__name__
                            valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                            print(f"  {key}: {valor_str} ({tipo})")
                        
                        # Análise de check-ins
                        total_checkins = sum(1 for p in todos_participantes if p.get('checkin', {}).get('check_in', False))
                        percentual_checkin = (total_checkins / len(todos_participantes)) * 100
                        
                        print(f"\n📊 ANÁLISE DE CHECK-INS:")
                        print(f"  👥 Total participantes: {len(todos_participantes)}")
                        print(f"  ✅ Total check-ins: {total_checkins}")
                        print(f"  📈 Percentual check-in: {percentual_checkin:.1f}%")
                        
                        print(f"\n📋 DETALHES POR EVENTO:")
                        for event_id, dados in detalhes_eventos.items():
                            print(f"  🎪 {dados['nome']}: {dados['participantes']} participantes")
                        
                        # Salvar amostra completa
                        with open(f"sample_sympla_participantes_{DATA_TESTE.replace('.', '_')}.json", 'w', encoding='utf-8') as f:
                            json.dump({
                                "api": "sympla",
                                "endpoint": "participantes",
                                "data_teste": DATA_TESTE,
                                "total_eventos": len(eventos_relevantes),
                                "total_participantes": len(todos_participantes),
                                "total_checkins": total_checkins,
                                "percentual_checkin": percentual_checkin,
                                "detalhes_eventos": detalhes_eventos,
                                "amostra": todos_participantes[:5]
                            }, f, indent=2, ensure_ascii=False)
                        
                        resultados['participantes'] = {
                            "success": True,
                            "total": len(todos_participantes),
                            "total_checkins": total_checkins,
                            "percentual_checkin": percentual_checkin,
                            "eventos": len(eventos_relevantes),
                            "campos": list(primeiro_part.keys())
                        }
                    else:
                        print("⚠️ Nenhum participante encontrado em nenhum evento")
                        resultados['participantes'] = {"success": True, "total": 0}
                else:
                    print("⚠️ Nenhum evento 'ordi' encontrado")
            else:
                print("⚠️ Nenhum evento encontrado")
                resultados['eventos'] = {"success": True, "total": 0}
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"Resposta: {response.text[:200]}")
            resultados['eventos'] = {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        resultados['eventos'] = {"success": False, "error": str(e)}
    
    return resultados

def testar_yuzer():
    """Testar API do Yuzer"""
    print("\n🍕 TESTANDO YUZER API")
    print("=" * 50)
    
    resultados = {}
    
    # 1. Testar dados analíticos - BEARER AUTH
    print("\n📋 1a. TESTANDO: Dados Analíticos (Bearer Auth)")
    headers_bearer = {
        "Authorization": f"Bearer {YUZER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        url_analitico = "https://api.eagle.yuzer.com.br/api/dashboards/salesPanels/statistics"
        
        # Primeiro testar data específica
        print(f"🔍 Testando data específica: {DATA_YUZER}")
        payload = {
            "dateStart": DATA_YUZER,
            "dateEnd": DATA_YUZER
        }
        response = requests.post(url_analitico, headers=headers_bearer, json=payload, timeout=30)
        
        # Se não encontrar dados, expandir para últimos 7 dias
        if response.status_code == 200:
            data = response.json()
            if data.get('total', 0) == 0 or len(data.get('data', [])) == 0:
                print(f"⚠️ Sem dados na data específica, expandindo para últimos 7 dias...")
                payload_expandido = {
                    "dateStart": "2025-06-23",
                    "dateEnd": "2025-06-30"
                }
                response = requests.post(url_analitico, headers=headers_bearer, json=payload_expandido, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Bearer Auth funcionou!")
            
            print("\n📋 ESTRUTURA DOS DADOS ANALÍTICOS:")
            for key, value in data.items():
                tipo = type(value).__name__
                valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                print(f"  {key}: {valor_str} ({tipo})")
            
            # Salvar amostra
            with open(f"sample_yuzer_analitico_{DATA_TESTE.replace('.', '_')}.json", 'w', encoding='utf-8') as f:
                json.dump({
                    "api": "yuzer",
                    "endpoint": "analitico",
                    "auth_method": "bearer",
                    "data_teste": DATA_TESTE,
                    "dados": data
                }, f, indent=2, ensure_ascii=False)
            
            resultados['analitico'] = {
                "success": True,
                "auth_method": "bearer",
                "campos": list(data.keys()),
                "amostra": data
            }
        else:
            print(f"❌ Bearer Auth falhou: {response.status_code}")
            print(f"Resposta: {response.text[:200]}")
            
            # 1b. Tentar com header customizado Yuzer
            print("\n📋 1b. TESTANDO: Dados Analíticos (Custom Yuzer Header)")
            headers_custom = {
                "Yuzer": YUZER_TOKEN,
                "Content-Type": "application/json"
            }
            
            try:
                # Primeiro testar data específica com custom header
                response_custom = requests.post(url_analitico, headers=headers_custom, json=payload, timeout=30)
                print(f"Status Custom: {response_custom.status_code}")
                
                if response_custom.status_code == 200:
                    data = response_custom.json()
                    
                    # Se não encontrar dados, expandir range também no custom header
                    if data.get('total', 0) == 0 or len(data.get('data', [])) == 0:
                        print(f"⚠️ Custom Header - Sem dados na data específica, expandindo para últimos 7 dias...")
                        payload_expandido = {
                            "dateStart": "2025-06-23",
                            "dateEnd": "2025-06-30"
                        }
                        response_custom = requests.post(url_analitico, headers=headers_custom, json=payload_expandido, timeout=30)
                        if response_custom.status_code == 200:
                            data = response_custom.json()
                    
                    print(f"✅ Custom Header funcionou!")
                    
                    print("\n📋 ESTRUTURA DOS DADOS ANALÍTICOS:")
                    for key, value in data.items():
                        tipo = type(value).__name__
                        valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                        print(f"  {key}: {valor_str} ({tipo})")
                    
                    # Buscar por IDs de operações nos dados
                    if 'data' in data and len(data['data']) > 0:
                        print(f"\n🔍 ANALISANDO DADOS PARA ENCONTRAR IDs DE OPERAÇÕES:")
                        operation_ids = []
                        for item in data['data']:
                            if isinstance(item, dict):
                                for key, value in item.items():
                                    if 'operation' in key.lower() or 'id' in key.lower():
                                        print(f"  📋 {key}: {value}")
                                        if 'operation' in key.lower() and isinstance(value, (int, str)):
                                            operation_ids.append(str(value))
                        
                        if operation_ids:
                            print(f"🎯 IDs de operações encontrados: {operation_ids}")
                            # Armazenar os IDs para usar nos orders
                            resultados['operation_ids'] = operation_ids
                        else:
                            print("⚠️ Nenhum ID de operação encontrado nos dados")
                    
                    # Salvar amostra
                    with open(f"sample_yuzer_analitico_{DATA_TESTE.replace('.', '_')}.json", 'w', encoding='utf-8') as f:
                        json.dump({
                            "api": "yuzer",
                            "endpoint": "analitico",
                            "auth_method": "custom_yuzer",
                            "data_teste": DATA_TESTE,
                            "dados": data
                        }, f, indent=2, ensure_ascii=False)
                    
                    resultados['analitico'] = {
                        "success": True,
                        "auth_method": "custom_yuzer",
                        "campos": list(data.keys()),
                        "amostra": data
                    }
                else:
                    print(f"❌ Custom Header também falhou: {response_custom.status_code}")
                    print(f"Resposta: {response_custom.text[:200]}")
                    resultados['analitico'] = {"success": False, "error": f"HTTP {response_custom.status_code}"}
            except Exception as e2:
                print(f"❌ Erro Custom Header: {e2}")
                resultados['analitico'] = {"success": False, "error": str(e2)}
    except Exception as e:
        print(f"❌ Erro na requisição Bearer: {e}")
        resultados['analitico'] = {"success": False, "error": str(e)}
    
    # 2. Testar orders (usando endpoint correto POST /api/orders/search)
    print("\n📋 2. TESTANDO: Orders/Vendas (POST /api/orders/search)")
    
    # Usar o header que funcionou acima, ou custom por padrão
    headers_orders = headers_bearer if resultados.get('analitico', {}).get('auth_method') == 'bearer' else {
        "Yuzer": YUZER_TOKEN,
        "Content-Type": "application/json",
        "Accept": "*/*"
    }
    
    try:
        url_orders = "https://api.eagle.yuzer.com.br/api/orders/search"
        # Primeiro teste: filtros mínimos para ver se há dados (data específica)
        print(f"\n🔍 TESTE 1: Filtros para data específica ({DATA_YUZER})")
        payload_orders_minimal = {
            "from": f"{DATA_YUZER}T00:00:00.000Z",
            "to": f"{DATA_YUZER}T23:59:59.999Z",
            "page": 1,
            "perPage": 10,
            "status": "ALL",
            "sort": "desc",
            "sortColumn": "createdAt"
        }
        
        response_minimal = requests.post(url_orders, headers=headers_orders, json=payload_orders_minimal, timeout=30)
        print(f"Status minimal: {response_minimal.status_code}")
        
        if response_minimal.status_code == 200:
            data_minimal = response_minimal.json()
            if isinstance(data_minimal, list):
                orders_minimal = data_minimal
            else:
                orders_minimal = data_minimal.get('data', []) or data_minimal.get('orders', [])
            
            print(f"✅ Teste minimal: {len(orders_minimal)} orders encontrados")
            
            if len(orders_minimal) > 0:
                print("🎯 DADOS ENCONTRADOS! Usando filtros completos...")
                
                # Verificar se temos IDs de operações dos analytics
                operation_ids = resultados.get('operation_ids', [])
                if operation_ids:
                    print(f"🎯 Usando IDs de operações dos analytics: {operation_ids}")
                
                # Usar a estrutura correta da API baseada no exemplo curl
                payload_orders = {
                    "from": f"{DATA_YUZER}T00:00:00.000Z",
                    "to": f"{DATA_YUZER}T23:59:59.999Z",
                    "addTaxInTotal": False,
                    "currency": "BRL",
                    "page": 1,
                    "perPage": 100,
                    "q": "",
                    "sort": "desc",
                    "sortColumn": "createdAt",
                    "operationIds": operation_ids,  # Usar IDs encontrados nos analytics
                    "companiesIds": [],
                    "status": "ALL",
                    "idsNotIn": [],
                    "channels": [],  # Remover filtro de canal
                    "expandCombo": False
                }
            else:
                print("❌ Nenhum dado encontrado na data específica")
                print(f"🔍 TESTE 2: Expandindo para últimos 7 dias")
                # Tentar com range maior (últimos 7 dias)
                payload_orders_range = {
                    "from": "2025-06-23T00:00:00.000Z",
                    "to": "2025-06-30T23:59:59.999Z",
                    "page": 1,
                    "perPage": 10,
                    "status": "ALL",
                    "sort": "desc",
                    "sortColumn": "createdAt"
                }
                
                response_range = requests.post(url_orders, headers=headers_orders, json=payload_orders_range, timeout=30)
                print(f"Status range: {response_range.status_code}")
                
                if response_range.status_code == 200:
                    data_range = response_range.json()
                    if isinstance(data_range, list):
                        orders_range = data_range
                    else:
                        orders_range = data_range.get('data', []) or data_range.get('orders', [])
                    
                    print(f"✅ Teste range: {len(orders_range)} orders encontrados")
                    
                    if len(orders_range) > 0:
                        print("🎯 DADOS ENCONTRADOS no range! Usando filtros completos...")
                        
                        # Verificar se temos IDs de operações dos analytics
                        operation_ids = resultados.get('operation_ids', [])
                        if operation_ids:
                            print(f"🎯 Usando IDs de operações dos analytics: {operation_ids}")
                        
                        payload_orders = {
                            "from": "2025-06-23T00:00:00.000Z",
                            "to": "2025-06-30T23:59:59.999Z",
                            "addTaxInTotal": False,
                            "currency": "BRL",
                            "page": 1,
                            "perPage": 100,
                            "q": "",
                            "sort": "desc",
                            "sortColumn": "createdAt",
                            "operationIds": operation_ids,  # Usar IDs encontrados nos analytics
                            "companiesIds": [],
                            "status": "ALL",
                            "idsNotIn": [],
                            "channels": [],
                            "expandCombo": False
                        }
                    else:
                        print("❌ Nenhum dado encontrado mesmo no range")
                        
                        # Última tentativa: usar apenas operation IDs se disponíveis
                        operation_ids = resultados.get('operation_ids', [])
                        if operation_ids:
                            print(f"🎯 ÚLTIMA TENTATIVA: Usando apenas operation IDs {operation_ids} com range estendido")
                            payload_orders = {
                                "from": "2025-06-01T00:00:00.000Z",  # Range ainda maior
                                "to": "2025-06-30T23:59:59.999Z",
                                "addTaxInTotal": False,
                                "currency": "BRL",
                                "page": 1,
                                "perPage": 100,
                                "q": "",
                                "sort": "desc",
                                "sortColumn": "createdAt",
                                "operationIds": operation_ids,
                                "companiesIds": [],
                                "status": "ALL",
                                "idsNotIn": [],
                                "channels": [],
                                "expandCombo": False
                            }
                        else:
                            payload_orders = payload_orders_minimal  # Usar minimal
                else:
                    print(f"❌ Erro no teste range: {response_range.text[:100]}")
                    payload_orders = payload_orders_minimal  # Usar minimal
        else:
            print(f"❌ Erro no teste minimal: {response_minimal.text[:200]}")
            # Fallback para filtros originais
            operation_ids = resultados.get('operation_ids', [])
            if operation_ids:
                print(f"🎯 Fallback - Usando IDs de operações dos analytics: {operation_ids}")
            
            payload_orders = {
                "from": f"{DATA_YUZER}T00:00:00.000Z",
                "to": f"{DATA_YUZER}T23:59:59.999Z",
                "page": 1,
                "perPage": 100,
                "status": "ALL",
                "sort": "desc",
                "sortColumn": "createdAt",
                "operationIds": operation_ids
            }
        
        print(f"URL: {url_orders}")
        print(f"Payload: {payload_orders}")
        print(f"Auth method: {'Bearer' if headers_orders.get('Authorization') else 'Custom Yuzer'}")
        
        # IMPLEMENTAR PAGINAÇÃO COMPLETA DO YUZER
        print(f"\n🔄 EXECUTANDO COM PAGINAÇÃO COMPLETA...")
        
        todas_orders = []
        pagina = 1
        
        while True:
            payload_orders["page"] = pagina
            
            response = requests.post(url_orders, headers=headers_orders, json=payload_orders, timeout=30)
            print(f"📄 Página {pagina} - Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    orders_pagina = data
                else:
                    orders_pagina = data.get('data', []) or data.get('orders', [])
                
                if orders_pagina:
                    todas_orders.extend(orders_pagina)
                    print(f"✅ +{len(orders_pagina)} orders (total: {len(todas_orders)})")
                    
                    # Verificar se há mais páginas (se retornou menos que o perPage, é a última)
                    if len(orders_pagina) < payload_orders.get("perPage", 100):
                        print(f"🏁 Última página atingida")
                        break
                    
                    pagina += 1
                    
                    # Limite de segurança para evitar loop infinito
                    if pagina > 20:  # Máximo 2000 registros
                        print(f"⚠️ Limite de páginas atingido (20)")
                        break
                else:
                    print(f"🏁 Página vazia - fim da paginação")
                    break
            else:
                print(f"❌ Erro HTTP na página {pagina}: {response.status_code}")
                print(f"Resposta: {response.text[:200]}")
                break
        
        orders = todas_orders
        print(f"\n🎊 TOTAL FINAL: {len(orders)} orders encontrados")
        
        if len(orders) > 0:
            print("\n📋 ESTRUTURA DO ORDER:")
            primeiro_order = orders[0]
            for key, value in primeiro_order.items():
                tipo = type(value).__name__
                valor_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                print(f"  {key}: {valor_str} ({tipo})")
            
            # Análise detalhada dos produtos vendidos
            print(f"\n🔍 ANÁLISE DETALHADA DOS {len(orders)} ORDERS:")
            print("=" * 60)
            
            produtos_vendidos = {}
            ingressos_vendidos = {}
            valor_total_geral = 0
            valor_produtos = 0
            valor_ingressos = 0
            
            for order in orders:
                # Analisar items do order
                items = order.get('items', [])
                total_order = order.get('total', 0)
                valor_total_geral += total_order
                
                for item in items:
                    nome_item = item.get('name', 'N/A')
                    quantidade = item.get('quantity', 0)
                    preco = item.get('price', 0)
                    total_item = quantidade * preco
                    
                    # Identificar se é ingresso
                    is_ingresso = any(palavra in nome_item.lower() for palavra in ['ingresso', 'entrada', 'ticket', '_ingresso_'])
                    
                    if is_ingresso:
                        if nome_item in ingressos_vendidos:
                            ingressos_vendidos[nome_item]['quantidade'] += quantidade
                            ingressos_vendidos[nome_item]['valor'] += total_item
                        else:
                            ingressos_vendidos[nome_item] = {'quantidade': quantidade, 'valor': total_item}
                        valor_ingressos += total_item
                    else:
                        if nome_item in produtos_vendidos:
                            produtos_vendidos[nome_item]['quantidade'] += quantidade
                            produtos_vendidos[nome_item]['valor'] += total_item
                        else:
                            produtos_vendidos[nome_item] = {'quantidade': quantidade, 'valor': total_item}
                        valor_produtos += total_item
            
            # Produto mais vendido
            if produtos_vendidos:
                produto_top = max(produtos_vendidos.items(), key=lambda x: x[1]['quantidade'])
                print(f"🥇 PRODUTO MAIS VENDIDO:")
                print(f"   📦 {produto_top[0]}")
                print(f"   📊 Quantidade: {produto_top[1]['quantidade']}")
                print(f"   💰 Valor total: R$ {produto_top[1]['valor']:.2f}")
            
            # Ingressos
            if ingressos_vendidos:
                print(f"\n🎫 INGRESSOS VENDIDOS:")
                for nome, dados in ingressos_vendidos.items():
                    print(f"   🎟️ {nome}: {dados['quantidade']} un. - R$ {dados['valor']:.2f}")
            
            # Resumo financeiro
            print(f"\n💰 RESUMO FINANCEIRO:")
            print(f"   🍺 Produtos: R$ {valor_produtos:.2f}")
            print(f"   🎫 Ingressos: R$ {valor_ingressos:.2f}")
            print(f"   📊 Total geral: R$ {valor_total_geral:.2f}")
            
            # Top 5 produtos por quantidade
            if produtos_vendidos:
                print(f"\n📋 TOP 5 PRODUTOS POR QUANTIDADE:")
                top_produtos = sorted(produtos_vendidos.items(), key=lambda x: x[1]['quantidade'], reverse=True)[:5]
                for i, (nome, dados) in enumerate(top_produtos, 1):
                    print(f"   {i}. {nome}: {dados['quantidade']} un. - R$ {dados['valor']:.2f}")
            
            # Salvar amostra
            with open(f"sample_yuzer_orders_{DATA_TESTE.replace('.', '_')}.json", 'w', encoding='utf-8') as f:
                json.dump({
                    "api": "yuzer",
                    "endpoint": "orders", 
                    "data_teste": DATA_TESTE,
                    "total_orders": len(orders),
                    "resumo_financeiro": {
                        "valor_produtos": valor_produtos,
                        "valor_ingressos": valor_ingressos,
                        "valor_total": valor_total_geral
                    },
                    "produtos_vendidos": produtos_vendidos,
                    "ingressos_vendidos": ingressos_vendidos,
                    "amostra": orders[:3]
                }, f, indent=2, ensure_ascii=False)
            
            resultados['orders'] = {
                "success": True,
                "total": len(orders),
                "valor_total": valor_total_geral,
                "valor_produtos": valor_produtos, 
                "valor_ingressos": valor_ingressos,
                "campos": list(primeiro_order.keys())
            }
        else:
            print("⚠️ Nenhum order encontrado")
            resultados['orders'] = {"success": True, "total": 0}
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        resultados['orders'] = {"success": False, "error": str(e)}
    
    return resultados

def main():
    """Função principal"""
    print("🎯 TESTE REAL DAS APIS SYMPLA E YUZER")
    print("=" * 70)
    print(f"📅 Data de teste: {DATA_TESTE}")
    print(f"🕐 Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    try:
        # Testar Sympla
        resultados_sympla = testar_sympla()
        
        # Testar Yuzer
        resultados_yuzer = testar_yuzer()
        
        # Resumo final
        print("\n" + "=" * 70)
        print("📊 RESUMO DOS TESTES APIS")
        print("=" * 70)
        
        print("\n🎪 SYMPLA:")
        for endpoint, result in resultados_sympla.items():
            if result.get("success"):
                total = result.get("total", 0)
                if total > 0:
                    print(f"  ✅ {endpoint}: {total} registros")
                else:
                    print(f"  ⚠️ {endpoint}: SEM DADOS")
            else:
                print(f"  ❌ {endpoint}: FALHOU - {result.get('error', 'N/A')}")
        
        print("\n🍕 YUZER:")
        for endpoint, result in resultados_yuzer.items():
            if result.get("success"):
                total = result.get("total", "N/A")
                print(f"  ✅ {endpoint}: {total if total != 'N/A' else 'DADOS'}")
            else:
                print(f"  ❌ {endpoint}: FALHOU - {result.get('error', 'N/A')}")
        
        print(f"\n📅 Data testada: {DATA_TESTE}")
        print(f"💾 Amostras salvas em arquivos JSON")
        
        return {
            "sympla": resultados_sympla,
            "yuzer": resultados_yuzer
        }
        
    except Exception as e:
        print(f"💥 ERRO GERAL: {e}")
        return {}

if __name__ == "__main__":
    main() 