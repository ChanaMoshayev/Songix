// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // חיבור ל-MongoDB (החליפי את ה-URI בכתובת שלך)
// const mongoURI = 'mongodb://localhost:27017/yourDatabaseName';

// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Middlewares
// app.use(cors());               // מאפשר בקשות Cross-Origin
// app.use(express.json());       // מנתח בקשות JSON

// // רישום ה-Routers לפי התיקייה שלך
// app.use('/categories', require('./routes/categoriesRouter'));
// app.use('/comments', require('./routes/commentRoutes'));
// app.use('/favorites', require('./routes/favoriteSongsRouter'));
// // app.use('/lyrics', require('./routes/lyricsNewSongRouter'));
// app.use('/melodies', require('./routes/melodyRouter'));
// app.use('/songs', require('./routes/songsRouter'));
// app.use('/users', require('./routes/userRouter'));

// // נתיב ברירת מחדל
// app.get('/', (req, res) => {
//   res.send('Server is running');
// });

// // הפעלת השרת
// app.listen(PORT, () => {
//   console.log(`✔ Server is running on port ${PORT}`);
// });



const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const fs = require("fs");
const { DB_UNAVAILABLE } = require("./utils/mongoErrors");
const { ensureDefaultCategories } = require("./utils/seedDefaultCategories");
const { migrateContestMelodyDataUrlsToFiles } = require("./utils/migrateContestMelodyFiles");
const { parseCorsOrigins, createCorsOptions } = require("./utils/corsOrigins");

// טוען משתני סביבה מהקובץ .env (אם קיים)
try {
  require("dotenv").config();
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 5000;

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/songLyrics";
if (!process.env.MONGO_URI) {
  console.warn("[server] MONGO_URI missing from env — using default:", mongoURI);
}

function logMongoHints(err) {
  const msg = String(err?.message || "");
  if (msg.includes("querySrv ECONNREFUSED") || msg.includes("querySrv")) {
    console.error(
      "[MongoDB] שרת ה-DNS ברשת (למשל אוניברסיטה) עלול לחסום mongodb+srv.\n" +
        "  → שנה/י DNS ל-8.8.8.8 ו-8.8.4.4, או העתיק/י מ-Atlas מחרוזת חיבור רגילה (mongodb://… לא +srv)."
    );
  }
  if (msg.toLowerCase().includes("whitelist") || msg.includes("ServerSelection")) {
    console.error(
      "[MongoDB] ב-Atlas: Network Access → Add IP Address → «Add Current IP» (או 0.0.0.0/0 לפיתוח בלבד)."
    );
  }
  if (msg.includes("TLS") || msg.includes("SSL") || msg.includes("alert")) {
    console.error(
      "[MongoDB] שגיאת SSL לרוב = IP לא ברשימה ב-Atlas, או DNS/רשת חוסמת את Atlas. בדקי/י את שני הדברים למעלה."
    );
  }
}

/** רשתות מוסדיות לעיתים חוסמות SRV — משתמשים ב-DNS ציבורי לפני mongodb+srv */
function usePublicDnsForMongoSrv() {
  if (!mongoURI.startsWith("mongodb+srv://")) return;
  if (process.env.MONGO_DNS_SERVERS) {
    dns.setServers(process.env.MONGO_DNS_SERVERS.split(",").map(s => s.trim()).filter(Boolean));
    return;
  }
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

async function connectMongo() {
  usePublicDnsForMongoSrv();
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 20000 });
  console.log("MongoDB connected");
  await ensureDefaultCategories();
  await migrateContestMelodyDataUrlsToFiles();
}

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "15mb" }));

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("Accept-Ranges", "bytes");
    },
  })
);

/** מחזיר 503 מיידי במקום להמתין 10 שניות ל-buffering של Mongoose */
app.use((req, res, next) => {
  if (req.method === "GET" && req.path === "/") return next();
  if (req.path.startsWith("/uploads")) return next();
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ message: DB_UNAVAILABLE });
});

// חיבור לראוטרים
app.use('/categories', require('./routes/categoriesRouter'));
app.use('/favorites', require('./routes/favoriteSongsRouter'));
app.use('/songs', require('./routes/songsRouter'));
app.use('/artists', require('./routes/artistsRouter'));
app.use('/users', require('./routes/userRouter'));
app.use('/auth', require('./routes/authRouter'));
app.use('/contest-submissions', require('./routes/contestSubmissionsRouter'));

app.get('/', (req, res) => {
  res.send('Server is running');
});

// טיפול בשגיאות שלא נתפסו בראוטרים (כולל async ב־Express 5)
app.use((err, req, res, next) => {
  console.error("[express-error]", err?.name, err?.message, err?.stack);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: err?.message || "שגיאת שרת" });
});

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✔ Server is running on port ${PORT}`);
      console.log("   CORS origins:", parseCorsOrigins().join(", "));
      console.log("   Auth: POST /auth/forgot-password-request, /auth/forgot-password-verify");
      console.log("   Songs: POST /songs/upload-cover, /songs/upload-audio");
      console.log("   Artists: GET /artists, POST /artists/save, /upload-avatar, /delete");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err?.message || err);
    logMongoHints(err);
    console.error("\n[server] לא מפעילים את השרת בלי מסד נתונים. תקני/י את החיבור והריצי שוב npm run dev.\n");
    process.exit(1);
  });