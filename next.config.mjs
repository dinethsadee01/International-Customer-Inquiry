/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude Puppeteer from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        tty: false,
        net: false,
        child_process: false,
      };

      // Exclude puppeteer and related modules from client bundle
      config.externals = [
        ...(config.externals || []),
        "puppeteer",
        "puppeteer-core",
        "@tootallnate/quickjs-emscripten",
      ];
    }

    return config;
  },
};

export default nextConfig;
