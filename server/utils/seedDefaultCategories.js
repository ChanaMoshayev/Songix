const Category = require("../models/categoriesModel");

/** קטגוריות ברירת מחדל — נוצרות פעם אחת אם חסרות (שם ייחודי במסד) */
const DEFAULT_CATEGORY_NAMES = ["קצבי", "מקפיצה"];

async function ensureDefaultCategories() {
  for (const categoryName of DEFAULT_CATEGORY_NAMES) {
    const exists = await Category.exists({ categoryName });
    if (!exists) {
      await Category.create({ categoryName });
      // eslint-disable-next-line no-console
      console.log(`[categories] נוספה קטגוריה: «${categoryName}»`);
    }
  }
}

module.exports = { ensureDefaultCategories, DEFAULT_CATEGORY_NAMES };
