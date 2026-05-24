/** שיר שפורסם מתחרות לחן */
export function isMelodyCatalogSong(song) {
  if (!song) return false;
  if (song.contentType === "melody") return true;
  const lyrics = String(song.lyrics || "").trim();
  return lyrics === "לחן שהוגש לתחרות" || lyrics.startsWith("לחן שהוגש");
}
