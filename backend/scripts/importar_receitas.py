#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SGB V2 - IMPORTADOR DE RECEITAS (EXCEL + GOOGLE SHEETS)
Autor: Sistema SGB V2
Data: 30/01/2025

Importa receitas e ingredientes de:
- Arquivos Excel (.xlsx)
- Google Sheets (via URL ou sheet_id)
Baseado no exemplo do Frango a Passarinho fornecido.
"""

import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import sys
import os
from datetime import datetime
import logging
import re

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('importacao_receitas.log'),
        logging.StreamHandler()
    ]
)

class ImportadorReceitas:
    def __init__(self, db_config):
        """
        Inicializa o importador com configurações do banco
        
        Args:
            db_config (dict): Configurações de conexão com o banco
        """
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        
    def conectar_banco(self):
        """Conecta ao banco de dados"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            logging.info("✅ Conectado ao banco de dados")
            return True
        except Exception as e:
            logging.error(f"❌ Erro ao conectar ao banco: {e}")
            return False
    
    def desconectar_banco(self):
        """Desconecta do banco de dados"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logging.info("🔌 Desconectado do banco de dados")
    
    def extrair_sheet_id_url(self, url_google_sheets):
        """
        Extrai o sheet_id de uma URL do Google Sheets
        
        URLs aceitas:
        - https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
        - https://docs.google.com/spreadsheets/d/SHEET_ID
        - SHEET_ID (direto)
        """
        if not url_google_sheets:
            return None
            
        # Regex para extrair sheet_id da URL
        pattern = r'/spreadsheets/d/([a-zA-Z0-9-_]+)'
        match = re.search(pattern, url_google_sheets)
        
        if match:
            return match.group(1)
        
        # Se não é URL, pode ser o ID direto
        if re.match(r'^[a-zA-Z0-9-_]+$', url_google_sheets):
            return url_google_sheets
        
        return None
    
    def carregar_google_sheets(self, sheet_id, aba_nome='Receitas'):
        """
        Carrega dados diretamente do Google Sheets
        
        Args:
            sheet_id (str): ID da planilha do Google Sheets
            aba_nome (str): Nome da aba (padrão: 'Receitas')
            
        Returns:
            pandas.DataFrame: DataFrame com os dados
        """
        try:
            # URL para exportar como CSV
            url_csv = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={aba_nome}'
            
            logging.info(f"🔄 Carregando Google Sheets: {sheet_id}")
            logging.info(f"📋 Aba: {aba_nome}")
            
            # Carregar dados
            df = pd.read_csv(url_csv)
            
            logging.info(f"✅ Google Sheets carregado. {len(df)} linhas encontradas")
            return df
            
        except Exception as e:
            logging.error(f"❌ Erro ao carregar Google Sheets: {e}")
            raise Exception(f"Erro ao acessar Google Sheets: {e}")
    
    def validar_dados_receitas(self, df, fonte="arquivo"):
        """
        Valida se o DataFrame tem as colunas necessárias
        
        Funciona com Excel e Google Sheets
        
        Formato esperado:
        - CodProduto | Produto | CodInsumo | INSUMO | QUANTIDADE RECEITA
        - pc0005 | Frango a Passarinho preparo | i0123 | Frango a passarinho | 1000
        """
        try:
            # Colunas obrigatórias
            colunas_obrigatorias = [
                'CodProduto', 'Produto', 'CodInsumo', 
                'INSUMO', 'QUANTIDADE RECEITA'
            ]
            
            # Verificar se todas as colunas estão presentes
            colunas_faltantes = []
            for coluna in colunas_obrigatorias:
                if coluna not in df.columns:
                    colunas_faltantes.append(coluna)
            
            if colunas_faltantes:
                logging.error(f"❌ Colunas faltantes no {fonte}: {colunas_faltantes}")
                return False, f"Colunas faltantes: {', '.join(colunas_faltantes)}"
            
            # Remover linhas vazias
            df = df.dropna(subset=['CodProduto', 'Produto'])
            
            logging.info(f"✅ {fonte.capitalize()} válido. {len(df)} linhas encontradas")
            return True, df
            
        except Exception as e:
            logging.error(f"❌ Erro ao validar {fonte}: {e}")
            return False, str(e)
    
    def validar_excel_receitas(self, arquivo_excel):
        """
        MÉTODO MANTIDO PARA COMPATIBILIDADE
        Valida se o arquivo Excel tem as colunas necessárias
        """
        try:
            df = pd.read_excel(arquivo_excel)
            return self.validar_dados_receitas(df, "Excel")
        except Exception as e:
            logging.error(f"❌ Erro ao validar Excel: {e}")
            return False, str(e)
    
    def processar_receitas_excel(self, df, bar_id=1):
        """
        Processa o DataFrame e extrai receitas únicas
        
        Args:
            df (pandas.DataFrame): DataFrame com dados do Excel
            bar_id (int): ID do bar para associar as receitas
            
        Returns:
            dict: Dicionário com receitas e ingredientes processados
        """
        receitas_processadas = {}
        
        for _, row in df.iterrows():
            codigo_produto = str(row['CodProduto']).strip()
            nome_produto = str(row['Produto']).strip()
            codigo_insumo = str(row['CodInsumo']).strip()
            nome_insumo = str(row['INSUMO']).strip()
            quantidade = float(row['QUANTIDADE RECEITA'])
            
            # Se a receita ainda não existe, criar
            if codigo_produto not in receitas_processadas:
                receitas_processadas[codigo_produto] = {
                    'codigo_produto': codigo_produto,
                    'nome_produto': nome_produto,
                    'bar_id': bar_id,
                    'categoria': self._determinar_categoria(nome_produto),
                    'peso_referencia': 1.000,  # Base 1kg
                    'rendimento_estimado': self._estimar_rendimento(nome_produto),
                    'tempo_preparo_estimado': self._estimar_tempo_preparo(nome_produto),
                    'ingredientes': []
                }
            
            # Adicionar ingrediente à receita
            ingrediente = {
                'codigo_insumo': codigo_insumo,
                'nome_insumo': nome_insumo,
                'unidade': self._determinar_unidade(nome_insumo, quantidade),
                'quantidade': quantidade
            }
            
            receitas_processadas[codigo_produto]['ingredientes'].append(ingrediente)
        
        logging.info(f"✅ Processadas {len(receitas_processadas)} receitas únicas")
        return receitas_processadas
    
    def _determinar_categoria(self, nome_produto):
        """Determina a categoria baseada no nome do produto"""
        nome_lower = nome_produto.lower()
        
        if any(termo in nome_lower for termo in ['frango', 'picanha', 'calabresa', 'peixe', 'carne']):
            return 'Proteínas'
        elif any(termo in nome_lower for termo in ['salada', 'vegetal', 'verdura']):
            return 'Saladas'
        elif any(termo in nome_lower for termo in ['batata', 'arroz', 'macarrão', 'pão']):
            return 'Acompanhamentos'
        elif any(termo in nome_lower for termo in ['drink', 'bebida', 'coquetel']):
            return 'Bebidas'
        else:
            return 'Produção'
    
    def _determinar_unidade(self, nome_insumo, quantidade):
        """Determina a unidade baseada no nome do insumo e quantidade"""
        nome_lower = nome_insumo.lower()
        
        # Líquidos
        if any(termo in nome_lower for termo in ['vinagre', 'óleo', 'molho', 'água', 'leite']):
            return 'ml' if quantidade < 100 else 'L'
        
        # Carnes e proteínas (normalmente em kg/g)
        if any(termo in nome_lower for termo in ['frango', 'carne', 'peixe', 'calabresa']):
            return 'kg' if quantidade >= 1000 else 'g'
        
        # Temperos e especiarias (normalmente em g)
        if any(termo in nome_lower for termo in ['sal', 'pimenta', 'alho', 'cebola', 'tempero']):
            return 'g'
        
        # Default: gramas para pequenas quantidades, kg para grandes
        return 'kg' if quantidade >= 1000 else 'g'
    
    def _estimar_rendimento(self, nome_produto):
        """Estima o rendimento baseado no tipo de produto"""
        nome_lower = nome_produto.lower()
        
        if 'frango' in nome_lower:
            return 4  # 4 porções por kg
        elif 'picanha' in nome_lower:
            return 3  # 3 porções por kg (corte mais nobre)
        elif 'calabresa' in nome_lower:
            return 6  # 6 porções por kg
        else:
            return 4  # Default: 4 porções por kg
    
    def _estimar_tempo_preparo(self, nome_produto):
        """Estima o tempo de preparo baseado no tipo de produto"""
        nome_lower = nome_produto.lower()
        
        if 'frango' in nome_lower:
            return '45 minutes'
        elif 'picanha' in nome_lower:
            return '60 minutes'
        elif 'calabresa' in nome_lower:
            return '30 minutes'
        else:
            return '45 minutes'  # Default
    
    def inserir_receita_banco(self, receita_data):
        """
        Insere uma receita no banco de dados
        
        Args:
            receita_data (dict): Dados da receita processada
            
        Returns:
            int: ID da receita inserida ou None se erro
        """
        try:
            # Inserir receita
            query_receita = """
                INSERT INTO receitas (
                    bar_id, codigo_produto, nome_produto, categoria,
                    peso_referencia, rendimento_estimado, tempo_preparo_estimado
                ) VALUES (
                    %(bar_id)s, %(codigo_produto)s, %(nome_produto)s, %(categoria)s,
                    %(peso_referencia)s, %(rendimento_estimado)s, %(tempo_preparo_estimado)s::INTERVAL
                ) RETURNING id
            """
            
            params_receita = {
                'bar_id': receita_data['bar_id'],
                'codigo_produto': receita_data['codigo_produto'],
                'nome_produto': receita_data['nome_produto'],
                'categoria': receita_data['categoria'],
                'peso_referencia': receita_data['peso_referencia'],
                'rendimento_estimado': receita_data['rendimento_estimado'],
                'tempo_preparo_estimado': receita_data['tempo_preparo_estimado']
            }
            
            self.cursor.execute(query_receita, params_receita)
            receita_id = self.cursor.fetchone()['id']
            
            # Inserir ingredientes
            for ingrediente in receita_data['ingredientes']:
                query_ingrediente = """
                    INSERT INTO receita_ingredientes (
                        receita_id, codigo_insumo, nome_insumo, unidade, quantidade
                    ) VALUES (
                        %s, %s, %s, %s, %s
                    )
                """
                
                self.cursor.execute(query_ingrediente, (
                    receita_id,
                    ingrediente['codigo_insumo'],
                    ingrediente['nome_insumo'],
                    ingrediente['unidade'],
                    ingrediente['quantidade']
                ))
            
            logging.info(f"✅ Receita inserida: {receita_data['nome_produto']} (ID: {receita_id})")
            return receita_id
            
        except Exception as e:
            logging.error(f"❌ Erro ao inserir receita {receita_data['codigo_produto']}: {e}")
            return None
    
    def importar_receitas_completo(self, fonte, bar_id=1, confirmar=True, aba_nome='Receitas'):
        """
        Importa todas as receitas de Excel ou Google Sheets
        
        Args:
            fonte (str): Caminho Excel ou URL/ID do Google Sheets
            bar_id (int): ID do bar
            confirmar (bool): Se True, pede confirmação antes de importar
            aba_nome (str): Nome da aba (só para Google Sheets)
            
        Returns:
            dict: Resultado da importação
        """
        resultado = {
            'sucesso': False,
            'receitas_importadas': 0,
            'receitas_com_erro': 0,
            'detalhes': [],
            'tipo_fonte': 'unknown'
        }
        
        try:
            # Conectar ao banco
            if not self.conectar_banco():
                resultado['detalhes'].append("Erro na conexão com banco")
                return resultado
            
            # Detectar tipo de fonte e carregar dados
            df = None
            
            # Verificar se é Google Sheets (URL ou sheet_id)
            sheet_id = self.extrair_sheet_id_url(fonte)
            if sheet_id:
                # É Google Sheets
                resultado['tipo_fonte'] = 'google_sheets'
                logging.info(f"🌐 Detectado Google Sheets: {sheet_id}")
                
                try:
                    df = self.carregar_google_sheets(sheet_id, aba_nome)
                    valido, df_ou_erro = self.validar_dados_receitas(df, "Google Sheets")
                    if not valido:
                        resultado['detalhes'].append(f"Google Sheets inválido: {df_ou_erro}")
                        return resultado
                    df = df_ou_erro
                    
                except Exception as e:
                    resultado['detalhes'].append(f"Erro ao acessar Google Sheets: {e}")
                    return resultado
            
            # Verificar se é arquivo Excel
            elif os.path.exists(fonte) and fonte.endswith(('.xlsx', '.xls')):
                # É arquivo Excel
                resultado['tipo_fonte'] = 'excel'
                logging.info(f"📊 Detectado arquivo Excel: {fonte}")
                
                valido, df_ou_erro = self.validar_excel_receitas(fonte)
                if not valido:
                    resultado['detalhes'].append(f"Excel inválido: {df_ou_erro}")
                    return resultado
                df = df_ou_erro
            
            else:
                # Fonte não reconhecida
                resultado['detalhes'].append("Fonte não reconhecida. Use arquivo Excel (.xlsx) ou URL do Google Sheets")
                return resultado
            
            # Processar receitas
            receitas_processadas = self.processar_receitas_excel(df, bar_id)
            
            # Mostrar preview e pedir confirmação
            if confirmar:
                print("\n" + "="*60)
                print("📋 PREVIEW DA IMPORTAÇÃO")
                print("="*60)
                
                for codigo, receita in list(receitas_processadas.items())[:3]:  # Mostrar apenas 3 primeiras
                    print(f"\n🍳 {receita['nome_produto']} ({codigo})")
                    print(f"   📦 Categoria: {receita['categoria']}")
                    print(f"   ⏱️  Tempo: {receita['tempo_preparo_estimado']}")
                    print(f"   🍽️  Rendimento: {receita['rendimento_estimado']} porções")
                    print(f"   📋 Ingredientes: {len(receita['ingredientes'])}")
                    
                    for ing in receita['ingredientes'][:3]:  # Mostrar apenas 3 primeiros ingredientes
                        print(f"      • {ing['nome_insumo']}: {ing['quantidade']}{ing['unidade']}")
                    
                    if len(receita['ingredientes']) > 3:
                        print(f"      ... e mais {len(receita['ingredientes']) - 3} ingredientes")
                
                print(f"\n📊 TOTAL: {len(receitas_processadas)} receitas para importar")
                
                resposta = input("\n❓ Confirmar importação? (s/N): ").strip().lower()
                if resposta not in ['s', 'sim', 'y', 'yes']:
                    resultado['detalhes'].append("Importação cancelada pelo usuário")
                    return resultado
            
            # Iniciar transação
            self.conn.autocommit = False
            
            # Importar receitas
            for codigo, receita in receitas_processadas.items():
                receita_id = self.inserir_receita_banco(receita)
                
                if receita_id:
                    resultado['receitas_importadas'] += 1
                    resultado['detalhes'].append(f"✅ {receita['nome_produto']}")
                else:
                    resultado['receitas_com_erro'] += 1
                    resultado['detalhes'].append(f"❌ {receita['nome_produto']}")
            
            # Confirmar transação
            self.conn.commit()
            resultado['sucesso'] = True
            
            logging.info(f"🎉 Importação concluída: {resultado['receitas_importadas']} receitas importadas")
            
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            logging.error(f"❌ Erro durante importação: {e}")
            resultado['detalhes'].append(f"Erro geral: {e}")
        
        finally:
            self.desconectar_banco()
        
        return resultado
    
    def importar_excel_completo(self, arquivo_excel, bar_id=1, confirmar=True):
        """
        MÉTODO MANTIDO PARA COMPATIBILIDADE
        Redireciona para importar_receitas_completo
        """
        return self.importar_receitas_completo(arquivo_excel, bar_id, confirmar)
    
    def gerar_template_excel(self, arquivo_saida='template_receitas_sgb.xlsx'):
        """
        Gera um template Excel para facilitar a entrada de dados
        """
        try:
            # Dados de exemplo baseados no frango a passarinho
            dados_exemplo = [
                {
                    'CodProduto': 'pc0005',
                    'Produto': 'Frango a Passarinho preparo',
                    'CodInsumo': 'i0123',
                    'INSUMO': 'Frango a passarinho',
                    'QUANTIDADE RECEITA': 1000
                },
                {
                    'CodProduto': 'pc0005',
                    'Produto': 'Frango a Passarinho preparo',
                    'CodInsumo': 'i0149',
                    'INSUMO': 'Pimenta do reino',
                    'QUANTIDADE RECEITA': 3
                },
                {
                    'CodProduto': 'pc0005',
                    'Produto': 'Frango a Passarinho preparo',
                    'CodInsumo': 'i0095',
                    'INSUMO': 'Alho com Casca kg',
                    'QUANTIDADE RECEITA': 50
                },
                {
                    'CodProduto': 'pc0006',
                    'Produto': 'Calabresa Acebolada',
                    'CodInsumo': 'i0200',
                    'INSUMO': 'Calabresa',
                    'QUANTIDADE RECEITA': 1000
                }
            ]
            
            df = pd.DataFrame(dados_exemplo)
            
            # Salvar Excel com formatação
            with pd.ExcelWriter(arquivo_saida, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Receitas', index=False)
                
                # Ajustar largura das colunas
                worksheet = writer.sheets['Receitas']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            
            logging.info(f"✅ Template Excel gerado: {arquivo_saida}")
            return True
            
        except Exception as e:
            logging.error(f"❌ Erro ao gerar template: {e}")
            return False


def main():
    """Função principal do script"""
    print("🍳 IMPORTADOR DE RECEITAS SGB V2")
    print("📊 Excel + 🌐 Google Sheets")
    print("=" * 50)
    
    # Configurações do banco (ajustar conforme necessário)
    db_config = {
        'host': 'localhost',
        'database': 'sgb_v2',
        'user': 'postgres',
        'password': 'sua_senha_aqui',
        'port': 5432
    }
    
    importador = ImportadorReceitas(db_config)
    
    if len(sys.argv) < 2:
        print("📝 USO:")
        print("  python importar_receitas_excel.py <fonte> [bar_id] [aba_nome]")
        print("  python importar_receitas_excel.py --template")
        print()
        print("📊 EXCEL:")
        print("  python importar_receitas_excel.py receitas.xlsx 1")
        print()
        print("🌐 GOOGLE SHEETS:")
        print("  python importar_receitas_excel.py 'https://docs.google.com/spreadsheets/d/1ABC.../edit' 1")
        print("  python importar_receitas_excel.py '1ABC...' 1 'Receitas'")
        print()
        print("🛠️  OUTROS:")
        print("  python importar_receitas_excel.py --template")
        return
    
    if sys.argv[1] == '--template':
        # Gerar template
        print("📋 Gerando template Excel...")
        if importador.gerar_template_excel():
            print("✅ Template gerado: template_receitas_sgb.xlsx")
            print("📝 Use este arquivo como modelo para suas receitas")
        else:
            print("❌ Erro ao gerar template")
        return
    
    # Parâmetros
    fonte = sys.argv[1]
    bar_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    aba_nome = sys.argv[3] if len(sys.argv) > 3 else 'Receitas'
    
    # Verificar se é arquivo local e se existe
    if not fonte.startswith('http') and not importador.extrair_sheet_id_url(fonte):
        if not os.path.exists(fonte):
            print(f"❌ Arquivo não encontrado: {fonte}")
            return
    
    # Executar importação
    print(f"📂 Importando de: {fonte}")
    print(f"🏪 Bar ID: {bar_id}")
    if aba_nome != 'Receitas':
        print(f"📋 Aba: {aba_nome}")
    print()
    
    resultado = importador.importar_receitas_completo(fonte, bar_id, confirmar=True, aba_nome=aba_nome)
    
    # Mostrar resultado
    print("\n" + "="*60)
    print("📊 RESULTADO DA IMPORTAÇÃO")
    print("="*60)
    
    # Mostrar fonte utilizada
    fonte_emoji = "🌐" if resultado.get('tipo_fonte') == 'google_sheets' else "📊"
    fonte_nome = "Google Sheets" if resultado.get('tipo_fonte') == 'google_sheets' else "Excel"
    print(f"{fonte_emoji} Fonte: {fonte_nome}")
    
    if resultado['sucesso']:
        print(f"✅ Importação bem-sucedida!")
        print(f"📈 Receitas importadas: {resultado['receitas_importadas']}")
        if resultado['receitas_com_erro'] > 0:
            print(f"⚠️  Receitas com erro: {resultado['receitas_com_erro']}")
        
        # Dicas para Google Sheets
        if resultado.get('tipo_fonte') == 'google_sheets':
            print(f"\n💡 DICA: Como a fonte é Google Sheets, os dados ficam sempre atualizados!")
            print(f"   Para reimportar, execute o mesmo comando novamente.")
    else:
        print(f"❌ Importação falhou!")
        print(f"📉 Receitas importadas: {resultado['receitas_importadas']}")
        print(f"❌ Receitas com erro: {resultado['receitas_com_erro']}")
    
    # Detalhes
    if resultado['detalhes']:
        print(f"\n📋 Detalhes:")
        for detalhe in resultado['detalhes'][-10:]:  # Mostrar últimos 10
            print(f"   {detalhe}")
    
    # Exemplo de Google Sheets se foi usado Excel
    if resultado.get('tipo_fonte') == 'excel' and resultado['sucesso']:
        print(f"\n💡 PRÓXIMA VEZ: Experimente usar Google Sheets!")
        print(f"   - Dados sempre atualizados")
        print(f"   - Edição colaborativa")
        print(f"   - Sem necessidade de baixar arquivos")


if __name__ == "__main__":
    main() 