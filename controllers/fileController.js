const crypto = require("crypto");
const fs = require("fs/promises");
const File = require("../models/File");
const User = require("../models/User");
const Group = require("../models/Group");
const ActivityLog = require("../models/ActivityLog");

function parseList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function resolveUsers(userIds) {
  if (!userIds.length) {
    return [];
  }
  const users = await User.find({ userId: { $in: userIds } }, "_id").lean();
  return users.map((user) => user._id);
}

async function resolveGroups(groupNames, memberId) {
  if (!groupNames.length) {
    return [];
  }
  const groups = await Group.find(
    { name: { $in: groupNames }, members: memberId },
    "_id",
  ).lean();
  return groups.map((group) => group._id);
}

function buildAccessQuery(userId, groupIds) {
  return {
    $or: [
      { owner: userId },
      { "access.visibility": "public" },
      { "access.visibility": "users", "access.allowedUsers": userId },
      {
        "access.visibility": "groups",
        "access.allowedGroups": { $in: groupIds },
      },
    ],
  };
}

function normalizeSort(sortField) {
  const allowed = new Set(["size", "createdAt", "name"]);
  if (allowed.has(sortField)) {
    return sortField;
  }
  return "createdAt";
}

function canAccessFile(file, user) {
  if (!user) {
    return false;
  }
  if (file.owner.toString() === user._id.toString()) {
    return true;
  }
  if (file.access.visibility === "public") {
    return true;
  }
  if (file.access.visibility === "users") {
    return file.access.allowedUsers.some(
      (id) => id.toString() === user._id.toString(),
    );
  }
  if (file.access.visibility === "groups") {
    const groupIds = (user.groups || []).map((id) => id.toString());
    return file.access.allowedGroups.some((id) =>
      groupIds.includes(id.toString()),
    );
  }
  return false;
}

async function list(req, res) {
  const user = res.locals.currentUser;
  const groupIds = user.groups || [];
  const filters = [buildAccessQuery(user._id, groupIds)];

  if (req.query.q) {
    filters.push({ $text: { $search: req.query.q } });
  }
  if (req.query.tag) {
    filters.push({ tags: req.query.tag });
  }
  if (req.query.type) {
    filters.push({ mimeType: req.query.type });
  }
  if (req.query.folderPath) {
    filters.push({ folderPath: req.query.folderPath });
  }
  if (req.query.from || req.query.to) {
    const createdAt = {};
    if (req.query.from) {
      createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      createdAt.$lte = new Date(req.query.to);
    }
    filters.push({ createdAt });
  }

  const query = filters.length > 1 ? { $and: filters } : filters[0];
  const sortField = normalizeSort(req.query.sort);
  const order = req.query.order === "asc" ? 1 : -1;
  const sort = { [sortField]: order };

  const files = await File.find(query).sort(sort).lean();
  const groups = await Group.find({ members: user._id }).lean();
  const favorites = new Set((user.favorites || []).map((id) => id.toString()));

  const storageAgg = await File.aggregate([
    { $match: { owner: user._id } },
    {
      $group: {
        _id: "$owner",
        totalSize: { $sum: "$size" },
        count: { $sum: 1 },
      },
    },
  ]);

  const storage = storageAgg[0] || { totalSize: 0, count: 0 };

  const storageByType = await File.aggregate([
    { $match: { owner: user._id } },
    {
      $group: {
        _id: "$mimeType",
        totalSize: { $sum: "$size" },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalSize: -1 } },
  ]);

  res.render("dashboard", {
    title: "Dashboard",
    files,
    groups,
    favorites,
    storage,
    storageByType,
    filters: req.query,
    error: req.query.error || null,
  });
}

async function upload(req, res) {
  const user = res.locals.currentUser;

  if (!req.file) {
    return res.redirect("/files?error=missing-file");
  }

  const visibility = req.body.visibility || "private";
  const displayName = (req.body.name || "").trim() || req.file.originalname;
  const folderPath = (req.body.folderPath || "/").trim() || "/";
  const allowedUsers = await resolveUsers(parseList(req.body.allowedUserIds));
  const allowedGroups = await resolveGroups(
    parseList(req.body.allowedGroupNames),
    user._id,
  );

  const access = {
    visibility,
    allowedUsers,
    allowedGroups,
    shareToken:
      visibility === "link"
        ? crypto.randomBytes(12).toString("hex")
        : undefined,
  };

  const file = await File.create({
    owner: user._id,
    name: displayName,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    path: req.file.path,
    mimeType: req.file.mimetype,
    size: req.file.size,
    folderPath,
    tags: parseList(req.body.tags),
    access,
  });

  await User.updateOne({ _id: user._id }, { $inc: { storageUsed: file.size } });
  await ActivityLog.create({
    actor: user._id,
    action: "upload",
    file: file._id,
  });

  return res.redirect("/files");
}

