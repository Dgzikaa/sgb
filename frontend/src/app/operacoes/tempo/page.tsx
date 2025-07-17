'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function TempoPage() {
  return (
    <ProtectedRoute requiredModule="analise_tempo">
      <EmConstrucao 
      titulo="GestÃ£o de Tempo"
      descricao="AnÃ¡lise de tempos de produÃ§Ã£o, eficiÃªncia operacional e otimizaÃ§Ã£o de processos."
      prioridade="baixa"
      previsao="1-2 meses"
    />
    </ProtectedRoute>
  )
} 
