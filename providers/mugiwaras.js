import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://mugiwarasoficial.com';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': BASE_URL
  },
  timeout: 10000
});

function cleanText(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

function extractChapterNumber(name) {
  if (!name) return null;
  const match = name.match(/cap[íi]tulo\s*([\d\.]+)/i) || name.match(/cap\.?\s*([\d\.]+)/i) || name.match(/ch\.?\s*([\d\.]+)/i) || name.match(/([\d\.]+)/);
  return match ? match[1] : null;
}

export const MugiwarasProvider = {
  name: 'mugiwaras',
  baseUrl: BASE_URL,

  async search(query) {
    const response = await client.get(`/catalogo?q=${encodeURIComponent(query)}`);
    const $ = cheerio.load(response.data);
    const results = [];

    $('a').each((_, el) => {
      const link = $(el).attr('href');
      if (!link || link === '/' || link === '/catalogo') return;

      if (link.includes('/manga/') || link.includes('/manhwa/') || link.includes('/manhua/')) {
        const parts = link.split('/').filter(Boolean);
        if (parts.length > 2) return; // ignora sublinks de capítulos

        const slug = parts.join('/');
        if (!slug || results.some(item => item.slug === slug)) return;

        const parent = $(el).closest('div, article, li') || $(el);
        const rawText = cleanText($(el).text());
        
        let title = parent.find('h3, h4, .title').first().text().trim();
        if (!title || title.length > 80) {
          const lines = rawText.split(' ').filter(w => !['MANGA', 'MANHWA', 'MANHUA', '18+'].includes(w));
          title = lines.join(' ') || parts[1]?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const cover = parent.find('img').attr('src') || parent.find('img').attr('data-src') || $(el).find('img').attr('src') || null;

        results.push({
          title: cleanText(title),
          slug,
          url: `${BASE_URL}/${slug}`,
          cover,
          provider: 'mugiwaras'
        });
      }
    });

    return results;
  },

  async getMangas(page = 1) {
    const response = await client.get(`/catalogo?page=${page}`);
    const $ = cheerio.load(response.data);
    const mangas = [];

    $('a').each((_, el) => {
      const link = $(el).attr('href');
      if (!link || link === '/' || link === '/catalogo') return;

      if (link.includes('/manga/') || link.includes('/manhwa/') || link.includes('/manhua/')) {
        const parts = link.split('/').filter(Boolean);
        if (parts.length > 2) return;

        const slug = parts.join('/');
        if (!slug || mangas.some(item => item.slug === slug)) return;

        const parent = $(el).closest('div, article, li') || $(el);
        let title = parent.find('h3, h4, .title').first().text().trim() || cleanText($(el).text());
        if (!title || title.length > 80) {
          title = parts[1]?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const cover = parent.find('img').attr('src') || parent.find('img').attr('data-src') || null;

        mangas.push({
          title: cleanText(title),
          slug,
          url: `${BASE_URL}/${slug}`,
          cover,
          provider: 'mugiwaras'
        });
      }
    });

    return mangas;
  },

  async getMangaDetails(slug) {
    const targetUrl = slug.startsWith('http') ? slug : `${BASE_URL}/${slug}`;
    const response = await client.get(targetUrl);
    const $ = cheerio.load(response.data);

    const title = cleanText($('h1').first().text() || $('.title h1').text() || slug.split('/')[1]?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    const cover = $('img').first().attr('src') || $('img').first().attr('data-src');
    const summary = cleanText($('.synopsis, .description, p').text());

    const genres = [];
    $('a[href*="/genero/"], a[href*="/catalogo?genre="]').each((_, el) => {
      genres.push(cleanText($(el).text()));
    });

    const chapters = [];
    $('a').each((_, el) => {
      const chapterUrl = $(el).attr('href');
      if (!chapterUrl || !chapterUrl.includes(`/${slug}/`)) return;

      const name = cleanText($(el).text().replace(/Começar a Ler/gi, ''));
      if (!name) return;

      const chapterSlug = chapterUrl.replace(/^\//, '').replace(/\/$/, '');
      const number = extractChapterNumber(name);

      if (chapterSlug && !chapters.some(c => c.chapterSlug === chapterSlug)) {
        chapters.push({
          name,
          number,
          chapterSlug,
          url: `${BASE_URL}${chapterUrl}`,
          pagesApiUrl: `/api/chapter/${chapterSlug}?provider=mugiwaras`
        });
      }
    });

    return {
      title,
      slug,
      cover,
      summary,
      genres,
      chaptersCount: chapters.length,
      chapters,
      provider: 'mugiwaras'
    };
  },

  async getChapterPages(chapterSlug) {
    const targetUrl = chapterSlug.startsWith('http') ? chapterSlug : `${BASE_URL}/${chapterSlug}`;
    const response = await client.get(targetUrl);
    const $ = cheerio.load(response.data);

    const pages = [];
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        src = src.trim();
        if ((src.includes('cdn') || src.includes('mugiverso') || src.includes('uploads')) && !src.includes('logo') && !src.includes('avatar') && !src.includes('cover')) {
          pages.push(src);
        }
      }
    });

    const title = cleanText($('h1, .entry-title').first().text());
    const number = extractChapterNumber(title || chapterSlug);

    return {
      chapterSlug,
      title: title || `Capítulo ${number || ''}`,
      number,
      pagesCount: pages.length,
      pages,
      provider: 'mugiwaras'
    };
  }
};
