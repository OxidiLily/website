// Uji logika ikon dashboard: bentuk slug, terjemahan nilai ↔ jalur, dan
// peringkat pencarian. Jalankan: npx tsx src/lib/ikon.check.ts
//
// Yang diuji di sini bukan "apakah ikonnya bagus", melainkan dua hal yang
// kegagalannya berujung lubang:
//  1. nilai kolom `icon` tidak boleh bisa menjadi `src` ber-skema berbahaya;
//  2. slug tidak boleh bisa keluar dari bentuk yang dipakai server untuk
//     menyusun URL unduhan (`/ikon/svg/<slug>.svg`).
import {
  AWALAN_IKON,
  JALUR_IKON,
  cariIkon,
  labelIkon,
  nilaiIkon,
  slugIkon,
  slugIkonSah,
  tautanIkon,
  varianIkon,
  type KatalogIkon,
} from './ikon';

let gagal = 0;
const cek = (nama: string, benar: boolean, info = ''): void => {
  if (benar) {
    console.log(`  [✓] ${nama}`);
  } else {
    gagal++;
    console.log(`  [×] ${nama}${info ? ` — ${info}` : ''}`);
  }
};
const sama = (nama: string, dapat: unknown, harap: unknown): void =>
  cek(nama, Object.is(dapat, harap), `dapat ${JSON.stringify(dapat)}, harap ${JSON.stringify(harap)}`);

console.log('slug — bentuk yang diterima server:');
for (const sah of ['docker', 'nginx-proxy-manager', 'nextjs', 'a', 'x1', '1password', 'a'.repeat(64), 'v0'])
  cek(`sah: ${sah.length > 12 ? `${sah.slice(0, 12)}…(${sah.length})` : sah}`, slugIkonSah(sah));
for (const salah of [
  '', 'Docker', 'DOCKER', 'a b', 'a/b', '../etc/passwd', '..', 'a..b', '.hidden', 'akhir.', '-awal',
  'a'.repeat(65), 'a$b', 'a%2fb', 'a\\b', 'a\nb', 'ikon.svg', 'foo.bar', 'ünïcode', 'a:b', 'a?b', 'a#b', "'",
])
  cek(`tolak: ${JSON.stringify(salah.length > 14 ? `${salah.slice(0, 14)}…` : salah)}`, !slugIkonSah(salah));

console.log('\nnilai tersimpan ↔ slug:');
sama('nilaiIkon', nilaiIkon('docker'), `${AWALAN_IKON}docker`);
sama('slugIkon dasar', slugIkon(`${AWALAN_IKON}nextcloud`), 'nextcloud');
sama('huruf besar dinormalkan', slugIkon(`${AWALAN_IKON.toUpperCase()}PROXMOX`), 'proxmox');
sama('spasi dipangkas', slugIkon(`  ${AWALAN_IKON}docker  `), 'docker');
sama('bukan penanda dashboard → null', slugIkon('/storage/v1/object/public/media/a.png'), null);
sama('kosong → null', slugIkon(''), null);
sama('null → null', slugIkon(null), null);
sama('slug tak sah → null', slugIkon(`${AWALAN_IKON}../rahasia`), null);
sama('slug dengan spasi → null', slugIkon(`${AWALAN_IKON}ssl cert`), null);

