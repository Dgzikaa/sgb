'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PagamentosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_pagamentos">
      <EmConstrucao 
        titulo="Gestá£o de Pagamentos"
        descricao="Controle de pagamentos, recebimentos: any, formas de pagamento e conciliaá§á£o financeira."
        prioridade="alta"
        previsao="1-2 semanas"
      />
    </ProtectedRoute>
  )
} 
