'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PagamentosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_pagamentos">
      <EmConstrucao 
        titulo="Gestão de Pagamentos"
        descricao="Controle de pagamentos, recebimentos, formas de pagamento e conciliação financeira."
        prioridade="alta"
        previsao="1-2 semanas"
      />
    </ProtectedRoute>
  )
} 
