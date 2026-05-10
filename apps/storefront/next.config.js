const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * Hostname of the Medusa backend serving uploaded files (`/static/...`).
 * Set this in production (e.g. `MEDUSA_BACKEND_HOSTNAME=cms.lehena.com`).
 * Localhost is already permitted by the `localhost` entry below regardless
 * of the port (so dev on 9000/9100/etc. works without further config).
 */
const MEDUSA_BACKEND_HOSTNAME = process.env.MEDUSA_BACKEND_HOSTNAME
const MEDUSA_BACKEND_PROTOCOL =
  process.env.MEDUSA_BACKEND_PROTOCOL || "https"

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      ...(MEDUSA_BACKEND_HOSTNAME
        ? [
            {
              protocol: MEDUSA_BACKEND_PROTOCOL,
              hostname: MEDUSA_BACKEND_HOSTNAME,
              pathname: "/static/**",
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
