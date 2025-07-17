'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function TempoPage() {
  return (
    <ProtectedRoute requiredModule="analise_tempo">
      <EmConstrucao 
      titulo="GestÃ¡Â£o de Tempo"
      descricao="AnÃ¡Â¡lise de tempos de produÃ¡Â§Ã¡Â£o, eficiÃ¡Âªncia operacional e otimizaÃ¡Â§Ã¡Â£o de processos."
      prioridade="baixa"
      previsao="1-2 meses"
    />
    </ProtectedRoute>
  )
} 

