# 📖 MangaDox — API REST & Web App de Agregação de Mangás

> **MangaDox** é um leitor de mangás moderno e uma API REST de alta performance desenvolvida em Node.js. O projeto faz scraping em tempo real e agrega capítulos, capas e páginas puras de múltiplos provedores de mangás, manhwas e manhuas (*MangaLivre.blog*, *MangaLivre.to*, *Mugiwaras Oficial* e *MangaFire*).

---

## ✨ Destaques do Projeto

* 🚀 **Multi-Provedor Integrado**: Alterne entre múltiplos provedores em português e inglês ou use o modo **`all` (Unificado)** para pesquisar em todas as fontes ao mesmo tempo.
* 🖼️ **Leitor Imersivo de Páginas Puras**: Extrai os links diretos das imagens (`.png`, `.jpg`, `.webp`) sem anúncios, popups ou rastreadores dos sites de origem.
* 🛡️ **Bypass de Hotlinking / Referer**: Endpoint de proxy inteligente (`/api/proxy`) que contorna erros de `403 Forbidden` e bloqueios de imagem por CDN.
* 📱 **Interface Web Moderna (Glassmorphic Dark UI)**: Frontend responsivo feito em HTML5/CSS3/JS Vanilla com busca instantânea, filtro de capítulos e leitor em tela cheia.
* ⚙️ **Pronto para Serverless & Vercel**: Arquitetura modular compatível com deploy em instâncias Node.js locais ou funções Serverless na Vercel (`vercel.json`).

---

## 🛠️ Tecnologias Utilizadas

* **Backend / API**: Node.js, Express, Axios, Cheerio, Puppeteer Headless.
* **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, CSS Grid & Flexbox), ES6 JavaScript.
* **Deploy & Config**: Vercel Serverless (`vercel.json`).

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

Acesse a interface web no navegador em: `http://localhost:3001`
