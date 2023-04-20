/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    publicRuntimeConfig: {
        // Will be available on both server and client
        HOSTNAME: process.env.BITBADGES_IO ? 'api.bitbadges.io' : 'localhost',
    },
};

require('dotenv').config();

module.exports = nextConfig;
