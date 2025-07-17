'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function FatPorHoraPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_fatporhora">
      <EmConstrucao 
        titulo="Faturamento por Hora"
        descricao="Aná¡lise detalhada do faturamento por perá­odos horá¡rios e identificaá§á£o de picos de movimento."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
