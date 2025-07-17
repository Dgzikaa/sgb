'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaOperacoesPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
        titulo="AnÃ¡Â¡lise de RecorrÃ¡Âªncia Operacional"
        descricao="AnÃ¡Â¡lise de padrÃ¡Âµes operacionais recorrentes e otimizaÃ¡Â§Ã¡Â£o de processos."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 

