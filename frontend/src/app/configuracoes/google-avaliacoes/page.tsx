'use client';

import { useState } from 'react'

export default function GoogleAvaliacoesConfig() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleRun = async () => {
    setLoading(true)
    setResult(null)
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const res = await fetch('/api/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: 1, automatic: true, date: yesterday })
      })
      const data = await res.json()
      if (data.success) {
        setResult('úÖ Coleta realizada com sucesso!')
      } else {
        setResult('ùå Erro: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (e) {
      setResult('ùå Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <h1 className="card-title-dark mb-4">Google Avalia·ß·µes - Configura·ß·£o</h1>
          <p className="card-description-dark mb-6">Clique no bot·£o abaixo para rodar manualmente a coleta das avalia·ß·µes do Google para o dia anterior.</p>
          <button className="btn-primary-dark px-4 py-2" onClick={handleRun} disabled={loading}>
            {loading ? 'Executando...' : 'Rodar coleta de avalia·ß·µes (ontem)'}
          </button>
          {result && <div className="mt-4 card-description-dark">{result}</div>}
        </div>
      </div>
    </div>
  )
} 
