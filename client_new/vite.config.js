import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = "http://localhost:5000";

/** רענון דף React (Accept: text/html) לא יועבר ל-API — מונע הצגת JSON גולמי במקום האתר */
function devApiProxy() {
  return {
    target: API_TARGET,
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
export default defineConfig({
  plugins: [react()],
  appType: "spa",
  server: {
    proxy: {
      "/auth": devApiProxy(),
      "/songs": devApiProxy(),
      "/uploads": devApiProxy(),
      "/categories": devApiProxy(),
      "/users": devApiProxy(),
      "/favorites": devApiProxy(),
      "/contest-submissions": devApiProxy(),
      "/artists": devApiProxy(),
    },
  },
});
