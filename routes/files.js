const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");
const fileController = require("../controllers/fileController");

const router = express.Router();

router.get("/share/:token", asyncHandler(fileController.shareView));
router.post(
  "/share/:token/download",
  asyncHandler(fileController.shareDownload),
);

router.get("/", requireAuth, asyncHandler(fileController.list));
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(fileController.upload),
);
router.post("/:id/delete", requireAuth, asyncHandler(fileController.remove));
router.post("/:id/rename", requireAuth, asyncHandler(fileController.rename));
router.post("/:id/move", requireAuth, asyncHandler(fileController.move));
router.post("/:id/tags", requireAuth, asyncHandler(fileController.updateTags));
router.post(
  "/:id/access",
  requireAuth,
  asyncHandler(fileController.updateAccess),
);
router.post(
  "/:id/share-link",
  requireAuth,
  asyncHandler(fileController.toggleShareLink),
);
router.post(
  "/:id/favorite",
  requireAuth,
  asyncHandler(fileController.toggleFavorite),
);
router.get("/:id/download", requireAuth, asyncHandler(fileController.download));

module.exports = router;
