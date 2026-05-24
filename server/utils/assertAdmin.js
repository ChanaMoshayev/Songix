const mongoose = require("mongoose");
const User = require("../models/usersModel");

async function assertAdmin(userId) {
  const id = String(userId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const user = await User.findById(id).select("status").lean();
  return user?.status === "admin";
}

module.exports = { assertAdmin };
