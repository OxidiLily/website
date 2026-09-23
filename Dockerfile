# syntax=docker/dockerfile:1.7
# Situs desain-web dalam satu container — tiga tahap, image akhir hanya
# membawa yang benar-benar dipakai saat jalan.
#
# Server produksinya `vite preview` — sama seperti yang dijalankan unit systemd
# di host, BUKAN nginx yang menyajikan dist/ begitu saja. Alasannya bukan
# kebiasaan: jalur `/supabase`, `/ai`, dan `/riset` hidup di vite.config.ts, dan
# `/riset` bahkan bukan proxy melainkan middleware yang mengunduh lalu menyaring
# halaman sumber artikel. Menyajikan dist/ dengan nginx berarti menulis ulang
# ketiganya, lalu memeliharanya dua kali dan membiarkannya menyimpang.
#
# Konsekuensinya vite.config.ts tetap dievaluasi saat start, jadi tahap akhir
# butuh vite beserta plugin yang diimpornya — tapi TIDAK butuh three.js, React,
# Supabase client, dan seluruh dependensi bundel yang sudah dipanggang ke dist/.
# Itu yang dipangkas di sini.

# Tag dikunci ke versi persis (bukan `22-alpine`) supaya build hari ini dan
# build bulan depan menghasilkan image yang sama. Naikkan dengan sengaja.
ARG NODE_IMAGE=node:22.23.2-alpine3.24

# ── Tahap 1: build bundel ──────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS build
WORKDIR /app

# Lapisan dependensi dipisah dari kode, dan cache npm dipasang sebagai mount:
# build ulang setelah edit kode tidak mengunduh ulang apa pun, dan cache-nya
# tidak ikut ke lapisan image.
#
# `--ignore-scripts` juga di sini, bukan cuma di tahap runtime. Tanpa itu,
# preinstall/postinstall SELURUH pohon dependensi build dijalankan di dalam
# image — termasuk paket yang tidak pernah diimpor kode, seperti
# `@google/genai` (preinstall) dan `protobufjs` (postinstall). Berkas
# `.npmrc`/`allowScripts` tidak mengikat `npm ci`; yang mengikat hanya flag ini.
# esbuild dan @tailwindcss/oxide memasang binarinya lewat optionalDependencies
# per-platform, jadi keduanya tetap ada tanpa skrip — diuji: `npm ci
# --ignore-scripts` lalu `npm run build` selesai dengan exit 0.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund

COPY . .

# Nilai VITE_* DIPANGGANG ke dalam bundel saat build — memberikannya hanya saat
# container jalan tidak berpengaruh apa pun pada berkas JS yang sudah jadi.
#
# Yang membuat ARG ini benar-benar terbaca: vite.config.ts memanggil
# `loadEnv(mode, cwd, '')` dengan prefix KOSONG, dan loadEnv menyalin seluruh
# `process.env` yang cocok prefix — dengan prefix kosong berarti semuanya. Jadi
# environment build ini cukup; tidak perlu menyalin berkas .env ke dalam image
# (dan memang tidak boleh, lihat .dockerignore). Keempatnya nilai publik yang
# memang sampai ke browser pengunjung; kunci gateway AI TIDAK lewat sini.
#
# SITE_URL dipakai scripts/seo-files.ts untuk canonical dan sitemap. Kalau
# kosong, ia jatuh ke setting `site_website` di Supabase.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_AI_ORIGIN
ARG SITE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_AI_ORIGIN=$VITE_AI_ORIGIN \
    SITE_URL=$SITE_URL

# `npm run build` = vite build + scripts/seo-files.ts. Tahap SEO menghubungi
# Supabase untuk menulis HTML statis per artikel; kalau tidak terjangkau dari
# jaringan build, ia melapor dilewati dan build TETAP berhasil — situsnya utuh,
# hanya perayap tanpa JavaScript yang kehilangan meta per artikel.
RUN npm run build

# Manifes + lockfile untuk tahap jalan: HANYA paket yang diimpor vite.config.ts,
# dengan versi PERSIS dari package-lock.json — bukan rentang `^` dari
# package.json — supaya yang jalan di container sama dengan yang diuji di host.
# Pohonnya dipotong dari lockfile itu apa adanya (resolusi + hash-nya ikut),
# jadi tidak ada satu pun permintaan jaringan di langkah ini dan hasilnya tidak
# bergantung pada registry saat build. Penjelasan lengkapnya ada di kepala
# scripts/runtime-manifest.mjs; ujinya di scripts/runtime-manifest.check.mjs.
RUN node scripts/runtime-manifest.mjs /runtime

# ── Tahap 2: dependensi runtime saja ───────────────────────────────────────
FROM ${NODE_IMAGE} AS runtime-deps
WORKDIR /app
COPY --from=build /runtime/package.json /runtime/package-lock.json ./
# `npm ci` dan bukan `npm install`: dengan lockfile yang ikut, pemasangannya
# deterministik dan berhenti kalau manifesnya tidak sinkron — bukan diam-diam
# menyelesaikan sendiri versi yang berbeda.
#
# --ignore-scripts: tidak ada skrip postinstall pihak ketiga yang dijalankan
# di dalam image. esbuild dan @tailwindcss/oxide memakai optionalDependencies
# per-platform, jadi binari mereka tetap terpasang tanpa skrip.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# ── Tahap 3: image akhir ───────────────────────────────────────────────────
FROM ${NODE_IMAGE}
LABEL org.opencontainers.image.source="https://github.com/OxidiLily/desain-web" \
      org.opencontainers.image.description="Situs OxidiLily — vite preview + proxy /supabase, /ai, /riset"
ENV NODE_ENV=production
WORKDIR /app

# Yang dibawa: hasil build, dependensi runtime, vite.config.ts, modul src/lib
# yang diimpor config itu (riset → blogWriter; ikon → sanitasi), dan katalog ikon
# dashboard-icons. Katalog itu wajib ada: ia daftar-putih jalur /ikon/svg/<slug>.svg,
# dan tanpa berkasnya seluruh pemilih ikon di panel berhenti dengan 503 yang
# disengaja — bukan diam-diam membuka jalur unduhan tanpa batas.
# Tidak ada sumber lain, tidak ada perkakas build, tidak ada .env.
COPY --from=runtime-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=runtime-deps --chown=node:node /app/package.json ./package.json
COPY --from=build        --chown=node:node /app/dist ./dist
COPY --chown=node:node vite.config.ts ./
COPY --chown=node:node src/lib/riset.ts src/lib/blogWriter.ts src/lib/ikon.ts src/lib/sanitasi.ts ./src/lib/
COPY --chown=node:node src/data/ikon-katalog.json ./src/data/

# /app milik `node` (chown di atas), bukan root: Vite menulis berkas sementara
# `vite.config.ts.timestamp-*.mjs` di direktori config saat mem-bundle-nya, dan
# cache ikon (.ikon-cache) juga ditulis di sini saat ikon pertama diminta. Itu
# juga sebabnya root filesystem container tidak bisa dibuat read-only.
RUN mkdir -p /app/.ikon-cache && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"]
