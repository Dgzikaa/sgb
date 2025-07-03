#!/usr/bin/env python3
"""
📊 MAPEAMENTO COMPLETO DE CAMPOS - SGB V2
Análise de todos os campos das APIs e mapeamento para tabelas do SGB V2
"""
import json
import glob
from datetime import datetime

def analisar_campos_apis():
    """Analisar todos os campos disponíveis das APIs"""
    print("📊 MAPEAMENTO COMPLETO DE CAMPOS - SGB V2")
    print("=" * 80)
    print("🎯 Análise de TODOS os campos das APIs para criar tabelas SGB V2")
    print("")
    
    # Estrutura para armazenar campos
    campos_apis = {
        "contahub": {},
        "sympla": {},
        "yuzer": {}
    }
    
    # ================================
    # 1. ANÁLISE CONTAHUB
    # ================================
    print("🏦 ANALISANDO CAMPOS CONTAHUB...")
    print("-" * 50)
    
    # Buscar arquivo mais recente do ContaHub
    arquivos_contahub = glob.glob("contahub_completo_*.json")
    if arquivos_contahub:
        arquivo = max(arquivos_contahub, key=lambda x: x.split('_')[-1])
        print(f"📁 Arquivo ContaHub: {arquivo}")
        
        with open(arquivo, 'r', encoding='utf-8') as f:
            dados_contahub = json.load(f)
        
        # Analisar cada query
        for query_name, dados in dados_contahub.items():
            if isinstance(dados, dict) and 'data' in dados and dados['data']:
                campos_apis["contahub"][query_name] = list(dados['data'][0].keys())
                print(f"   ✅ {query_name}: {len(dados['data'][0].keys())} campos")
    
    # ================================
    # 2. ANÁLISE SYMPLA
    # ================================
    print(f"\n🎫 ANALISANDO CAMPOS SYMPLA...")
    print("-" * 50)
    
    # Buscar arquivo mais recente do Sympla
    arquivos_sympla = glob.glob("dados_completos_apis_*.json")
    if arquivos_sympla:
        arquivo = max(arquivos_sympla, key=lambda x: x.split('_')[-1])
        
        with open(arquivo, 'r', encoding='utf-8') as f:
            dados_apis = json.load(f)
        
        if 'sympla' in dados_apis:
            sympla_data = dados_apis['sympla']
            
            # Eventos
            if 'events' in sympla_data and sympla_data['events']:
                campos_apis["sympla"]["events"] = list(sympla_data['events'][0].keys())
                print(f"   ✅ events: {len(sympla_data['events'][0].keys())} campos")
            
            # Participantes
            if 'all_participants' in sympla_data and sympla_data['all_participants']:
                campos_apis["sympla"]["participants"] = list(sympla_data['all_participants'][0].keys())
                print(f"   ✅ participants: {len(sympla_data['all_participants'][0].keys())} campos")
            
            # Orders
            if 'all_orders' in sympla_data and sympla_data['all_orders']:
                campos_apis["sympla"]["orders"] = list(sympla_data['all_orders'][0].keys())
                print(f"   ✅ orders: {len(sympla_data['all_orders'][0].keys())} campos")
    
    # ================================
    # 3. ANÁLISE YUZER
    # ================================
    print(f"\n🍺 ANALISANDO CAMPOS YUZER...")
    print("-" * 50)
    
    # Usar dados separados do Yuzer
    arquivos_yuzer_sep = glob.glob("yuzer_separado_ingressos_produtos_*.json")
    if arquivos_yuzer_sep:
        arquivo = max(arquivos_yuzer_sep, key=lambda x: x.split('_')[-1])
        
        with open(arquivo, 'r', encoding='utf-8') as f:
            dados_yuzer = json.load(f)
        
        # Vendas de ingressos
        if dados_yuzer['vendas_ingressos']:
            order_sample = dados_yuzer['vendas_ingressos'][0]
            campos_apis["yuzer"]["vendas_ingressos"] = list(order_sample.keys())
            
            if order_sample['products']:
                campos_apis["yuzer"]["produtos_ingressos"] = list(order_sample['products'][0].keys())
            
            print(f"   ✅ vendas_ingressos: {len(order_sample.keys())} campos")
        
        # Vendas de produtos do bar
        if dados_yuzer['vendas_produtos_bar']:
            order_sample = dados_yuzer['vendas_produtos_bar'][0]
            campos_apis["yuzer"]["vendas_produtos_bar"] = list(order_sample.keys())
            
            if order_sample['products']:
                campos_apis["yuzer"]["produtos_bar"] = list(order_sample['products'][0].keys())
            
            print(f"   ✅ vendas_produtos_bar: {len(order_sample.keys())} campos")
    
    print("")
    return campos_apis

