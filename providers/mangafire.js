import puppeteer from 'puppeteer';

const BASE_URL = 'https://mangafire.to';

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    try {
      browserInstance = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    } catch (e) {
      console.warn('Puppeteer launch warning:', e.message);
      return null;
    }
  }
  return browserInstance;
}

export const MangaFireProvider = {
  name: 'mangafire',
  baseUrl: BASE_URL,

  async search(query) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const searchUrl = `${BASE_URL}/browse?keyword=${encodeURIComponent(query)}&sort=relevance:desc`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('a[href*="/title/"]', { timeout: 10000 }).catch(() => {});

      const results = await page.evaluate((baseUrl) => {
        const items = [];
        const links = Array.from(document.querySelectorAll('a[href*="/title/"]'));

        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          const slug = href.replace(/^\/title\//, '').split('/chapter/')[0].replace(/\/$/, '');
          
          if (!slug || items.some(x => x.slug === slug)) return;

          const text = a.innerText.trim();
          const parent = a.parentElement;
          const img = a.querySelector('img')?.src || parent?.querySelector('img')?.src || null;

          let title = text;
          if (title.includes('\n')) {
            const parts = title.split('\n').map(p => p.trim()).filter(Boolean);
            title = parts.find(p => !p.startsWith('Ch.') && !p.includes('ago') && !['MANGA', 'MANHWA', 'MANHUA', 'OTHER'].includes(p)) || parts[parts.length - 1];
          }

          if (title && !title.startsWith('Ch.')) {
            items.push({
              title,
              slug,
              url: `${baseUrl}/title/${slug}`,
              cover: img,
              provider: 'mangafire'
            });
          }
        });

        return items;
      }, BASE_URL);

      return results;
    } finally {
      await page.close();
    }
  },

  async getMangas(pageNumber = 1) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(`${BASE_URL}/browse?page=${pageNumber}`, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('a[href*="/title/"]', { timeout: 10000 }).catch(() => {});

      const mangas = await page.evaluate((baseUrl) => {
        const items = [];
        const links = Array.from(document.querySelectorAll('a[href*="/title/"]'));

        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          const slug = href.replace(/^\/title\//, '').split('/chapter/')[0].replace(/\/$/, '');
          
          if (!slug || items.some(x => x.slug === slug)) return;

          const text = a.innerText.trim();
          const parent = a.parentElement;
          const img = a.querySelector('img')?.src || parent?.querySelector('img')?.src || null;

          let title = text;
          if (title.includes('\n')) {
            const parts = title.split('\n').map(p => p.trim()).filter(Boolean);
            title = parts.find(p => !p.startsWith('Ch.') && !p.includes('ago') && !['MANGA', 'MANHWA', 'MANHUA', 'OTHER'].includes(p)) || parts[parts.length - 1];
          }

          if (title && !title.startsWith('Ch.')) {
            items.push({
              title,
              slug,
              url: `${baseUrl}/title/${slug}`,
              cover: img,
              provider: 'mangafire'
            });
          }
        });

        return items;
      }, BASE_URL);

      return mangas;
    } finally {
      await page.close();
    }
  },

  async getMangaDetails(slug) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(`${BASE_URL}/title/${slug}`, { waitUntil: 'networkidle2', timeout: 30000 });

      const data = await page.evaluate((baseUrl, currentSlug) => {
        const title = document.querySelector('h1')?.innerText?.trim() || '';
        const summary = document.querySelector('.description, .synopsis, p')?.innerText?.trim() || '';
        const cover = document.querySelector('.poster img, img')?.src || null;

        const genres = Array.from(document.querySelectorAll('a[href*="/genre/"], a[href*="/filter?genre="]')).map(a => a.innerText.trim());

        const chapters = [];
        const chapterLinks = Array.from(document.querySelectorAll('a')).filter(a => a.getAttribute('href')?.includes('/title/') && a.getAttribute('href')?.includes('/chapter/'));

        chapterLinks.forEach(a => {
          const href = a.getAttribute('href') || '';
          const name = a.innerText.trim() || 'Capítulo';
          const fullPath = href.replace(/^\/title\//, '').replace(/\/$/, '');
          const matchNum = name.match(/ch\.?\s*([\d\.]+)/i) || name.match(/([\d\.]+)/);
          const number = matchNum ? matchNum[1] : null;

          if (fullPath && !chapters.some(c => c.chapterSlug === fullPath)) {
            chapters.push({
              name,
              number,
              chapterSlug: fullPath,
              url: `${baseUrl}${href}`,
              pagesApiUrl: `/api/chapter/${fullPath}?provider=mangafire`
            });
          }
        });

        return {
          title,
          slug: currentSlug,
          cover,
          summary,
          genres,
          chaptersCount: chapters.length,
          chapters,
          provider: 'mangafire'
        };
      }, BASE_URL, slug);

      return data;
    } finally {
      await page.close();
    }
  },

  async getChapterPages(chapterSlug) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const targetUrl = chapterSlug.startsWith('http') ? chapterSlug : `${BASE_URL}/title/${chapterSlug}`;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

      // Rola a página para forçar o carregamento de todas as imagens lazy-load do leitor
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 800;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight || totalHeight > 15000) {
              clearInterval(timer);
              resolve();
            }
          }, 150);
        });
      });

      await new Promise(r => setTimeout(r, 1500));

      const data = await page.evaluate((slug) => {
        const title = document.title || '';
        const imgs = Array.from(document.querySelectorAll('img'))
          .map(i => i.src || i.getAttribute('data-src'))
          .filter(s => s && (s.includes('mfcdn') || s.includes('upload') || s.includes('/h/p.jpg') || s.includes('.webp') || s.includes('.jpg') || s.includes('.png')) && !s.includes('logo'));

        const matchNum = title.match(/chapter\s*([\d\.]+)/i) || title.match(/ch\.?\s*([\d\.]+)/i);
        const number = matchNum ? matchNum[1] : null;

        const proxiedPages = imgs.map(src => `/api/proxy?url=${encodeURIComponent(src)}`);

        return {
          chapterSlug: slug,
          title,
          number,
          pagesCount: imgs.length,
          pages: proxiedPages,
          rawPages: imgs,
          provider: 'mangafire'
        };
      }, chapterSlug);

      return data;
    } finally {
      await page.close();
    }
  }
};
