import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import requests
from datetime import datetime
import os
import uuid
import sys
import time
import re
import json

print("Script iniciado...")

# === CONFIGURAÇÃO ===
SCOPE = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
CREDS_FILE = r'F:\MeM - Pagamentos\credentials_mem.json'
SHEET_NAME = 'PIX Pagamentos'
BASE_URL = "https://cdpj.partners.bancointer.com.br"
CERT_PATH = r"F:\MeM - Pagamentos\Inter API_Certificado.crt"
KEY_PATH = r"F:\MeM - Pagamentos\Inter API_Chave.key"
CLIENT_ID = "6e3dbb2d-e464-4dd4-a42b-728a50cbe239"
CLIENT_SECRET = "9906a02d-2ba7-455b-a38a-4cc0fb2a8b2e"
CONTA_CORRENTE = "435379291"

# Padrões para validação de tipos de chave PIX
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
CPF_REGEX = re.compile(r'^\d{11}$')
CNPJ_REGEX = re.compile(r'^\d{14}$')
TELEFONE_REGEX = re.compile(r'^\+?55\d{10,11}$|^\d{10,11}$')

print("Configurações carregadas...")

# === FUNÇÕES ===
def validar_cpf(cpf):
    """Valida CPF usando algoritmo de dígitos verificadores"""
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    
    # Primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cpf[9]) != digito1:
        return False
    
    # Segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    return int(cpf[10]) == digito2

def validar_cnpj(cnpj):
    """Valida CNPJ usando algoritmo de dígitos verificadores"""
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False
    
    # Primeiro dígito verificador
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj[12]) != digito1:
        return False
    
    # Segundo dígito verificador
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    return int(cnpj[13]) == digito2

def limpar_valor(valor):
    valor_limpo = valor.replace('R$', '').replace('.', '').replace(',', '.').strip()
    return "{:.2f}".format(float(valor_limpo))

def obter_access_token():
    print("Obtendo access token...")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    request_body = f"client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&scope=pagamento-pix.write&grant_type=client_credentials"
    
    response = requests.post(
        f"{BASE_URL}/oauth/v2/token",
        headers=headers,
        cert=(CERT_PATH, KEY_PATH),
        data=request_body
    )
    
    response.raise_for_status()
    return response.json().get("access_token")

