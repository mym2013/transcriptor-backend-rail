const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/transcribir', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL no proporcionada' });
  }

  const audioPath = path.join(__dirname, 'audio.mp3');
  const ytDlpPath = path.join(__dirname, '../herramientas/yt-dlp/yt-dlp.exe');

  const args = ['-x', '--audio-format', 'mp3', '-o', audioPath, url];
  const ytDlp = spawn(ytDlpPath, args);

  ytDlp.stdout.on('data', data => {
    console.log(`yt-dlp stdout: ${data}`);
  });

  ytDlp.stderr.on('data', data => {
    console.error(`yt-dlp stderr: ${data}`);
  });

  ytDlp.on('close', async code => {
    if (code !== 0) {
      console.error(`yt-dlp terminó con código ${code}`);
      return res.status(500).json({ error: 'Error al descargar audio' });
    }

    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'text'
      });

      const outputPath = path.join(__dirname, 'transcripcion.txt');
      fs.writeFileSync(outputPath, transcription);
      return res.json({ message: 'Transcripción lista', file: 'transcripcion.txt' });

    } catch (err) {
      console.error('Error al transcribir:', err);
      return res.status(500).json({ error: 'Error al transcribir el audio' });
    }
  });
});

app.use(express.static(__dirname));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

