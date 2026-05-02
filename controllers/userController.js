const User = require("../models/User");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function search(req, res) {
  const query = (req.query.userId || "").trim();
  if (!query) {
    return res.json({ results: [] });
  }

  const regex = new RegExp(`^${escapeRegex(query)}`, "i");
  const users = await User.find({ userId: regex })
    .select("userId name")
    .limit(10)
    .lean();

  return res.json({ results: users });
}

module.exports = { search };
