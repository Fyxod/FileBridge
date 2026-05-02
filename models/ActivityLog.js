const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    metadata: { type: Object },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ actor: 1, createdAt: -1 });
ActivityLogSchema.index({ file: 1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
