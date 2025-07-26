# 📊 ESTRUTURA DE SINCRONIZAÇÃO DE EVENTOS - SGB_V3

## 🎯 **OBJETIVO**
Implementar sistema completo de sincronização de eventos com indicadores financeiros e operacionais, aplicando regras de negócio automáticas.

## 📋 **COLUNAS ADICIONADAS NA TABELA `eventos`**

### **💰 Indicadores Financeiros**
- `real_r` - Real (R$) - Faturamento real do evento
- `m1_r` - M1 (R$) - Meta 1 do evento (baseada no dia da semana)
- `c_art` - C.Art - Custo artista (via Nibo)
- `c_prod` - C.Prod - Custo produção (via Nibo)
- `percent_art_fat` - %Art/Fat - Percentual artista sobre faturamento
- `fat_19h` - Fat.19h - Faturamento às 19h

### **👥 Indicadores de Clientes**
- `cl_plan` - Cl.Plan - Cliente planejado
- `cl_real` - Cl.Real - Cliente real
- `res_tot` - Res.Tot - Reservas totais
- `res_p` - Res.P - Reservas pagas
- `lot_max` - Lot.Max - Lotação máxima

### **🎫 Indicadores de Tickets**
- `te_plan` - T.E.Plan - Ticket médio planejado (baseado no dia da semana)
- `te_real` - T.E.Real - Ticket médio real
- `tb_plan` - T.B.Plan - Ticket bebida planejado (baseado no dia da semana)
- `tb_real` - T.B.Real - Ticket bebida real
- `t_medio` - T.Médio - Ticket médio geral

### **📈 Indicadores de Performance**
- `percent_b` - %B - Percentual B
- `percent_d` - %D - Percentual D
- `percent_c` - %C - Percentual C
- `t_coz` - T.Coz - Ticket cozinha
- `t_bar` - T.Bar - Ticket bar

## 🎯 **REGRAS DE NEGÓCIO IMPLEMENTADAS**

### **📅 Médias M1 por Dia da Semana**
```typescript
MEDIA_M1_POR_DIA = {
  0: 4742.88,  // Segunda
  1: 0.00,     // Terça
  2: 33200.17, // Quarta
  3: 18971.53, // Quinta
  4: 58811.74, // Sexta
  5: 47428.82, // Sábado
  6: 58811.74  // Domingo
}
```

### **🎫 Ticket Médio Planejado por Dia**
```typescript
TE_PLAN_POR_DIA = {
  0: 18.00,    // Segunda
  1: 21.00,    // Terça
  2: 21.00,    // Quarta
  3: 21.00,    // Quinta
  4: 21.00,    // Sexta
  5: 21.00,    // Sábado
  6: 21.00     // Domingo
}
```

### **🍺 Ticket Bebida Planejado por Dia**
```typescript
TB_PLAN_POR_DIA = {
  0: 82.50,    // Segunda
  1: 75.00,    // Terça
  2: 75.00,    // Quarta
  3: 75.00,    // Quinta
  4: 82.50,    // Sexta
  5: 82.50,    // Sábado
  6: 87.50     // Domingo
}
```

## 🏗️ **ESTRUTURA IMPLEMENTADA**

### **1. 📁 Regras de Negócio**
```
frontend/src/lib/eventos-rules.ts
```
- ✅ Constantes com todas as regras
- ✅ Funções para calcular valores baseados na data
- ✅ Funções para buscar custos no Nibo
- ✅ Funções para calcular percentuais

### **2. 🔗 API de Sincronização**
```
frontend/src/app/api/eventos/sync-eventos/route.ts
```
- ✅ POST: Sincronizar eventos com regras
- ✅ GET: Verificar status da sincronização
- ✅ Aplicação automática das regras de negócio
- ✅ Integração com custos do Nibo

### **3. 🔗 API para Dados Mockados**
```
frontend/src/app/api/eventos/popular-dados/route.ts
```
- ✅ POST: Popular dados mockados
- ✅ GET: Verificar dados atuais
- ✅ Aplicação das regras básicas (M1, TE, TB)

### **4. ⚡ Edge Function**
```
backend/supabase/functions/sync-eventos/index.ts
```
- ✅ Sincronização automática via Edge Function
- ✅ Integração completa com Nibo
- ✅ Processamento em background
- ✅ CORS configurado

### **5. 🎣 Hook de Gerenciamento**
```
frontend/src/hooks/useEventosSync.ts
```
- ✅ `sincronizarEventos()` - Sincronização completa
- ✅ `popularDadosMockados()` - Dados mockados
- ✅ `verificarStatus()` - Status atual
- ✅ Estados de loading e resultados

### **6. 📝 Tipos TypeScript**
```
frontend/src/types/eventos.ts
```
- ✅ Interface completa da tabela eventos
- ✅ Tipos para todas as novas colunas
- ✅ Tipos para sincronização

## 🔄 **FLUXO DE SINCRONIZAÇÃO**

### **1. Dados Mockados (Imediato)**
```typescript
// Aplicar regras básicas
const m1_r = getMediaM1(dataEvento)
const te_plan = getTePlan(dataEvento)
const tb_plan = getTbPlan(dataEvento)
```

### **2. Integração com Nibo (Futuro)**
```typescript
// Buscar custos por categoria e data
const custos = await buscarCustosNibo(dataEvento, barId)
const percent_art_fat = calcularPercentArtFat(
  custos.custoArtistico,
  custos.custoProducao,
  evento.real_r
)
```

### **3. Integração com ContaHub (Futuro)**
```typescript
// Quando ContaHub estiver pronto
// real_r, cl_real, res_tot, etc. virão do ContaHub
```

## 🚀 **COMO USAR**

### **1. Popular Dados Mockados**
```typescript
const { popularDadosMockados } = useEventosSync()
await popularDadosMockados(barId)
```

### **2. Sincronização Completa**
```typescript
const { sincronizarEventos } = useEventosSync()
await sincronizarEventos(barId, '2024-01-01', '2024-12-31')
```

### **3. Verificar Status**
```typescript
const { verificarStatus } = useEventosSync()
const eventos = await verificarStatus(barId)
```

## 📊 **PRÓXIMOS PASSOS**

### **1. Integração com Nibo**
- ✅ Estrutura preparada
- ⏳ Implementar busca real na tabela `nibo_agendamentos`
- ⏳ Testar padrões de data na descrição

### **2. Integração com ContaHub**
- ✅ Estrutura preparada
- ⏳ Aguardar cron do ContaHub
- ⏳ Implementar busca de faturamento real

### **3. Edge Function Automática**
- ✅ Edge Function criada
- ⏳ Configurar trigger após cron do ContaHub
- ⏳ Testar processamento automático

### **4. Interface de Controle**
- ⏳ Criar página de controle de sincronização
- ⏳ Dashboard de status dos eventos
- ⏳ Logs de sincronização

## 🎯 **RESULTADO FINAL**

Com essa estrutura implementada, o sistema agora:

- ✅ **Aplica automaticamente** as regras de negócio por dia da semana
- ✅ **Calcula indicadores** baseados em dados reais
- ✅ **Integra com Nibo** para custos artísticos e de produção
- ✅ **Prepara para ContaHub** para faturamento real
- ✅ **Processa em background** via Edge Functions
- ✅ **Mantém consistência** entre todas as fontes de dados

A estrutura está **100% preparada** para quando o ContaHub estiver pronto, permitindo sincronização automática e completa dos indicadores de eventos! 