def mapear_tabelas_sgb_v2(campos_apis):
    """Mapear campos para tabelas do SGB V2"""
    print("🏗️ MAPEAMENTO PARA TABELAS SGB V2")
    print("=" * 80)
    
    # Estrutura das tabelas SGB V2
    tabelas_sgb_v2 = {
        # ================================
        # TABELAS CORE
        # ================================
        "sistema_raw": {
            "descricao": "Tabela central para todos os dados JSON brutos",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "relatorio_nome VARCHAR(100) NOT NULL",
                "bar_id INTEGER REFERENCES bars(id)",
                "data JSONB NOT NULL",
                "hash VARCHAR(32) UNIQUE NOT NULL",
                "criado_em TIMESTAMP DEFAULT NOW()",
                "processado BOOLEAN DEFAULT FALSE"
            ],
            "fonte_dados": "Todas as APIs",
            "indices": [
                "CREATE INDEX idx_sistema_raw_hash ON sistema_raw(hash)",
                "CREATE INDEX idx_sistema_raw_relatorio ON sistema_raw(relatorio_nome)",
                "CREATE INDEX idx_sistema_raw_bar ON sistema_raw(bar_id)",
                "CREATE INDEX idx_sistema_raw_criado ON sistema_raw(criado_em)"
            ]
        },
        
        "bars": {
            "descricao": "Cadastro de bares",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "nome VARCHAR(100) NOT NULL",
                "cnpj VARCHAR(18)",
                "endereco TEXT",
                "ativo BOOLEAN DEFAULT TRUE",
                "config JSONB",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "Manual/Configuração",
            "dados_exemplo": [
                "(1, 'Ordinário Bar', '12.345.678/0001-90', 'Endereço do Ordinário', TRUE)",
                "(2, 'Deboche Bar', '98.765.432/0001-10', 'Endereço do Deboche', TRUE)"
            ]
        },
        
        # ================================
        # TABELAS FINANCEIRAS (ContaHub)
        # ================================
        "pagamentos": {
            "descricao": "Dados de pagamentos do ContaHub",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "data_pagamento DATE NOT NULL",
                "valor DECIMAL(10,2) NOT NULL",
                "forma_pagamento VARCHAR(50)",
                "descricao TEXT",
                "categoria VARCHAR(100)",
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub - query pagamentos",
            "campos_mapeados": campos_apis.get("contahub", {}).get("pagamentos", [])
        },
        
        "periodo": {
            "descricao": "Dados agregados por período do ContaHub",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "data_periodo DATE NOT NULL",
                "receita_total DECIMAL(10,2)",
                "custo_total DECIMAL(10,2)",
                "lucro_bruto DECIMAL(10,2)",
                "quantidade_vendas INTEGER",
                "ticket_medio DECIMAL(10,2)",
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub - query periodo",
            "campos_mapeados": campos_apis.get("contahub", {}).get("periodo", [])
        },
        
        # ================================
        # TABELAS DE PRODUTOS (ContaHub + Yuzer)
        # ================================
        "produtos": {
            "descricao": "Cadastro de produtos (bebidas, comidas, etc)",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "nome VARCHAR(200) NOT NULL",
                "categoria VARCHAR(100)",
                "preco_atual DECIMAL(10,2)",
                "unidade VARCHAR(20)",
                "ativo BOOLEAN DEFAULT TRUE",
                "dados_contahub JSONB",
                "dados_yuzer JSONB",
                "criado_em TIMESTAMP DEFAULT NOW()",
                "atualizado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (analitico) + Yuzer (produtos_bar)",
            "campos_contahub": campos_apis.get("contahub", {}).get("analitico", []),
            "campos_yuzer": campos_apis.get("yuzer", {}).get("produtos_bar", [])
        },
        
        "analitico": {
            "descricao": "Vendas detalhadas por produto",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "produto_id INTEGER REFERENCES produtos(id)",
                "data_venda DATE NOT NULL",
                "quantidade DECIMAL(10,3) NOT NULL",
                "preco_unitario DECIMAL(10,2) NOT NULL",
                "valor_total DECIMAL(10,2) NOT NULL",
                "origem VARCHAR(20)", # 'contahub' ou 'yuzer'
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (analitico) + Yuzer (vendas_produtos_bar)",
            "campos_mapeados": {
                "contahub": campos_apis.get("contahub", {}).get("analitico", []),
                "yuzer": campos_apis.get("yuzer", {}).get("produtos_bar", [])
            }
        },
        
        # ================================
        # TABELAS DE EVENTOS (Sympla + Yuzer)
        # ================================
        "eventos": {
            "descricao": "Cadastro de eventos",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "nome VARCHAR(200) NOT NULL",
                "data_evento DATE NOT NULL",
                "hora_inicio TIME",
                "hora_fim TIME",
                "capacidade_maxima INTEGER",
                "status VARCHAR(50)",
                "sympla_event_id INTEGER",
                "yuzer_operation_id INTEGER",
                "raw_data JSONB",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "Sympla (events) + Yuzer (operações bilheteria)",
            "campos_mapeados": {
                "sympla": campos_apis.get("sympla", {}).get("events", []),
                "yuzer": ["operation_id", "operation_name"]
            }
        },
        
        "participantes_eventos": {
            "descricao": "Participantes/ingressos de eventos",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "evento_id INTEGER REFERENCES eventos(id)",
                "nome VARCHAR(200)",
                "email VARCHAR(200)",
                "cpf VARCHAR(14)",
                "telefone VARCHAR(20)",
                "tipo_ingresso VARCHAR(100)",
                "valor_pago DECIMAL(10,2)",
                "status_pagamento VARCHAR(50)",
                "check_in BOOLEAN DEFAULT FALSE",
                "data_check_in TIMESTAMP",
                "origem VARCHAR(20)", # 'sympla' ou 'yuzer'
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "Sympla (participants) + Yuzer (vendas_ingressos)",
            "campos_mapeados": {
                "sympla": campos_apis.get("sympla", {}).get("participants", []),
                "yuzer": campos_apis.get("yuzer", {}).get("produtos_ingressos", [])
            }
        },
        
        # ================================
        # TABELAS CRM (ContaHub)
        # ================================
        "clientes": {
            "descricao": "Cadastro de clientes",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "bar_id INTEGER REFERENCES bars(id)",
                "nome VARCHAR(200)",
                "cpf VARCHAR(14) UNIQUE",
                "email VARCHAR(200)",
                "telefone VARCHAR(20)",
                "data_primeiro_acesso DATE",
                "total_visitas INTEGER DEFAULT 0",
                "total_gasto DECIMAL(10,2) DEFAULT 0",
                "ticket_medio DECIMAL(10,2)",
                "ativo BOOLEAN DEFAULT TRUE",
                "raw_data JSONB",
                "criado_em TIMESTAMP DEFAULT NOW()",
                "atualizado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (clientes_cpf, clientes_faturamento, clientes_presenca)",
            "campos_mapeados": {
                "clientes_cpf": campos_apis.get("contahub", {}).get("clientes_cpf", []),
                "clientes_faturamento": campos_apis.get("contahub", {}).get("clientes_faturamento", []),
                "clientes_presenca": campos_apis.get("contahub", {}).get("clientes_presenca", [])
            }
        },
        
        "visitas_clientes": {
            "descricao": "Histórico de visitas dos clientes",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "cliente_id INTEGER REFERENCES clientes(id)",
                "data_visita DATE NOT NULL",
                "valor_gasto DECIMAL(10,2)",
                "itens_consumidos INTEGER",
                "tempo_permanencia INTERVAL",
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (tempo, clientes_presenca)",
            "campos_mapeados": {
                "tempo": campos_apis.get("contahub", {}).get("tempo", []),
                "clientes_presenca": campos_apis.get("contahub", {}).get("clientes_presenca", [])
            }
        },
        
        # ================================
        # TABELAS DE ESTOQUE (ContaHub)
        # ================================
        "estoque_atual": {
            "descricao": "Estoque atual dos produtos",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "produto_id INTEGER REFERENCES produtos(id)",
                "quantidade_atual DECIMAL(10,3) NOT NULL",
                "quantidade_minima DECIMAL(10,3)",
                "custo_medio DECIMAL(10,2)",
                "valor_total_estoque DECIMAL(10,2)",
                "ultima_atualizacao TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (compras_vendas, analitico)",
            "campos_mapeados": {
                "compras_vendas": campos_apis.get("contahub", {}).get("compras_vendas", [])
            }
        },
        
        "movimentacao_estoque": {
            "descricao": "Movimentações de entrada e saída do estoque",
            "campos": [
                "id SERIAL PRIMARY KEY",
                "produto_id INTEGER REFERENCES produtos(id)",
                "tipo_movimentacao VARCHAR(20)", # 'entrada' ou 'saida'
                "quantidade DECIMAL(10,3) NOT NULL",
                "preco_unitario DECIMAL(10,2)",
                "valor_total DECIMAL(10,2)",
                "data_movimentacao DATE NOT NULL",
                "documento VARCHAR(100)",
                "observacoes TEXT",
                "raw_data JSONB",
                "sistema_raw_id INTEGER REFERENCES sistema_raw(id)",
                "criado_em TIMESTAMP DEFAULT NOW()"
            ],
            "fonte_dados": "ContaHub (compras_vendas) + Vendas (analitico)",
            "campos_mapeados": {
                "compras_vendas": campos_apis.get("contahub", {}).get("compras_vendas", [])
            }
        }
    }
    
    # Mostrar mapeamento completo
    print("📋 TABELAS A SEREM CRIADAS NO SGB V2:")
    print("=" * 80)
    
    for i, (nome_tabela, info) in enumerate(tabelas_sgb_v2.items(), 1):
        print(f"\n{i:2d}. TABELA: {nome_tabela.upper()}")
        print(f"    📝 {info['descricao']}")
        print(f"    📊 {len(info['campos'])} campos")
        print(f"    🔗 Fonte: {info['fonte_dados']}")
        
        if 'campos_mapeados' in info:
            if isinstance(info['campos_mapeados'], dict):
                for fonte, campos in info['campos_mapeados'].items():
                    if campos:
                        print(f"    📋 {fonte}: {len(campos)} campos mapeados")
            elif info['campos_mapeados']:
                print(f"    📋 {len(info['campos_mapeados'])} campos mapeados")
    
    return tabelas_sgb_v2

