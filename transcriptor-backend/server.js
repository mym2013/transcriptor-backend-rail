const express = require('express');
// Si quieres puedes dejar 'cors' instalado pero ya no lo usas
const cors = require('cors');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const ytdlp = require('yt-dlp-exec'); // 👈 Aquí usamos la nueva librería
require('dotenv').config();

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
    // 🚀 Descargar audio con yt-dlp-exec
    console.log('Iniciando descarga de audio...');
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: audioPath
    });
    console.log('Audio descargado correctamente.');

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('Iniciando transcripción con Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text'
    });

    const outputPath = path.join(__dirname, 'transcripcion.txt');
    fs.writeFileSync(outputPath, transcription);

    console.log('Transcripción completada.');
    return res.json({ transcripcion: transcription });

  } catch (err) {
    console.error('Error al procesar:', err);
    return res.status(500).json({ error: 'Error al procesar el audio o transcribir.' });
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
