#!/usr/bin/env python3
"""
🔄 SEPARAR INGRESSOS E PRODUTOS - YUZER
Analisar e separar claramente vendas de ingressos vs produtos do bar
"""
import json
import glob
import os
from datetime import datetime

def separar_ingressos_produtos_yuzer():
    """Separar vendas de ingressos vs produtos do bar"""
    print("🔄 SEPARAR INGRESSOS E PRODUTOS - YUZER")
    print("=" * 60)
    print("🎯 Objetivo: Classificar vendas entre ingressos e produtos do bar")
    print("")
    
    # Buscar arquivos do Yuzer
    arquivos_yuzer = []
    padroes = [
        "yuzer_completo_*.json",
        "dados_completos_apis_*.json"
    ]
    
    for padrao in padroes:
        arquivos = glob.glob(padrao)
        arquivos_yuzer.extend(arquivos)
    
    if not arquivos_yuzer:
        print("❌ Nenhum arquivo do Yuzer encontrado!")
        return
    
    # Usar arquivo mais recente
    arquivo = max(arquivos_yuzer, key=os.path.getctime)
    print(f"📁 Analisando arquivo: {arquivo}")
    
    try:
        with open(arquivo, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        # Extrair orders do Yuzer
        orders = []
        
        if 'yuzer' in dados and 'orders' in dados['yuzer']:
            orders = dados['yuzer']['orders']
        elif isinstance(dados, list):
            orders = dados
        else:
            print("⚠️ Estrutura não reconhecida")
            print(f"Chaves disponíveis: {list(dados.keys()) if isinstance(dados, dict) else 'Lista'}")
            return
        
        print(f"📊 Total de orders: {len(orders)}")
        
        if len(orders) == 0:
            print("❌ Nenhuma order encontrada!")
            return
        
        # Analisar estrutura de uma order
        primeira_order = orders[0]
        print(f"\n🔍 ESTRUTURA DE UMA ORDER:")
        print("=" * 50)
        print(f"📋 Campos da order: {list(primeira_order.keys())}")
        
        if 'operation' in primeira_order:
            operation = primeira_order['operation']
            print(f"📋 Operation: {operation}")
        
        if 'cart' in primeira_order:
            cart = primeira_order['cart']
            print(f"📋 Campos do cart: {list(cart.keys())}")
            
            if 'products' in cart and len(cart['products']) > 0:
                produto = cart['products'][0]
                print(f"📋 Campos do produto: {list(produto.keys())}")
                print(f"📋 Exemplo produto: {produto}")
        
        # Classificar produtos em ingressos vs produtos do bar
        print(f"\n🔍 CLASSIFICANDO PRODUTOS...")
        print("=" * 50)
        
        # Palavras-chave para identificar ingressos
        palavras_ingresso = [
            'ingresso', 'ticket', 'entrada', 'bilhete', 'convite',
            'acesso', 'passe', 'voucher', 'cupom'
        ]
        
        # Classificar por operação
        operacoes_ingresso = ['bilheteria', 'tickets', 'entrada']
        operacoes_bar = ['caixa', 'bar', 'bebidas', 'consumo']
        
        vendas_ingressos = []
        vendas_produtos = []
        produtos_unicos_ingressos = {}
        produtos_unicos_bar = {}
        
        for order in orders:
            operation = order.get('operation', {})
            operation_name = operation.get('name', '').lower() if operation else ''
            
            cart = order.get('cart', {})
            products = cart.get('products', [])
            order_total = cart.get('total', 0)
            
            # Classificar a order inteira por operação
            is_operacao_ingresso = any(op in operation_name for op in operacoes_ingresso)
            is_operacao_bar = any(op in operation_name for op in operacoes_bar)
            
            order_classificada = {
                'order_id': order.get('id'),
                'operation_name': operation.get('name', 'N/A'),
                'operation_id': operation.get('id', 'N/A'),
                'created_at': order.get('createdAt'),
                'payment_status': order.get('paymentStatus'),
                'total': order_total,
                'products': []
            }
            
            # Analisar cada produto da order
            for product in products:
                product_name = product.get('name', '').lower()
                product_quantity = product.get('quantity', 0)
                product_price = product.get('price', 0)
                product_total = product.get('total', 0)
                
                # Classificar produto individualmente
                is_produto_ingresso = any(palavra in product_name for palavra in palavras_ingresso)
                
                produto_classificado = {
                    'name': product.get('name', 'N/A'),
                    'quantity': product_quantity,
                    'price': product_price,
                    'total': product_total,
                    'brand': product.get('brand', {}).get('name', '') if product.get('brand') else '',
                    'type': product.get('type', ''),
                    'is_ingresso': is_produto_ingresso or is_operacao_ingresso
                }
                
                order_classificada['products'].append(produto_classificado)
                
                # Contabilizar produtos únicos
                nome_produto = product.get('name', 'N/A')
                
                if produto_classificado['is_ingresso']:
                    if nome_produto in produtos_unicos_ingressos:
                        produtos_unicos_ingressos[nome_produto]['quantidade'] += product_quantity
                        produtos_unicos_ingressos[nome_produto]['valor'] += product_total
                        produtos_unicos_ingressos[nome_produto]['orders'] += 1
                    else:
                        produtos_unicos_ingressos[nome_produto] = {
                            'quantidade': product_quantity,
                            'valor': product_total,
                            'orders': 1,
                            'preco_medio': product_price
                        }
                else:
                    if nome_produto in produtos_unicos_bar:
                        produtos_unicos_bar[nome_produto]['quantidade'] += product_quantity
                        produtos_unicos_bar[nome_produto]['valor'] += product_total
                        produtos_unicos_bar[nome_produto]['orders'] += 1
                    else:
                        produtos_unicos_bar[nome_produto] = {
                            'quantidade': product_quantity,
                            'valor': product_total,
                            'orders': 1,
                            'preco_medio': product_price
                        }
            
            # Classificar order como ingresso ou produto baseado na maioria dos produtos
            ingressos_na_order = sum(1 for p in order_classificada['products'] if p['is_ingresso'])
            produtos_na_order = len(order_classificada['products']) - ingressos_na_order
            
            if ingressos_na_order > produtos_na_order:
                vendas_ingressos.append(order_classificada)
            else:
                vendas_produtos.append(order_classificada)
        
        # Relatório de classificação
        print(f"🎯 RESULTADO DA CLASSIFICAÇÃO:")
        print("=" * 50)
        
        total_valor_ingressos = sum(order['total'] for order in vendas_ingressos)
        total_valor_produtos = sum(order['total'] for order in vendas_produtos)
        
        print(f"🎫 VENDAS DE INGRESSOS:")
        print(f"   📦 {len(vendas_ingressos)} orders")
        print(f"   💰 R$ {total_valor_ingressos:.2f}")
        print(f"   🎟️ {len(produtos_unicos_ingressos)} tipos únicos")
        
        print(f"\n🍺 VENDAS DE PRODUTOS (BAR):")
        print(f"   📦 {len(vendas_produtos)} orders")
        print(f"   💰 R$ {total_valor_produtos:.2f}")
        print(f"   🍻 {len(produtos_unicos_bar)} tipos únicos")
        
        # Top produtos de cada categoria
        print(f"\n🎫 TOP 10 INGRESSOS MAIS VENDIDOS:")
        print("=" * 50)
        
        top_ingressos = sorted(produtos_unicos_ingressos.items(), 
                              key=lambda x: x[1]['quantidade'], reverse=True)[:10]
        
        for i, (nome, dados) in enumerate(top_ingressos, 1):
            print(f"   {i:2d}. {nome}")
            print(f"       📊 {dados['quantidade']} unidades")
            print(f"       💰 R$ {dados['valor']:.2f}")
            print(f"       🛒 {dados['orders']} orders")
            print(f"       💵 R$ {dados['preco_medio']:.2f}/un")
        
        print(f"\n🍺 TOP 10 PRODUTOS DO BAR MAIS VENDIDOS:")
        print("=" * 50)
        
        top_produtos = sorted(produtos_unicos_bar.items(), 
                             key=lambda x: x[1]['quantidade'], reverse=True)[:10]
        
        for i, (nome, dados) in enumerate(top_produtos, 1):
            print(f"   {i:2d}. {nome}")
            print(f"       📊 {dados['quantidade']} unidades")
            print(f"       💰 R$ {dados['valor']:.2f}")
            print(f"       🛒 {dados['orders']} orders")
            print(f"       💵 R$ {dados['preco_medio']:.2f}/un")
        
        # Análise por operação
        print(f"\n🏢 ANÁLISE POR OPERAÇÃO:")
        print("=" * 50)
        
        operacoes = {}
        for order in orders:
            operation = order.get('operation', {})
            op_name = operation.get('name', 'N/A')
            op_id = operation.get('id', 'N/A')
            
            if op_name not in operacoes:
                operacoes[op_name] = {
                    'id': op_id,
                    'orders': 0,
                    'valor_total': 0,
                    'produtos_vendidos': 0
                }
            
            operacoes[op_name]['orders'] += 1
            operacoes[op_name]['valor_total'] += order.get('cart', {}).get('total', 0)
            operacoes[op_name]['produtos_vendidos'] += len(order.get('cart', {}).get('products', []))
        
        for op_name, dados in sorted(operacoes.items(), key=lambda x: x[1]['valor_total'], reverse=True):
            print(f"   🏢 {op_name} (ID: {dados['id']})")
            print(f"      📦 {dados['orders']} orders")
            print(f"      💰 R$ {dados['valor_total']:.2f}")
            print(f"      📊 {dados['produtos_vendidos']} produtos vendidos")
        
        # Salvar dados separados
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        dados_separados = {
            "timestamp": timestamp,
            "total_orders": len(orders),
            "resumo": {
                "ingressos": {
                    "orders": len(vendas_ingressos),
                    "valor_total": total_valor_ingressos,
                    "tipos_unicos": len(produtos_unicos_ingressos)
                },
                "produtos_bar": {
                    "orders": len(vendas_produtos),
                    "valor_total": total_valor_produtos,
                    "tipos_unicos": len(produtos_unicos_bar)
                }
            },
            "vendas_ingressos": vendas_ingressos,
            "vendas_produtos_bar": vendas_produtos,
            "produtos_unicos_ingressos": produtos_unicos_ingressos,
            "produtos_unicos_bar": produtos_unicos_bar,
            "operacoes": operacoes
        }
        
        filename = f"yuzer_separado_ingressos_produtos_{timestamp}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dados_separados, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 DADOS SEPARADOS SALVOS EM: {filename}")
        
        # Arquivo específico só de ingressos
        filename_ingressos = f"yuzer_apenas_ingressos_{timestamp}.json"
        with open(filename_ingressos, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": timestamp,
                "total_orders_ingressos": len(vendas_ingressos),
                "valor_total_ingressos": total_valor_ingressos,
                "vendas_ingressos": vendas_ingressos,
                "produtos_unicos_ingressos": produtos_unicos_ingressos
            }, f, indent=2, ensure_ascii=False)
        
        # Arquivo específico só de produtos do bar
        filename_bar = f"yuzer_apenas_produtos_bar_{timestamp}.json"
        with open(filename_bar, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": timestamp,
                "total_orders_bar": len(vendas_produtos),
                "valor_total_bar": total_valor_produtos,
                "vendas_produtos_bar": vendas_produtos,
                "produtos_unicos_bar": produtos_unicos_bar
            }, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Apenas ingressos: {filename_ingressos}")
        print(f"💾 Apenas produtos bar: {filename_bar}")
        
        return dados_separados
        
    except Exception as e:
        print(f"💥 Erro: {e}")
        return None

if __name__ == "__main__":
    dados = separar_ingressos_produtos_yuzer()
    
    if dados:
        print(f"\n🎉 SEPARAÇÃO CONCLUÍDA!")
        print(f"🎫 {dados['resumo']['ingressos']['orders']} orders de ingressos")
        print(f"🍺 {dados['resumo']['produtos_bar']['orders']} orders de produtos")
        print(f"✅ Dados prontos para SGB_V2!") 