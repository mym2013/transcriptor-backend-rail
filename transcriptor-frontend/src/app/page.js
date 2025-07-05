'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [transcripcion, setTranscripcion] = useState('');
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarTranscripcion = async () => {
    setError('');
    setTranscripcion('');

    if (!url) {
      setError('Por favor ingresa una URL.');
      return;
    }

    setCargando(true);

    try {
      const response = await fetch('http://localhost:3001/transcribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Error al procesar la transcripción.');
      }

      const data = await response.json();
      setTranscripcion(data.transcripcion);
      setHistorial([url, ...historial.slice(0, 4)]);
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Transcriptor de YouTube</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Pega la URL de YouTube"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={manejarTranscripcion}
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {cargando ? 'Procesando...' : 'Transcribir'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 mb-4">⚠️ {error}</p>
      )}

      {transcripcion && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Transcripción:</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">{transcripcion}</pre>
        </div>
      )}

      {historial.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Historial reciente:</h2>
          <ul className="list-disc pl-5 space-y-1">
            {historial.map((item, index) => (
              <li key={index}>
                <a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}


