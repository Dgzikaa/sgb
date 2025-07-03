# ❌ ERRO: Coluna 'codigo' não encontrada - SOLUÇÃO COMPLETA

## O que aconteceu?
O erro indica que as tabelas `produtos` e `insumos` não têm a coluna `codigo` necessária para a importação.

## ✅ SOLUÇÃO EM 5 PASSOS:

### 1. Acesse a página de teste
```
http://localhost:3000/teste-importacao
```

### 2. Clique no botão vermelho "Verificar Estrutura das Tabelas"
- Isso vai mostrar qual é a estrutura atual das suas tabelas
- E fornecer o script de correção completo

### 3. Copie o script SQL que aparecerá
- Clique no botão "Copiar Script"
- O script será copiado para sua área de transferência

### 4. Execute o script no Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `uqtgsvujwcbymjmvkjhy`
3. Menu lateral → "SQL Editor"
4. Cole o script e clique em "Run"

### 5. Teste novamente a importação
- Volte para `/teste-importacao`
- Clique em "Testar Conectividade e Tabelas" (botão laranja)
- Se aparecer ✅ verde, pode importar os dados

## 🔧 O que o script faz?
- Apaga as tabelas antigas (com estrutura incorreta)
- Recria as tabelas com a estrutura completa
- Inclui a coluna `codigo` necessária
- Adiciona dados de exemplo para teste

## 🚀 Após a correção
Você poderá:
1. Importar a planilha real do Google Sheets
2. Usar o Terminal de Produção normalmente
3. Calcular receitas automaticamente

## 📞 Se der erro
1. Copie a mensagem de erro completa
2. Me informe qual passo não funcionou
3. Vou ajudar a resolver rapidamente 