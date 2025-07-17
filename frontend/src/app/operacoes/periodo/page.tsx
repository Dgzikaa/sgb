'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PeriodoPage() {
  return (
    <ProtectedRoute requiredModule="analise_periodo">
      <EmConstrucao 
      titulo="AnÃ¡Â¡lise por PerÃ¡Â­odo"
      descricao="RelatÃ¡Â³rios e anÃ¡Â¡lises detalhadas por perÃ¡Â­odos especÃ¡Â­ficos com comparativos histÃ¡Â³ricos."
      prioridade="media"
      previsao="2-3 semanas"
    />
    </ProtectedRoute>
  )
} 

