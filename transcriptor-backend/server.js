const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('transcripciones.sqlite');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS transcripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    texto TEXT,
    fecha TEXT
  )`);
});

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de autenticación
app.use((req, res, next) => {
  const userKey = req.headers['x-access-key'];
  if (userKey !== process.env.ACCESS_KEY) {
    return res.status(401).json({ error: 'Clave de acceso no válida' });
  }
  next();
});

app.post('/transcribir', async (req, res) => {
  const { url, usarCookies } = req.body;
  if (!url) return res.status(400).json({ error: 'URL no proporcionada' });

  const ytdlpArgs = [
    url,
    '--extract-audio',
    '--audio-format', 'mp3',
    '--force-overwrites',
    '--no-cache-dir',
    '-o', 'audio.mp3'
  ];
  if (usarCookies) {
    ytdlpArgs.splice(1, 0, '--cookies', 'cookies.txt');
  }

  const ytdlp = spawn('yt-dlp', ytdlpArgs);
  ytdlp.stderr.on('data', d => console.error(`yt-dlp: ${d}`));

  ytdlp.on('close', async code => {
    if (code !== 0) return res.status(500).json({ error: 'Error al descargar audio' });

    const audioPath = path.join(__dirname, 'audio.mp3');
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'text'
      });

      fs.writeFileSync('transcripcion.txt', transcription);
      db.prepare('INSERT INTO transcripciones (url, texto, fecha) VALUES (?, ?, ?)')
        .run(url, transcription, new Date().toISOString());

      res.json({ transcripcion: transcription });
    } catch (err) {
      console.error('Error al transcribir:', err);
      res.status(500).json({ error: 'Error al transcribir el audio' });
    }
  });
});

app.post('/resumir', async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'Texto no proporcionado' });

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente que crea resúmenes ejecutivos detallados de transcripciones. Genera un resumen estructurado y proporcional al texto.`
        },
        {
          role: 'user',
          content: texto
        }
      ]
    });

    res.json({ resumen: completion.choices[0].message.content });
  } catch (err) {
    console.error('Error al generar el resumen:', err);
    res.status(500).json({ error: 'Error al generar el resumen' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
