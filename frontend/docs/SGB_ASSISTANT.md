# 🤖 SGB Assistant

## Visão Geral

O **SGB Assistant** é um assistente inteligente integrado ao sistema SGB que utiliza análise de dados em tempo real para fornecer insights, detectar anomalias e sugerir melhorias para o negócio.

## 🎯 Funcionalidades Atuais

### ✅ Implementado (Fase 1)

- **Interface de Chat**: Chat em tempo real estilo Cursor
- **Comandos Básicos**: Análise de vendas do dia atual
- **Sistema de Feedback**: Botões 👍👎 para aprendizado
- **Persistência**: Estado salvo no localStorage
- **Responsivo**: Funciona em desktop e mobile
- **Comandos Rápidos**: Botões para ações comuns

### 🚧 Em Desenvolvimento (Fase 2)

- **Análise Semanal**: Comparativos e tendências
- **Detecção de Anomalias**: Alertas automáticos
- **Sugestões Inteligentes**: Recomendações baseadas em dados
- **Integração com IA**: OpenAI/Claude para processamento avançado

### 🔮 Planejado (Fase 3)

- **Aprendizado Adaptativo**: Melhora com uso
- **Previsões**: Projeções de vendas
- **Relatórios Automáticos**: Geração de insights
- **Integração com WhatsApp**: Notificações externas

## 🏗️ Arquitetura

### Componentes Principais

```
frontend/src/
├── components/
│   ├── SGBAssistant.tsx      # Componente principal do chat
│   └── AssistantButton.tsx   # Botão flutuante
├── hooks/
│   └── useSGBAssistant.ts    # Hook para gerenciar estado
└── styles/
    └── assistant.css         # Estilos específicos
```

### Fluxo de Dados

1. **Input do Usuário** → `processUserInput()`
2. **Análise de Comando** → Funções específicas (`analyzeToday`, etc.)
3. **Consulta ao Banco** → Supabase queries
4. **Processamento** → Formatação e insights
5. **Resposta** → Exibição no chat
6. **Feedback** → Armazenamento para aprendizado

## 🔧 Como Usar

### Comandos Disponíveis

| Comando | Descrição | Status |
|---------|-----------|--------|
| `💰 Vendas hoje` | Análise do faturamento atual | ✅ Ativo |
| `📊 Análise semana` | Relatório semanal | 🚧 Em desenvolvimento |
| `🔍 Anomalias` | Detecção de padrões estranhos | 🚧 Em desenvolvimento |
| `💡 Sugestões` | Recomendações de melhoria | 🚧 Em desenvolvimento |

### Exemplos de Uso

```typescript
// Análise de vendas do dia
"vendas hoje" → Retorna faturamento, transações e ticket médio

// Perguntas livres (futuro)
"Como estão as vendas desta semana?"
"Qual o melhor horário para promoções?"
"Detectou alguma anomalia hoje?"
```

## 🛠️ Como Expandir

### Adicionando Novos Comandos

1. **Editar `processUserInput()`**:
```typescript
if (lowercaseInput.includes('novo comando')) {
  return await novaFuncao(barInfo)
}
```

2. **Criar função de análise**:
```typescript
async function novaFuncao(barInfo: any) {
  // Consultar dados
  const { data } = await supabase.from('tabela').select('*')
  
  // Processar e retornar
  return {
    content: "Resultado da análise...",
    metadata: { command: 'novo_comando', data }
  }
}
```

3. **Adicionar botão rápido**:
```typescript
// Em SGBAssistant.tsx
['💰 Vendas hoje', '📊 Análise semana', '🆕 Novo Comando']
```

### Integrando IA Externa

```typescript
// Exemplo com OpenAI
import OpenAI from 'openai'

async function processWithAI(userInput: string, context: any) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Você é um assistente especializado em análise de dados de bares. 
                 Contexto atual: ${JSON.stringify(context)}`
      },
      {
        role: "user", 
        content: userInput
      }
    ]
  })
  
  return response.choices[0].message.content
}
```

### Sistema de Aprendizado

```typescript
// Salvar feedback para treinamento
async function saveFeedback(messageId: string, feedback: 'positive' | 'negative', context: any) {
  await supabase.from('assistant_feedback').insert({
    message_id: messageId,
    feedback,
    user_input: context.userInput,
    assistant_response: context.response,
    bar_id: context.barId,
    created_at: new Date()
  })
}
```

## 📊 Métricas e Analytics

### Dados Coletados

- **Comandos mais usados**
- **Taxa de feedback positivo**
- **Tempo de resposta**
- **Padrões de uso por bar**

### Queries Úteis

```sql
-- Comandos mais populares
SELECT metadata->>'command' as comando, COUNT(*) as uso
FROM assistant_conversations 
GROUP BY comando 
ORDER BY uso DESC;

-- Feedback por comando
SELECT 
  metadata->>'command' as comando,
  AVG(CASE WHEN metadata->>'feedback' = 'positive' THEN 1 ELSE 0 END) as taxa_positiva
FROM assistant_conversations 
WHERE metadata->>'feedback' IS NOT NULL
GROUP BY comando;
```

## 🔐 Segurança e Privacidade

### Dados Protegidos

- **Não armazenar**: Dados financeiros sensíveis em logs
- **Criptografar**: Conversas com informações críticas
- **Anonimizar**: Dados para treinamento de IA

### Implementação

```typescript
// Sanitizar dados antes de enviar para IA externa
function sanitizeForAI(data: any) {
  return {
    ...data,
    // Remover campos sensíveis
    cpf: undefined,
    senha: undefined,
    // Anonimizar valores
    faturamento: data.faturamento > 0 ? 'alto' : 'baixo'
  }
}
```

## 🚀 Roadmap

### Próximos Passos

1. **Semana 1-2**: Implementar análise semanal completa
2. **Semana 3-4**: Sistema de detecção de anomalias
3. **Mês 2**: Integração com OpenAI/Claude
4. **Mês 3**: Sistema de aprendizado adaptativo
5. **Mês 4**: Previsões e projeções

### Ideias Futuras

- **Integração com WhatsApp**: Notificações automáticas
- **Dashboard do Assistant**: Métricas de uso
- **API Externa**: Permitir integração com outros sistemas
- **Modo Voz**: Comandos por voz
- **Relatórios Automáticos**: PDFs gerados automaticamente

## 🤝 Contribuindo

### Como Melhorar

1. **Teste os comandos** e dê feedback
2. **Sugira novos comandos** baseados no uso real
3. **Reporte bugs** ou comportamentos estranhos
4. **Contribua com código** para novas funcionalidades

### Estrutura de Commits

```
feat(assistant): adicionar comando de análise mensal
fix(assistant): corrigir erro na consulta de vendas
docs(assistant): atualizar documentação de comandos
```

---

**Desenvolvido com ❤️ para o SGB - Sistema de Gestão de Bares** 