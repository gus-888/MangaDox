// ESTADO GLOBAL DA APLICAÇÃO
const state = {
  provider: 'all',
  activeItemProvider: 'mangalivre',
  currentManga: null,
  currentChapterIndex: -1,
  chaptersList: []
};

// DOM ELEMENTS
const providerSelect = document.getElementById('provider-select');
const activeProviderBadge = document.getElementById('active-provider-badge');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const brandHome = document.getElementById('brand-home');
const sectionTitle = document.getElementById('section-title');
const resultsCount = document.getElementById('results-count');
const loader = document.getElementById('loader');
const mangaGrid = document.getElementById('manga-grid');

// MODAL ELEMENTS
const detailsModal = document.getElementById('details-modal');
const closeModalOverlay = document.getElementById('close-modal-overlay');
const closeDetailsBtn = document.getElementById('close-details-btn');
const modalCover = document.getElementById('modal-cover');
const modalTitle = document.getElementById('modal-title');
const modalGenres = document.getElementById('modal-genres');
const modalSummary = document.getElementById('modal-summary');
const modalChapterCount = document.getElementById('modal-chapter-count');
const chapterFilterInput = document.getElementById('chapter-filter-input');
const modalChaptersList = document.getElementById('modal-chapters-list');

// READER ELEMENTS
const readerView = document.getElementById('reader-view');
const closeReaderBtn = document.getElementById('close-reader-btn');
const readerTitle = document.getElementById('reader-title');
const readerPageCounter = document.getElementById('reader-page-counter');
const prevChapterBtn = document.getElementById('prev-chapter-btn');
const nextChapterBtn = document.getElementById('next-chapter-btn');
const readerLoader = document.getElementById('reader-loader');
const readerPagesContainer = document.getElementById('reader-pages-container');

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  loadPopularMangas();
  setupEventListeners();
});

function setupEventListeners() {
  providerSelect.addEventListener('change', (e) => {
    state.provider = e.target.value;
    updateProviderBadgeText();

    if (searchInput.value.trim()) {
      performSearch(searchInput.value.trim());
    } else {
      loadPopularMangas();
    }
  });

  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) performSearch(query);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) performSearch(query);
    }
  });

  brandHome.addEventListener('click', () => {
    searchInput.value = '';
    loadPopularMangas();
  });

  closeDetailsBtn.addEventListener('click', closeModal);
  closeModalOverlay.addEventListener('click', closeModal);

  closeReaderBtn.addEventListener('click', closeReader);

  chapterFilterInput.addEventListener('input', (e) => {
    filterChapters(e.target.value.trim().toLowerCase());
  });

  prevChapterBtn.addEventListener('click', () => navigateChapter(-1));
  nextChapterBtn.addEventListener('click', () => navigateChapter(1));
}

function updateProviderBadgeText() {
  const map = {
    all: '⚡ Todos os Provedores',
    mangalivre: 'MangaLivre.blog',
    mangalivreto: 'MangaLivre.to',
    mugiwaras: 'Mugiwaras Oficial',
    mangafire: 'MangaFire'
  };
  activeProviderBadge.textContent = map[state.provider] || state.provider;
}

// BUSCAR MANGÁS POPULARES
async function loadPopularMangas() {
  sectionTitle.textContent = '✨ Mangás em Destaque';
  showLoader(true);
  mangaGrid.innerHTML = '';

  try {
    const res = await fetch(`/api/mangas?provider=${state.provider}`);
    const data = await res.json();
    showLoader(false);

    if (data.data && data.data.length > 0) {
      resultsCount.textContent = `${data.data.length} mangás encontrados`;
      renderMangaGrid(data.data);
    } else {
      mangaGrid.innerHTML = '<p class="text-muted">Nenhum mangá encontrado.</p>';
    }
  } catch (err) {
    showLoader(false);
    mangaGrid.innerHTML = `<p class="text-muted">Erro ao carregar mangás: ${err.message}</p>`;
  }
}

// REALIZAR PESQUISA
async function performSearch(query) {
  sectionTitle.textContent = `🔍 Resultados para: "${query}"`;
  showLoader(true);
  mangaGrid.innerHTML = '';

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&provider=${state.provider}`);
    const data = await res.json();
    showLoader(false);

    if (data.data && data.data.length > 0) {
      resultsCount.textContent = `${data.data.length} mangás encontrados em todos os provedores`;
      renderMangaGrid(data.data);
    } else {
      resultsCount.textContent = '0 resultados';
      mangaGrid.innerHTML = '<p class="text-muted">Nenhum mangá encontrado para essa busca.</p>';
    }
  } catch (err) {
    showLoader(false);
    mangaGrid.innerHTML = `<p class="text-muted">Erro ao pesquisar: ${err.message}</p>`;
  }
}

// RENDERIZAR CARDS DE MANGÁ
function renderMangaGrid(items) {
  mangaGrid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'manga-card';

    const coverUrl = item.cover || 'https://via.placeholder.com/200x280?text=Sem+Capa';
    const providerTag = item.provider ? `<span class="badge-provider" style="font-size:0.65rem; padding: 2px 6px;">${item.provider}</span>` : '';

    card.innerHTML = `
      <img class="manga-card-cover" src="${coverUrl}" alt="${item.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='/api/proxy?url=' + encodeURIComponent('${coverUrl}')" />
      <div class="manga-card-info">
        <h4 class="manga-card-title">${item.title}</h4>
        <div class="manga-card-meta">
          ${item.status ? `<span class="badge-status">${item.status}</span>` : ''}
          ${providerTag}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openMangaDetails(item.slug, item.provider || state.provider));
    mangaGrid.appendChild(card);
  });
}

