const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename(req, file, cb) {
    const suffix = crypto.randomBytes(8).toString("hex");
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${suffix}_${safeName}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
