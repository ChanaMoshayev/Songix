/** מפתח ייחודי לזמר — אחד לכל שם (ללא רגישות לאותיות גדולות/רווחים כפולים) */
function artistNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

module.exports = { artistNameKey };
