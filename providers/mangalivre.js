import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://mangalivre.blog';

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

function slugToTitle(slug) {
  if (!slug) return '';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractMangaTitle(container, slug) {
  // Procura primeiro pelo link dentro do h3/h4/post-title que contém APENAS o nome do mangá
  let title = container.find('h3 a, h4 a, .post-title a, .c-tabs-item__content a').first().text().trim();
  
  if (!title || title.includes('Cap.') || title.includes('Em Lançamento') || title.length > 80) {
    title = slugToTitle(slug);
  }
  return cleanText(title);
}

function extractChapterNumber(name) {
  if (!name) return null;
  const match = name.match(/cap[íi]tulo\s*([\d\.]+)/i) || name.match(/cap\.?\s*([\d\.]+)/i) || name.match(/ch\.?\s*([\d\.]+)/i) || name.match(/([\d\.]+)/);
  return match ? match[1] : null;
}

export const MangaLivreProvider = {
  name: 'mangalivre',
  baseUrl: BASE_URL,

  async search(query) {
    const response = await client.get(`/?s=${encodeURIComponent(query)}`);
    const $ = cheerio.load(response.data);
    const results = [];

    $('a[href*="/manga/"]').each((_, el) => {
      const link = $(el).attr('href');
      if (!link || link === `${BASE_URL}/manga/`) return;

      const slug = link.split('/manga/')[1]?.replace(/\/$/, '') || '';
      if (!slug || results.some(item => item.slug === slug)) return;

      const container = $(el).closest('.row, .c-tabs-item__content, .c-search-item, article, div');
      
      const title = extractMangaTitle(container, slug);

      const cover = container.find('img').attr('src') || container.find('img').attr('data-src') || 
                    $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || null;

      const fullText = container.text();
      const status = fullText.includes('Em Lançamento') ? 'Em Lançamento' : fullText.includes('Completo') ? 'Completo' : null;
      const chapterMatch = fullText.match(/Cap\.?\s*([\d\.]+)/i);
      const latestChapter = chapterMatch ? chapterMatch[1] : null;
      const ratingMatch = fullText.match(/(\d\.\d)/);
      const rating = ratingMatch ? ratingMatch[1] : null;

      results.push({
        title,
        slug,
        url: link,
        cover,
        status,
        latestChapter,
        rating,
        provider: 'mangalivre'
      });
    });

    return results;
  },

  async getMangas(page = 1) {
    const url = page > 1 ? `/manga/page/${page}/` : '/manga/';
    const response = await client.get(url);
    const $ = cheerio.load(response.data);
    const mangas = [];

    $('a[href*="/manga/"]').each((_, el) => {
      const link = $(el).attr('href');
      if (!link || link === `${BASE_URL}/manga/`) return;

      const slug = link.split('/manga/')[1]?.replace(/\/$/, '') || '';
      if (!slug || mangas.some(item => item.slug === slug)) return;

      const container = $(el).closest('.page-item-detail, .c-tabs-item__content, article, div');
      const title = extractMangaTitle(container, slug);

      const cover = container.find('img').attr('src') || container.find('img').attr('data-src') || null;

      mangas.push({
        title,
        slug,
        url: link,
        cover,
        provider: 'mangalivre'
      });
    });

    return mangas;
  },

  async getMangaDetails(slug) {
    const response = await client.get(`/manga/${slug}/`);
    const $ = cheerio.load(response.data);

    const title = cleanText($('h1').first().text() || $('.post-title h1').text() || slugToTitle(slug));

    const cover = $('.summary_image img, .tab-summary img').attr('src') || $('.summary_image img').attr('data-src');
    const summary = cleanText($('.description-summary, .summary__content, .manga-exporter-summary').text());
    
    const genres = [];
    $('.genres-content a').each((_, el) => {
      genres.push(cleanText($(el).text()));
    });

    const chapters = [];
    $('a[href*="/capitulo/"]').each((_, el) => {
      const chapterUrl = $(el).attr('href');
      const name = cleanText($(el).text().replace(/NOVO/gi, ''));
      const chapterSlug = chapterUrl?.split('/capitulo/')[1]?.replace(/\/$/, '') || '';
      const number = extractChapterNumber(name);

      if (chapterSlug && !chapters.some(c => c.chapterSlug === chapterSlug)) {
        chapters.push({
          name,
          number,
          chapterSlug,
          url: chapterUrl,
          pagesApiUrl: `/api/chapter/${chapterSlug}?provider=mangalivre`
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
      provider: 'mangalivre'
    };
  },

  async getChapterPages(chapterSlug) {
    const response = await client.get(`/capitulo/${chapterSlug}/`);
    const $ = cheerio.load(response.data);

    const pages = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && (src.includes('/wp-content/uploads/') || src.includes('cdn')) && !src.includes('logo') && !src.includes('flagcdn')) {
        pages.push(src);
      }
    });

    const title = cleanText($('h1, .entry-title').first().text());
    const number = extractChapterNumber(title || chapterSlug);

    return {
      chapterSlug,
      title,
      number,
      pagesCount: pages.length,
      pages,
      provider: 'mangalivre'
    };
  }
};
