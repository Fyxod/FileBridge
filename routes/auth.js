const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/register", authController.getRegister);
router.post("/register", asyncHandler(authController.postRegister));
router.get("/login", authController.getLogin);
router.post("/login", asyncHandler(authController.postLogin));
router.post("/logout", authController.logout);

module.exports = router;
