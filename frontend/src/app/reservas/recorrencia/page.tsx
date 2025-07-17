'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
      titulo="AnÃ¡Â¡lise de RecorrÃ¡Âªncia"
      descricao="AnÃ¡Â¡lise de clientes recorrentes, frequÃ¡Âªncia de visitas e padrÃ¡Âµes de consumo."
      prioridade="media"
      previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 

