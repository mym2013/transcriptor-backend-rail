'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [transcripcion, setTranscripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    setHistory(saved);
  }, []);

  const manejarTranscripcion = async () => {
    if (!url) return;

    const newHistory = [url, ...history.filter((u) => u !== url)].slice(0, 5);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));
    setHistory(newHistory);

    setCargando(true);
    setTranscripcion('');
    setError('');

    try {
      const respuesta = await fetch('https://transcriptor-backend-vkdb.onrender.com/transcribir', {
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
        <button
          onClick={manejarTranscripcion}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={cargando || !url}
        >
          {cargando ? 'Procesando...' : 'Transcribir'}
        </button>

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

      {history.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold mb-2">🕘 Historial reciente:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {history.map((u, idx) => (
              <li
                key={idx}
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => setUrl(u)}
              >
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-600">
          ⚠️ {error}
        </p>
      )}

      {transcripcion && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📝 Transcripción:
          </h2>
          <div className="bg-white p-4 rounded shadow overflow-y-auto max-h-[400px] border border-gray-300 whitespace-pre-wrap text-sm">
            {transcripcion}
          </div>

          <button
            onClick={() => {
              const blob = new Blob([transcripcion], { type: 'text/plain' });
              const downloadUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = 'transcripcion.txt';
              a.click();
              URL.revokeObjectURL(downloadUrl);
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

