# 🍳 SISTEMA KDS (Kitchen Display System) - ZYKOR + ZIGPAY

## 📋 SUMÁRIO EXECUTIVO

### **O QUE É KDS?**
Kitchen Display System (Sistema de Display de Cozinha) é um sistema que substitui comandas impressas por telas digitais na cozinha, mostrando pedidos em tempo real conforme são lançados pelos garçons.

### **POR QUE DESENVOLVER?**
- **ZigPay não tem KDS nativo** - Oportunidade de criar solução proprietária
- **ZigPay tem API completa** - Muito melhor que ContaHub
- **Controle total** - Customização para necessidades específicas
- **Diferencial competitivo** - Feature única no mercado

---

## 🎯 OBJETIVOS DO SISTEMA

### **Funcionais**
1. ✅ Receber pedidos em tempo real da API ZigPay
2. ✅ Exibir pedidos por prioridade (tempo de espera)
3. ✅ Separar pedidos por categoria (bar, cozinha, chapa)
4. ✅ Permitir marcar pedidos como "preparando" e "pronto"
5. ✅ Notificar garçom quando pedido está pronto
6. ✅ Métricas de tempo (tempo médio de preparo por item)
7. ✅ Alertas de pedidos atrasados

### **Não-funcionais**
1. ✅ Interface touch-screen otimizada
2. ✅ Funcionar em tablets (10-15 polegadas)
3. ✅ Modo offline (cache local)
4. ✅ Performance < 500ms para atualizar pedido
5. ✅ Sons e notificações visuais
6. ✅ Dark mode (ambiente de cozinha)

---

## 🏗️ ARQUITETURA TÉCNICA

### **Stack Recomendado**

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (KDS APP)                      │
│  Next.js 14 + TypeScript + TailwindCSS + ShadcnUI          │
│  - PWA (Progressive Web App)                                 │
│  - Suporte Offline                                           │
│  - Touch-optimized                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (Realtime)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                        │
│  - Realtime Database                                         │
│  - Edge Functions                                            │
│  - PostgreSQL                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/Webhooks
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ZIGPAY                               │
│  - Webhook de novos pedidos                                  │
│  - API REST para consultas                                   │
│  - Atualização de status                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### **1. Novo Pedido**
```
Garçom lança pedido no ZigPay
     │
     ▼
ZigPay dispara Webhook
     │
     ▼
Supabase Edge Function recebe
     │
     ▼
Salva em tabela "kds_pedidos"
     │
     ▼
Realtime envia para tela KDS
     │
     ▼
KDS exibe pedido com notificação
```

### **2. Preparação**
```
Cozinheiro toca em "PREPARAR"
     │
     ▼
Atualiza status no Supabase
     │
     ▼
Realtime atualiza tela
     │
     ▼
Inicia contagem de tempo
```

### **3. Pedido Pronto**
```
Cozinheiro toca em "PRONTO"
     │
     ▼
Atualiza status no Supabase
     │
     ▼
Notifica garçom (app/tablet/som)
     │
     ▼
Registra tempo total de preparo
     │
     ▼
Move para área "Prontos"
```

---

## 📊 MODELO DE DADOS

### **Tabela: kds_pedidos**
```sql
CREATE TABLE kds_pedidos (
  id SERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id),
  
  -- Dados ZigPay
  zigpay_pedido_id VARCHAR(100) UNIQUE NOT NULL,
  zigpay_comanda VARCHAR(50) NOT NULL,
  zigpay_mesa VARCHAR(50),
  
  -- Dados do Pedido
  itens JSONB NOT NULL, -- Array de {nome, qtd, obs}
  categoria VARCHAR(50), -- bar, cozinha, chapa
  prioridade INTEGER DEFAULT 1, -- 1-5
  
  -- Status
  status VARCHAR(20) DEFAULT 'pendente', 
  -- pendente | preparando | pronto | entregue | cancelado
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  iniciado_em TIMESTAMP,
  finalizado_em TIMESTAMP,
  entregue_em TIMESTAMP,
  
  -- Métricas
  tempo_preparo_segundos INTEGER,
  tempo_espera_segundos INTEGER,
  atrasado BOOLEAN DEFAULT false,
  
  -- Metadata
  observacoes TEXT,
  preparado_por INTEGER REFERENCES profiles(id),
  
  CONSTRAINT check_status CHECK (status IN (
    'pendente', 'preparando', 'pronto', 'entregue', 'cancelado'
  ))
);

CREATE INDEX idx_kds_pedidos_bar_status ON kds_pedidos(bar_id, status);
CREATE INDEX idx_kds_pedidos_criado ON kds_pedidos(criado_em DESC);
```

