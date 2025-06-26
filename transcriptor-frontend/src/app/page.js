'use client';

import { useState } from 'react';

export default function Home() {
  // ✅✔️ Estado para URL, transcripción, carga y errores
  const [url, setUrl] = useState('');
  const [transcripcion, setTranscripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // ✅✔️ Función manejarTranscripcion
  const manejarTranscripcion = async () => {
    setCargando(true);
    setTranscripcion('');
    setError('');

    try {
      const respuesta = await fetch('http://localhost:3001/transcribir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!respuesta.ok) {
        throw new Error('Error al transcribir el video');
      }

      const datos = await respuesta.json();
      setTranscripcion(datos.transcripcion);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Transcriptor de YouTube</h1>

      <input
        type="text"
        placeholder="Pega la URL del video de YouTube"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {/* ✅✔️ Botón "Transcribir" */}
        <button
          onClick={manejarTranscripcion}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={cargando || !url}
        >
          {cargando ? 'Procesando...' : 'Transcribir'}
        </button>

        {/* ✅✔️ Botón "🔄 Borrar URL" */}
        {url && (
          <button
            onClick={() => {
              setUrl('');
              setTranscripcion('');
              setError('');
            }}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            🔄 Borrar URL
          </button>
        )}
      </div>

      {/* ✅✔️ Manejo de errores */}
      {error && (
        <p className="mt-4 text-red-600">
          ⚠️ {error}
        </p>
      )}

      {/* ✅✔️ Sección de Transcripción + Botón Descargar */}
      {transcripcion && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📝 Transcripción:
          </h2>
          <div className="bg-white p-4 rounded shadow overflow-y-auto max-h-[400px] border border-gray-300 whitespace-pre-wrap text-sm">
            {transcripcion}
          </div>

          {/* ✅✔️ Botón "📥 Descargar TXT" */}
          <button
            onClick={() => {
              const blob = new Blob([transcripcion], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'transcripcion.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📥 Descargar TXT
          </button>
        </div>
      )}
    </main>
  );
}
