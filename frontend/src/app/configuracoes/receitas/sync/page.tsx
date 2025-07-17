// Página de sincronização de receitas/insumos via upload de Excel/CSV
'use client'
import React, { useState } from 'react'

export default function SyncReceitasInsumosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [log, setLog] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setLog(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/sync-recipes-insumos', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setLog(data)
      if (!data.success) setError(data.error || 'Erro desconhecido')
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-2 py-4">
      <div className="w-full max-w-md card-dark p-6 shadow-lg rounded-xl">
        <h1 className="card-title-dark mb-4 text-center text-xl sm:text-2xl">Sincronizar Receitas e Insumos</h1>
        <p className="card-description-dark mb-6 text-center text-base sm:text-lg">
          Faça upload do arquivo Excel/CSV exportado do Google Sheets para atualizar receitas, insumos e vínculos.<br />
          <span className="font-semibold">Nenhum dado será apagado</span>, apenas atualizado ou inserido.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <label className="block">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Selecione o arquivo Excel/CSV:</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="input-dark mt-2 w-full"
              disabled={loading}
            />
          </label>
          {file && (
            <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
              <span className="font-semibold">Arquivo:</span> {file.name}
            </div>
          )}
          <button
            className="btn-primary-dark w-full py-3 text-lg rounded-lg disabled:opacity-60 mt-2"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Sincronizando...
              </span>
            ) : 'Sincronizar Dados'}
          </button>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg p-3 text-center font-semibold">
              {error}
            </div>
          )}
          {log && (
            <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg p-3 text-center font-semibold">
              <span className="block mb-1">Sincronização concluída!</span>
              <span className="block mb-1">{log.message}</span>
              <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <summary>Ver detalhes do log</summary>
                <pre className="overflow-x-auto whitespace-pre-wrap max-h-60">{JSON.stringify(log.logs, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          <span>Planilha modelo: <a href="https://docs.google.com/spreadsheets/d/1klPn-uVLKeoJ9UA9TkiSYqa7sV7NdUdDEELdgd1q4b8/edit" target="_blank" rel="noopener noreferrer" className="underline">Google Sheets</a></span>
        </div>
      </div>
    </div>
  )
} 
