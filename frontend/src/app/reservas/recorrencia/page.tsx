'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
      titulo="AnÃ¡lise de RecorrÃªncia"
      descricao="AnÃ¡lise de clientes recorrentes, frequÃªncia de visitas e padrÃµes de consumo."
      prioridade="media"
      previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
