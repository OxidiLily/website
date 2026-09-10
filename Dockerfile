# Situs desain-web dalam satu container.
#
# Server produksinya `vite preview` — sama seperti yang dijalankan unit systemd
# di host, BUKAN nginx yang menyajikan dist/ begitu saja. Alasannya bukan
# kebiasaan: jalur `/supabase`, `/ai`, dan `/riset` hidup di vite.config.ts, dan
# `/riset` bahkan bukan proxy melainkan middleware yang mengunduh lalu menyaring
# halaman sumber artikel. Menyajikan dist/ dengan nginx berarti menulis ulang
# ketiganya, lalu memeliharanya dua kali dan membiarkannya menyimpang.
#
# ponytail: satu tahap, jadi image ikut membawa seluruh perkakas build
# (three.js dan @react-three/* yang mendominasi ukurannya). Turunkan ke
# multi-stage kalau ukurannya mulai jadi masalah — yang harus ikut ke tahap
# runtime bukan cuma dist/, tapi juga vite beserta plugin yang diimpor
# vite.config.ts (@vitejs/plugin-react dan @tailwindcss/vite), karena config-nya
# tetap dievaluasi saat `vite preview` start.
FROM node:22-alpine

WORKDIR /app

# Lapisan dependensi dipisah dari kode: selama package-lock.json tidak berubah,
# build setelah edit kode tidak mengunduh ulang apa pun.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Nilai VITE_* DIPANGGANG ke dalam bundel saat build — memberikannya hanya saat
# container jalan tidak berpengaruh apa pun pada berkas JS yang sudah jadi.
#
# Yang membuat ARG ini benar-benar terbaca: vite.config.ts memanggil
# `loadEnv(mode, cwd, '')` dengan prefix KOSONG, dan loadEnv menyalin seluruh
# `process.env` yang cocok prefix — dengan prefix kosong berarti semuanya. Jadi
# environment build ini cukup; tidak perlu menyalin berkas .env ke dalam image
# (dan memang tidak boleh, lihat .dockerignore).
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

# node_modules dibuat root oleh npm ci di atas. Diserahkan ke akun `node`
# supaya proses runtime tidak berjalan sebagai root sekaligus tetap bisa
# menulis berkas sementara di bawah /app kalau nanti diperlukan.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"]
