// מייבאים את ספריית mongoose כדי לעבוד עם MongoDB
const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({

  // שם השיר
  title: {
    type: String,        
    required: true,      // שדה חובה
    trim: true           // מוחק רווחים מיותרים בתחילת ובסוף הטקסט
  },

  // מילות השיר
  lyrics: {
    type: String,        // נשמר כמחרוזת (יכול להיות טקסט ארוך מאוד)
    required: true       // חובה להזין מילים
  },

  // שם אמן (מחושב אוטומטית מ־songUrl ב־pre validate)
  artist: {
    type: String,
    trim: true,
    default: "",
  },

  // תמונת שער / כריכה לשיר (URL או נתיב ב-uploads)
  coverImageUrl: {
    type: String,
    trim: true,
    default: "",
  },

  // קישור לקובץ השיר (למשל קובץ MP3 שנשמר בשרת או בענן)
  songUrl: {
    type: String,        // נשמר כטקסט כי זה נתיב/URL
    required: true       // חובה לצרף קישור לשיר
  },

  // קוד קטגוריות — מערך של מזהים בטבלת Categories (לפחות אחת)
  categoryIds: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categories",
      },
    ],
    required: true,
    validate: {
      validator(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "נדרשת לפחות קטגוריה אחת.",
    },
  },

  // קוד המפרסם - המשתמש שהעלה את השיר
  publisherId: {
    type: mongoose.Schema.Types.ObjectId, // מזהה של משתמש
    ref: "Users", // שם המודל ב-usersModel.js
    required: true, // חובה לדעת מי העלה את השיר
  },

  // תאריך העלאה
  uploadDate: {
    type: Date,         // סוג תאריך
    default: Date.now   // אם לא שולחים תאריך - נשמר אוטומטית הזמן הנוכחי
  },

  // משך השיר (בשניות)
  duration: {
    type: Number,       // מספר כדי לאפשר חישובים ומיונים
    required: true      // חובה לציין אורך שיר
  },

  /** כמה פעמים השיר הושמע (לסידור אקראי עם הטיה) */
  playCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  /** מוצג ראשון בעמוד השירים עם נגן */
  isLeading: {
    type: Boolean,
    default: false,
    index: true,
  },

  /** שיר מלא או לחן שפורסם מתחרות */
  contentType: {
    type: String,
    enum: ["song", "melody"],
    default: "song",
  },

  // // דירוג השיר
  // rating: {
  //   type: Number,       // מספר
  //   min: 0,             // ערך מינימלי אפשרי
  //   max: 5,             // ערך מקסימלי אפשרי
  //   default: 0          // ברירת מחדל אם אף אחד לא דירג עדיין
  // }

}, 
{
  timestamps: true      // מוסיף אוטומטית createdAt ו-updatedAt
});

const { deriveArtistFromSongUrl } = require("../utils/deriveArtistFromSongUrl");

songSchema.pre("validate", async function () {
  const explicit = typeof this.artist === "string" ? this.artist.trim() : "";
  if (explicit) {
    this.artist = explicit;
    return;
  }
  if (!this.songUrl) {
    this.artist = "";
    return;
  }
  try {
    this.artist = deriveArtistFromSongUrl(this.songUrl) || "";
  } catch {
    this.artist = "";
  }
});

module.exports = mongoose.model("Song", songSchema);
