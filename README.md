# 📖 MangaDox — API REST & Web App de Mangás

> **MangaDox** um leitor de mangás desenvolvido em Node.js. O projeto faz scraping em tempo real e agrega capítulos, capas e páginas puras de varios provedores de mangás, manhwas e manhuas (*Ma-gaLivre.blog*, *MangaLivre.-o*, *M-giwaras Oficial* e *M-ngaFire*).

---

## 🛠️ Tecnologias Utilizadas

* **Backend / API**: Node.js, Express, Axios, Cheerio, Puppeteer Headless.
* **Frontend**: HTML5, Vanilla CSS3, ES6 JavaScript.
  
---

## 🌐 Endpoints Principais

* `GET /api/search?q=query&provider=all` — Busca unificada de mangás.
* `GET /api/mangas?provider=mangalivre` — Lista de mangás em destaque/catálogo.
* `GET /api/manga/:slug?provider=mangalivreto` — Detalhes do mangá e lista de capítulos.
* `GET /api/chapter/*?provider=mangafire` — Links diretos das imagens do capítulo.
* `GET /api/proxy?url=...` — Proxy de imagens contra bloqueios de CDN.

---

## ⚡ Como Executar Localmente

```bash
# Clone o repositório e entre na pasta
cd mangadox

# Instale as dependências
npm install

# Inicie o servidor
npm start
```
