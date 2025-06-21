'use client'
import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:3001/transcribir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (response.ok) {
        setResultado(data)
      } else {
        setError(data.error || 'Ocurrió un error.')
      }
    } catch (err) {
      setError('Error de red o servidor no disponible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Transcriptor de YouTube 🎙️</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md bg-white p-6 rounded shadow">
        <label className="font-semibold">URL del video de YouTube:</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/..."
          className="border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Procesando...' : 'Transcribir'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {resultado && (
        <div className="mt-6 bg-white p-4 rounded shadow w-full max-w-md">
          <h2 className="font-bold mb-2">Resultado</h2>
          <p>Archivo generado: {resultado.file}</p>
        </div>
      )}
    </main>
  )
}