console.log('\ntautanIkon — nilai kolom → src:');
sama('penanda → jalur se-origin', tautanIkon(nilaiIkon('docker')), `${JALUR_IKON}docker.svg`);
sama('jalur unggahan diteruskan', tautanIkon('/storage/v1/object/public/media/1-a.png'), '/storage/v1/object/public/media/1-a.png');
sama('URL https diteruskan', tautanIkon('https://contoh.test/a.svg'), 'https://contoh.test/a.svg');
sama('jalan relatif biasa', tautanIkon('logo.png'), 'logo.png');
sama('javascript: ditolak', tautanIkon('javascript:alert(1)'), null);
sama('JaVaScRiPt: ditolak', tautanIkon('JaVaScRiPt:alert(1)'), null);
sama('jav&#x61;script: ditolak', tautanIkon('jav&#x61;script:alert(1)'), null);
sama('java\\tscript: ditolak', tautanIkon('java\tscript:alert(1)'), null);
sama('data:text/html ditolak', tautanIkon('data:text/html,<script>alert(1)</script>'), null);
sama('data:image base64 diterima', tautanIkon('data:image/png;base64,iVBORw0KGgo='), 'data:image/png;base64,iVBORw0KGgo=');
sama('data:image svg ditolak (bukan daftar)', tautanIkon('data:image/svg+xml;base64,PHN2Zz4='), null);
sama('kosong → null', tautanIkon(''), null);
sama('slug tak sah tidak jadi jalur', tautanIkon(`${AWALAN_IKON}../x`), null);
sama('vbscript: ditolak', tautanIkon('vbscript:msgbox(1)'), null);

console.log('\nlabel & varian:');
sama('label bersingkatan', labelIkon('claude-ai'), 'Claude AI');
sama('label multi kata', labelIkon('nginx-proxy-manager'), 'Nginx Proxy Manager');
sama('label satu kata', labelIkon('nextjs'), 'Nextjs');
sama('label titik/garis bawah', labelIkon('ml_flow-wordmark'), 'ML Flow Wordmark');
sama('varian gelap', varianIkon('dagster-dark'), 'gelap');
sama('varian terang', varianIkon('serviio-light'), 'terang');
sama('bukan varian', varianIkon('docker'), null);

console.log('\ncariIkon — peringkat & batas:');
const katalog: KatalogIkon = {
  docker: { k: ['Developer-Tools'] },
  'docker-compose': { k: ['Developer-Tools'] },
  dokuwiki: {},
  supabase: { a: ['supabase-io', 'firebase-alternative'], k: ['Cloud-Computing'] },
  proxmox: { a: ['Virtualization Platform'], k: ['Server-Panels'], w: ['proxmox-light'] },
  'proxmox-light': {},
  nextjs: { w: ['nextjs-light'] },
  'nextjs-light': {},
  zeppelin: { k: ['Cloud-Computing'] },
};
const slugs = (k: KatalogIkon, q: string, batas?: number) => cariIkon(k, q, batas).map((h) => h.slug);

sama('slug persis menang', slugs(katalog, 'docker')[0], 'docker');
cek('kecocokan awalan ikut', slugs(katalog, 'docker').includes('docker-compose'));
sama('kata dengan spasi → slug', slugs(katalog, 'proxmox light')[0], 'proxmox-light');
sama('alias ditemukan', slugs(katalog, 'firebase-alternative')[0], 'supabase');
sama('alias sebagian', slugs(katalog, 'virtualization')[0], 'proxmox');
cek('kategori juga dicari', slugs(katalog, 'Cloud-Computing').includes('supabase'));
sama('tanpa kecocokan → kosong', slugs(katalog, 'tidakada-samasekali').length, 0);
sama('kueri kosong → abjad', slugs(katalog, '')[0], 'docker');
sama('kueri kosong terbatas', slugs(katalog, '', 2).length, 2);
sama('batas besar dipangkas', slugs(katalog, 'd', 99_999).length <= 200, true);
sama('batas nol → tetap ada hasil', slugs(katalog, 'docker', 0).length >= 1, true);
const hasilDocker = cariIkon(katalog, 'docker');
sama('penanda persis', hasilDocker[0].persis, true);
sama('label ikut dikirim', hasilDocker[0].label, 'Docker');
sama('kategori ikut dikirim', hasilDocker[0].kategori[0], 'Developer-Tools');
sama('urutan abjad saat skor sama', slugs(katalog, 'compose')[0], 'docker-compose');

console.log(
  gagal === 0 ? '\n[✓] ikon: semua pemeriksaan lolos' : `\n[×] ikon: ${gagal} pemeriksaan gagal`,
);
process.exit(gagal === 0 ? 0 : 1);
