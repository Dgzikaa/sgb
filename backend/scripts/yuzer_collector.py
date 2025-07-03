#!/usr/bin/env python3
"""
🚀 YUZER INTEGRATION FINAL - Sistema SGB V2
Integração completa com endpoints funcionais descobertos
"""
import requests
import json
from datetime import datetime, timedelta
import hashlib

class YuzerAPI:
    """Cliente para API Yuzer com endpoints corretos"""
    
    def __init__(self, token, panel_id="11917"):
        self.token = token
        self.panel_id = panel_id
        self.base_url = "https://api.eagle.yuzer.com.br/api"
        self.headers = {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Yuzer": self.token
        }
    
    def get_products_statistics(self, date_start, date_end):
        """Obter estatísticas de produtos"""
        url = f"{self.base_url}/salesPanels/{self.panel_id}/dashboards/products/statistics"
        
        payload = {
            "currency": None,
            "from": f"{date_start}T00:00:00.000Z",
            "to": f"{date_end}T23:59:59.999Z"
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "raw_response": response.text
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "raw_response": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_response": None
            }
    
    def get_payments_statistics(self, date_start, date_end):
        """Obter estatísticas de pagamentos"""
        url = f"{self.base_url}/dashboards/payments/statistics"
        
        payload = {
            "currency": None,
            "from": f"{date_start}T00:00:00.000Z",
            "to": f"{date_end}T23:59:59.999Z"
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "raw_response": response.text
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "raw_response": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_response": None
            }
    
    def get_complete_data(self, date_start, date_end):
        """Obter dados completos para um período"""
        print(f"🔄 Coletando dados Yuzer de {date_start} a {date_end}")
        
        results = {
            "date_start": date_start,
            "date_end": date_end,
            "timestamp": datetime.now().isoformat(),
            "products": None,
            "payments": None,
            "success": False,
            "errors": []
        }
        
        # 1. Produtos
        print("📊 Coletando estatísticas de produtos...")
        products_result = self.get_products_statistics(date_start, date_end)
        results["products"] = products_result
        
        if products_result["success"]:
            data = products_result["data"]
            total = data.get("total", 0)
            count = data.get("count", 0)
            print(f"   ✅ Produtos: R$ {total:,.2f} - {count} itens")
        else:
            print(f"   ❌ Erro produtos: {products_result['error']}")
            results["errors"].append(f"Products: {products_result['error']}")
        
        # 2. Pagamentos
        print("💳 Coletando estatísticas de pagamentos...")
        payments_result = self.get_payments_statistics(date_start, date_end)
        results["payments"] = payments_result
        
        if payments_result["success"]:
            data = payments_result["data"]
            total = data.get("total", 0)
            orders = data.get("ordersQuantity", 0)
            print(f"   ✅ Pagamentos: R$ {total:,.2f} - {orders} pedidos")
            
            # Detalhes dos métodos de pagamento
            methods = data.get("methods", [])
            if methods:
                print("   💳 Métodos de pagamento:")
                for method in methods:
                    method_total = method.get("total", 0)
                    method_percent = method.get("percent", 0)
                    print(f"      - ID {method.get('id', 'N/A')}: R$ {method_total:,.2f} ({method_percent:.1f}%)")
        else:
            print(f"   ❌ Erro pagamentos: {payments_result['error']}")
            results["errors"].append(f"Payments: {payments_result['error']}")
        
        # Verificar sucesso geral
        results["success"] = products_result["success"] or payments_result["success"]
        
        return results
    
    def save_to_sistema_raw_format(self, data, bar_id=1):
        """Converter dados para formato sistema_raw do SGB V2"""
        records = []
        
        # Criar hash único para este período
        period_str = f"{data['date_start']}_{data['date_end']}"
        hash_id = hashlib.md5(period_str.encode()).hexdigest()
        
        # Record para produtos
        if data["products"] and data["products"]["success"]:
            products_record = {
                "id": f"yuzer_products_{hash_id}",
                "bar_id": bar_id,
                "sistema": "yuzer",
                "tipo_dados": "products_statistics",
                "data_referencia": data["date_start"],
                "timestamp_coleta": data["timestamp"],
                "dados_completos": data["products"]["data"],
                "hash_dados": hashlib.md5(data["products"]["raw_response"].encode()).hexdigest(),
                "status_coleta": "sucesso"
            }
            records.append(products_record)
        
        # Record para pagamentos
        if data["payments"] and data["payments"]["success"]:
            payments_record = {
                "id": f"yuzer_payments_{hash_id}",
                "bar_id": bar_id,
                "sistema": "yuzer", 
                "tipo_dados": "payments_statistics",
                "data_referencia": data["date_start"],
                "timestamp_coleta": data["timestamp"],
                "dados_completos": data["payments"]["data"],
                "hash_dados": hashlib.md5(data["payments"]["raw_response"].encode()).hexdigest(),
                "status_coleta": "sucesso"
            }
            records.append(payments_record)
        
        return records

def test_integration():
    """Testar integração completa"""
    print("🚀 TESTE INTEGRAÇÃO YUZER FINAL")
    print("=" * 60)
    
    # Inicializar cliente
    yuzer = YuzerAPI("d3237ab2-4a68-4624-8ae4-16bc68929499")
    
    # Datas para teste
    test_dates = [
        ("2025-06-29", "2025-06-29"),  # Dia específico do dashboard
        ("2025-06-01", "2025-06-30"),  # Mês completo
    ]
    
    all_results = []
    
    for date_start, date_end in test_dates:
        print(f"\n📅 Período: {date_start} a {date_end}")
        print("-" * 40)
        
        # Coletar dados
        result = yuzer.get_complete_data(date_start, date_end)
        all_results.append(result)
        
        # Converter para formato sistema_raw
        if result["success"]:
            raw_records = yuzer.save_to_sistema_raw_format(result)
            print(f"\n📋 Criados {len(raw_records)} registros sistema_raw:")
            for record in raw_records:
                print(f"   - {record['tipo_dados']}: {record['id']}")
        
        print(f"\n✅ Sucesso: {result['success']}")
        if result["errors"]:
            print(f"⚠️ Erros: {result['errors']}")
    
    # Salvar resultados completos
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"yuzer_integration_test_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Resultados salvos em: {filename}")
    
    # Resumo final
    print("\n" + "=" * 60)
    print("📊 RESUMO DA INTEGRAÇÃO")
    print("=" * 60)
    
    total_success = sum(1 for r in all_results if r["success"])
    print(f"✅ Períodos com sucesso: {total_success}/{len(all_results)}")
    
    if total_success > 0:
        print("\n🎉 INTEGRAÇÃO YUZER COMPLETA!")
        print("💡 Endpoints funcionais:")
        print("   - Products Statistics: /api/salesPanels/11917/dashboards/products/statistics")
        print("   - Payments Statistics: /api/dashboards/payments/statistics")
        print("\n🔧 Formato de payload:")
        print('   {"currency": null, "from": "YYYY-MM-DDTHH:mm:ss.sssZ", "to": "YYYY-MM-DDTHH:mm:ss.sssZ"}')
        print("\n🚀 Pronto para implementar no SGB V2!")
    else:
        print("\n❌ Nenhuma coleta bem-sucedida")

if __name__ == "__main__":
    test_integration() 