# scripts/

- `seed.ts` — isi Supabase dari `src/data/siteData.ts` (idempoten, upsert by slug).
  `SR=<service_role> npx tsx scripts/seed.ts`
- `admin.mjs` — uji panel admin di browser (login, Pengaturan/AI, form upload gambar).
  `ADMIN_EMAIL=… ADMIN_PASS=… node scripts/admin.mjs`
- `route.mjs` / `nav.mjs` / `detail.mjs` — routing berbasis path, klik navigasi, halaman detail.
- `probe.mjs` — hitung `<canvas>` per halaman; penjaga regresi untuk efek React Bits.
- `search.mjs` — search navbar: modal terbuka, hasil muncul, klik hasil benar-benar
  membuka halaman detail.
- `diag.mjs` — isi `<main>`, jumlah canvas, error konsol, respons >=400 per halaman.
  Dipakai untuk memburu halaman yang "kelihatan load" tapi kolomnya kosong.
- `chunks.mjs` — daftar aset yang diunduh sebuah halaman. Penjaga regresi supaya
  chunk HomePage/Ballpit/Orb tidak bocor lagi ke `/about` (rute kini diselesaikan
  sebelum render pertama).

Chromium diambil dari cache Playwright. Mesin ini tidak punya pustaka sistemnya
dan `sudo` butuh password, jadi pustaka diunduh ke direktori lokal
(`apt-get download` + `dpkg -x`) dan dipakai lewat `LD_LIBRARY_PATH`:

    LD_LIBRARY_PATH=<dir>/usr/lib/x86_64-linux-gnu node scripts/route.mjs

Klik pada navbar diuji lewat `element.click()` di DOM, bukan actionability
Playwright: `index.css` memasang `scroll-behavior: smooth`, dan
`scrollIntoViewIfNeeded` tidak pernah selesai di navbar yang beranimasi.
