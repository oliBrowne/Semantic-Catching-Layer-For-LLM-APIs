/**
 * The experience is a static site so it can be served from anywhere a QR code
 * can point at (GitHub Pages, Vercel, a folder on a phone). `BASE_PATH` lets
 * the same build work at a domain root or under /<repo-name>/ on Pages.
 */
const basePath = process.env.BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
