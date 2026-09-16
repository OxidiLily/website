# scripts/

## Akun admin lewat Docker Compose

Terapkan `supabase/schema.sql`, lalu `supabase/require-password-change.sql` pada
Supabase tujuan sebelum deploy. Jika schema.sql diterapkan ulang, terapkan ulang
migrasi password setelahnya karena keduanya mendefinisikan web.is_admin().
Isi `VITE_SUPABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (minimal 12 karakter),
serta `SUPABASE_SERVICE_ROLE_KEY` pada berkas kredensial lokal yang dilindungi.
Jangan gunakan awalan `VITE_` untuk kata sandi atau service_role.

    docker compose --env-file "$HOME/DATA/Documents/obsidian-vault/kredensial/kredensial.env" up -d --build

Layanan sekali jalan ini membuat akun Supabase Auth dengan email terkonfirmasi,
menetapkan `web.profiles.role=admin`, lalu membaca ulang perannya. Rahasia dipasang
sebagai Docker secrets, tidak dimasukkan ke image atau container web.
Akun admin lama diperiksa melalui service_role, tanpa reset kata sandi.
Akun lama non-admin ditolak; naikkan perannya manual jika memang dikehendaki.
Jika pembuatan Auth berhasil tetapi penulisan profil gagal, perbaiki schema dan
peran akun tersebut manual; skrip tidak menghapus akun saat terjadi kegagalan.
`docker compose up -d` menjalankan admin-init sebelum web. Akun baru ditandai
`app_metadata.require_password_change=true`. Login pertama membuka formulir
ganti kata sandi; RLS menolak hak admin sampai hash password benar-benar berubah.
Kata sandi awal berasal dari ADMIN_PASSWORD, bukan kata sandi bawaan universal,
dan tidak dicetak ke log. Akun lama tidak dipaksa mengganti ulang.

Uji lokal tanpa koneksi Supabase:

    node scripts/create-admin.check.mjs

- `ai-live-publik.mjs` — uji asisten AI di halaman PUBLIK lewat browser:
  jawabannya harus datang dari model, bukan teks cadangan panel. Penjaga
  regresi untuk baris `settings` berawalan `ai_` yang lahir dengan
  `is_public = false` — gejalanya setiap pertanyaan dijawab "Terima kasih atas
  pertanyaannya mengenai …" tanpa satu pun panggilan ke `/ai/*`.
  `LD_LIBRARY_PATH=… node scripts/ai-live-publik.mjs`
- `seed.ts` — isi Supabase dari `src/data/siteData.ts` (idempoten, upsert by slug).
  Menyasar schema `web` lewat header `Accept-Profile`/`Content-Profile`, bukan
  `public` — lihat `supabase/migrate-public-to-web.sql`.
  `SR=<service_role> npx tsx scripts/seed.ts`
- `admin.mjs` — uji panel admin di browser (login, Pengaturan/AI, form upload gambar).
  `ADMIN_EMAIL=… ADMIN_PASS=… node scripts/admin.mjs`
- `route.mjs` / `nav.mjs` / `detail.mjs` — routing berbasis path, klik navigasi, halaman detail.
- `probe.mjs` — hitung `<canvas>` per halaman; penjaga regresi untuk efek React Bits.
- `search.mjs` — search navbar: modal terbuka, hasil muncul, klik hasil benar-benar
  membuka halaman detail.
- `diag.mjs` — isi `<main>`, jumlah canvas, error konsol, respons >=400 per halaman.
  Dipakai untuk memburu halaman yang "kelihatan load" tapi kolomnya kosong.
- `nowebgl.mjs` — memblokir konteks WebGL (meniru Brave Shields "block
  fingerprinting"). Penjaga regresi terpenting: sebelum ada `Decor`, kegagalan
  WebGL meng-unmount SELURUH aplikasi dan halaman jadi hitam kosong.
- `lanyard.mjs` — memastikan kolom About menampilkan Lanyard React Bits saat
  WebGL tersedia, dan kartu statis (bukan canvas mati) saat WebGL diblokir.
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
