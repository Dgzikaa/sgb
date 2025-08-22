# 🔧 Sistema de Logging - SGB v2

## 🎯 Visão Geral

O novo sistema de logging foi implementado para **reduzir a poluição de logs** durante o desenvolvimento, mantendo logs limpos e focados apenas no essencial.

## 🚀 Comandos Rápidos

```bash
# ✅ Desenvolvimento silencioso (RECOMENDADO)
npm run dev:quiet

# 🔍 Desenvolvimento com logs verbosos (apenas para debug)
npm run dev:verbose

# 📊 Ver status atual dos logs
npm run logs:status

# 🔴 Desativar logs verbosos
npm run logs:off

# 🟢 Ativar logs verbosos
npm run logs:on
```

## 📋 Estados de Logging

### 🔴 Modo Silencioso (Padrão)
- **Variável**: `NEXT_PUBLIC_VERBOSE_LOGS=false`
- **Comportamento**: Apenas erros críticos são exibidos
- **Recomendado para**: Desenvolvimento normal, foco no código
- **Ativa com**: `npm run dev:quiet`

### 🟢 Modo Verbose (Debug)
- **Variável**: `NEXT_PUBLIC_VERBOSE_LOGS=true`
- **Comportamento**: Todos os logs de debug são exibidos
- **Recomendado para**: Debugar problemas específicos
- **Ativa com**: `npm run dev:verbose`

## 🏗️ Implementação

### Frontend
```typescript
// ✅ ANTES (sempre logava)
console.log('🔍 Buscando dados...');

// ✅ DEPOIS (controlado por variável)
if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
  console.log('🔍 Buscando dados...');
}
```

### Usando o Logger Customizado
```typescript
import { logger, devLog, quietLogger } from '@/lib/logger';

// Para logs de desenvolvimento controlados
devLog('Debug info here'); // Só aparece se VERBOSE_LOGS=true

// Para logs críticos apenas
quietLogger.log('CRITICAL: Something important'); // Apenas logs críticos

// Para logs de produção
logger.error('Always logged', error); // Sempre logado (Sentry)
```

## 📁 Arquivos Principais Afetados

- ✅ `frontend/src/app/estrategico/planejamento-comercial/page.tsx`
- ✅ `frontend/src/contexts/BarContext.tsx`
- ✅ `frontend/src/lib/api-client.ts`
- ✅ `frontend/src/app/api/estrategico/desempenho/route.ts`
- ✅ `frontend/src/lib/logger.ts` (sistema principal)

## 🎮 Como Usar no Dia a Dia

### Desenvolvimento Normal
```bash
# Inicie sempre assim para desenvolvimento limpo
npm run dev:quiet
```

### Quando Precisar Debuggar
```bash
# Ative logs temporariamente
npm run logs:on
npm run dev

# Após debuggar, desative novamente
npm run logs:off
```

### Build de Produção
```bash
# Build sempre com logs silenciosos
npm run build:production
```

## 🔍 Tipos de Logs

### 🟢 Sempre Logados
- Erros críticos (`console.error`)
- Falhas de API
- Problemas de autenticação

### 🟡 Controlados por VERBOSE_LOGS
- Debug de dados (`🔍`)
- Info de carregamento (`📊`)
- Detalhes de contexto (`✅`)

### 🔴 Removidos Completamente
- Logs muito específicos (ex: debug de datas específicas)
- Logs repetitivos desnecessários
- Debug de desenvolvimento interno

## ⚙️ Configuração do .env.local

```bash
# Configuração recomendada para desenvolvimento
NEXT_PUBLIC_VERBOSE_LOGS=false
NEXT_PUBLIC_DEBUG_API=false
NEXT_PUBLIC_DEBUG_CONTEXT=false
NEXT_PUBLIC_PERFORMANCE_LOGS=false
```

## 🚨 Regras Importantes

1. **Produção sempre limpa**: Logs de debug NUNCA aparecem em produção
2. **Desenvolvimento silencioso por padrão**: Reduz distração
3. **Debug sob demanda**: Ative apenas quando necessário
4. **Erros sempre visíveis**: Problemas críticos sempre logados

## 📊 Monitoramento

### Status dos Logs
```bash
npm run logs:status
```

### Saída esperada:
```
📊 STATUS DOS LOGS DE DESENVOLVIMENTO:
🔍 Verbose Logs: 🔴 DESATIVADO

📝 Para alterar:
  • Ativar logs:   npm run logs:on
  • Desativar logs: npm run logs:off
```

## 🔄 Migração de Código Legado

Para migrar logs antigos:

```typescript
// ❌ ANTES
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// ✅ DEPOIS  
if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
  console.log('Debug info');
}

// ✅ OU MELHOR
import { devLog } from '@/lib/logger';
devLog('Debug info'); // Automaticamente controlado
```

---

## 🎯 Resultado Final

- ✅ **Desenvolvimento mais limpo** - sem poluição de logs
- ✅ **Debug sob demanda** - ative quando precisar
- ✅ **Produção otimizada** - zero logs desnecessários
- ✅ **Controle fácil** - comandos npm simples
- ✅ **Backward compatible** - código antigo continua funcionando
