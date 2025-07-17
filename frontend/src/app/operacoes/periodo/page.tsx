'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PeriodoPage() {
  return (
    <ProtectedRoute requiredModule="analise_periodo">
      <EmConstrucao 
      titulo="AnÃ¡lise por PerÃ­odo"
      descricao="RelatÃ³rios e anÃ¡lises detalhadas por perÃ­odos especÃ­ficos com comparativos histÃ³ricos."
      prioridade="media"
      previsao="2-3 semanas"
    />
    </ProtectedRoute>
  )
} 
