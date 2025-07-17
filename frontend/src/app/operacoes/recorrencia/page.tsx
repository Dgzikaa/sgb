'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaOperacoesPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
        titulo="Aná¡lise de Recorráªncia Operacional"
        descricao="Aná¡lise de padráµes operacionais recorrentes e otimizaá§á£o de processos."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