def identificar_tipo_chave(chave):
    """
    Identifica automaticamente o tipo de chave PIX baseado no formato
    com validações mais robustas
    """
    if not chave:
        return None, None
        
    chave_original = str(chave)
    chave = chave_original.strip()
    
    print(f"🔍 Analisando chave: '{chave_original}' -> '{chave}'")
    
    # Verifica se é email primeiro (mais específico)
    if '@' in chave and EMAIL_REGEX.match(chave):
        print(f"✅ Identificado como EMAIL: {chave}")
        return 'EMAIL', chave.lower()
    
    # Remove toda formatação para análise numérica (pontos, traços, barras, espaços, parênteses, etc.)
    chave_limpa = re.sub(r'[^\d+]', '', chave)  # Mantém + para telefones internacionais
    
    # Se tem +55 no início, remove para análise mas lembra que é telefone internacional
    telefone_internacional = False
    if chave_limpa.startswith('+55'):
        telefone_internacional = True
        chave_limpa = chave_limpa[3:]  # Remove +55
    elif chave_limpa.startswith('55') and len(chave_limpa) >= 12:
        # Pode ser um telefone que começou com 55 (código do Brasil)
        if len(chave_limpa) in [12, 13]:  # 55 + 10 ou 11 dígitos
            telefone_internacional = True
            chave_limpa = chave_limpa[2:]  # Remove 55
    
    print(f"🧹 Chave limpa: '{chave_limpa}' (tamanho: {len(chave_limpa)})")
    
    # Verifica se é CNPJ (14 dígitos) - deve vir antes do CPF
    if len(chave_limpa) == 14:
        if validar_cnpj(chave_limpa):
            print(f"✅ Identificado como CNPJ válido: {chave_limpa}")
            return 'CNPJ', chave_limpa
        else:
            print(f"⚠️ CNPJ inválido detectado: {chave_original} -> {chave_limpa}")
            return 'CNPJ', chave_limpa  # Retorna mesmo se inválido para tentar o pagamento
    
    # Verifica se é CPF (11 dígitos)
    elif len(chave_limpa) == 11:
        if validar_cpf(chave_limpa):
            print(f"✅ Identificado como CPF válido: {chave_limpa}")
            return 'CPF', chave_limpa
        else:
            print(f"⚠️ CPF inválido detectado: {chave_original} -> {chave_limpa}")
            return 'CPF', chave_limpa  # Retorna mesmo se inválido para tentar o pagamento
    
    # Verifica se é telefone (10 ou 11 dígitos)
    elif len(chave_limpa) in [10, 11] or telefone_internacional:
        # Valida se é um telefone brasileiro válido
        if len(chave_limpa) == 11:
            # Celular: deve começar com DDD (11-99) + 9 + 8 dígitos
            ddd = chave_limpa[:2]
            if ddd.isdigit() and 11 <= int(ddd) <= 99 and chave_limpa[2] == '9':
                print(f"✅ Identificado como TELEFONE CELULAR válido: {chave_limpa}")
                return 'TELEFONE', chave_limpa
        elif len(chave_limpa) == 10:
            # Fixo: deve começar com DDD (11-99) + 8 dígitos
            ddd = chave_limpa[:2]
            if ddd.isdigit() and 11 <= int(ddd) <= 99:
                print(f"✅ Identificado como TELEFONE FIXO válido: {chave_limpa}")
                return 'TELEFONE', chave_limpa
        
        print(f"⚠️ Telefone com formato suspeito: {chave_original} -> {chave_limpa}")
        return 'TELEFONE', chave_limpa  # Retorna mesmo se formato suspeito
    
    # Se chegou até aqui e tem mais de 14 dígitos ou formato especial, 
    # provavelmente é uma chave aleatória (UUID)
    elif len(chave) >= 32 or '-' in chave or len(chave_limpa) == 0:
        print(f"✅ Identificado como CHAVE ALEATÓRIA: {chave}")
        return 'ALEATORIA', chave
    
    # Caso não consiga identificar claramente
    else:
        print(f"⚠️ Tipo de chave não identificado: {chave_original} -> {chave_limpa} (tamanho: {len(chave_limpa)} dígitos)")
        # Tenta inferir baseado no tamanho
        if len(chave_limpa) > 14:
            print(f"📝 Inferindo como CHAVE ALEATÓRIA por tamanho")
            return 'ALEATORIA', chave
        elif len(chave_limpa) > 11:
            print(f"📝 Inferindo como CNPJ por tamanho")
            return 'CNPJ', chave_limpa
        elif len(chave_limpa) > 10:
            print(f"📝 Inferindo como CPF por tamanho")
            return 'CPF', chave_limpa
        else:
            print(f"📝 Inferindo como TELEFONE por tamanho")
            return 'TELEFONE', chave_limpa

def atualizar_codigo_solicitacao(sheet, row_idx, codigo):
    """Atualiza a coluna de código de solicitação na planilha"""
    try:
        # A linha da planilha é o índice + 2 (1 para header e 1 porque sheets começa em 1)
        sheet_row = row_idx + 2
        # Assumindo que a coluna de código_solicitacao é a "G" (7ª coluna)
        sheet.update_cell(sheet_row, 7, codigo)
        print(f"✅ Código de solicitação atualizado na planilha: {codigo}")
    except Exception as e:
        print(f"❌ Erro ao atualizar código na planilha: {e}")

