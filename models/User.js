const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    storageUsed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model("User", UserSchema);
