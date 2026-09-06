// Seed Supabase dari data statis siteData.ts. Idempoten lewat upsert on_conflict=slug.
// Field yang tak punya kolom → disimpan di `meta`. Jalankan:
//   SR=<service_role> npx tsx scripts/seed.ts
import { projectsData, blogPostsData } from '../src/data/siteData';
import { slugify } from '../src/pages/admin/resources';

const URL = process.env.VITE_SUPABASE_URL || 'http://192.168.2.99:8000';
const SR = process.env.SR;
if (!SR) { console.error('[x] env SR (service_role) wajib'); process.exit(1); }

const H = { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' };

async function upsert(table: string, rows: any[], onConflict = 'slug') {
  const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
  const body = await res.json();
  if (!res.ok) { console.error(`[x] ${table}:`, JSON.stringify(body).slice(0, 300)); process.exit(1); }
  return body as any[];
}

async function idBySlug(table: string): Promise<Record<string, number>> {
  const res = await fetch(`${URL}/rest/v1/${table}?select=id,slug`, { headers: H });
  const rows = await res.json();
  return Object.fromEntries(rows.map((r: any) => [r.slug, r.id]));
}

(async () => {
  // 1. Kategori (dari nilai distinct di data statis)
  const projCats = [...new Set(projectsData.map((p) => p.category))];
  await upsert('project_categories', projCats.map((name) => ({ name, slug: slugify(name) })));
  const projCatId = await idBySlug('project_categories');

  const blogCats = [...new Set(blogPostsData.map((p) => p.category))];
  await upsert('blog_categories', blogCats.map((name) => ({ name, slug: slugify(name) })));
  const blogCatId = await idBySlug('blog_categories');

  // 2. Projects — kolom inti + sisanya ke meta
  const projRows = projectsData.map((p) => {
    const { id, title, category, description, year, client, tags, image, ...rest } = p;
    return {
      slug: id,
      name: title,
      description,
      image,
      client,
      year,
      tech_stack: tags,
      project_category_id: projCatId[slugify(category)],
      status: 'aktif',
      meta: { category, ...rest }, // featured, linkUrl, githubUrl
    };
  });
  await upsert('projects', projRows);

  // 3. Blogs — semua published; field kaya ke meta
  const blogRows = blogPostsData.map((p) => {
    const { id, title, category, content, readTime, ...rest } = p;
    const rt = parseInt(String(readTime), 10);
    return {
      slug: id,
      title,
      content: content ?? '',
      status: 'published',
      author: 'OxidiLily',
      featured_image: null,
      reading_time: Number.isFinite(rt) ? rt : null,
      blog_category_id: blogCatId[slugify(category)],
      meta: { category, readTime, ...rest }, // date, excerpt, sections, subtitle, dst
    };
  });
  await upsert('blogs', blogRows);

  console.log(`[ok] seed: ${projRows.length} project, ${blogRows.length} blog, ${projCats.length}+${blogCats.length} kategori`);
})();
