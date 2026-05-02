const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const groupController = require("../controllers/groupController");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(groupController.list));
router.post("/", requireAuth, asyncHandler(groupController.create));
router.post(
  "/:id/members",
  requireAuth,
  asyncHandler(groupController.addMember),
);
router.post(
  "/:id/members/remove",
  requireAuth,
  asyncHandler(groupController.removeMember),
);
router.post(
  "/:id/permissions",
  requireAuth,
  asyncHandler(groupController.updatePermissions),
);

module.exports = router;
