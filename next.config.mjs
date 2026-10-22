/** @type {import('next').NextConfig} */

// Pictures and icons keep their names when they change, so they're cached for a week and then
// refreshed in the background (stale-while-revalidate) rather than marked immutable.
const STATIC_CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const nextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF first (smallest), WebP for browsers without it. Optimised copies are kept a year.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    // The app is a 393px phone frame: no need for desktop-sized variants.
    deviceSizes: [393, 640, 828, 1080, 1200],
    imageSizes: [16, 24, 32, 48, 64, 128, 160, 256, 353],
  },
  async headers() {
    return [
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: STATIC_CACHE }] },
      { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: STATIC_CACHE }] },
    ];
  },
  async redirects() {
    // The big PNGs became WebP (16 MB → 40 KB for Health); old links still resolve.
    return [
      { source: "/images/life-areas/:name.png", destination: "/images/life-areas/:name.webp", permanent: true },
      { source: "/images/life-purpose/:name(power-words|purpose-sky).png", destination: "/images/life-purpose/:name.webp", permanent: true },
      { source: "/images/home-illustration.png", destination: "/images/home-illustration.webp", permanent: true },
      { source: "/images/companion/background.png", destination: "/images/companion/background.webp", permanent: true },
    ];
  },
};

export default nextConfig;
