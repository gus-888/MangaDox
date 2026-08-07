import { MangaLivreProvider } from './mangalivre.js';
import { MangaFireProvider } from './mangafire.js';
import { MangaLivreToProvider } from './mangalivreto.js';
import { MugiwarasProvider } from './mugiwaras.js';

export const AllProvider = {
  name: 'all',
  baseUrl: 'multi-provider',

  async search(query) {
    const searchPromises = [
      MangaLivreProvider.search(query).catch(() => []),
      MangaLivreToProvider.search(query).catch(() => []),
      MangaFireProvider.search(query).catch(() => []),
      MugiwarasProvider.search(query).catch(() => [])
    ];

    const results = await Promise.allSettled(searchPromises);
    const merged = [];

    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        merged.push(...res.value);
      }
    });

    return merged;
  },

  async getMangas(page = 1) {
    const promises = [
      MangaLivreProvider.getMangas(page).catch(() => []),
      MangaLivreToProvider.getMangas(page).catch(() => []),
      MugiwarasProvider.getMangas(page).catch(() => [])
    ];

    const results = await Promise.allSettled(promises);
    const merged = [];

    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        merged.push(...res.value);
      }
    });

    return merged;
  }
};
