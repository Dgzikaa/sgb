'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaOperacoesPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
        titulo="AnÃ¡lise de RecorrÃªncia Operacional"
        descricao="AnÃ¡lise de padrÃµes operacionais recorrentes e otimizaÃ§Ã£o de processos."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
