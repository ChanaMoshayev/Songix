const mongoose = require("mongoose");

/**
 * מנרמל מזהי קטגוריות מגוף בקשה — תומך ב־categoryIds (מערך) או ב־categoryId יחיד (legacy).
 */
function normalizeCategoryIds(body) {
  if (!body || typeof body !== "object") return [];
  if (Array.isArray(body.categoryIds) && body.categoryIds.length > 0) {
    return body.categoryIds
      .map(id => String(id).trim())
      .filter(Boolean)
      .filter(id => mongoose.Types.ObjectId.isValid(id));
  }
  if (body.categoryId != null && String(body.categoryId).trim() !== "") {
    const one = String(body.categoryId).trim();
    if (mongoose.Types.ObjectId.isValid(one)) return [one];
  }
  return [];
}

module.exports = { normalizeCategoryIds };
