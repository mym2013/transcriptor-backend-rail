const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { spawn } = require('child_process');

const app = express();

/**
 * ===========================
 * 🔹 CORS CONFIGURACIÓN LOCAL
 * ===========================
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

/**
 * ===========================
 * 🔹 Endpoint para Transcribir
 * ===========================
 */
app.post('/transcribir', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL no proporcionada' });
  }

  const audioPath = path.join(__dirname, 'audio.mp3');

  console.log('✅ Descargando audio con yt-dlp...');
  const ytdlp = spawn('yt-dlp', [
    url,
    '--extract-audio',
    '--audio-format', 'mp3',
    '--force-overwrites',
    '--no-cache-dir',
    '-o', 'audio.mp3'
  ]);

  ytdlp.stdout.on('data', data => {
    console.log(`yt-dlp stdout: ${data}`);
  });

  ytdlp.stderr.on('data', data => {
    console.error(`yt-dlp stderr: ${data}`);
  });

  ytdlp.on('close', async code => {
    if (code !== 0) {
      console.error(`yt-dlp terminó con código ${code}`);
      return res.status(500).json({ error: 'Error al descargar audio' });
    }

    try {
      console.log('✅ Audio descargado correctamente.');
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      console.log('✅ Transcribiendo audio con Whisper...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'text'
      });

      fs.writeFileSync(path.join(__dirname, 'transcripcion.txt'), transcription);
      console.log('✅ Transcripción completa.');

      return res.json({ transcripcion: transcription });

    } catch (err) {
      console.error('Error al transcribir:', err);
      return res.status(500).json({ error: 'Error al transcribir el audio' });
    }
  });
});

/**
 * ===========================
 * 🔹 Endpoint para Resumir
 * ===========================
 */
app.post('/resumir', async (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'Texto no proporcionado' });
  }

  try {
    console.log('✅ Solicitando resumen ejecutivo a OpenAI...');
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // ✅ Usamos GPT-3.5 para evitar errores
      messages: [
        {
          role: 'system',
          content: `Eres un asistente que crea resúmenes ejecutivos detallados de transcripciones. Quiero que generes un resumen estructurado y proporcional a la longitud del texto original. 
- Si la transcripción es breve (menos de 300 palabras), resume en 1 párrafo.
- Si es media (300–2000 palabras), resume en 3–5 párrafos.
- Si es extensa (más de 2000 palabras), resume detalladamente en varios apartados o puntos clave.
No omitas nombres ni detalles relevantes. Usa un estilo claro y profesional.`
        },
        {
          role: 'user',
          content: texto
        }
      ]
    });

    const resumen = completion.choices[0].message.content;
    console.log('✅ Resumen generado correctamente.');
    res.json({ resumen });

  } catch (err) {
    console.error('Error al generar el resumen:', err);
    res.status(500).json({ error: 'Error al generar el resumen' });
  }
});

/**
 * ===========================
 * 🔹 Levantar Servidor
 * ===========================
 */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

