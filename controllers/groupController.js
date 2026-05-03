const Group = require("../models/Group");
const User = require("../models/User");
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

async function list(req, res) {
  const groups = await Group.find({ members: req.session.userId })
    .populate("members", "userId name")
    .lean();

  const groupNames = groups
    .map((group) => group.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const suggestionsJson = JSON.stringify({ groups: groupNames }).replace(
    /</g,
    "\\u003c",
  );

  res.render("groups", {
    title: "Groups",
    groups,
    error: null,
    suggestionsJson,
  });
}

async function create(req, res) {
  const name = (req.body.name || "").trim();
  if (!name) {
    return res.redirect("/groups");
  }

  const memberUserIds = parseList(req.body.memberUserIds);
  const users = await User.find(
    { userId: { $in: memberUserIds } },
    "_id",
  ).lean();
  const memberIds = users.map((user) => user._id.toString());
  const members = Array.from(
    new Set([req.session.userId.toString(), ...memberIds]),
  );

  const permissions = {
    canUpload: req.body.canUpload === "on",
    canEdit: req.body.canEdit === "on",
    canShare: req.body.canShare === "on",
  };

  const group = await Group.create({
    name,
    owner: req.session.userId,
    members,
    permissions,
  });

  await User.updateMany(
    { _id: { $in: members } },
    { $addToSet: { groups: group._id } },
  );
  await ActivityLog.create({
    actor: req.session.userId,
    action: "group-create",
    group: group._id,
  });

  return res.redirect("/groups");
}

async function addMember(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (group.owner.toString() !== req.session.userId.toString()) {
    return res.status(403).render("error", {
      title: "Forbidden",
      error: { message: "Not allowed" },
    });
  }

  const memberUserId = (req.body.memberUserId || "").trim();
  const user = await User.findOne({ userId: memberUserId });
  if (!user) {
    return res.redirect("/groups");
  }

  await Group.updateOne(
    { _id: group._id },
    { $addToSet: { members: user._id } },
  );
  await User.updateOne({ _id: user._id }, { $addToSet: { groups: group._id } });
  await ActivityLog.create({
    actor: req.session.userId,
    action: "group-add-member",
    group: group._id,
  });

  return res.redirect("/groups");
}

async function removeMember(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (group.owner.toString() !== req.session.userId.toString()) {
    return res.status(403).render("error", {
      title: "Forbidden",
      error: { message: "Not allowed" },
    });
  }

  const memberUserId = (req.body.memberUserId || "").trim();
  const user = await User.findOne({ userId: memberUserId });
  if (!user) {
    return res.redirect("/groups");
  }

  if (user._id.toString() === group.owner.toString()) {
    return res.redirect("/groups");
  }

  await Group.updateOne({ _id: group._id }, { $pull: { members: user._id } });
  await User.updateOne({ _id: user._id }, { $pull: { groups: group._id } });
  await ActivityLog.create({
    actor: req.session.userId,
    action: "group-remove-member",
    group: group._id,
  });

  return res.redirect("/groups");
}

async function updatePermissions(req, res) {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).render("not-found", { title: "Not Found" });
  }

  if (group.owner.toString() !== req.session.userId.toString()) {
    return res.status(403).render("error", {
      title: "Forbidden",
      error: { message: "Not allowed" },
    });
  }

  const permissions = {
    canUpload: req.body.canUpload === "on",
    canEdit: req.body.canEdit === "on",
    canShare: req.body.canShare === "on",
  };

  await Group.updateOne({ _id: group._id }, { $set: { permissions } });

  return res.redirect("/groups");
}

module.exports = {
  list,
  create,
  addMember,
  removeMember,
  updatePermissions,
};
