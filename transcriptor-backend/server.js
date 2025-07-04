const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdlp = require('yt-dlp-exec'); // ✅ Nuevo import limpio
require('dotenv').config();

const app = express();

// 🚀 CORS seguro para Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://transcriptor-app.vercel.app');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

app.post('/transcribir', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL no proporcionada' });
  }

  // Ruta absoluta al archivo MP3
  const audioPath = path.join(__dirname, 'audio.mp3');

  try {
    console.log('Descargando audio con yt-dlp...');
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath
    });
    console.log('✅ Audio descargado correctamente.');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('Transcribiendo audio con Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text'
    });

    console.log('✅ Transcripción completada.');

    const outputPath = path.join(__dirname, 'transcripcion.txt');
    fs.writeFileSync(outputPath, transcription);

    return res.json({ transcripcion: transcription });

  } catch (err) {
    console.error('❌ Error en proceso:', err);
    return res.status(500).json({ error: 'Error al procesar el video. Revisa logs.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