def gerar_sql_criacao(tabelas_sgb_v2):
    """Gerar SQL para criação das tabelas"""
    print(f"\n🔧 GERANDO SQL DE CRIAÇÃO DAS TABELAS...")
    print("=" * 80)
    
    sql_completo = "-- SGB V2 - CRIAÇÃO COMPLETA DAS TABELAS\n"
    sql_completo += f"-- Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n\n"
    
    # Ordem de criação (dependências)
    ordem_criacao = [
        "bars", "sistema_raw", "produtos", "clientes", "eventos",
        "pagamentos", "periodo", "analitico", "participantes_eventos",
        "visitas_clientes", "estoque_atual", "movimentacao_estoque"
    ]
    
    for nome_tabela in ordem_criacao:
        if nome_tabela in tabelas_sgb_v2:
            info = tabelas_sgb_v2[nome_tabela]
            
            sql_completo += f"-- {info['descricao']}\n"
            sql_completo += f"CREATE TABLE {nome_tabela} (\n"
            
            campos_sql = []
            for campo in info['campos']:
                campos_sql.append(f"    {campo}")
            
            sql_completo += ",\n".join(campos_sql)
            sql_completo += "\n);\n\n"
            
            # Adicionar índices se existirem
            if 'indices' in info:
                for indice in info['indices']:
                    sql_completo += f"{indice};\n"
                sql_completo += "\n"
    
    # Salvar SQL
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename_sql = f"sgb_v2_create_tables_{timestamp}.sql"
    
    with open(filename_sql, 'w', encoding='utf-8') as f:
        f.write(sql_completo)
    
    print(f"💾 SQL SALVO EM: {filename_sql}")
    
    return filename_sql, sql_completo

