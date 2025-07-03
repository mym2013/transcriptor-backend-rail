const express = require('express');
const { createWriteStream } = require('fs');
const path = require('path');
require('dotenv').config();
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');

const app = express();

// 🚀 CORS manual global
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

  const audioPath = path.join(__dirname, 'audio.mp3');

  try {
    console.log(`Descargando audio de ${url}...`);
    // ✅ Descargar con ytdlp (sin spawn)
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath
    });
    console.log('Descarga completada.');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('Enviando audio a OpenAI...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text'
    });

    const outputPath = path.join(__dirname, 'transcripcion.txt');
    fs.writeFileSync(outputPath, transcription);
    console.log('Transcripción generada y guardada.');

    return res.json({ transcripcion: transcription });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error al procesar el video' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
