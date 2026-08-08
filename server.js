import express from 'express';
import cors from 'cors';
import axios from 'axios';
import http from 'http';
import https from 'https';

import { MangaLivreProvider } from './providers/mangalivre.js';
import { MangaFireProvider } from './providers/mangafire.js';
import { MangaLivreToProvider } from './providers/mangalivreto.js';
import { MugiwarasProvider } from './providers/mugiwaras.js';
import { AllProvider } from './providers/all.js';

const app = express();
const PORT = process.env.PORT || 8080;

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/**
 * GET /api/proxy?url=https://...
 */
app.get('/api/proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('URL é obrigatória');

    if (imageUrl.includes('via.placeholder.com')) {
      return res.redirect(imageUrl);
    }

    const isMangaFire = imageUrl.includes('mfcdn') || imageUrl.includes('mangafire');
    const isMugiwara = imageUrl.includes('mugiverso') || imageUrl.includes('mugiwaras');
    
    let referer = 'https://mangalivre.blog/';
    if (isMangaFire) referer = 'https://mangafire.to/';
    if (isMugiwara) referer = 'https://mugiwarasoficial.com/';

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok && response.status !== 403 && response.status !== 404) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error(`Proxy Error for URL ${req.query.url}:`, error.message);
    res.status(500).send('Erro no proxy de imagem: ' + error.message);
  }
});

const providers = {
  mangalivre: MangaLivreProvider,
  mangafire: MangaFireProvider,
  mangalivreto: MangaLivreToProvider,
  'mangalivre.to': MangaLivreToProvider,
  mugiwaras: MugiwarasProvider,
  all: AllProvider,
  todos: AllProvider
};

function getProvider(req) {
  const providerName = (req.query.provider || 'mangalivre').toLowerCase();
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Provedor inválido: "${providerName}". Provedores disponíveis: mangalivre, mangafire, mangalivreto, mugiwaras, all`);
  }
  return provider;
}

/**
 * GET /api/search?q=query&provider=mangalivre|mangafire|mangalivreto|mugiwaras|all
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório.' });
    }

    const provider = getProvider(req);
    const data = await provider.search(query);

    res.json({
      provider: provider.name,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro na busca', details: error.message });
  }
});

/**
 * GET /api/mangas?page=1&provider=...
 */
app.get('/api/mangas', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const provider = getProvider(req);
    const data = await provider.getMangas(page);

    res.json({
      provider: provider.name,
      page: Number(page),
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar mangás', details: error.message });
  }
});

/**
 * GET /api/manga/:slug
 */
app.get('/api/manga/:slug(*)', async (req, res) => {
  try {
    const slug = req.params.slug || req.params[0];
    const provider = getProvider(req);
    const data = await provider.getMangaDetails(slug);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes do mangá', details: error.message });
  }
});

/**
 * GET /api/chapter/*
 */
app.get('/api/chapter/*', async (req, res) => {
  try {
    const chapterSlug = req.params[0];
    const provider = getProvider(req);
    const data = await provider.getChapterPages(chapterSlug);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar capítulo', details: error.message });
  }
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 API MangaDox rodando em http://localhost:${port}`);
    console.log(`- Provedores: mangalivre, mangalivreto, mangafire, mugiwaras, all`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Porta ${port} ocupada. Tentando ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Erro no servidor:', err);
    }
  });
}

startServer(PORT);

export default app;