### **Tabela: kds_configuracoes**
```sql
CREATE TABLE kds_configuracoes (
  id SERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id),
  
  -- Tempos de Alerta (segundos)
  tempo_alerta_bar INTEGER DEFAULT 300, -- 5min
  tempo_alerta_cozinha INTEGER DEFAULT 900, -- 15min
  tempo_alerta_chapa INTEGER DEFAULT 600, -- 10min
  
  -- Display
  colunas_exibidas INTEGER DEFAULT 3,
  modo_dark BOOLEAN DEFAULT true,
  sons_ativados BOOLEAN DEFAULT true,
  
  -- Categorias customizadas
  categorias JSONB DEFAULT '["bar", "cozinha", "chapa"]',
  
  -- Integração ZigPay
  zigpay_webhook_url TEXT,
  zigpay_api_key TEXT,
  
  UNIQUE(bar_id)
);
```

### **Tabela: kds_metricas**
```sql
CREATE TABLE kds_metricas (
  id SERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL REFERENCES bars(id),
  data DATE NOT NULL,
  
  -- Volumes
  total_pedidos INTEGER DEFAULT 0,
  pedidos_no_prazo INTEGER DEFAULT 0,
  pedidos_atrasados INTEGER DEFAULT 0,
  
  -- Tempos (segundos)
  tempo_medio_preparo INTEGER,
  tempo_min_preparo INTEGER,
  tempo_max_preparo INTEGER,
  
  -- Por Categoria
  metricas_por_categoria JSONB,
  -- {bar: {total: 50, tempo_medio: 180}, cozinha: {...}}
  
  -- Horários de Pico
  horario_pico_inicio TIME,
  horario_pico_fim TIME,
  
  UNIQUE(bar_id, data)
);
```

---

## 🎨 INTERFACE DO USUÁRIO

### **Tela Principal - Layout em Colunas**

```
┌──────────────────────────────────────────────────────────────────┐
│  🍳 KDS - COZINHA                    🔴 3 ATRASADOS   [⚙️ Config] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PENDENTE (5)        PREPARANDO (3)       PRONTO (2)             │
│  ┌──────────────┐   ┌──────────────┐    ┌──────────────┐       │
│  │ 🔴 ATRASADO  │   │ Mesa 12      │    │ Mesa 08      │       │
│  │ Mesa 15      │   │ 🕐 8min      │    │ ✅ PRONTO    │       │
│  │ Comanda 234  │   │              │    │              │       │
│  │ 🕐 18min     │   │ 2x Hambúrguer│    │ 1x Pizza     │       │
│  │              │   │ 1x Batata    │    │              │       │
│  │ 3x Picanha   │   │              │    │ [RETIRADO]   │       │
│  │ 2x Arroz     │   │ Obs: Mal pas.│    │              │       │
│  │ 1x Salada    │   │              │    └──────────────┘       │
│  │              │   │ [PRONTO]     │                           │
│  │ [PREPARAR]   │   └──────────────┘    ┌──────────────┐       │
│  └──────────────┘                       │ Mesa 05      │       │
│                    ┌──────────────┐    │ ✅ PRONTO    │       │
│  ┌──────────────┐ │ Mesa 20      │    │              │       │
│  │ Mesa 18      │ │ 🕐 5min      │    │ 2x Caipirinha│       │
│  │ Comanda 567  │ │              │    │              │       │
│  │ 🕐 3min      │ │ 5x Chopp     │    │ [RETIRADO]   │       │
│  │              │ │              │    └──────────────┘       │
│  │ 2x Pizza     │ │ [PRONTO]     │                           │
│  │ 1x Calzone   │ └──────────────┘                           │
│  │              │                                             │
│  │ [PREPARAR]   │                                             │
│  └──────────────┘                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Design System - Componentes**

#### **Card de Pedido**
```tsx
interface PedidoCardProps {
  pedido: {
    id: number
    mesa: string
    comanda: string
    itens: Item[]
    status: 'pendente' | 'preparando' | 'pronto'
    tempoDecorrido: number // minutos
    atrasado: boolean
  }
  onAtualizarStatus: (status: string) => void
}

