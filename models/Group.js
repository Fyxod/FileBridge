const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    permissions: {
      canUpload: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: true },
      canShare: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

GroupSchema.index({ owner: 1, name: 1 }, { unique: true });
GroupSchema.index({ members: 1 });

module.exports = mongoose.model("Group", GroupSchema);
