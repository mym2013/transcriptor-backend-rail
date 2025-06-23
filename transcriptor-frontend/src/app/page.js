"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [transcripcion, setTranscripcion] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setTranscripcion("");

    try {
      const res = await fetch("http://localhost:3001/transcribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Archivo generado: ${data.file}`);
        // ✅ Aquí accedemos al backend directamente
        const txtRes = await fetch("http://localhost:3001/transcripcion.txt");
        const textoPlano = await txtRes.text();
        setTranscripcion(textoPlano);
      } else {
        setMessage("❌ " + (data.error || "Error al transcribir el audio"));
      }
    } catch (err) {
      setMessage("❌ Error de red o servidor no disponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Transcriptor de YouTube 🎙️
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white p-6 rounded shadow">
        <label className="block text-gray-700 font-bold mb-2">
          URL del video de YouTube:
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 mb-4 border border-gray-400 rounded text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Procesando..." : "Transcribir"}
        </button>
      </form>

      {message && (
        <div className="mt-4 text-center text-sm font-medium text-gray-700">
          {message}
        </div>
      )}

      {transcripcion && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📝 Transcripción:
          </h2>
          <div className="bg-white p-4 rounded shadow overflow-y-auto max-h-[400px] border border-gray-300 whitespace-pre-wrap text-sm">
            {transcripcion}
          </div>
        </div>
      )}
    </main>
  );
}