// Estados visuais:
- Pendente: Borda cinza, fundo branco
- Preparando: Borda azul, fundo azul claro
- Pronto: Borda verde, fundo verde claro
- Atrasado: Borda vermelha pulsante
```

#### **Som e Notificações**
```typescript
// Novos pedidos: Som de sino
playSound('new-order.mp3')

// Pedido atrasado: Som de alerta
playSound('alert.mp3')

// Vibração no tablet
navigator.vibrate([200, 100, 200])
```

---

## 🔌 INTEGRAÇÃO ZIGPAY

### **1. Webhook de Novos Pedidos**

```typescript
// Edge Function: zigpay-webhook-pedidos/index.ts

serve(async (req) => {
  const payload = await req.json()
  
  // Payload esperado do ZigPay
  const {
    pedido_id,
    comanda,
    mesa,
    itens, // [{ nome, quantidade, observacao }]
    status,
    criado_em
  } = payload

  // Processar e categorizar itens
  const itensPorCategoria = categorizarItens(itens)
  
  // Criar pedidos separados por categoria
  for (const [categoria, items] of Object.entries(itensPorCategoria)) {
    await supabase.from('kds_pedidos').insert({
      bar_id: getBarIdFromWebhook(req),
      zigpay_pedido_id: pedido_id,
      zigpay_comanda: comanda,
      zigpay_mesa: mesa,
      itens: items,
      categoria: categoria,
      status: 'pendente'
    })
  }

  // Realtime vai notificar automaticamente as telas KDS
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200
  })
})