def gerar_relatorio_completo(campos_apis, tabelas_sgb_v2):
    """Gerar relatório completo com todos os detalhes"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    relatorio = {
        "timestamp": timestamp,
        "description": "Mapeamento completo de campos das APIs para tabelas SGB V2",
        "campos_apis_disponiveis": campos_apis,
        "tabelas_sgb_v2": tabelas_sgb_v2,
        "estatisticas": {
            "total_tabelas": len(tabelas_sgb_v2),
            "tabelas_core": 2,
            "tabelas_financeiras": 2,
            "tabelas_produtos": 3,
            "tabelas_eventos": 2,
            "tabelas_crm": 2,
            "tabelas_estoque": 2
        },
        "apis_integradas": {
            "contahub": {
                "queries_funcionais": 9,
                "queries_com_erro": 3,
                "total_campos_mapeados": sum(len(v) for v in campos_apis.get("contahub", {}).values())
            },
            "sympla": {
                "endpoints_funcionais": 3,
                "total_participantes": 8823,
                "total_checkins": 1359,
                "total_campos_mapeados": sum(len(v) for v in campos_apis.get("sympla", {}).values())
            },
            "yuzer": {
                "orders_ingressos": 260,
                "orders_produtos_bar": 1272,
                "total_campos_mapeados": sum(len(v) for v in campos_apis.get("yuzer", {}).values())
            }
        }
    }
    
    filename = f"sgb_v2_mapeamento_completo_{timestamp}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(relatorio, f, indent=2, ensure_ascii=False)
    
    return filename, relatorio

def main():
    print("🚀 INICIANDO ANÁLISE COMPLETA PARA SGB V2...")
    print("=" * 80)
    print("")
    
    # 1. Analisar campos das APIs
    campos_apis = analisar_campos_apis()
    
    # 2. Mapear para tabelas SGB V2
    tabelas_sgb_v2 = mapear_tabelas_sgb_v2(campos_apis)
    
    # 3. Gerar SQL de criação
    filename_sql, sql_completo = gerar_sql_criacao(tabelas_sgb_v2)
    
    # 4. Gerar relatório completo
    filename_relatorio, relatorio = gerar_relatorio_completo(campos_apis, tabelas_sgb_v2)
    
    # 5. Resumo final
    print(f"\n🎉 ANÁLISE COMPLETA FINALIZADA!")
    print("=" * 80)
    print(f"📊 {len(tabelas_sgb_v2)} tabelas mapeadas para SGB V2")
    print(f"📁 SQL de criação: {filename_sql}")
    print(f"📁 Relatório completo: {filename_relatorio}")
    print("")
    print("🎯 PRÓXIMOS PASSOS:")
    print("1️⃣ Criar banco de dados SGB_V2")
    print("2️⃣ Executar SQL de criação das tabelas")
    print("3️⃣ Desenvolver ETL para popular sistema_raw")
    print("4️⃣ Criar triggers/funções para processamento automático")
    print("5️⃣ Desenvolver dashboard com os dados estruturados")
    print("")
    print("✅ TUDO PRONTO PARA COMEÇAR O SGB V2!")

if __name__ == "__main__":
    main() 