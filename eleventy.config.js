export default function (eleventyConfig) {
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