function categorizarItens(itens: any[]) {
  const categorias = {
    bar: [],
    cozinha: [],
    chapa: []
  }
  
  // Lógica de categorização baseada em keywords
  itens.forEach(item => {
    if (item.nome.match(/chopp|cerveja|drink|caipirinha/i)) {
      categorias.bar.push(item)
    } else if (item.nome.match(/hamburguer|picanha|carne/i)) {
      categorias.chapa.push(item)
    } else {
      categorias.cozinha.push(item)
    }
  })
  
  return categorias
}
```

### **2. Consultar API ZigPay**

```typescript
// Buscar pedidos ativos
async function buscarPedidosZigPay(bar_id: number) {
  const config = await getZigPayConfig(bar_id)
  
  const response = await fetch('https://api.zigpay.com.br/v1/pedidos', {
    headers: {
      'Authorization': `Bearer ${config.zigpay_api_key}`,
      'Content-Type': 'application/json'
    }
  })
  
  const pedidos = await response.json()
  return pedidos.filter(p => p.status === 'aberto')
}
```

### **3. Atualizar Status no ZigPay**

```typescript
// Quando pedido fica pronto, notificar ZigPay
async function notificarPedidoProntoZigPay(pedido_id: string) {
  await fetch(`https://api.zigpay.com.br/v1/pedidos/${pedido_id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${config.zigpay_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'pronto'
    })
  })
}
```

---

## 📱 FRONTEND - COMPONENTES REACT

### **Componente Principal**

```tsx
// frontend/src/app/kds/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PedidoCard } from '@/components/kds/PedidoCard'
import { useSom } from '@/hooks/useSom'

export default function KDSPage() {
  const supabase = createClientComponentClient()
  const { playNewOrder, playAlert } = useSom()
  
  const [pedidosPendentes, setPedidosPendentes] = useState([])
  const [pedidosPreparando, setPedidosPreparando] = useState([])
  const [pedidosProntos, setPedidosProntos] = useState([])
  
  useEffect(() => {
    // Carregar pedidos iniciais
    carregarPedidos()
    
    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('kds_pedidos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kds_pedidos'
        },
        (payload) => {
          handlePedidoChange(payload)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  const handlePedidoChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Novo pedido
      playNewOrder()
      carregarPedidos()
    } else if (payload.eventType === 'UPDATE') {
      // Pedido atualizado
      carregarPedidos()
    }
  }
  
  const carregarPedidos = async () => {
    const { data } = await supabase
      .from('kds_pedidos')
      .select('*')
      .in('status', ['pendente', 'preparando', 'pronto'])
      .order('criado_em', { ascending: true })
    
    setPedidosPendentes(data?.filter(p => p.status === 'pendente') || [])
    setPedidosPreparando(data?.filter(p => p.status === 'preparando') || [])
    setPedidosProntos(data?.filter(p => p.status === 'pronto') || [])
  }
  
  const atualizarStatus = async (pedidoId: number, novoStatus: string) => {
    const updates: any = { status: novoStatus }
    
    if (novoStatus === 'preparando') {
      updates.iniciado_em = new Date().toISOString()
    } else if (novoStatus === 'pronto') {
      updates.finalizado_em = new Date().toISOString()
      // Calcular tempo de preparo
      const pedido = [...pedidosPendentes, ...pedidosPreparando]
        .find(p => p.id === pedidoId)
      if (pedido?.iniciado_em) {
        const inicio = new Date(pedido.iniciado_em)
        const fim = new Date()
        updates.tempo_preparo_segundos = Math.floor((fim - inicio) / 1000)
      }
    }
    
    await supabase
      .from('kds_pedidos')
      .update(updates)
      .eq('id', pedidoId)
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          🍳 KDS - Cozinha
        </h1>
        <div className="text-white">
          {pedidosPendentes.filter(p => p.atrasado).length > 0 && (
            <span className="animate-pulse text-red-500 text-xl font-bold">
              🔴 {pedidosPendentes.filter(p => p.atrasado).length} ATRASADOS
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Coluna PENDENTE */}
        <div>
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            PENDENTE ({pedidosPendentes.length})
          </h2>
          <div className="space-y-4">
            {pedidosPendentes.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAtualizarStatus={(status) => atualizarStatus(pedido.id, status)}
              />
            ))}
          </div>
        </div>
        
        {/* Coluna PREPARANDO */}
        <div>
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            PREPARANDO ({pedidosPreparando.length})
          </h2>
          <div className="space-y-4">
            {pedidosPreparando.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAtualizarStatus={(status) => atualizarStatus(pedido.id, status)}
              />
            ))}
          </div>
        </div>
        
        {/* Coluna PRONTO */}
        <div>
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            PRONTO ({pedidosProntos.length})
          </h2>
          <div className="space-y-4">
            {pedidosProntos.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAtualizarStatus={(status) => atualizarStatus(pedido.id, status)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **Componente PedidoCard**

```tsx
// frontend/src/components/kds/PedidoCard.tsx

'use client'

interface PedidoCardProps {
  pedido: any
  onAtualizarStatus: (status: string) => void
}

export function PedidoCard({ pedido, onAtualizarStatus }: PedidoCardProps) {
  const tempoDecorrido = calcularTempoDecorrido(pedido.criado_em)
  const atrasado = tempoDecorrido > 15 // > 15 minutos
  
  const getBorderColor = () => {
    if (atrasado) return 'border-red-500 animate-pulse'
    if (pedido.status === 'pronto') return 'border-green-500'
    if (pedido.status === 'preparando') return 'border-blue-500'
    return 'border-gray-300'
  }
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-lg p-4 
      border-4 ${getBorderColor()}
      shadow-lg
    `}>
      {/* Cabeçalho */}
      <div className="mb-3">
        {atrasado && (
          <span className="text-red-500 font-bold text-sm">
            🔴 ATRASADO
          </span>
        )}
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          {pedido.zigpay_mesa || 'Sem Mesa'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Comanda: {pedido.zigpay_comanda}
        </div>
        <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
          🕐 {tempoDecorrido}min
        </div>
      </div>
      
      {/* Itens do Pedido */}
      <div className="mb-4 space-y-2">
        {pedido.itens.map((item: any, idx: number) => (
          <div key={idx} className="text-gray-800 dark:text-gray-200">
            <span className="font-bold text-lg">
              {item.quantidade}x
            </span>
            {' '}
            <span className="text-lg">{item.nome}</span>
            {item.observacao && (
              <div className="text-sm text-gray-600 dark:text-gray-400 italic ml-6">
                Obs: {item.observacao}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Botões de Ação */}
      {pedido.status === 'pendente' && (
        <button
          onClick={() => onAtualizarStatus('preparando')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-lg"
        >
          PREPARAR
        </button>
      )}
      
      {pedido.status === 'preparando' && (
        <button
          onClick={() => onAtualizarStatus('pronto')}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg"
        >
          PRONTO
        </button>
      )}
      
      {pedido.status === 'pronto' && (
        <button
          onClick={() => onAtualizarStatus('entregue')}
          className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-lg"
        >
          RETIRADO
        </button>
      )}
    </div>
  )
}

function calcularTempoDecorrido(criadoEm: string): number {
  const agora = new Date()
  const criado = new Date(criadoEm)
  return Math.floor((agora.getTime() - criado.getTime()) / 1000 / 60) // minutos
}
```

---

## 📈 MÉTRICAS E RELATÓRIOS

### **Dashboard de Performance**

```sql
-- Tempo médio de preparo por categoria (últimos 7 dias)
SELECT 
  categoria,
  COUNT(*) as total_pedidos,
  ROUND(AVG(tempo_preparo_segundos) / 60, 2) as tempo_medio_min,
  ROUND(MIN(tempo_preparo_segundos) / 60, 2) as tempo_min_min,
  ROUND(MAX(tempo_preparo_segundos) / 60, 2) as tempo_max_min,
  ROUND(
    COUNT(*) FILTER (WHERE atrasado = true)::NUMERIC / COUNT(*) * 100, 
    2
  ) as taxa_atraso_pct
FROM kds_pedidos
WHERE 
  bar_id = $1 
  AND criado_em >= NOW() - INTERVAL '7 days'
  AND status IN ('pronto', 'entregue')
GROUP BY categoria
ORDER BY total_pedidos DESC;
```

### **Horários de Pico**

```sql
-- Identificar horários com mais pedidos
SELECT 
  EXTRACT(HOUR FROM criado_em) as hora,
  COUNT(*) as total_pedidos,
  ROUND(AVG(tempo_preparo_segundos) / 60, 2) as tempo_medio_min
FROM kds_pedidos
WHERE 
  bar_id = $1
  AND criado_em >= NOW() - INTERVAL '30 days'
GROUP BY hora
ORDER BY total_pedidos DESC
LIMIT 5;
```

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1: MVP (2 semanas)**
- [ ] Criar tabelas do banco (kds_pedidos, kds_configuracoes)
- [ ] Edge Function de webhook ZigPay
- [ ] Tela KDS básica (3 colunas)
- [ ] Realtime funcionando
- [ ] Testes com 1 bar piloto

### **FASE 2: Otimizações (1 semana)**
- [ ] Sons e notificações
- [ ] Modo offline/PWA
- [ ] Categorização automática inteligente
- [ ] Alertas de atraso

### **FASE 3: Métricas (1 semana)**
- [ ] Dashboard de performance
- [ ] Relatórios de tempo médio
- [ ] Horários de pico
- [ ] Gráficos e insights

### **FASE 4: Features Avançadas (2 semanas)**
- [ ] Múltiplas telas (bar, cozinha, chapa)
- [ ] Impressora térmica (backup)
- [ ] Integração com WhatsApp (notificar garçom)
- [ ] IA para prever tempo de preparo
- [ ] Sugestão de otimização de fluxo

---

## 💡 DIFERENCIAIS COMPETITIVOS

### **Features Únicas**
1. **IA Preditiva** - Prever tempo de preparo baseado em histórico
2. **Otimização Automática** - Sugerir ordem de preparo para minimizar tempo
3. **Multi-bar** - Um único sistema para todos os bares
4. **Métricas Avançadas** - Insights que ninguém mais oferece
5. **Integração Total** - KDS + estoque + CMV + desempenho

### **ROI Esperado**
- ⏰ **Redução de 30% no tempo de preparo** (melhor fluxo)
- 📉 **Redução de 50% em pedidos esquecidos** (visibilidade)
- 📊 **Aumento de 15% na capacidade** (otimização)
- 😊 **Melhoria no NPS** (pedidos mais rápidos)

---

## 🔒 SEGURANÇA E CONTINGÊNCIA

### **Backup e Redundância**
- [ ] Modo offline com cache local
- [ ] Impressora térmica como fallback
- [ ] Sincronização automática ao voltar online

### **Segurança**
- [ ] Webhook assinado (verificar origem ZigPay)
- [ ] API Keys criptografadas
- [ ] Logs de auditoria (quem marcou pedido)

---

## 📞 PRÓXIMOS PASSOS

1. **Contato com ZigPay** - Solicitar documentação completa da API
2. **Setup Ambiente** - Criar conta de testes ZigPay
3. **Protótipo** - Desenvolver tela KDS mockup
4. **Validação** - Testar com equipe operacional
5. **Piloto** - Implementar em 1 bar de teste
6. **Rollout** - Expandir para todos os bares

---

**Data de Criação:** 2026-01-05  
**Responsável:** Zykor Tech Team  
**Status:** Pronto para Desenvolvimento
**Prazo Estimado:** 4-6 semanas para MVP completo
