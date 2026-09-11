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
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

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

# Manifes untuk tahap jalan: HANYA paket yang diimpor vite.config.ts, dengan
# versi PERSIS dari package-lock.json — bukan rentang `^` dari package.json —
# supaya yang jalan di container sama dengan yang diuji di host. Dibuat di
# sini, bukan disimpan sebagai berkas kedua di repo yang harus dijaga sinkron.
RUN node -e '\
  const lock = require("./package-lock.json").packages; \
  const paket = ["vite", "@vitejs/plugin-react", "@tailwindcss/vite", "tailwindcss"]; \
  const deps = Object.fromEntries(paket.map((p) => [p, lock["node_modules/" + p].version])); \
  require("fs").mkdirSync("/runtime", { recursive: true }); \
  require("fs").writeFileSync("/runtime/package.json", JSON.stringify({ name: "desain-web-runtime", private: true, type: "module", dependencies: deps }, null, 2)); \
  console.log(deps);'

# ── Tahap 2: dependensi runtime saja ───────────────────────────────────────
FROM ${NODE_IMAGE} AS runtime-deps
WORKDIR /app
COPY --from=build /runtime/package.json ./package.json
# --ignore-scripts: tidak ada skrip postinstall pihak ketiga yang dijalankan
# di dalam image. esbuild dan @tailwindcss/oxide memakai optionalDependencies
# per-platform, jadi binari mereka tetap terpasang tanpa skrip.
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --ignore-scripts --no-audit --no-fund

# ── Tahap 3: image akhir ───────────────────────────────────────────────────
FROM ${NODE_IMAGE}
LABEL org.opencontainers.image.source="https://github.com/OxidiLily/desain-web" \
      org.opencontainers.image.description="Situs OxidiLily — vite preview + proxy /supabase, /ai, /riset"
ENV NODE_ENV=production
WORKDIR /app

# Yang dibawa: hasil build, dependensi runtime, vite.config.ts, dan dua modul
# src/lib yang diimpor config itu (riset → blogWriter). Tidak ada sumber lain,
# tidak ada perkakas build, tidak ada .env.
COPY --from=runtime-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=runtime-deps --chown=node:node /app/package.json ./package.json
COPY --from=build        --chown=node:node /app/dist ./dist
COPY --chown=node:node vite.config.ts ./
COPY --chown=node:node src/lib/riset.ts src/lib/blogWriter.ts ./src/lib/

# /app milik `node` (chown di atas), bukan root: Vite menulis berkas sementara
# `vite.config.ts.timestamp-*.mjs` di direktori config saat mem-bundle-nya —
# itu juga sebabnya root filesystem container tidak bisa dibuat read-only.
USER node
EXPOSE 3000
CMD ["node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"]
