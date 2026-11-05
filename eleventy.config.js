// ── Offline switch ──────────────────────────────────────────────────
// true  → the production site (Netlify production deploy: jrcapitalgrp.com)
//         builds only a blank "not found" page plus the /admin CMS login;
//         every other address returns 404 and nothing is indexed. Local
//         builds and Netlify deploy previews still build the full site.
// false → the full site is live again. Commit and push to main.
const SITE_OFFLINE = true;
const OFFLINE_NOW = SITE_OFFLINE && process.env.CONTEXT === 'production';

export default function (eleventyConfig) {
  if (OFFLINE_NOW) {
    eleventyConfig.ignores.add('src/**');
    eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });
    eleventyConfig.addTemplate('offline-404.html',
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Not found</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#888;background:#fff}</style></head><body><p>404 · Not found</p></body></html>`,
      { permalink: '/404.html' });
    eleventyConfig.on('eleventy.after', async ({ directories, dir }) => {
      const out = (directories && directories.output) || dir.output;
      const fs = await import('node:fs/promises');
      await fs.writeFile(`${out}/robots.txt`, 'User-agent: *\nDisallow: /\n');
      await fs.writeFile(`${out}/_headers`, '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
    });
    return { dir: { input: 'src', output: '_site' } };
  }
  // Static files are copied as-is; the CMS admin is a plain HTML app.
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets', 'src/admin': 'admin' });

  // Everything editors type in the CMS is escaped; markup lives only in templates.
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  eleventyConfig.addFilter('pad2', (n) => String(n).padStart(2, '0'));
  eleventyConfig.addGlobalData('year', () => new Date().getFullYear());

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: false,
  };
}
