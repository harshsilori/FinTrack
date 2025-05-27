import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      handlebars: path.resolve(__dirname, 'node_modules/handlebars/lib/index.js'),
    };
    config.module.rules.push({
      test: /\.js$/,
      loader: 'babel-loader',
      include: [path.resolve(__dirname, 'node_modules/handlebars/lib/index.js')],
      options: {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      },
    });
    return config;
  },
  experimental: {
    // Remove the turbo: false line as it's causing config validation errors
  }
};

export default nextConfig;