'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function NFsPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_nfs">
      <EmConstrucao 
        titulo="Notas Fiscais EletrÃ´nicas"
        descricao="EmissÃ£o, consulta e gestÃ£o de notas fiscais eletrÃ´nicas integradas ao sistema."
        prioridade="baixa"
        previsao="2-3 meses"
      />
    </ProtectedRoute>
  )
} 
