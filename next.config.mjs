/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "mongodb"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        aws4: false,
        "mongodb-client-encryption": false,
        "@aws-sdk/credential-providers": false,
        "@mongodb-js/zstd": false,
        kerberos: false,
        snappy: false,
        socks: false,
      };
    }

    if (isServer) {
      config.externals.push({
        "mongodb-client-encryption": "mongodb-client-encryption",
        "@aws-sdk/credential-providers": "@aws-sdk/credential-providers",
        kerberos: "kerberos",
        snappy: "snappy",
        socks: "socks",
        aws4: "aws4",
        "@mongodb-js/zstd": "@mongodb-js/zstd",
      });
    }

    return config;
  },
};

export default nextConfig;