async function remove(req, res) {
  const user = res.locals.currentUser;
  const file = await File.findById(req.params.id);

  if (!file) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (file.owner.toString() !== user._id.toString()) {
    return res
      .status(403)
      .render("error", {
        title: "Forbidden",
        error: { message: "Not allowed" },
      });
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {}

  await File.deleteOne({ _id: file._id });
  await User.updateOne(
    { _id: user._id },
    { $inc: { storageUsed: -file.size } },
  );
  await User.updateMany(
    { favorites: file._id },
    { $pull: { favorites: file._id } },
  );
  await ActivityLog.create({
    actor: user._id,
    action: "delete",
    file: file._id,
  });

  return res.redirect("/files");
}

async function rename(req, res) {
  const user = res.locals.currentUser;
  const name = (req.body.name || "").trim();
  if (!name) {
    return res.redirect("/files");
  }

  await File.updateOne(
    { _id: req.params.id, owner: user._id },
    { $set: { name } },
  );
  await ActivityLog.create({
    actor: user._id,
    action: "rename",
    file: req.params.id,
    metadata: { name },
  });

  return res.redirect("/files");
}

async function move(req, res) {
  const user = res.locals.currentUser;
  const folderPath = (req.body.folderPath || "/").trim();

  await File.updateOne(
    { _id: req.params.id, owner: user._id },
    { $set: { folderPath } },
  );
  await ActivityLog.create({
    actor: user._id,
    action: "move",
    file: req.params.id,
  });

  return res.redirect("/files");
}

async function updateTags(req, res) {
  const user = res.locals.currentUser;
  const tags = parseList(req.body.tags);

  await File.updateOne(
    { _id: req.params.id, owner: user._id },
    { $set: { tags } },
  );

  return res.redirect("/files");
}

async function updateAccess(req, res) {
  const user = res.locals.currentUser;
  const visibility = req.body.visibility || "private";
  const allowedUsers = await resolveUsers(parseList(req.body.allowedUserIds));
  const allowedGroups = await resolveGroups(
    parseList(req.body.allowedGroupNames),
    user._id,
  );

  const update = {
    $set: {
      "access.visibility": visibility,
      "access.allowedUsers": allowedUsers,
      "access.allowedGroups": allowedGroups,
    },
  };

  if (visibility === "link") {
    update.$set["access.shareToken"] = crypto.randomBytes(12).toString("hex");
  } else {
    update.$unset = { "access.shareToken": "" };
  }

  await File.updateOne({ _id: req.params.id, owner: user._id }, update);
  await ActivityLog.create({
    actor: user._id,
    action: "share",
    file: req.params.id,
  });

  return res.redirect("/files");
}

async function toggleShareLink(req, res) {
  const user = res.locals.currentUser;
  const file = await File.findOne({ _id: req.params.id, owner: user._id });

  if (!file) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (file.access && file.access.shareToken) {
    await File.updateOne(
      { _id: file._id },
      {
        $set: { "access.visibility": "private" },
        $unset: { "access.shareToken": "" },
      },
    );
  } else {
    const token = crypto.randomBytes(12).toString("hex");
    await File.updateOne(
      { _id: file._id },
      { $set: { "access.visibility": "link", "access.shareToken": token } },
    );
  }

  return res.redirect("/files");
}

async function toggleFavorite(req, res) {
  const user = res.locals.currentUser;
  const fileId = req.params.id;

  const exists = await User.exists({ _id: user._id, favorites: fileId });
  if (exists) {
    await User.updateOne({ _id: user._id }, { $pull: { favorites: fileId } });
  } else {
    await User.updateOne(
      { _id: user._id },
      { $addToSet: { favorites: fileId } },
    );
  }

  return res.redirect("/files");
}

async function download(req, res) {
  const user = res.locals.currentUser;
  const file = await File.findById(req.params.id);

  if (!file) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (!canAccessFile(file, user)) {
    return res
      .status(403)
      .render("error", {
        title: "Forbidden",
        error: { message: "Not allowed" },
      });
  }

  return res.download(file.path, file.originalName);
}

async function shareView(req, res) {
  const file = await File.findOne({
    "access.shareToken": req.params.token,
    "access.visibility": "link",
  }).lean();

  if (!file) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  return res.render("share", { title: "Shared File", file });
}

async function shareDownload(req, res) {
  const file = await File.findOne({
    "access.shareToken": req.params.token,
    "access.visibility": "link",
  });

  if (!file) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  return res.download(file.path, file.originalName);
}

module.exports = {
  list,
  upload,
  remove,
  rename,
  move,
  updateTags,
  updateAccess,
  toggleShareLink,
  toggleFavorite,
  download,
  shareView,
  shareDownload,
};
