import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  webpack(config, options) {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: 'raw-loader',
    });
    return config;
  }
};

export default nextConfig;
