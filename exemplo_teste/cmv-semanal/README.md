# CMV Semanal - Importação e Automação

## 📋 Visão Geral

Sistema completo para gerenciar CMV (Custo de Mercadoria Vendida) por semana, incluindo:
- Importação de dados históricos do Google Sheets
- Processamento automático de novas semanas
- Interface de visualização e edição

---

## 🚀 Importação de Dados Históricos

### Pré-requisitos

1. **Google Service Account**
   - Arquivo `google-service-account.json` na raiz do projeto
   - Permissões de leitura na planilha do Google Sheets

2. **Variáveis de Ambiente**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### Como Rodar

```bash
cd exemplo_teste/cmv-semanal
npm install
npm run importar-historico
```

### O que o Script Faz

1. ✅ Conecta ao Google Sheets
2. ✅ Lê dados das semanas 4 até 45 (2025)
3. ✅ Extrai valores de:
   - Estoque Inicial
   - Compras
   - Estoque Final (Cozinha, Bebidas, Drinks)
   - Consumos (Sócios, Benefícios, ADM, RH, Artista)
   - Ajustes Manuais
   - CMV Real, Faturamento CMVível, CMV Limpo, Gap
4. ✅ Insere no banco de dados (upsert para evitar duplicatas)
5. ✅ Marca como status "fechado" (dados históricos)

### Campos Importados

| Campo | Origem | Observação |
|-------|--------|------------|
| Estoque Inicial | Planilha | Valor manual da planilha |
| Compras | Planilha | Soma de todas as compras |
| Estoque Final | Planilha | Soma por categoria (Cozinha, Bebidas, Drinks) |
| Consumos | Planilha | Valores calculados na planilha |
| CMV Real | Planilha | Calculado na planilha |
| Faturamento CMVível | Planilha | Da planilha |
| CMV Limpo (%) | Planilha | Calculado na planilha |
| Gap | Planilha | Diferença vs teórico |

### Campos Deixados em Branco

Estes serão preenchidos pelo script automático nas próximas semanas:
- Vendas Brutas
- Vendas Líquidas
- Contas Especiais (valores brutos das mesas)

---

## 🤖 Processamento Automático

### Edge Function: `cmv-semanal-auto`

Localização: `backend/supabase/functions/cmv-semanal-auto/`

### O que Faz

1. ✅ Identifica semana e ano atual
2. ✅ Busca estoque inicial (estoque final da semana anterior)
3. ✅ Busca dados automáticos:
   - Consumo dos sócios (x-corbal, etc) do ContaHub
   - Contas especiais (benefícios, banda, ADM, RH)
   - Faturamento CMVível (vr_repique)
   - Vendas Brutas e Líquidas
   - Compras do NIBO por categoria
   - Estoques da última contagem
4. ✅ Calcula CMV automaticamente
5. ✅ Insere/atualiza no banco (status "rascunho")

### Como Deploy

```bash
npx supabase functions deploy cmv-semanal-auto
```

### Como Testar

```bash
# Via curl
curl -X POST https://[seu-projeto].supabase.co/functions/v1/cmv-semanal-auto \
  -H "Authorization: Bearer [seu-anon-key]"

# Via interface do sistema (botão "Processar Semana Atual")
```

### Agendar Execução Automática

Opção 1: Cron do Supabase (se disponível)
Opção 2: GitHub Actions
Opção 3: Vercel Cron

```yaml
# .github/workflows/cmv-semanal-cron.yml
name: CMV Semanal Automático
on:
  schedule:
    - cron: '0 10 * * 1' # Toda segunda-feira às 10h
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Processar CMV
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/cmv-semanal-auto \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 📊 Interface de Visualização

### Páginas

1. **`/ferramentas/cmv-semanal`** - Listagem e edição
2. **`/ferramentas/cmv-semanal/visualizar`** - Dashboard com gráficos

### Funcionalidades

- ✅ Listar todas as semanas
- ✅ Filtrar por ano e status
- ✅ Adicionar/editar manualmente
- ✅ Botão "Buscar Dados" para preencher automaticamente
- ✅ Visualizar cálculos em tempo real
- ✅ Gráficos de evolução
- ✅ Cards de resumo

### Estados de CMV

| Status | Descrição | Edição |
|--------|-----------|--------|
| rascunho | CMV em preenchimento | ✅ Sim |
| fechado | CMV finalizado | ✅ Sim |
| auditado | CMV auditado e aprovado | ❌ Não |

---

## 🔄 Workflow Recomendado

### Semana Atual (Automático)

1. Segunda-feira: Edge Function roda automaticamente
2. Sistema busca todos os dados disponíveis
3. CMV criado com status "rascunho"
4. Usuário revisa e ajusta campos manuais:
   - Consumo RH
   - Outros Ajustes
   - Ajuste Bonificações
   - CMV Teórico (meta)
5. Usuário muda status para "fechado"

### Semanas Passadas (Manual)

1. Acessar `/ferramentas/cmv-semanal`
2. Clicar em "Editar" na semana desejada
3. Ajustar valores manualmente
4. Salvar

### Auditoria

1. Após análise completa, marcar como "auditado"
2. CMVs auditados não podem mais ser editados

---

## 📐 Fórmulas de Cálculo

```
Estoque Inicial = Estoque Final da semana anterior

Consumo Sócios = Total Consumo Sócios × 0.35
Consumo Benefícios = (Mesa Benefícios + Chegadeira) × 0.33
Consumo ADM = Mesa ADM/Casa × 0.35
Consumo Artista = Mesa Banda/DJ × 0.35

Estoque Final = Cozinha + Bebidas + Drinks
Compras = CUSTO COMIDA + CUSTO BEBIDAS + CUSTO OUTROS + CUSTO DRINKS

CMV Real = (Estoque Inicial + Compras - Estoque Final) 
           - (Consumos) 
           + Ajuste Bonificações

Faturamento CMVível = Soma de vr_repique do ContaHub
CMV Limpo (%) = (CMV Real / Faturamento CMVível) × 100
Gap = CMV Limpo - CMV Teórico
```

---

## 🔧 Troubleshooting

### Importação não encontra dados

1. Verificar se o arquivo `google-service-account.json` existe
2. Verificar permissões na planilha
3. Verificar se o SPREADSHEET_ID está correto

### Edge Function não roda

1. Verificar se está deployed: `npx supabase functions list`
2. Verificar logs: `npx supabase functions logs cmv-semanal-auto`
3. Testar manualmente via curl

### Dados não batem com a planilha

1. Verificar mapeamento de linhas no script de importação
2. Verificar se as colunas da planilha mudaram
3. Executar novamente a importação (faz upsert, não duplica)

---

## 📞 Suporte

Para dúvidas ou problemas, verificar:
- Logs do Edge Function
- Console do navegador
- Tabela `cmv_semanal` no Supabase

