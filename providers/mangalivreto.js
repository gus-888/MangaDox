import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://mangalivre.to';

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

export const MangaLivreToProvider = {
  name: 'mangalivreto',
  baseUrl: BASE_URL,

  async search(query) {
    const response = await client.get(`/?s=${encodeURIComponent(query)}&post_type=wp-manga`);
    const $ = cheerio.load(response.data);
    const results = [];

    $('.c-tabs-item__content, .search-wrap .tab-content-wrap, article, .row').each((_, el) => {
      const container = $(el);
      const linkEl = container.find('.post-title a, h3 a, h4 a, a[href*="/manga/"]').first();
      const link = linkEl.attr('href');
      if (!link || link === `${BASE_URL}/manga/` || link === `${BASE_URL}/manga`) return;

      const slug = link.split('/manga/')[1]?.replace(/\/$/, '') || '';
      if (!slug || results.some(item => item.slug === slug)) return;

      let title = cleanText(container.find('.post-title a, h3 a, h4 a').first().text() || linkEl.text());
      if (!title || title.length > 80) {
        title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const cover = container.find('img').attr('src') || container.find('img').attr('data-src') || null;

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
        provider: 'mangalivreto'
      });
    });

    if (results.length === 0) {
      $('a[href*="/manga/"]').each((_, el) => {
        const link = $(el).attr('href');
        if (!link || link === `${BASE_URL}/manga/` || link.includes('/genero/') || link.includes('/author/')) return;
        const slug = link.split('/manga/')[1]?.replace(/\/$/, '') || '';
        const rawText = cleanText($(el).text());

        if (slug && rawText && !results.some(item => item.slug === slug)) {
          results.push({
            title: rawText,
            slug,
            url: link,
            cover: null,
            provider: 'mangalivreto'
          });
        }
      });
    }

    return results;
  },

  async getMangas(page = 1) {
    const url = page > 1 ? `/manga/page/${page}/` : '/manga/';
    const response = await client.get(url);
    const $ = cheerio.load(response.data);
    const mangas = [];

    $('.page-item-detail, .c-tabs-item__content, article').each((_, el) => {
      const container = $(el);
      const linkEl = container.find('.post-title a, h3 a, h4 a, a[href*="/manga/"]').first();
      const link = linkEl.attr('href');
      if (!link || link === `${BASE_URL}/manga/`) return;

      const slug = link.split('/manga/')[1]?.replace(/\/$/, '') || '';
      if (!slug || mangas.some(item => item.slug === slug)) return;

      let title = cleanText(container.find('.post-title a, h3 a, h4 a').first().text() || linkEl.text());
      if (!title || title.length > 80) {
        title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const cover = container.find('img').attr('src') || container.find('img').attr('data-src') || null;

      mangas.push({
        title,
        slug,
        url: link,
        cover,
        provider: 'mangalivreto'
      });
    });

    return mangas;
  },

  async getMangaDetails(slug) {
    const response = await client.get(`/manga/${slug}/`);
    const $ = cheerio.load(response.data);

    const title = cleanText($('h1').first().text() || $('.post-title h1').text());
    const cover = $('.summary_image img, .tab-summary img').attr('src') || $('.summary_image img').attr('data-src');
    const summary = cleanText($('.description-summary, .summary__content, .manga-exporter-summary').text());
    
    const genres = [];
    $('.genres-content a').each((_, el) => {
      genres.push(cleanText($(el).text()));
    });

    const chapters = [];
    $('a[href*="/manga/"]').each((_, el) => {
      const chapterUrl = $(el).attr('href');
      if (!chapterUrl || !chapterUrl.includes(`/${slug}/`) || chapterUrl === `${BASE_URL}/manga/${slug}/`) return;

      const name = cleanText($(el).text().replace(/NOVO/gi, ''));
      if (!name || name.toLowerCase().includes('leia') || name.toLowerCase().includes('iniciar')) return;

      const chapterSlug = chapterUrl.replace(`${BASE_URL}/manga/`, '').replace(/\/$/, '');
      const number = extractChapterNumber(name);

      if (chapterSlug && !chapters.some(c => c.chapterSlug === chapterSlug)) {
        chapters.push({
          name,
          number,
          chapterSlug,
          url: chapterUrl,
          pagesApiUrl: `/api/chapter/${chapterSlug}?provider=mangalivreto`
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
      provider: 'mangalivreto'
    };
  },

  async getChapterPages(chapterSlug) {
    const targetUrl = chapterSlug.startsWith('http') ? chapterSlug : `${BASE_URL}/manga/${chapterSlug}/`;
    const response = await client.get(targetUrl);
    const $ = cheerio.load(response.data);

    const pages = [];
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        src = src.trim();
        if ((src.includes('uploads') || src.includes('wp-content') || src.includes('data/manga')) && !src.includes('logo') && !src.includes('flagcdn')) {
          pages.push(src);
        }
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
      provider: 'mangalivreto'
    };
  }
};
