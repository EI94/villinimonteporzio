/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_PAGES === '1';
const repo = 'monteporzio-render';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Static export (GitHub Pages)
  ...(isPages
    ? {
        output: 'export',
        images: { unoptimized: true },
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        trailingSlash: true,
      }
    : {}),
};

module.exports = nextConfig;
