const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    folderPath: { type: String, default: "/" },
    tags: [{ type: String, trim: true }],
    access: {
      visibility: {
        type: String,
        enum: ["private", "public", "users", "groups", "link"],
        default: "private",
      },
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      allowedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
      shareToken: { type: String },
    },
  },
  { timestamps: true },
);

FileSchema.index({ owner: 1, name: 1 });
FileSchema.index({ "access.visibility": 1 });
FileSchema.index({ "access.allowedUsers": 1 });
FileSchema.index({ "access.allowedGroups": 1 });
FileSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("File", FileSchema);
