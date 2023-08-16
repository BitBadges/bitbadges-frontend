/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    publicRuntimeConfig: {
        // Will be available on both server and client
        HOSTNAME:
            process.env.BITBADGES_IO === 'true'
                ? 'api.bitbadges.io'
                : 'localhost',
        BACKEND_PORT: process.env.BACKEND_PORT ? process.env.BACKEND_PORT : '',
        MAINNET: process.env.MAINNET === 'true' ? true : false,
    },
    // typescript: {
    //     // !! WARN !!
    //     // Dangerously allow production builds to successfully complete even if
    //     // your project has type errors.
    //     // !! WARN !!
    //     ignoreBuildErrors: true,
    // },
};

require('dotenv').config();

module.exports = nextConfig;