// DETALHES DO MANGÁ (MODAL)
async function openMangaDetails(slug, itemProvider) {
  const selectedProvider = itemProvider || state.provider;
  state.activeItemProvider = selectedProvider;

  detailsModal.classList.remove('hidden');
  modalTitle.textContent = 'Carregando...';
  modalCover.src = '';
  modalSummary.textContent = 'Buscando sinopse e capítulos...';
  modalGenres.innerHTML = '';
  modalChaptersList.innerHTML = '<div class="spinner"></div>';
  chapterFilterInput.value = '';

  try {
    const res = await fetch(`/api/manga/${slug}?provider=${selectedProvider}`);
    const data = await res.json();

    state.currentManga = data;
    state.chaptersList = data.chapters || [];

    modalTitle.textContent = data.title || slug;
    modalCover.src = data.cover || 'https://via.placeholder.com/240x340?text=Sem+Capa';
    modalCover.referrerPolicy = 'no-referrer';
    modalSummary.textContent = data.summary || 'Nenhuma sinopse disponível.';
    modalChapterCount.textContent = data.chaptersCount || 0;

    modalGenres.innerHTML = (data.genres || [])
      .map(g => `<span class="tag-genre">${g}</span>`)
      .join('');

    renderChaptersList(state.chaptersList);

  } catch (err) {
    modalTitle.textContent = 'Erro ao carregar';
    modalSummary.textContent = err.message;
    modalChaptersList.innerHTML = '';
  }
}

function renderChaptersList(chapters) {
  modalChaptersList.innerHTML = '';

  if (!chapters || chapters.length === 0) {
    modalChaptersList.innerHTML = '<p class="text-muted">Nenhum capítulo encontrado.</p>';
    return;
  }

  chapters.forEach((chap, idx) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    btn.textContent = chap.name || `Capítulo ${chap.number || ''}`;
    btn.title = chap.name;

    btn.addEventListener('click', () => {
      openReader(idx);
    });

    modalChaptersList.appendChild(btn);
  });
}

function filterChapters(query) {
  if (!query) {
    renderChaptersList(state.chaptersList);
    return;
  }
  const filtered = state.chaptersList.filter(c => 
    (c.name && c.name.toLowerCase().includes(query)) ||
    (c.number && c.number.toString().includes(query))
  );
  renderChaptersList(filtered);
}

function closeModal() {
  detailsModal.classList.add('hidden');
}

// LEITOR IMERSIVO DE CAPÍTULO PURAS
async function openReader(chapterIndex) {
  if (!state.chaptersList || !state.chaptersList[chapterIndex]) return;

  state.currentChapterIndex = chapterIndex;
  const chapter = state.chaptersList[chapterIndex];

  closeModal();
  readerView.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  readerTitle.textContent = `${state.currentManga.title} - ${chapter.name}`;
  readerPageCounter.textContent = 'Carregando páginas...';
  readerLoader.classList.remove('hidden');
  readerPagesContainer.innerHTML = '';

  updateReaderNavButtons();

  try {
    const targetProvider = state.activeItemProvider || state.provider;
    const res = await fetch(`/api/chapter/${chapter.chapterSlug}?provider=${targetProvider}`);
    const data = await res.json();
    readerLoader.classList.add('hidden');

    if (data.pages && data.pages.length > 0) {
      readerPageCounter.textContent = `${data.pages.length} Páginas Puras (${targetProvider})`;
      renderChapterPages(data.pages);
    } else {
      readerPagesContainer.innerHTML = '<p class="text-muted">Nenhuma imagem encontrada para este capítulo.</p>';
    }
  } catch (err) {
    readerLoader.classList.add('hidden');
    readerPagesContainer.innerHTML = `<p class="text-muted">Erro ao carregar leitor: ${err.message}</p>`;
  }
}

function renderChapterPages(pages) {
  readerPagesContainer.innerHTML = '';

  pages.forEach((src, idx) => {
    const img = document.createElement('img');
    img.className = 'reader-page-img';
    img.referrerPolicy = 'no-referrer';
    img.src = src;
    img.alt = `Página ${idx + 1}`;
    img.loading = idx < 3 ? 'eager' : 'lazy';

    img.onerror = () => {
      if (!img.dataset.proxied) {
        img.dataset.proxied = 'true';
        img.src = `/api/proxy?url=${encodeURIComponent(src)}`;
      }
    };

    readerPagesContainer.appendChild(img);
  });
}

function navigateChapter(direction) {
  const newIndex = state.currentChapterIndex + direction;
  if (newIndex >= 0 && newIndex < state.chaptersList.length) {
    openReader(newIndex);
  }
}

function updateReaderNavButtons() {
  prevChapterBtn.disabled = state.currentChapterIndex >= state.chaptersList.length - 1;
  nextChapterBtn.disabled = state.currentChapterIndex <= 0;
}

function closeReader() {
  readerView.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function showLoader(show) {
  if (show) loader.classList.remove('hidden');
  else loader.classList.add('hidden');
}
