/** @type {import('next').NextConfig} */
export default {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': './components',
      '@/hooks': './hooks',
      '@/lib': './lib',
      '@/services': './src/services',
      '@/server': './server',
    }
    return config
  },
}
