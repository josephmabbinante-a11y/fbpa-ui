import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ""
    },
    roles: {
      type: [String],
      default: ["user"]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Users", userSchema);
