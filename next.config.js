/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    publicRuntimeConfig: {
        // Will be available on both server and client
        HOSTNAME:
            process.env.BITBADGES_IO === 'true'
                ? 'api.bitbadges.io'
                : 'localhost',
        BACKEND_PORT: process.env.BACKEND_PORT ? process.env.BACKEND_PORT : '',
        MAINNET: process.env.MAINNET === 'true' ? true : false,
    },
};

require('dotenv').config();

module.exports = nextConfig;
