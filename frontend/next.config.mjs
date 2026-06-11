/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  devIndicators: {
    appIsrStatus: false,
  },
  allowedDevOrigins: ['10.130.231.6'],
};

export default nextConfig;
