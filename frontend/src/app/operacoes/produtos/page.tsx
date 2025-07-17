'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function ProdutosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_produtos">
      <EmConstrucao 
      titulo="GestÃ£o de Produtos"
      descricao="Cadastro, ediÃ§Ã£o e controle de produtos, receitas, custos e margem de lucro."
      prioridade="alta"
      previsao="1 semana"
    />
    </ProtectedRoute>
  )
} 
