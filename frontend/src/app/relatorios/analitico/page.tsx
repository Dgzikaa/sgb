'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function AnaliticoPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_analitico">
      <EmConstrucao 
        titulo="Dashboard AnalÃ­tico"
        descricao="AnÃ¡lises avanÃ§adas com grÃ¡ficos, mÃ©tricas de performance e insights detalhados do seu negÃ³cio."
        prioridade="alta"
        previsao="2-3 semanas"
      />
    </ProtectedRoute>
  )
} 
