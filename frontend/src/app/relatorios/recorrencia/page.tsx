'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaOperacoesPage() {
  return (
    <ProtectedRoute requiredModule="relatorios">
      <EmConstrucao 
        titulo="Análise de Recorrência Operacional"
        descricao="Análise de padrões operacionais recorrentes e otimização de processos."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
