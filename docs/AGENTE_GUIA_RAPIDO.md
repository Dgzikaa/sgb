# 🚀 Guia Rápido - Agente Inteligente Zykor

## ⚡ Início Rápido (5 minutos)

### 1. Configuração Inicial (Primeira vez)

Execute o setup para seu bar:

```typescript
// Via terminal (substituir bar_id)
await fetch('https://[projeto].supabase.co/functions/v1/agente-test-setup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer [seu-token]',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ bar_id: 1 })
})
```

✅ Isso irá:
- Criar todas as configurações necessárias
- Executar primeira análise
- Gerar insights iniciais

### 2. Acesse o Dashboard

Vá para: **`/visao-geral/agente-inteligente`**

Você verá:
- 📊 **Insights Novos** - Descobertas sobre seu negócio
- ⚠️ **Alertas Ativos** - Problemas que precisam atenção
- 🧠 **Total de Insights** - Histórico completo
- ⏰ **Última Análise** - Quando foi a última varredura

### 3. Execute uma Análise Manual

Clique no botão **"Executar Análise"** no dashboard

O agente irá:
1. Varrer todas as tabelas do banco de dados
2. Analisar dados operacionais, financeiros, experiência e equipe
3. Gerar insights acionáveis
4. Criar alertas para problemas críticos

⏱️ Tempo médio: 5-10 segundos

---

## 📱 Funcionalidades Principais

### 🎯 Dashboard de Insights

**Aba "Insights":**
- Veja todas as descobertas do agente
- Filtre por categoria (operacional, financeiro, etc.)
- Filtre por tipo (oportunidade, alerta, tendência)
- Marque como visualizado
- Arquive insights resolvidos

**Aba "Alertas":**
- Alertas críticos que precisam ação imediata
- Marque como lido
- Veja insights relacionados

**Aba "Histórico":**
- Todas as análises executadas
- Tempo de execução
- Quantidade de insights/alertas gerados

### ⚙️ Configurações

Vá para: **`/configuracoes/agente-inteligente`**

Configure 4 tipos de agente:

1. **🔧 Operacional**
   - Monitora checklists, tarefas, execuções
   - Alerta sobre pendências e baixa conclusão

2. **💰 Financeiro**
   - Analisa vendas, faturamento, ticket médio
   - Detecta quedas ou crescimentos significativos

3. **⭐ Experiência**
   - Acompanha NPS, satisfação, feedbacks
   - Identifica problemas com clientes

4. **👥 Equipe**
   - Avalia produtividade e engajamento
   - Sugere melhorias na gestão

**Para cada agente você pode:**
- ✅ Ativar/Desativar
- ⏰ Definir frequência de análise (5min a 1 dia)
- 🔔 Habilitar/Desabilitar notificações

### 📊 Métricas

Vá para: **`/visao-geral/metricas-agente`**

Visualize:
- Gráficos de evolução das métricas
- Comparações com períodos anteriores
- Tendências de crescimento/queda
- Tabela completa de métricas coletadas

---

## 💡 Exemplos de Insights Gerados

### Operacional
```
❌ Alto número de checklists pendentes
📝 Existem 12 checklists pendentes. Isso pode indicar sobrecarga da equipe.
💡 Ação: Revisar prioridades e redistribuir tarefas entre a equipe
```

### Financeiro
```
📉 Queda significativa no faturamento
💰 O faturamento caiu 15.3% em relação à semana anterior.
💡 Ação: Analisar causas da queda: eventos cancelados, problemas operacionais
```

### Experiência
```
⚠️ NPS precisa de atenção
⭐ NPS em 32%. É necessário trabalhar na satisfação dos clientes.
💡 Ação: Analisar feedbacks negativos e implementar melhorias urgentes
```

### Equipe
```
📊 Baixa produtividade da equipe
👥 Média de 3.2 execuções por funcionário nos últimos 7 dias.
💡 Ação: Verificar se há sobrecarga ou falta de engajamento
```

---

## 🔔 Notificações em Tempo Real

O componente `NotificacoesAgente` pode ser integrado em qualquer página:

```tsx
import NotificacoesAgente from '@/components/agente/NotificacoesAgente'

// No seu header/navbar
<NotificacoesAgente barId={barId} />
```

Mostra:
- Badge com número de alertas não lidos
- Dropdown com alertas recentes
- Botão "Marcar todos como lido"
- Link direto para o dashboard

---

## 📡 APIs REST

### Executar Scan
```typescript
POST /api/agente/scan
{
  "bar_id": 1,
  "tipo_scan": "completo"
}
```

### Listar Insights
```typescript
GET /api/agente/insights?bar_id=1&categoria=operacional&visualizado=false
```

### Listar Alertas Não Lidos
```typescript
GET /api/agente/alertas?bar_id=1&lido=false
```

### Buscar Métricas Financeiras
```typescript
GET /api/agente/metricas?bar_id=1&categoria=financeiro
```

---

## 🎨 Tipos de Insights

| Tipo | Cor | Descrição |
|------|-----|-----------|
| 🎯 **Oportunidade** | Verde | Pontos fortes para potencializar |
| ⚠️ **Alerta** | Amarelo | Problemas que precisam atenção |
| 📈 **Tendência** | Azul | Padrões identificados |
| 🔴 **Anomalia** | Vermelho | Comportamentos fora do normal |

## 📊 Níveis de Impacto

| Impacto | Badge | Ação |
|---------|-------|------|
| 🟢 **Baixo** | Info | Observar |
| 🟡 **Médio** | Warning | Planejar ação |
| 🟠 **Alto** | Error | Agir em breve |
| 🔴 **Crítico** | Critical | Ação imediata |

---

## ❓ FAQ

### Quando o agente executa análises automáticas?
Conforme a frequência configurada em cada tipo de agente (padrão: 1 hora).

### Posso executar análises manuais?
Sim! Clique em "Executar Análise" no dashboard a qualquer momento.

### Os insights são privados por bar?
Sim! Cada bar só vê seus próprios insights através de Row Level Security.

### Como funciona o aprendizado do agente?
Cada análise gera dados de aprendizado que são usados para melhorar insights futuros.

### Posso desativar um tipo de agente?
Sim! Vá em Configurações e desative qualquer tipo que não quiser monitorar.

### As notificações são em tempo real?
Sim! O componente verifica novos alertas a cada 30 segundos.

---

## 🚨 Troubleshooting

### Não vejo insights após análise
- Verifique se há dados suficientes nas tabelas
- Execute análise com `tipo_scan: "completo"`
- Aguarde 5-10 segundos para processamento

### Alertas não aparecem
- Confirme que `notificacoes_ativas: true` nas configurações
- Verifique se há insights com impacto alto/crítico

### Erro ao executar scan
- Verifique se o bar_id está correto
- Confirme que o usuário tem acesso ao bar
- Veja logs da Edge Function no Supabase

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase: Edge Functions > agente-scanner/analyzer
2. Consulte a documentação completa: `docs/AGENTE_INTELIGENTE_ZYKOR.md`
3. Contate o suporte técnico

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0.0