def realizar_pagamento_pix(valor, data_pagamento, descricao, destinatario, chave, row_idx, sheet):
    resultado = identificar_tipo_chave(chave)
    
    if not resultado or not resultado[0]:
        print(f"❌ Não foi possível identificar o tipo de chave PIX para {destinatario}: {chave}")
        return False
        
    tipo_chave, chave_formatada = resultado
    print(f"Tipo de chave identificado: {tipo_chave}")
    print(f"Chave formatada: {chave_formatada}")
    
    # Validação por tipo de chave
    if not chave_formatada:
        print(f"❌ Chave PIX vazia ou inválida para {destinatario}")
        return False
        
    # Estrutura do payload baseada no tipo de chave
    if tipo_chave == "TELEFONE":
        # Garante o formato +55XXXXXXXXXX para telefones
        if not chave_formatada.startswith('+55'):
            chave_final = f"+55{chave_formatada}"
        else:
            chave_final = chave_formatada
    elif tipo_chave == "EMAIL":
        chave_final = chave_formatada.lower()
    elif tipo_chave == "CPF":
        chave_final = chave_formatada
    elif tipo_chave == "CNPJ":
        chave_final = chave_formatada
    else:  # ALEATORIA
        chave_final = chave_formatada
    
    emitir_body = json.dumps({
        "valor": str(float(valor)),
        "descricao": descricao,
        "destinatario": {
            "tipo": "CHAVE",
            "chave": chave_final
        }
    })
    
    print(f"Payload sendo enviado: {emitir_body}")
    
    cabecalhos = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "x-conta-corrente": CONTA_CORRENTE
    }
    
    print(f"Headers sendo enviados: {cabecalhos}")
    
    response = requests.post(
        f"{BASE_URL}/banking/v2/pix",
        headers=cabecalhos,
        cert=(CERT_PATH, KEY_PATH),
        data=emitir_body
    )
    
    if response.status_code == 200:
        print(f"✅ Pagamento realizado com sucesso para {destinatario}")
        resposta = response.json()
        print("Pagamento de Pix = ", resposta)
        
        # Atualiza o código de solicitação na planilha
        if 'codigoSolicitacao' in resposta:
            atualizar_codigo_solicitacao(sheet, row_idx, resposta['codigoSolicitacao'])
        
        return True
    else:
        print(f"❌ Erro ao pagar {destinatario}: {response.status_code}")
        print(f"Resposta: {response.text}")
        return False

# === EXECUÇÃO ===
if __name__ == "__main__":
    print("Iniciando conexão com Google Sheets...")
    try:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
        client = gspread.authorize(credentials)
        sheet = client.open(SHEET_NAME).sheet1
        dados = pd.DataFrame(sheet.get_all_records())
        print("Dados da planilha carregados com sucesso!")
    except Exception as e:
        print(f"Erro ao acessar Google Sheets: {e}")
        sys.exit(1)

    hoje = datetime.now().strftime('%d/%m/%Y')
    print(f"Data de hoje: {hoje}")
    pagamentos_hoje = dados[dados['data_competencia'] == hoje]

    if not pagamentos_hoje.empty:
        print(f"\nPagamentos para hoje ({hoje}): {len(pagamentos_hoje)}")

        try:
            access_token = obter_access_token()
            print("Access token obtido com sucesso!")
        except Exception as e:
            print(f"Erro ao obter token: {e}")
            sys.exit(1)

        # Converter data para formato da API
        data_api = datetime.now().strftime('%Y-%m-%d')

        for idx, pagamento in pagamentos_hoje.iterrows():
            nome = pagamento['nome_beneficiario']
            chave_pix = str(pagamento['chave_pix']).strip()
            valor = limpar_valor(pagamento['valor'])
            descricao = pagamento['descricao']
            codigo_solicitacao = pagamento.get('codigo_solicitacao', '')

            # Verifica se já existe código de solicitação (já foi pago)
            if codigo_solicitacao and str(codigo_solicitacao).strip():
                print(f"⏩ Pulando pagamento para {nome}: Já possui código de solicitação {codigo_solicitacao}")
                continue

            if not chave_pix:
                print(f"⚠️ Ignorando pagamento para {nome}: Chave PIX não informada")
                continue

            realizar_pagamento_pix(valor, data_api, descricao, nome, chave_pix, idx, sheet)
    else:
        print("Nenhum pagamento com data de hoje.")
