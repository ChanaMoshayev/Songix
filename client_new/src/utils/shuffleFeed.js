/** ערבוב מערך (Fisher–Yates) */
export function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function popularityScore(song) {
  const plays = Number(song?.playCount) || 0;
  const favs = Number(song?.favoriteCount) || 0;
  return plays * 2 + favs * 6;
}

/**
 * סדר שירים לעמוד הבית: אקראי בכל כניסה, עם הטיה לפופולריים/מועדפים (לא אותם שירים תמיד בראש)
 */
export function orderSongsForFeed(songs) {
  if (!Array.isArray(songs) || songs.length <= 1) return songs ? [...songs] : [];

  const maxPop = Math.max(1, ...songs.map(popularityScore));
  const noise = maxPop * 0.9;

  const withScore = songs.map(song => ({
    song,
    pop: popularityScore(song),
    roll: popularityScore(song) + Math.random() * noise,
  }));

  const popular = withScore.filter(x => x.pop > 0);
  const obscure = withScore.filter(x => x.pop === 0);

  shuffleArray(popular);
  shuffleArray(obscure);

  const headCount = Math.min(
    songs.length,
    Math.max(3, Math.ceil(songs.length * 0.45))
  );
  const headPool = popular.length ? popular : withScore;
  const head = shuffleArray(headPool)
    .slice(0, Math.min(headCount, headPool.length))
    .map(x => x.song);

  const headIds = new Set(head.map(s => String(s._id)));
  const tail = shuffleArray(
    withScore.filter(x => !headIds.has(String(x.song._id))).map(x => x.song)
  );

  return [...head, ...tail];
}
