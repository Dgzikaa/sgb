'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function FatPorHoraPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_fatporhora">
      <EmConstrucao 
        titulo="Faturamento por Hora"
        descricao="AnÃ¡lise detalhada do faturamento por perÃ­odos horÃ¡rios e identificaÃ§Ã£o de picos de movimento."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
