const express = require('express');
// Si quieres dejar cors instalado, no pasa nada
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// yt-dlp-exec en vez de spawn
const ytdlp = require('yt-dlp-exec');

const app = express();

// 🚀 CORS manual que permite tu frontend en Vercel
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
    console.log('Descargando audio de:', url);

    // Descargar audio usando yt-dlp-exec
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath
    });

    console.log('Audio descargado correctamente:', audioPath);

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('Enviando audio a Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text'
    });

    console.log('Transcripción completada.');
    const outputPath = path.join(__dirname, 'transcripcion.txt');
    fs.writeFileSync(outputPath, transcription);

    // Opcional: eliminar el MP3 después de usarlo
    fs.unlinkSync(audioPath);

    return res.json({ transcripcion: transcription });

  } catch (err) {
    console.error('Error al procesar:', err);
    console.error('Stack:', err.stack);
    return res.status(500).json({ error: `Error al procesar: ${err.message}` });
  }
});

app.use(express.static(__dirname));

// 🚀 IMPORTANTE: usar process.env.PORT en Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
