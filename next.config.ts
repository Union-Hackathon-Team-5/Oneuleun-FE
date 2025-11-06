import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
    /* config options here */
    turbopack: {}, // Turbopack 호환성을 위해 추가
};

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
})(nextConfig);
