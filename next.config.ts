import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Standalone output: self-contained server bundle for the eventual Docker
// image (matches listing-studio/when-we-meet's deploy pattern).
const nextConfig: NextConfig = {
  output: "standalone",
};

export default withNextIntl(nextConfig);
