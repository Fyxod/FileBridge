const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/search", requireAuth, asyncHandler(userController.search));

module.exports = router;
