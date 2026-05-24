import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** רענון דף React (Accept: text/html) לא יועבר ל-API — מונע הצגת JSON גולמי במקום האתר */
function devApiProxy(apiTarget) {
  return {
    target: apiTarget,
    changeOrigin: true,
    bypass(req) {
      const accept = String(req.headers?.accept || "");
      if (req.method === "GET" && accept.includes("text/html")) {
        return "/index.html";
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  return {
    plugins: [react()],
    appType: "spa",
    server: {
      proxy: {
        "/auth": devApiProxy(apiTarget),
        "/songs": devApiProxy(apiTarget),
        "/uploads": devApiProxy(apiTarget),
        "/categories": devApiProxy(apiTarget),
        "/users": devApiProxy(apiTarget),
        "/favorites": devApiProxy(apiTarget),
        "/contest-submissions": devApiProxy(apiTarget),
        "/artists": devApiProxy(apiTarget),
      },
    },
  };
});
