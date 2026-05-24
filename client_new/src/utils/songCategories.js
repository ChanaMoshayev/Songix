/** מחזיר מערך מזהי קטגוריה (מחרוזות) לשיר — תומך ב־categoryIds ובשדה legacy categoryId */
export function getSongCategoryIds(song) {
  if (!song) return [];
  const arr = song.categoryIds;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.map(id => String(id)).filter(Boolean);
  }
  if (song.categoryId != null && song.categoryId !== "") {
    return [String(song.categoryId)];
  }
  return [];
}

/** סינון לפי קטגוריה בודדת (מחרוזת מזהה) */
export function songHasCategory(song, categoryFilter) {
  if (!categoryFilter) return true;
  return getSongCategoryIds(song).includes(String(categoryFilter));
}

/** כל מזהי הקטגוריות הייחודיים מתוך רשימת שירים */
export function collectCategoryIdsFromSongs(songs) {
  if (!Array.isArray(songs)) return [];
  const set = new Set();
  for (const s of songs) {
    for (const id of getSongCategoryIds(s)) set.add(id);
  }
  return Array.from(set);
}

/** תווית תצוגה לפי מזהה ורשימת קטגוריות מהשרת */
export function categoryNameById(categoryId, categories) {
  if (!categoryId || !Array.isArray(categories)) return String(categoryId ?? "");
  const c = categories.find(x => String(x._id) === String(categoryId));
  return c?.categoryName != null ? String(c.categoryName) : String(categoryId);
}

/** כמה קטגוריות משותפות יש בין שני שירים */
export function categoryOverlapCount(songA, songB) {
  const setA = new Set(getSongCategoryIds(songA));
  if (setA.size === 0) return 0;
  let n = 0;
  for (const id of getSongCategoryIds(songB)) {
    if (setA.has(id)) n += 1;
  }
  return n;
}

/**
 * שירים דומים בסגנון — בעיקר חפיפת קטגוריות; השלמה בשירים אחרונים אם חסר.
 */
export function getSimilarSongs(current, allSongs, { limit = 8 } = {}) {
  if (!current?._id || !Array.isArray(allSongs)) return [];
  const curId = String(current._id);
  const others = allSongs.filter(s => s && String(s._id) !== curId);

  const scored = others.map(s => ({
    song: s,
    overlap: categoryOverlapCount(current, s),
  }));

  const matched = scored
    .filter(x => x.overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      const da = new Date(a.song.uploadDate || 0).getTime();
      const db = new Date(b.song.uploadDate || 0).getTime();
      return db - da;
    })
    .map(x => x.song);

  const seen = new Set(matched.map(s => String(s._id)));
  const filler = others
    .filter(s => !seen.has(String(s._id)))
    .sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());

  return [...matched, ...filler].slice(0, limit);
}
