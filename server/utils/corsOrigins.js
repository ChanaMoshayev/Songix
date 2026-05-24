/** מקורות מותרים ל-CORS — CLIENT_ORIGIN / CORS_ORIGINS + ברירות מחדל לפיתוח ולקליינט ב-Render */
function parseCorsOrigins() {
  const fromEnv = String(process.env.CORS_ORIGINS || process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const defaults = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "https://songixclient.onrender.com",
  ];

  return [...new Set([...defaults, ...fromEnv])];
}

function createCorsOptions() {
  const allowed = parseCorsOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        return callback(null, true);
      }
      console.warn("[cors] blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
  };
}

module.exports = { parseCorsOrigins, createCorsOptions };
