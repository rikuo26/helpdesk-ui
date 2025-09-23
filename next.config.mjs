import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ルート誤認の警告を防ぐために、ワークスペースのルートを明示
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
